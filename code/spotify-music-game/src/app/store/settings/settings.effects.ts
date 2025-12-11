import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import * as SettingsActions from './settings.actions';
import * as SettingsSelectors from './settings.selectors';

const SETTINGS_STORAGE_KEY = 'gameSettings';

@Injectable()
export class SettingsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  // Load settings from localStorage on app init
  loadSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.loadSettings),
      map(() => {
        const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (storedSettings) {
          try {
            const parsed = JSON.parse(storedSettings);
            return SettingsActions.loadSettingsSuccess({
              settings: {
                songsPerGame: parsed.songsPerGame ?? environment.songsPerGame,
                previewDuration: parsed.previewDuration ?? environment.songPreviewDuration
              }
            });
          } catch (e) {
            console.error('Failed to parse stored settings', e);
            return SettingsActions.loadSettingsSuccess({
              settings: {
                songsPerGame: environment.songsPerGame,
                previewDuration: environment.songPreviewDuration
              }
            });
          }
        }
        return SettingsActions.loadSettingsSuccess({
          settings: {
            songsPerGame: environment.songsPerGame,
            previewDuration: environment.songPreviewDuration
          }
        });
      })
    )
  );

  // Save to localStorage when songs per game changes
  saveSongsPerGame$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.updateSongsPerGame),
      withLatestFrom(this.store.select(SettingsSelectors.selectPreviewDuration)),
      map(([action, previewDuration]) => {
        const updatedSettings = {
          songsPerGame: action.songsPerGame,
          previewDuration
        };
        return SettingsActions.saveSettingsToStorage({ settings: updatedSettings });
      })
    )
  );

  // Save to localStorage when preview duration changes
  savePreviewDuration$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.updatePreviewDuration),
      withLatestFrom(this.store.select(SettingsSelectors.selectSongsPerGame)),
      map(([action, songsPerGame]) => {
        const updatedSettings = {
          songsPerGame,
          previewDuration: action.previewDuration
        };
        return SettingsActions.saveSettingsToStorage({ settings: updatedSettings });
      })
    )
  );

  // Persist settings to localStorage
  persistSettings$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.saveSettingsToStorage),
        tap(({ settings }) => {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
          console.log('[Settings] Saved to localStorage:', settings);
        })
      ),
    { dispatch: false }
  );
}

