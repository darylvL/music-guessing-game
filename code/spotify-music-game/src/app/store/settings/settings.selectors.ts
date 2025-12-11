import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SettingsState } from './settings.reducer';

export const selectSettingsState = createFeatureSelector<SettingsState>('settings');

export const selectSettings = createSelector(
  selectSettingsState,
  (state: SettingsState) => state.settings
);

export const selectSongsPerGame = createSelector(
  selectSettings,
  (settings) => settings.songsPerGame
);

export const selectPreviewDuration = createSelector(
  selectSettings,
  (settings) => settings.previewDuration
);

