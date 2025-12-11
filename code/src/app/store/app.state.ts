import { ActionReducerMap } from '@ngrx/store';
import { authReducer, AuthState } from './auth/auth.reducer';
import { gameReducer, GameState } from './game/game.reducer';
import { settingsReducer, SettingsState } from './settings/settings.reducer';

export interface AppState {
  auth: AuthState;
  game: GameState;
  settings: SettingsState;
}

export const appReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  game: gameReducer,
  settings: settingsReducer
};

