import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store/app.state';
import { GameMode } from '../../../shared/models/game.model';
import * as GameActions from '../../../store/game/game.actions';
import * as GameSelectors from '../../../store/game/game.selectors';
import * as AuthActions from '../../../store/auth/auth.actions';
import * as AuthSelectors from '../../../store/auth/auth.selectors';
import * as SettingsActions from '../../../store/settings/settings.actions';
import * as SettingsSelectors from '../../../store/settings/settings.selectors';
import * as PlaylistActions from '../../../store/playlist/playlist.actions';
import * as PlaylistSelectors from '../../../store/playlist/playlist.selectors';
import * as MusicCacheActions from '../../../store/music-cache/music-cache.actions';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-setup.component.html',
  styleUrls: ['./game-setup.component.css']
})
export class GameSetupComponent implements OnInit {
  selectedMode: GameMode = 'easy';

  songsPerGame$: Observable<number>;
  previewDuration$: Observable<number>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  currentUser$: Observable<any>;
  musicSourceDisplay$: Observable<string>;

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.isLoading$ = this.store.select(GameSelectors.selectGameLoading);
    this.error$ = this.store.select(GameSelectors.selectGameError);
    this.currentUser$ = this.store.select(AuthSelectors.selectCurrentUser);
    this.songsPerGame$ = this.store.select(SettingsSelectors.selectSongsPerGame);
    this.previewDuration$ = this.store.select(SettingsSelectors.selectPreviewDuration);
    this.musicSourceDisplay$ = this.store.select(PlaylistSelectors.selectMusicSourceDisplay);
  }

  ngOnInit(): void {
    // Load settings from localStorage via NgRx
    this.store.dispatch(SettingsActions.loadSettings());

    // Load music source from localStorage via NgRx
    this.store.dispatch(PlaylistActions.loadMusicSource());

    // Fetch tracks from the selected music source
    this.store.select(PlaylistSelectors.selectSelectedMusicSource).subscribe(source => {
      const musicSource = source || { type: 'liked-songs' as const };
      console.log('[Game Setup] Fetching tracks from selected music source:', musicSource);
      this.store.dispatch(MusicCacheActions.fetchTracksWithCache({
        source: musicSource
      }));
    }).unsubscribe();

    // Initialize game with default mode
    this.updateGameConfig();
  }

  selectMode(mode: GameMode): void {
    this.selectedMode = mode;
    this.updateGameConfig();
  }

  private updateGameConfig(): void {
    this.songsPerGame$.subscribe(songsPerGame => {
      this.store.dispatch(GameActions.initializeGame({
        mode: this.selectedMode,
        totalRounds: songsPerGame
      }));
    }).unsubscribe();
  }

  startGame(): void {
    // Store preview duration in session storage for the game to use
    this.previewDuration$.subscribe(previewDuration => {
      sessionStorage.setItem('previewDuration', String(previewDuration));
      this.store.dispatch(GameActions.startGame());
      this.router.navigate(['/game/play']);
    }).unsubscribe();
  }

  openSettings(): void {
    this.router.navigate(['/game/settings']);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

