/**
 * Playlist Store State Interface
 * Manages user's playlists and music source selection
 */

/**
 * Simplified playlist model for our application
 * Mapped from Spotify API response
 */
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  trackCount: number;
  owner: string;
  isPublic: boolean;
  isCollaborative: boolean;
}

/**
 * Music source selection type
 * Represents the different ways users can select music for the game
 */
export type MusicSourceSelection =
  | { type: 'liked-songs' }
  | { type: 'single-playlist'; playlistId: string; playlistName: string }
  | { type: 'multiple-playlists'; playlistIds: string[]; playlistNames: string[] };

/**
 * Playlist store state interface
 */
export interface PlaylistState {
  /** User's available playlists from Spotify */
  userPlaylists: SpotifyPlaylist[];

  /** Loading state for fetching playlists */
  isLoadingPlaylists: boolean;

  /** Currently selected music source for the game */
  selectedMusicSource: MusicSourceSelection | null;

  /** Error message if playlist loading fails */
  error: string | null;

  /** Timestamp of last playlist fetch (for cache TTL) */
  lastFetchedAt: number | null;
}

/**
 * Initial state for playlist store
 */
export const initialPlaylistState: PlaylistState = {
  userPlaylists: [],
  isLoadingPlaylists: false,
  selectedMusicSource: { type: 'liked-songs' }, // Default to liked songs
  error: null,
  lastFetchedAt: null
};

