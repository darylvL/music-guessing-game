import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated
);

export const selectAuthTokens = createSelector(
  selectAuthState,
  (state) => state.tokens
);

export const selectAccessToken = createSelector(
  selectAuthTokens,
  (tokens) => tokens?.accessToken || null
);

export const selectCurrentUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.isLoading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

