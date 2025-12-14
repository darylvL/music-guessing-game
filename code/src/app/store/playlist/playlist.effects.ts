import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, EMPTY } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
import { SpotifyApiService } from '../../core/services/spotify-api.service';
import { AppState } from '../app.state';
import * as PlaylistActions from './playlist.actions';
import * as PlaylistSelectors from './playlist.selectors';
import * as MusicCacheActions from '../music-cache/music-cache.actions';
import { environment } from '../../../environments/environment';

/**
 * Playlist Effects
 * Handles side effects for playlist store (API calls, prefetching)
 */
@Injectable()
export class PlaylistEffects {
  private actions$ = inject(Actions);
  private store = inject(Store<AppState>);
  private spotifyApi = inject(SpotifyApiService);

  /**
   * Load user playlists effect
   * Checks cache TTL before fetching from API
   */
  loadUserPlaylists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.loadUserPlaylists),
      withLatestFrom(
        this.store.select(PlaylistSelectors.selectUserPlaylists),
        this.store.select(PlaylistSelectors.selectLastFetchedAt)
      ),
      switchMap(([_, cachedPlaylists, lastFetchedAt]) => {
        // Check if cache is valid using environment TTL
        const now = Date.now();
        const isCacheValid = lastFetchedAt &&
          (now - lastFetchedAt) < environment.cacheTtlUserPlaylists;

        if (isCacheValid && cachedPlaylists.length > 0) {
          console.log('[Playlist Effects] Using cached playlists');
          // Return success action with cached data to clear loading state
          return of(PlaylistActions.loadUserPlaylistsSuccess({
            playlists: cachedPlaylists,
            fetchedAt: lastFetchedAt
          }));
        }

        console.log('[Playlist Effects] Fetching playlists from API');
        return this.spotifyApi.getUserPlaylists().pipe(
          map(playlists => {
            console.log('[Playlist Effects] Loaded playlists:', playlists.length);
            return PlaylistActions.loadUserPlaylistsSuccess({
              playlists,
              fetchedAt: Date.now()
            });
          }),
          catchError(error => {
            console.error('[Playlist Effects] Failed to load playlists:', error);
            return of(PlaylistActions.loadUserPlaylistsFailure({
              error: error.message || 'Failed to load playlists'
            }));
          })
        );
      })
    )
  );

  /**
   * Select music source and prefetch tracks effect
   * Triggers track prefetch when a music source is selected
   */
  selectMusicSourceAndPrefetch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.selectMusicSource),
      map(({ source }) => {
        console.log('[Playlist Effects] Music source selected, prefetching tracks:', source);
        return MusicCacheActions.fetchTracksWithCache({ source });
      })
    )
  );
}

