import { Track } from '../../shared/models/track.model';
import { environment } from '../../../environments/environment';

/**
 * Music Cache Store State Interface
 * Manages caching of all fetched music data (liked songs and playlists)
 */

/**
 * Cached music collection with metadata
 */
export interface CachedMusicCollection {
  /** Array of tracks in this collection */
  tracks: Track[];

  /** Timestamp when this collection was fetched */
  fetchedAt: number;

  /** Source identifier (e.g., 'liked-songs' or playlistId) */
  sourceId: string;

  /** Type of source */
  sourceType: 'liked-songs' | 'playlist';
}

/**
 * Cache metadata for tracking cache state
 */
export interface CacheMetadata {
  /** Source identifier */
  sourceId: string;

  /** Type of source */
  sourceType: 'liked-songs' | 'playlist';

  /** When the cache was last fetched */
  lastFetchedAt: number;

  /** When the cache was last accessed */
  lastAccessedAt: number;

  /** Number of tracks in the cache */
  trackCount: number;

  /** Whether the cache is considered stale */
  isStale: boolean;
}

/**
 * Music cache store state interface
 */
export interface MusicCacheState {
  /** Cached liked songs collection */
  likedSongs: CachedMusicCollection | null;

  /** Cached playlist tracks (key: playlistId, value: cached collection) */
  playlistTracks: Record<string, CachedMusicCollection>;

  /** Cache metadata for all cached sources */
  cacheMetadata: Record<string, CacheMetadata>;
}

/**
 * Initial state for music cache store
 */
export const initialMusicCacheState: MusicCacheState = {
  likedSongs: null,
  playlistTracks: {},
  cacheMetadata: {}
};

/**
 * Cache TTL constants from environment
 * These values determine how long cached data is considered fresh
 */
export const LIKED_SONGS_CACHE_TTL = environment.cacheTtlLikedSongs;
export const PLAYLIST_CACHE_TTL = environment.cacheTtlPlaylists;
export const USER_PLAYLISTS_CACHE_TTL = environment.cacheTtlUserPlaylists;

/**
 * Helper function to check if cache is fresh based on TTL
 * @param fetchedAt - Timestamp when cache was fetched
 * @param ttl - Time to live in milliseconds
 * @returns true if cache is still fresh, false if stale
 */
export function isCacheFresh(fetchedAt: number, ttl: number): boolean {
  const now = Date.now();
  return (now - fetchedAt) < ttl;
}

/**
 * Helper function to get TTL for a source type
 * @param sourceType - Type of source ('liked-songs' or 'playlist')
 * @returns TTL in milliseconds
 */
export function getTTLForSourceType(sourceType: 'liked-songs' | 'playlist'): number {
  return sourceType === 'liked-songs' ? LIKED_SONGS_CACHE_TTL : PLAYLIST_CACHE_TTL;
}

