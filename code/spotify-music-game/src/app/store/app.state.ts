import { ActionReducerMap } from '@ngrx/store';
import { authReducer, AuthState } from './auth/auth.reducer';
import { gameReducer, GameState } from './game/game.reducer';

export interface AppState {
  auth: AuthState;
  game: GameState;
}

export const appReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  game: gameReducer
};

