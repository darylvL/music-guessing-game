import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store/app.state';
import { RoundResult } from '../../../shared/models/game.model';
import * as GameActions from '../../../store/game/game.actions';
import * as GameSelectors from '../../../store/game/game.selectors';

@Component({
  selector: 'app-game-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-results.component.html',
  styleUrls: ['./game-results.component.css']
})
export class GameResultsComponent implements OnInit {
  score$: Observable<number>;
  maxScore$: Observable<number>;
  scorePercentage$: Observable<number>;
  roundResults$: Observable<RoundResult[]>;
  totalRounds$: Observable<number>;

  score: number = 0;
  maxScore: number = 0;
  scorePercentage: number = 0;

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.score$ = this.store.select(GameSelectors.selectScore);
    this.maxScore$ = this.store.select(GameSelectors.selectMaxScore);
    this.scorePercentage$ = this.store.select(GameSelectors.selectScorePercentage);
    this.roundResults$ = this.store.select(GameSelectors.selectRoundResults);
    this.totalRounds$ = this.store.select(GameSelectors.selectTotalRounds);
  }

  ngOnInit(): void {
    // Check if game is actually finished
    this.store.select(GameSelectors.selectIsGameFinished).subscribe(isFinished => {
      if (!isFinished) {
        this.router.navigate(['/game/setup']);
      }
    });

    // Subscribe to values for template
    this.score$.subscribe(score => this.score = score);
    this.maxScore$.subscribe(maxScore => this.maxScore = maxScore);
    this.scorePercentage$.subscribe(percentage => this.scorePercentage = percentage);
  }

  playAgain(): void {
    this.store.dispatch(GameActions.resetGame());
    this.router.navigate(['/game/setup']);
  }

  getPerformanceMessage(percentage: number): string {
    if (percentage >= 90) return '🏆 Outstanding!';
    if (percentage >= 75) return '🌟 Excellent!';
    if (percentage >= 60) return '👍 Good job!';
    if (percentage >= 40) return '💪 Not bad!';
    return '📚 Keep practicing!';
  }

  getPerformanceClass(percentage: number): string {
    if (percentage >= 75) return 'excellent';
    if (percentage >= 50) return 'good';
    return 'needs-improvement';
  }
}

