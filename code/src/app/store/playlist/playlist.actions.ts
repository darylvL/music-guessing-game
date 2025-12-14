import { createAction, props } from '@ngrx/store';
import { SpotifyPlaylist, MusicSourceSelection } from './playlist.state';

/**
 * Playlist Actions
 * Actions for managing user playlists and music source selection
 */

// Load user playlists
export const loadUserPlaylists = createAction(
  '[Playlist] Load User Playlists'
);

export const loadUserPlaylistsSuccess = createAction(
  '[Playlist] Load User Playlists Success',
  props<{ playlists: SpotifyPlaylist[]; fetchedAt: number }>()
);

export const loadUserPlaylistsFailure = createAction(
  '[Playlist] Load User Playlists Failure',
  props<{ error: string }>()
);

// Select music source
export const selectMusicSource = createAction(
  '[Playlist] Select Music Source',
  props<{ source: MusicSourceSelection }>()
);

// Clear music source selection
export const clearMusicSource = createAction(
  '[Playlist] Clear Music Source'
);

// Reset to default source (liked songs)
export const resetToDefaultSource = createAction(
  '[Playlist] Reset To Default Source'
);

// Load music source from localStorage
export const loadMusicSource = createAction(
  '[Playlist] Load Music Source'
);

export const loadMusicSourceSuccess = createAction(
  '[Playlist] Load Music Source Success',
  props<{ source: MusicSourceSelection }>()
);

// Save music source to localStorage (internal action, dispatched by effects)
export const saveMusicSourceToStorage = createAction(
  '[Playlist] Save Music Source To Storage',
  props<{ source: MusicSourceSelection }>()
);

