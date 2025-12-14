import { createReducer, on } from '@ngrx/store';
import * as PlaylistActions from './playlist.actions';
import { initialPlaylistState } from './playlist.state';

/**
 * Playlist Reducer
 * Handles all state transitions for playlist store
 */
export const playlistReducer = createReducer(
  initialPlaylistState,

  // Load user playlists
  on(PlaylistActions.loadUserPlaylists, (state) => ({
    ...state,
    isLoadingPlaylists: true,
    error: null
  })),

  on(PlaylistActions.loadUserPlaylistsSuccess, (state, { playlists, fetchedAt }) => ({
    ...state,
    userPlaylists: playlists,
    isLoadingPlaylists: false,
    lastFetchedAt: fetchedAt,
    error: null
  })),

  on(PlaylistActions.loadUserPlaylistsFailure, (state, { error }) => ({
    ...state,
    isLoadingPlaylists: false,
    error
  })),

  // Select music source
  on(PlaylistActions.selectMusicSource, (state, { source }) => ({
    ...state,
    selectedMusicSource: source,
    error: null
  })),

  // Clear music source selection
  on(PlaylistActions.clearMusicSource, (state) => ({
    ...state,
    selectedMusicSource: null
  })),

  // Reset to default source (liked songs)
  on(PlaylistActions.resetToDefaultSource, (state) => ({
    ...state,
    selectedMusicSource: { type: 'liked-songs' }
  }))
);

