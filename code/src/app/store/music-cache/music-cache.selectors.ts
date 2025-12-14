import { createSelector } from '@ngrx/store';
import { AppState } from '../app.state';
import { MusicCacheState, getTTLForSourceType, isCacheFresh } from './music-cache.state';
import { MusicSourceSelection } from '../playlist/playlist.state';
import { Track } from '../../shared/models/track.model';

/**
 * Music Cache Selectors
 * Selectors for accessing music cache store state
 */

// Base selector
export const selectMusicCacheState = (state: AppState) => state.musicCache;

// Simple selectors
export const selectLikedSongsCache = createSelector(
  selectMusicCacheState,
  (state: MusicCacheState) => state.likedSongs
);

// Factory selector for playlist tracks cache
export const selectPlaylistTracksCache = (playlistId: string) => createSelector(
  selectMusicCacheState,
  (state: MusicCacheState) => state.playlistTracks[playlistId]
);

// Factory selector for cache metadata
export const selectCacheMetadata = (sourceId: string) => createSelector(
  selectMusicCacheState,
  (state: MusicCacheState) => state.cacheMetadata[sourceId]
);

// Factory selector to check if cache is stale
export const selectIsCacheStale = (sourceId: string, sourceType: 'liked-songs' | 'playlist') => createSelector(
  selectMusicCacheState,
  (state: MusicCacheState) => {
    const metadata = state.cacheMetadata[sourceId];
    if (!metadata) return true; // No cache = stale

    if (metadata.isStale) return true; // Explicitly marked as stale

    // Check TTL
    const ttl = getTTLForSourceType(sourceType);
    return !isCacheFresh(metadata.lastFetchedAt, ttl);
  }
);

// Factory selector to get cached tracks for a source
export const selectCachedTracksForSource = (source: MusicSourceSelection | null) => createSelector(
  selectMusicCacheState,
  (state: MusicCacheState): Track[] | null => {
    if (!source) return null;

    if (source.type === 'liked-songs') {
      return state.likedSongs?.tracks ?? null;
    } else if (source.type === 'single-playlist') {
      return state.playlistTracks[source.playlistId]?.tracks ?? null;
    } else if (source.type === 'multiple-playlists') {
      // Combine tracks from multiple playlists
      const allTracks: Track[] = [];
      for (const playlistId of source.playlistIds) {
        const cached = state.playlistTracks[playlistId];
        if (!cached) return null; // If any playlist is not cached, return null
        allTracks.push(...cached.tracks);
      }
      return allTracks.length > 0 ? allTracks : null;
    }
    return null;
  }
);

// Computed selector for available track count
export const selectAvailableTrackCount = createSelector(
  selectMusicCacheState,
  (state: AppState) => state.playlist?.selectedMusicSource,
  (cacheState, source) => {
    if (!source) return 0;

    if (source.type === 'liked-songs') {
      return cacheState.likedSongs?.tracks.length ?? 0;
    } else if (source.type === 'single-playlist') {
      return cacheState.playlistTracks[source.playlistId]?.tracks.length ?? 0;
    } else if (source.type === 'multiple-playlists') {
      return source.playlistIds.reduce((sum, id) => {
        const cached = cacheState.playlistTracks[id];
        return sum + (cached?.tracks.length ?? 0);
      }, 0);
    }
    return 0;
  }
);

