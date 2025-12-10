import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, tap, switchMap, withLatestFrom } from 'rxjs/operators';
import { MusicSourceService } from '../../core/services/music-source.service';
import { SpotifyPlaybackService } from '../../core/services/spotify-playback.service';
import { environment } from '../../../environments/environment';
import { Track } from '../../shared/models/track.model';
import { RoundResult } from '../../shared/models/game.model';
import * as GameActions from './game.actions';
import * as GameSelectors from './game.selectors';
import { AppState } from '../app.state';

@Injectable()
export class GameEffects {
  private actions$ = inject(Actions);
  private store = inject(Store<AppState>);
  private musicSourceService = inject(MusicSourceService);
  private playbackService = inject(SpotifyPlaybackService);

  // Load tracks when game is initialized
  initializeGame$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.initializeGame),
      map(() => GameActions.loadTracks())
    )
  );

  // Load tracks from music source
  loadTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.loadTracks),
      switchMap(() => {
        const musicSource = this.musicSourceService.getDefaultMusicSource();
        return musicSource.fetchTracks().then(
          (tracks) => GameActions.loadTracksSuccess({ tracks }),
          (error) => GameActions.loadTracksFailure({ error: error.message })
        );
      }),
      catchError((error) =>
        of(GameActions.loadTracksFailure({ error: error.message }))
      )
    )
  );

  // Start game and load first song
  startGame$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.startGame),
      map(() => GameActions.loadNextSong())
    )
  );

  // Load next song with multiple choice options
  loadNextSong$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.loadNextSong),
      withLatestFrom(
        this.store.select(GameSelectors.selectAvailableTracks),
        this.store.select(GameSelectors.selectUsedTrackIds)
      ),
      map(([, availableTracks, usedTrackIds]) => {
        // Filter out already used tracks
        const unusedTracks = availableTracks.filter(
          track => !usedTrackIds.includes(track.id)
        );

        if (unusedTracks.length === 0) {
          return GameActions.loadNextSongFailure({
            error: 'No more tracks available'
          });
        }

        // Select random song
        const randomIndex = Math.floor(Math.random() * unusedTracks.length);
        const selectedSong = unusedTracks[randomIndex];

        // Generate multiple choice options
        const { titleChoices, artistChoices } = this.generateMultipleChoices(
          selectedSong,
          availableTracks
        );

        return GameActions.loadNextSongSuccess({
          song: selectedSong,
          titleChoices,
          artistChoices
        });
      }),
      catchError((error) =>
        of(GameActions.loadNextSongFailure({ error: error.message }))
      )
    )
  );

  // Start playback when song is loaded
  loadNextSongSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.loadNextSongSuccess),
      map(() => GameActions.startPlayback())
    )
  );

  // Handle playback start
  startPlayback$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.startPlayback),
        withLatestFrom(this.store.select(GameSelectors.selectCurrentSong)),
        tap(([, song]) => {
          if (song) {
            this.playbackService.playTrackForDuration(
              song.uri,
              environment.songPreviewDuration
            ).catch(error => {
              console.error('Playback error:', error);
            });
          }
        })
      ),
    { dispatch: false }
  );

  // Handle playback stop
  stopPlayback$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.stopPlayback),
        tap(() => this.playbackService.stop())
      ),
    { dispatch: false }
  );

  // Validate answer and calculate score
  submitAnswer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.submitAnswer),
      withLatestFrom(
        this.store.select(GameSelectors.selectCurrentSong),
        this.store.select(GameSelectors.selectCurrentRound),
        this.store.select(GameSelectors.selectGameMode)
      ),
      map(([{ titleAnswer, artistAnswer }, currentSong, currentRound, gameMode]) => {
        if (!currentSong) {
          return GameActions.loadNextSongFailure({
            error: 'No current song'
          });
        }

        // Validate answers
        const correctTitle = this.validateAnswer(
          titleAnswer,
          currentSong.title,
          gameMode
        );
        const correctArtist = this.validateAnswer(
          artistAnswer,
          currentSong.artist,
          gameMode
        );

        const pointsEarned = (correctTitle ? 1 : 0) + (correctArtist ? 1 : 0);

        const result: RoundResult = {
          round: currentRound,
          track: currentSong,
          userTitleAnswer: titleAnswer,
          userArtistAnswer: artistAnswer,
          correctTitle,
          correctArtist,
          pointsEarned
        };

        return GameActions.submitAnswerSuccess({
          correctTitle,
          correctArtist,
          result
        });
      })
    )
  );

  // Stop playback when answer is submitted
  submitAnswerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.submitAnswerSuccess),
      map(() => GameActions.stopPlayback())
    )
  );

  // Check if game should finish or continue
  nextRound$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.nextRound),
      withLatestFrom(
        this.store.select(GameSelectors.selectCurrentRound),
        this.store.select(GameSelectors.selectTotalRounds)
      ),
      map(([, currentRound, totalRounds]) => {
        if (currentRound >= totalRounds) {
          return GameActions.finishGame();
        }
        return GameActions.loadNextSong();
      })
    )
  );

  /**
   * Generate multiple choice options for title and artist
   */
  private generateMultipleChoices(
    correctSong: Track,
    allTracks: Track[]
  ): { titleChoices: string[]; artistChoices: string[] } {
    // Get 3 random wrong answers from the same library
    const otherTracks = allTracks.filter(t => t.id !== correctSong.id);
    const shuffled = this.shuffleArray([...otherTracks]);
    const wrongTracks = shuffled.slice(0, 3);

    // Create title choices (correct + 3 wrong)
    const titleChoices = this.shuffleArray([
      correctSong.title,
      ...wrongTracks.map(t => t.title)
    ]);

    // Create artist choices (correct + 3 wrong)
    const artistChoices = this.shuffleArray([
      correctSong.artist,
      ...wrongTracks.map(t => t.artist)
    ]);

    return { titleChoices, artistChoices };
  }

  /**
   * Validate answer based on game mode
   */
  private validateAnswer(
    userAnswer: string,
    correctAnswer: string,
    gameMode: 'easy' | 'hard'
  ): boolean {
    if (gameMode === 'easy') {
      // Exact match for multiple choice
      return userAnswer === correctAnswer;
    } else {
      // Fuzzy match for hard mode (text input)
      return this.fuzzyMatch(userAnswer, correctAnswer);
    }
  }

  /**
   * Fuzzy string matching for hard mode
   */
  private fuzzyMatch(input: string, target: string): boolean {
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ');

    const normalizedInput = normalize(input);
    const normalizedTarget = normalize(target);

    // Exact match after normalization
    if (normalizedInput === normalizedTarget) {
      return true;
    }

    // Check if input contains at least 80% of the target words
    const inputWords = normalizedInput.split(' ');
    const targetWords = normalizedTarget.split(' ');

    if (targetWords.length === 0) return false;

    const matchedWords = targetWords.filter(word =>
      inputWords.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
    );

    return matchedWords.length / targetWords.length >= 0.8;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

