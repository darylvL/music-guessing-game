import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, throwError, timer } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, retryWhen, scan, delayWhen } from 'rxjs/operators';
import { SpotifyApiService } from '../../core/services/spotify-api.service';
import { AppState } from '../app.state';
import * as MusicCacheActions from './music-cache.actions';
import * as MusicCacheSelectors from './music-cache.selectors';
import * as GameActions from '../game/game.actions';
import { Track } from '../../shared/models/track.model';
import { MusicSourceSelection } from '../playlist/playlist.state';
import { getTTLForSourceType, isCacheFresh } from './music-cache.state';
import { environment } from '../../../environments/environment';

/**
 * Music Cache Effects
 * Handles side effects for music cache store (API calls, caching, retry logic)
 */
@Injectable()
export class MusicCacheEffects {
  private actions$ = inject(Actions);
  private store = inject(Store<AppState>);
  private spotifyApi = inject(SpotifyApiService);

  /**
   * Fetch tracks with cache check effect
   * Checks cache freshness and fetches from API if needed
   */
  fetchTracksWithCache$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MusicCacheActions.fetchTracksWithCache),
      withLatestFrom(this.store.select(MusicCacheSelectors.selectMusicCacheState)),
      switchMap(([{ source, forceRefresh }, cacheState]) => {
        console.log('[Music Cache Effects] Fetching tracks for source:', source);

        // Check cache if not forcing refresh
        if (!forceRefresh) {
          const cachedTracks = this.getCachedTracks(source, cacheState);
          const isFresh = this.isCacheFresh(source, cacheState);

          if (cachedTracks && isFresh) {
            console.log('[Music Cache Effects] Using cached tracks, count:', cachedTracks.length);
            return of(MusicCacheActions.fetchTracksWithCacheSuccess({
              tracks: cachedTracks,
              source,
              fromCache: true
            }));
          }
        }

        console.log('[Music Cache Effects] Fetching tracks from API');
        return this.fetchFromAPI(source).pipe(
          switchMap(tracks => {
            console.log('[Music Cache Effects] Fetched tracks from API:', tracks.length);
            const cacheAction = this.getCacheAction(source, tracks);
            return [
              cacheAction,
              MusicCacheActions.fetchTracksWithCacheSuccess({
                tracks,
                source,
                fromCache: false
              })
            ];
          }),
          catchError(error => {
            console.error('[Music Cache Effects] Failed to fetch tracks:', error);
            return of(MusicCacheActions.fetchTracksWithCacheFailure({
              error: error.message || 'Failed to fetch tracks'
            }));
          })
        );
      })
    )
  );

  /**
   * Update game store with tracks effect
   * Dispatches tracks to game store when successfully loaded
   */
  updateGameStoreWithTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MusicCacheActions.fetchTracksWithCacheSuccess),
      map(({ tracks }) => {
        console.log('[Music Cache Effects] Updating game store with tracks:', tracks.length);
        return GameActions.loadTracksSuccess({ tracks });
      })
    )
  );

  /**
   * Fetch tracks from API based on source type
   */
  private fetchFromAPI(source: MusicSourceSelection) {
    switch (source.type) {
      case 'liked-songs':
        return this.spotifyApi.getUserLikedTracks().pipe(
          this.retryWithBackoff()
        );
      case 'single-playlist':
        return this.spotifyApi.getPlaylistTracks(source.playlistId).pipe(
          this.retryWithBackoff()
        );
      case 'multiple-playlists':
        return this.spotifyApi.getMultiplePlaylistsTracks(source.playlistIds).pipe(
          this.retryWithBackoff()
        );
      default:
        return throwError(() => new Error('Unknown source type'));
    }
  }

  /**
   * Get appropriate cache action for source type
   */
  private getCacheAction(source: MusicSourceSelection, tracks: Track[]) {
    const fetchedAt = Date.now();

    if (source.type === 'liked-songs') {
      return MusicCacheActions.cacheLikedSongs({ tracks, fetchedAt });
    } else if (source.type === 'single-playlist') {
      return MusicCacheActions.cachePlaylistTracks({
        playlistId: source.playlistId,
        tracks,
        fetchedAt
      });
    } else {
      // For multiple playlists, cache the combined result
      // In a real implementation, you might want to cache each playlist separately
      return MusicCacheActions.cachePlaylistTracks({
        playlistId: source.playlistIds.join(','),
        tracks,
        fetchedAt
      });
    }
  }

  /**
   * Get cached tracks for a source
   */
  private getCachedTracks(source: MusicSourceSelection, cacheState: any): Track[] | null {
    if (source.type === 'liked-songs') {
      return cacheState.likedSongs?.tracks ?? null;
    } else if (source.type === 'single-playlist') {
      return cacheState.playlistTracks[source.playlistId]?.tracks ?? null;
    } else {
      // For multiple playlists, all must be cached
      const allTracks: Track[] = [];
      for (const id of source.playlistIds) {
        const cached = cacheState.playlistTracks[id];
        if (!cached) return null; // If any playlist is not cached, return null
        allTracks.push(...cached.tracks);
      }
      return allTracks.length > 0 ? allTracks : null;
    }
  }

  /**
   * Check if cache is fresh for a source
   */
  private isCacheFresh(source: MusicSourceSelection, cacheState: any): boolean {
    const now = Date.now();

    if (source.type === 'liked-songs') {
      const cache = cacheState.likedSongs;
      return cache ? isCacheFresh(cache.fetchedAt, getTTLForSourceType('liked-songs')) : false;
    } else if (source.type === 'single-playlist') {
      const cache = cacheState.playlistTracks[source.playlistId];
      return cache ? isCacheFresh(cache.fetchedAt, getTTLForSourceType('playlist')) : false;
    } else {
      // For multiple playlists, all must be fresh
      return source.playlistIds.every(id => {
        const cache = cacheState.playlistTracks[id];
        return cache && isCacheFresh(cache.fetchedAt, getTTLForSourceType('playlist'));
      });
    }
  }

  /**
   * Retry with exponential backoff using environment configuration
   */
  private retryWithBackoff<T>() {
    return retryWhen<T>(errors =>
      errors.pipe(
        scan((acc, error) => {
          const retryCount = acc.retryCount + 1;

          // Don't retry on certain errors
          if (error.status === 401 || error.status === 403 || error.status === 404) {
            throw error;
          }

          if (retryCount > environment.apiRetryMaxAttempts) {
            throw error;
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            environment.apiRetryInitialDelay * Math.pow(2, retryCount - 1),
            environment.apiRetryMaxDelay
          );

          console.log(`[Music Cache Effects] Retry attempt ${retryCount}/${environment.apiRetryMaxAttempts} after ${delay}ms`);

          return { retryCount, delay };
        }, { retryCount: 0, delay: 0 }),
        delayWhen(({ delay }) => timer(delay))
      )
    );
  }
}

