import { SpotifyImage } from './track.model';

/**
 * Spotify API paginated response wrapper
 * Used for endpoints that return paginated results
 */
export interface SpotifyPaginatedResponse<T> {
  items: T[];
  next: string | null;
  previous: string | null;
  total: number;
  limit: number;
  offset: number;
  href: string;
}

/**
 * Simplified playlist object from Spotify API
 * Returned by GET /me/playlists endpoint
 */
export interface SpotifyPlaylistSimplified {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks: {
    total: number;
    href: string;
  };
  owner: {
    display_name: string | null;
    id: string;
  };
  public: boolean;
  collaborative: boolean;
  snapshot_id: string;
  href: string;
  uri: string;
}

/**
 * Playlist track object from Spotify API
 * Returned by GET /playlists/{id}/tracks endpoint
 */
export interface PlaylistTrack {
  added_at: string;
  added_by: {
    id: string;
    uri: string;
  };
  is_local: boolean;
  track: SpotifyTrack | null; // Can be null for deleted tracks
}

/**
 * Full Spotify track object
 * Used in various API responses
 */
export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  is_local: boolean;
  explicit: boolean;
  popularity: number;
}

/**
 * Spotify artist object
 */
export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

/**
 * Spotify album object
 */
export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  uri: string;
}


