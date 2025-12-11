import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { SpotifyAuthService } from '../../core/services/spotify-auth.service';
import { SpotifyApiService } from '../../core/services/spotify-api.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(SpotifyAuthService);
  private apiService = inject(SpotifyApiService);
  private router = inject(Router);

  login$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.login),
        tap(() => this.authService.login())
      ),
    { dispatch: false }
  );

  handleCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleCallback),
      switchMap(({ code }) =>
        this.authService.handleCallback(code).then((success) => {
          if (success) {
            const tokens = this.authService.getTokens();
            if (tokens) {
              return AuthActions.handleCallbackSuccess({ tokens });
            }
          }
          return AuthActions.handleCallbackFailure({ error: 'Failed to authenticate' });
        })
      ),
      catchError((error) =>
        of(AuthActions.handleCallbackFailure({ error: error.message }))
      )
    )
  );

  handleCallbackSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleCallbackSuccess),
      map(() => AuthActions.loadUser())
    )
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      switchMap(() =>
        this.apiService.getCurrentUser().pipe(
          map((user) => AuthActions.loadUserSuccess({ user })),
          catchError((error) =>
            of(AuthActions.loadUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loadUserSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loadUserSuccess),
        tap(() => this.router.navigate(['/game/setup']))
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => this.authService.logout())
      ),
    { dispatch: false }
  );

  checkAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkAuth),
      map(() => {
        const tokens = this.authService.getTokens();
        if (tokens && this.authService.isAuthenticated()) {
          return AuthActions.loginSuccess({ tokens });
        }
        return AuthActions.logout();
      })
    )
  );
}

