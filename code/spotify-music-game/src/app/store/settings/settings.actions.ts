import { createAction, props } from '@ngrx/store';
import { GameSettings } from './settings.model';

export const loadSettings = createAction('[Settings] Load Settings');

export const loadSettingsSuccess = createAction(
  '[Settings] Load Settings Success',
  props<{ settings: GameSettings }>()
);

export const updateSongsPerGame = createAction(
  '[Settings] Update Songs Per Game',
  props<{ songsPerGame: number }>()
);

export const updatePreviewDuration = createAction(
  '[Settings] Update Preview Duration',
  props<{ previewDuration: number }>()
);

export const saveSettingsToStorage = createAction(
  '[Settings] Save Settings To Storage',
  props<{ settings: GameSettings }>()
);

