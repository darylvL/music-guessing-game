import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, from } from 'rxjs';
import { map, catchError, tap, switchMap, withLatestFrom, take } from 'rxjs/operators';
import { MusicSourceService } from '../../core/services/music-source.service';
import { SpotifyPlaybackService } from '../../core/services/spotify-playback.service';
import { AppState } from '../app.state';
import * as GameActions from './game.actions';
import * as GameSelectors from './game.selectors';
import * as PlaylistSelectors from '../playlist/playlist.selectors';
import * as MusicCacheActions from '../music-cache/music-cache.actions';
import { normalizeTitleForComparison, normalizeArtistForComparison } from '../../shared/utils/answer-normalizer.util';

@Injectable()
export class GameEffects {
  private actions$ = inject(Actions);
  private store = inject(Store<AppState>);
  private musicSourceService = inject(MusicSourceService);
  private playbackService = inject(SpotifyPlaybackService);

  // Note: Track preloading is now handled by the Music Cache Effects
  // The cache effects automatically load tracks into the game store when a music source is selected
  // This effect is kept for backward compatibility but may not be needed
  preloadTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.preloadTracks),
      switchMap(({ musicSourceType }) => {
        console.log('[Game Effects] Preloading tracks from:', musicSourceType || 'default');
        const musicSource = musicSourceType
          ? this.musicSourceService.getMusicSource(musicSourceType)
          : this.musicSourceService.getDefaultMusicSource();

        return from(musicSource.fetchTracks()).pipe(
          map((tracks) => {
            console.log('[Game Effects] Preloaded tracks:', tracks.length);
            return GameActions.loadTracksSuccess({ tracks });
          }),
          catchError((error) => {
            console.error('[Game Effects] Failed to preload tracks:', error);
            return of(GameActions.loadTracksFailure({ error: error.message }));
          })
        );
      })
    )
  );

  // Start game and load first song
  // Tracks should already be loaded from cache by Music Cache Effects
  startGameAndLoadTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.startGame),
      withLatestFrom(
        this.store.select(GameSelectors.selectAvailableTracks),
        this.store.select(PlaylistSelectors.selectSelectedMusicSource)
      ),
      switchMap(([_, availableTracks, selectedMusicSource]) => {
        console.log('[Game Effects] startGame - available tracks:', availableTracks.length);
        console.log('[Game Effects] startGame - selected music source:', selectedMusicSource);

        // If tracks are already loaded (from cache), just start the first song
        if (availableTracks.length > 0) {
          console.log('[Game Effects] Using cached/preloaded tracks, dispatching loadNextSong');
          return of(GameActions.loadNextSong());
        }

        // Fallback: If no tracks are loaded, fetch them from the selected music source
        console.warn('[Game Effects] No preloaded tracks found! Fetching from selected music source as fallback...');

        // Use the selected music source, or default to liked songs if none selected
        const source = selectedMusicSource || { type: 'liked-songs' as const };

        // Dispatch fetch action to music cache effects
        return of(MusicCacheActions.fetchTracksWithCache({ source }));
      })
    )
  );

  // After tracks are loaded during gameplay, start the first song
  // This handles the case when tracks weren't preloaded and needed to be fetched
  loadTracksAndStartSong$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.loadTracksSuccess),
      withLatestFrom(this.store.select(GameSelectors.selectGameStatus)),
      switchMap(([_, gameStatus]) => {
        // Only dispatch loadNextSong if the game is in playing status
        // This means tracks were loaded as a fallback during game start
        if (gameStatus === 'playing') {
          console.log('[Game Effects] Tracks loaded during gameplay, dispatching loadNextSong');
          return of(GameActions.loadNextSong());
        }
        return of(); // Return empty to complete the stream
      })
    )
  );

  // Initialize playback SDK when game starts
  initializePlayback$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.startGame),
        tap(() => {
          this.playbackService.initializePlayer().catch((error) => {
            console.error('Failed to initialize playback:', error);
          });
        })
      ),
    { dispatch: false }
  );

  // Play track preview when a new song is loaded
  playTrackPreview$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.loadNextSongSuccess),
        tap(({ song }) => {
          if (song?.uri) {
            this.playbackService.playTrackForDuration(song.uri).catch((error) => {
              console.warn('Failed to play track preview:', error);
            });
          }
        })
      ),
    { dispatch: false }
  );

  // Load next song - select random track and generate choices
  loadNextSong$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.loadNextSong),
      withLatestFrom(
        this.store.select(GameSelectors.selectAvailableTracks),
        this.store.select(GameSelectors.selectUsedTrackIds)
      ),
      map(([_, availableTracks, usedTrackIds]) => {
        console.log('[Game Effects] Loading next song...');

        // Filter out used tracks
        const unusedTracks = availableTracks.filter(
          track => !usedTrackIds.includes(track.id)
        );

        if (unusedTracks.length === 0) {
          console.log('[Game Effects] No more tracks available, finishing game');
          return GameActions.finishGame();
        }

        // Select random song
        const randomIndex = Math.floor(Math.random() * unusedTracks.length);
        const song = unusedTracks[randomIndex];
        console.log('[Game Effects] Selected song nr', randomIndex, 'of', unusedTracks.length);
        console.log('[Game Effects] Selected song:', song.title, 'by', song.artist);

        // Generate multiple choice options
        const titleChoices = this.generateChoices(
          song.title,
          availableTracks.map(t => t.title)
        );
        const artistChoices = this.generateChoices(
          song.artist,
          availableTracks.map(t => t.artist)
        );

        return GameActions.loadNextSongSuccess({
          song,
          titleChoices,
          artistChoices
        });
      })
    )
  );

  // Submit answer - check correctness and calculate score
  submitAnswer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.submitAnswer),
      withLatestFrom(
        this.store.select(GameSelectors.selectCurrentSong),
        this.store.select(GameSelectors.selectCurrentRound)
      ),
      map(([{ titleAnswer, artistAnswer }, currentSong, currentRound]) => {
        console.log('[Game Effects] Submitting answer:', { titleAnswer, artistAnswer });

        if (!currentSong) {
          return GameActions.loadNextSongFailure({
            error: 'No current song'
          });
        }

        // Check answers with normalization (ignores brackets, separators, and whitespace differences)
        const normalizedUserTitle = normalizeTitleForComparison(titleAnswer);
        const normalizedCorrectTitle = normalizeTitleForComparison(currentSong.title);
        const correctTitle = normalizedUserTitle === normalizedCorrectTitle;

        const normalizedUserArtist = normalizeArtistForComparison(artistAnswer);
        const normalizedCorrectArtist = normalizeArtistForComparison(currentSong.artist);
        const correctArtist = normalizedUserArtist === normalizedCorrectArtist;

        console.log('[Game Effects] Answer results:', { correctTitle, correctArtist });

        const result = {
          round: currentRound,
          track: currentSong,
          userTitleAnswer: titleAnswer,
          userArtistAnswer: artistAnswer,
          correctTitle,
          correctArtist,
          pointsEarned: (correctTitle ? 1 : 0) + (correctArtist ? 1 : 0)
        };

        return GameActions.submitAnswerSuccess({
          correctTitle,
          correctArtist,
          result
        });
      })
    )
  );

  // Next round - check if game finished or load next song
  nextRound$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.nextRound),
      withLatestFrom(
        this.store.select(GameSelectors.selectCurrentRound),
        this.store.select(GameSelectors.selectTotalRounds)
      ),
      map(([_, currentRound, totalRounds]) => {
        console.log('[Game Effects] Next round:', currentRound, '/', totalRounds);

        if (currentRound > totalRounds) {
          console.log('[Game Effects] Game finished!');
          return GameActions.finishGame();
        }

        return GameActions.loadNextSong();
      })
    )
  );

  // Stop playback when answer is submitted
  stopPlayback$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.submitAnswer),
        tap(() => {
          this.playbackService.stop();
        })
      ),
    { dispatch: false }
  );

  /**
   * Generate multiple choice options
   */
  private generateChoices(correct: string, allOptions: string[]): string[] {
    // Remove duplicates and the correct answer
    const uniqueOptions = Array.from(new Set(allOptions))
      .filter(opt => opt.toLowerCase() !== correct.toLowerCase());

    // Shuffle and take 3 wrong answers
    const shuffled = uniqueOptions.sort(() => Math.random() - 0.5);
    const wrongChoices = shuffled.slice(0, 3);

    // Add correct answer and shuffle again
    const choices = [...wrongChoices, correct];
    return choices.sort(() => Math.random() - 0.5);
  }
}

