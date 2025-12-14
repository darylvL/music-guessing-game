import { createReducer, on } from '@ngrx/store';
import * as MusicCacheActions from './music-cache.actions';
import { initialMusicCacheState } from './music-cache.state';

/**
 * Music Cache Reducer
 * Handles all state transitions for music cache store
 */
export const musicCacheReducer = createReducer(
  initialMusicCacheState,

  // Cache liked songs
  on(MusicCacheActions.cacheLikedSongs, (state, { tracks, fetchedAt }) => ({
    ...state,
    likedSongs: {
      tracks,
      fetchedAt,
      sourceId: 'liked-songs',
      sourceType: 'liked-songs' as const
    },
    cacheMetadata: {
      ...state.cacheMetadata,
      'liked-songs': {
        sourceId: 'liked-songs',
        sourceType: 'liked-songs',
        lastFetchedAt: fetchedAt,
        lastAccessedAt: fetchedAt,
        trackCount: tracks.length,
        isStale: false
      }
    }
  })),

  // Cache playlist tracks
  on(MusicCacheActions.cachePlaylistTracks, (state, { playlistId, tracks, fetchedAt }) => ({
    ...state,
    playlistTracks: {
      ...state.playlistTracks,
      [playlistId]: {
        tracks,
        fetchedAt,
        sourceId: playlistId,
        sourceType: 'playlist' as const
      }
    },
    cacheMetadata: {
      ...state.cacheMetadata,
      [playlistId]: {
        sourceId: playlistId,
        sourceType: 'playlist',
        lastFetchedAt: fetchedAt,
        lastAccessedAt: fetchedAt,
        trackCount: tracks.length,
        isStale: false
      }
    }
  })),

  // Update cache access time
  on(MusicCacheActions.updateCacheAccess, (state, { sourceId }) => {
    const metadata = state.cacheMetadata[sourceId];
    if (!metadata) return state;

    return {
      ...state,
      cacheMetadata: {
        ...state.cacheMetadata,
        [sourceId]: {
          ...metadata,
          lastAccessedAt: Date.now()
        }
      }
    };
  }),

  // Invalidate cache
  on(MusicCacheActions.invalidateCache, (state, { sourceId }) => {
    const metadata = state.cacheMetadata[sourceId];
    if (!metadata) return state;

    return {
      ...state,
      cacheMetadata: {
        ...state.cacheMetadata,
        [sourceId]: {
          ...metadata,
          isStale: true
        }
      }
    };
  }),

  // Clear all cache
  on(MusicCacheActions.clearAllCache, () => initialMusicCacheState)
);

