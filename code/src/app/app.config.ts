import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { appReducers } from './store/app.state';
import { AuthEffects } from './store/auth/auth.effects';
import { GameEffects } from './store/game/game.effects';
import { SettingsEffects } from './store/settings/settings.effects';
import { PlaylistEffects } from './store/playlist/playlist.effects';
import { MusicCacheEffects } from './store/music-cache/music-cache.effects';
import { SpotifyAuthInterceptor } from './core/interceptors/spotify-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), // Enable DI-based interceptors
    // Register Spotify Auth Interceptor to automatically add Bearer token to Spotify API requests
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SpotifyAuthInterceptor,
      multi: true
    },
    provideStore(appReducers),
    provideEffects([AuthEffects, GameEffects, SettingsEffects, PlaylistEffects, MusicCacheEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode()
    })
  ]
};
