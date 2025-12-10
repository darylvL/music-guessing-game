import { createAction, props } from '@ngrx/store';
import { AuthTokens, SpotifyUser } from '../../shared/models/auth.model';

// Login actions
export const login = createAction('[Auth] Login');

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ tokens: AuthTokens }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Callback actions
export const handleCallback = createAction(
  '[Auth] Handle Callback',
  props<{ code: string }>()
);

export const handleCallbackSuccess = createAction(
  '[Auth] Handle Callback Success',
  props<{ tokens: AuthTokens }>()
);

export const handleCallbackFailure = createAction(
  '[Auth] Handle Callback Failure',
  props<{ error: string }>()
);

// User actions
export const loadUser = createAction('[Auth] Load User');

export const loadUserSuccess = createAction(
  '[Auth] Load User Success',
  props<{ user: SpotifyUser }>()
);

export const loadUserFailure = createAction(
  '[Auth] Load User Failure',
  props<{ error: string }>()
);

// Logout action
export const logout = createAction('[Auth] Logout');

// Check auth status
export const checkAuth = createAction('[Auth] Check Auth');

