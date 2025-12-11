import { createReducer, on } from '@ngrx/store';
import { AuthTokens, SpotifyUser } from '../../shared/models/auth.model';
import * as AuthActions from './auth.actions';

export interface AuthState {
  tokens: AuthTokens | null;
  user: SpotifyUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  tokens: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,

  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { tokens }) => ({
    ...state,
    tokens,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Callback
  on(AuthActions.handleCallback, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(AuthActions.handleCallbackSuccess, (state, { tokens }) => ({
    ...state,
    tokens,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })),

  on(AuthActions.handleCallbackFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // User
  on(AuthActions.loadUser, (state) => ({
    ...state,
    isLoading: true,
  })),

  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    isLoading: false,
  })),

  on(AuthActions.loadUserFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Logout
  on(AuthActions.logout, () => initialAuthState),

  // Check auth
  on(AuthActions.checkAuth, (state) => state)
);

