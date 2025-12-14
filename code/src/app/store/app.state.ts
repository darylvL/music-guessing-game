import { ActionReducerMap } from '@ngrx/store';
import { authReducer, AuthState } from './auth/auth.reducer';
import { gameReducer, GameState } from './game/game.reducer';
import { settingsReducer, SettingsState } from './settings/settings.reducer';
import { playlistReducer } from './playlist/playlist.reducer';
import { PlaylistState } from './playlist/playlist.state';
import { musicCacheReducer } from './music-cache/music-cache.reducer';
import { MusicCacheState } from './music-cache/music-cache.state';

export interface AppState {
  auth: AuthState;
  game: GameState;
  settings: SettingsState;
  playlist: PlaylistState;
  musicCache: MusicCacheState;
}

export const appReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  game: gameReducer,
  settings: settingsReducer,
  playlist: playlistReducer,
  musicCache: musicCacheReducer
};

