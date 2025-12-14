import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AppState } from '../../../store/app.state';
import { Track } from '../../../shared/models/track.model';
import { GameMode } from '../../../shared/models/game.model';
import { SpotifyPlaybackService } from '../../../core/services/spotify-playback.service';
import { environment } from '../../../../environments/environment';
import * as GameActions from '../../../store/game/game.actions';
import * as GameSelectors from '../../../store/game/game.selectors';

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.css'],
  host: {
    '[style.--auto-advance-duration]': 'autoAdvanceDurationCss'
  }
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
  isLastRound$: Observable<boolean>;
  bothAnswersCorrect$: Observable<boolean>;

  selectedTitle: string = '';
  selectedArtist: string = '';
  inputTitle: string = '';
  inputArtist: string = '';
  gameMode: GameMode = 'easy';
  isAutoAdvancing: boolean = false;
  autoAdvanceDurationCss: string = `${environment.autoAdvanceDelay}ms`;

  private subscriptions = new Subscription();
  private autoAdvanceTimer: any = null;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private playbackService: SpotifyPlaybackService
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
    this.isLastRound$ = this.store.select(GameSelectors.selectIsLastRound);
    this.bothAnswersCorrect$ = this.store.select(GameSelectors.selectBothAnswersCorrect);
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

    // Start auto-advance only when both answers are correct
    this.subscriptions.add(
      this.isAnswered$.subscribe(isAnswered => {
        console.log('[GamePlay] isAnswered changed:', isAnswered, 'isAutoAdvancing:', this.isAutoAdvancing);
        if (isAnswered && !this.isAutoAdvancing) {
          // Check if both answers are correct before auto-advancing
          this.bothAnswersCorrect$.subscribe(bothCorrect => {
            if (bothCorrect) {
              console.log('[GamePlay] Both answers correct - starting auto-advance');
              this.startAutoAdvance();
            } else {
              console.log('[GamePlay] At least one answer incorrect - no auto-advance');
            }
          }).unsubscribe();
        } else if (!isAnswered && this.isAutoAdvancing) {
          console.log('[GamePlay] Stopping auto-advance');
          this.stopAutoAdvance();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stopAutoAdvance();
  }

  selectTitle(title: string): void {
    this.selectedTitle = title;
    // Auto-submit in easy mode when both answers are selected
    if (this.gameMode === 'easy') {
      this.checkAndAutoSubmit();
    }
  }

  selectArtist(artist: string): void {
    this.selectedArtist = artist;
    // Auto-submit in easy mode when both answers are selected
    if (this.gameMode === 'easy') {
      this.checkAndAutoSubmit();
    }
  }

  private checkAndAutoSubmit(): void {
    // Only auto-submit if both answers are selected and not already answered
    if (this.selectedTitle && this.selectedArtist) {
      // Small delay to allow user to see their selection
      setTimeout(() => {
        this.submitAnswer();
      }, 300);
    }
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

  restartSong(): void {
    // Get the current song and restart playback from the beginning
    this.currentSong$.subscribe(song => {
      if (song?.uri) {
        console.log('[GamePlay] Restarting song:', song.title);
        const duration = parseInt(sessionStorage.getItem('previewDuration') || String(environment.songPreviewDuration));
        this.playbackService.playTrackForDuration(song.uri, duration).catch((error) => {
          console.warn('Failed to restart track:', error);
        });
      }
    }).unsubscribe();
  }

  private startAutoAdvance(): void {
    // Clear any existing timers first
    this.stopAutoAdvance();

    this.isAutoAdvancing = true;
    const delay = environment.autoAdvanceDelay;

    console.log('[GamePlay] Auto-advance started. Delay:', delay, 'ms. CSS animation will handle progress bar.');

    // Just set a timer to advance - CSS handles the visual progress
    this.autoAdvanceTimer = setTimeout(() => {
      console.log('[GamePlay] Auto-advance timeout reached, advancing to next round');
      this.nextRound();
    }, delay);
  }

  private stopAutoAdvance(): void {
    this.isAutoAdvancing = false;
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Prevent keyboard shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement) {
      return;
    }

    // If answered, allow Enter or Space to advance
    if (this.isAutoAdvancing) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.stopAutoAdvance();
        this.nextRound();
        return;
      }
    }

    // Easy mode keyboard shortcuts
    if (this.gameMode === 'easy') {
      const num = parseInt(event.key);

      // Get current choices
      this.titleChoices$.subscribe(titleChoices => {
        this.artistChoices$.subscribe(artistChoices => {
          // Keys 1-4 for title choices
          if (num >= 1 && num <= 4 && titleChoices.length >= num) {
            event.preventDefault();
            this.selectTitle(titleChoices[num - 1]);
          }
          // Keys 5-8 for artist choices (mapped to indices 0-3)
          else if (num >= 5 && num <= 8 && artistChoices.length >= (num - 4)) {
            event.preventDefault();
            this.selectArtist(artistChoices[num - 5]);
          }
        }).unsubscribe();
      }).unsubscribe();
    }
    // Hard mode: Enter to submit
    else if (this.gameMode === 'hard' && event.key === 'Enter') {
      if (this.canSubmit()) {
        event.preventDefault();
        this.submitAnswer();
      }
    }
  }
}

