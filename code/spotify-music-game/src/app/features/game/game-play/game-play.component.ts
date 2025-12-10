import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AppState } from '../../../store/app.state';
import { Track } from '../../../shared/models/track.model';
import { GameMode } from '../../../shared/models/game.model';
import * as GameActions from '../../../store/game/game.actions';
import * as GameSelectors from '../../../store/game/game.selectors';

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.css']
})
export class GamePlayComponent implements OnInit, OnDestroy {
  currentSong$: Observable<Track | null>;
  titleChoices$: Observable<string[]>;
  artistChoices$: Observable<string[]>;
  currentRound$: Observable<number>;
  totalRounds$: Observable<number>;
  score$: Observable<number>;
  gameMode$: Observable<GameMode>;
  isAnswered$: Observable<boolean>;
  correctTitle$: Observable<boolean | null>;
  correctArtist$: Observable<boolean | null>;
  isLoading$: Observable<boolean>;

  selectedTitle: string = '';
  selectedArtist: string = '';
  inputTitle: string = '';
  inputArtist: string = '';
  gameMode: GameMode = 'easy';

  private subscriptions = new Subscription();

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.currentSong$ = this.store.select(GameSelectors.selectCurrentSong);
    this.titleChoices$ = this.store.select(GameSelectors.selectTitleChoices);
    this.artistChoices$ = this.store.select(GameSelectors.selectArtistChoices);
    this.currentRound$ = this.store.select(GameSelectors.selectCurrentRound);
    this.totalRounds$ = this.store.select(GameSelectors.selectTotalRounds);
    this.score$ = this.store.select(GameSelectors.selectScore);
    this.gameMode$ = this.store.select(GameSelectors.selectGameMode);
    this.isAnswered$ = this.store.select(GameSelectors.selectIsAnswered);
    this.correctTitle$ = this.store.select(GameSelectors.selectCorrectTitle);
    this.correctArtist$ = this.store.select(GameSelectors.selectCorrectArtist);
    this.isLoading$ = this.store.select(GameSelectors.selectGameLoading);
  }

  ngOnInit(): void {
    // Check if game is in correct state
    this.subscriptions.add(
      this.store.select(GameSelectors.selectGameStatus).subscribe(status => {
        if (status === 'setup') {
          this.router.navigate(['/game/setup']);
        } else if (status === 'finished') {
          this.router.navigate(['/game/results']);
        }
      })
    );

    // Reset selections when new song loads
    this.subscriptions.add(
      this.currentSong$.subscribe(() => {
        this.selectedTitle = '';
        this.selectedArtist = '';
        this.inputTitle = '';
        this.inputArtist = '';
      })
    );

    // Subscribe to game mode
    this.subscriptions.add(
      this.gameMode$.subscribe(mode => {
        this.gameMode = mode;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  selectTitle(title: string): void {
    this.selectedTitle = title;
  }

  selectArtist(artist: string): void {
    this.selectedArtist = artist;
  }

  submitAnswer(): void {
    const gameMode = this.gameMode;
    let titleAnswer: string;
    let artistAnswer: string;

    if (gameMode === 'easy') {
      titleAnswer = this.selectedTitle;
      artistAnswer = this.selectedArtist;
    } else {
      titleAnswer = this.inputTitle;
      artistAnswer = this.inputArtist;
    }

    if (!titleAnswer || !artistAnswer) {
      return; // Don't submit if answers are empty
    }

    this.store.dispatch(GameActions.submitAnswer({ titleAnswer, artistAnswer }));
  }

  nextRound(): void {
    this.store.dispatch(GameActions.nextRound());
  }

  canSubmit(): boolean {
    if (this.gameMode === 'easy') {
      return this.selectedTitle !== '' && this.selectedArtist !== '';
    } else {
      return this.inputTitle.trim() !== '' && this.inputArtist.trim() !== '';
    }
  }
}

