import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, EMPTY } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, tap } from 'rxjs/operators';
import { SpotifyApiService } from '../../core/services/spotify-api.service';
import { AppState } from '../app.state';
import * as PlaylistActions from './playlist.actions';
import * as PlaylistSelectors from './playlist.selectors';
import * as MusicCacheActions from '../music-cache/music-cache.actions';
import { environment } from '../../../environments/environment';
import { MusicSourceSelection } from './playlist.state';

const MUSIC_SOURCE_STORAGE_KEY = 'selectedMusicSource';

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

  /**
   * Save music source to localStorage when it changes
   */
  saveMusicSource$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.selectMusicSource),
      map(({ source }) => {
        return PlaylistActions.saveMusicSourceToStorage({ source });
      })
    )
  );

  /**
   * Persist music source to localStorage
   */
  persistMusicSource$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PlaylistActions.saveMusicSourceToStorage),
        tap(({ source }) => {
          localStorage.setItem(MUSIC_SOURCE_STORAGE_KEY, JSON.stringify(source));
          console.log('[Playlist Effects] Saved music source to localStorage:', source);
        })
      ),
    { dispatch: false }
  );

  /**
   * Load music source from localStorage on app init
   */
  loadMusicSource$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.loadMusicSource),
      map(() => {
        const storedSource = localStorage.getItem(MUSIC_SOURCE_STORAGE_KEY);
        if (storedSource) {
          try {
            const parsed: MusicSourceSelection = JSON.parse(storedSource);
            // Validate the parsed source has a valid type
            if (parsed && parsed.type) {
              console.log('[Playlist Effects] Loaded music source from localStorage:', parsed);
              return PlaylistActions.loadMusicSourceSuccess({ source: parsed });
            }
          } catch (e) {
            console.error('[Playlist Effects] Failed to parse stored music source', e);
          }
        }
        // Default to liked songs if nothing stored or parsing fails
        const defaultSource: MusicSourceSelection = { type: 'liked-songs' };
        console.log('[Playlist Effects] Using default music source:', defaultSource);
        return PlaylistActions.loadMusicSourceSuccess({ source: defaultSource });
      })
    )
  );

  /**
   * Prefetch tracks when music source is loaded from localStorage
   */
  loadMusicSourceAndPrefetch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.loadMusicSourceSuccess),
      map(({ source }) => {
        console.log('[Playlist Effects] Music source loaded, prefetching tracks:', source);
        return MusicCacheActions.fetchTracksWithCache({ source });
      })
    )
  );
}

