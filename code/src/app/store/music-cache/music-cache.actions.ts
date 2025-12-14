import { createAction, props } from '@ngrx/store';
import { Track } from '../../shared/models/track.model';
import { MusicSourceSelection } from '../playlist/playlist.state';

/**
 * Music Cache Actions
 * Actions for managing music cache (liked songs and playlists)
 */

// Fetch tracks with cache check
export const fetchTracksWithCache = createAction(
  '[Music Cache] Fetch Tracks With Cache',
  props<{ source: MusicSourceSelection; forceRefresh?: boolean }>()
);

export const fetchTracksWithCacheSuccess = createAction(
  '[Music Cache] Fetch Tracks With Cache Success',
  props<{ tracks: Track[]; source: MusicSourceSelection; fromCache: boolean }>()
);

export const fetchTracksWithCacheFailure = createAction(
  '[Music Cache] Fetch Tracks With Cache Failure',
  props<{ error: string }>()
);

// Cache liked songs
export const cacheLikedSongs = createAction(
  '[Music Cache] Cache Liked Songs',
  props<{ tracks: Track[]; fetchedAt: number }>()
);

// Cache playlist tracks
export const cachePlaylistTracks = createAction(
  '[Music Cache] Cache Playlist Tracks',
  props<{ playlistId: string; tracks: Track[]; fetchedAt: number }>()
);

// Invalidate cache for a specific source
export const invalidateCache = createAction(
  '[Music Cache] Invalidate Cache',
  props<{ sourceId: string }>()
);

// Clear all cache
export const clearAllCache = createAction(
  '[Music Cache] Clear All Cache'
);

// Update last accessed time for cache entry
export const updateCacheAccess = createAction(
  '[Music Cache] Update Cache Access',
  props<{ sourceId: string }>()
);

