import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GameState } from '../../shared/models/game.model';

export const selectGameState = createFeatureSelector<GameState>('game');

export const selectGameMode = createSelector(
  selectGameState,
  (state) => state.gameMode
);

export const selectGameStatus = createSelector(
  selectGameState,
  (state) => state.gameStatus
);

export const selectCurrentRound = createSelector(
  selectGameState,
  (state) => state.currentRound
);

export const selectTotalRounds = createSelector(
  selectGameState,
  (state) => state.totalRounds
);

export const selectScore = createSelector(
  selectGameState,
  (state) => state.score
);

export const selectCurrentSong = createSelector(
  selectGameState,
  (state) => state.currentSong
);

export const selectTitleChoices = createSelector(
  selectGameState,
  (state) => state.titleChoices
);

export const selectArtistChoices = createSelector(
  selectGameState,
  (state) => state.artistChoices
);

export const selectAvailableTracks = createSelector(
  selectGameState,
  (state) => state.availableTracks
);

export const selectUsedTrackIds = createSelector(
  selectGameState,
  (state) => state.usedTrackIds
);

export const selectCorrectTitle = createSelector(
  selectGameState,
  (state) => state.correctTitle
);

export const selectCorrectArtist = createSelector(
  selectGameState,
  (state) => state.correctArtist
);

export const selectRoundResults = createSelector(
  selectGameState,
  (state) => state.roundResults
);

export const selectGameLoading = createSelector(
  selectGameState,
  (state) => state.isLoading
);

export const selectGameError = createSelector(
  selectGameState,
  (state) => state.error
);

export const selectMaxScore = createSelector(
  selectTotalRounds,
  (totalRounds) => totalRounds * 2 // 2 points per round (title + artist)
);

export const selectScorePercentage = createSelector(
  selectScore,
  selectMaxScore,
  (score, maxScore) => maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
);

export const selectIsGameFinished = createSelector(
  selectGameStatus,
  (status) => status === 'finished'
);

export const selectIsAnswered = createSelector(
  selectGameStatus,
  (status) => status === 'answered'
);

