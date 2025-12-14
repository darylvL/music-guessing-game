import { createSelector } from '@ngrx/store';
import { AppState } from '../app.state';
import { PlaylistState } from './playlist.state';

/**
 * Playlist Selectors
 * Selectors for accessing playlist store state
 */

// Base selector
export const selectPlaylistState = (state: AppState) => state.playlist;

// Simple selectors
export const selectUserPlaylists = createSelector(
  selectPlaylistState,
  (state: PlaylistState) => state.userPlaylists
);

export const selectIsLoadingPlaylists = createSelector(
  selectPlaylistState,
  (state: PlaylistState) => state.isLoadingPlaylists
);

export const selectSelectedMusicSource = createSelector(
  selectPlaylistState,
  (state: PlaylistState) => state.selectedMusicSource
);

export const selectPlaylistError = createSelector(
  selectPlaylistState,
  (state: PlaylistState) => state.error
);

export const selectLastFetchedAt = createSelector(
  selectPlaylistState,
  (state: PlaylistState) => state.lastFetchedAt
);

// Computed selectors
export const selectMusicSourceDisplay = createSelector(
  selectSelectedMusicSource,
  (source) => {
    if (!source) return 'No source selected';

    switch (source.type) {
      case 'liked-songs':
        return 'Your Liked Songs';
      case 'single-playlist':
        return source.playlistName;
      case 'multiple-playlists':
        return `${source.playlistIds.length} Playlists`;
      default:
        return 'Unknown source';
    }
  }
);

