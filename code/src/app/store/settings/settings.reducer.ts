import { createReducer, on } from '@ngrx/store';
import { GameSettings } from './settings.model';
import { environment } from '../../../environments/environment';
import * as SettingsActions from './settings.actions';

export interface SettingsState {
  settings: GameSettings;
}

export const initialState: SettingsState = {
  settings: {
    songsPerGame: environment.songsPerGame,
    previewDuration: environment.songPreviewDuration
  }
};

export const settingsReducer = createReducer(
  initialState,
  on(SettingsActions.loadSettingsSuccess, (state, { settings }) => ({
    ...state,
    settings
  })),
  on(SettingsActions.updateSongsPerGame, (state, { songsPerGame }) => ({
    ...state,
    settings: {
      ...state.settings,
      songsPerGame
    }
  })),
  on(SettingsActions.updatePreviewDuration, (state, { previewDuration }) => ({
    ...state,
    settings: {
      ...state.settings,
      previewDuration
    }
  }))
);

