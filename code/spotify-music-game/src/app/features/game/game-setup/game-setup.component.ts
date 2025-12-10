import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store/app.state';
import { GameMode } from '../../../shared/models/game.model';
import { environment } from '../../../../environments/environment';
import * as GameActions from '../../../store/game/game.actions';
import * as GameSelectors from '../../../store/game/game.selectors';
import * as AuthActions from '../../../store/auth/auth.actions';
import * as AuthSelectors from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-setup.component.html',
  styleUrls: ['./game-setup.component.css']
})
export class GameSetupComponent implements OnInit {
  selectedMode: GameMode = 'easy';
  songsPerGame = environment.songsPerGame;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  currentUser$: Observable<any>;

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.isLoading$ = this.store.select(GameSelectors.selectGameLoading);
    this.error$ = this.store.select(GameSelectors.selectGameError);
    this.currentUser$ = this.store.select(AuthSelectors.selectCurrentUser);
  }

  ngOnInit(): void {
    // Initialize game with default mode
    this.store.dispatch(GameActions.initializeGame({
      mode: this.selectedMode,
      totalRounds: this.songsPerGame
    }));
  }

  selectMode(mode: GameMode): void {
    this.selectedMode = mode;
    this.store.dispatch(GameActions.initializeGame({
      mode,
      totalRounds: this.songsPerGame
    }));
  }

  startGame(): void {
    this.store.dispatch(GameActions.startGame());
    this.router.navigate(['/game/play']);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

