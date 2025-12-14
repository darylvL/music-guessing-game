import { createReducer, on } from '@ngrx/store';
import { GameState } from '../../shared/models/game.model';
import * as GameActions from './game.actions';

export type { GameState } from '../../shared/models/game.model';

export const initialGameState: GameState = {
  currentRound: 0,
  totalRounds: 0,
  score: 0,
  currentSong: null,
  titleChoices: [],
  artistChoices: [],
  gameMode: 'easy',
  gameStatus: 'setup',
  availableTracks: [],
  usedTrackIds: [],
  correctTitle: null,
  correctArtist: null,
  roundResults: [],
  isLoading: false,
  error: null,
};

export const gameReducer = createReducer(
  initialGameState,

  // Initialize game
  on(GameActions.initializeGame, (state, { mode, totalRounds }) => ({
    ...initialGameState,
    gameMode: mode,
    totalRounds,
    gameStatus: 'setup' as const,
    // Preserve preloaded tracks when initializing game
    availableTracks: state.availableTracks,
  })),

  // Preload tracks
  on(GameActions.preloadTracks, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  // Load tracks
  on(GameActions.loadTracks, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  on(GameActions.loadTracksSuccess, (state, { tracks }) => ({
    ...state,
    availableTracks: tracks,
    isLoading: false,
    error: null,
  })),

  on(GameActions.loadTracksFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Start game
  on(GameActions.startGame, (state) => {
    // Import environment here to get the configured value
    const totalRounds = state.totalRounds || 10;
    return {
      ...state,
      gameStatus: 'playing' as const,
      currentRound: 1,
      totalRounds,
      score: 0,
      usedTrackIds: [],
      roundResults: [],
    };
  }),

  // Load next song
  on(GameActions.loadNextSong, (state) => ({
    ...state,
    isLoading: true,
    correctTitle: null,
    correctArtist: null,
  })),

  on(GameActions.loadNextSongSuccess, (state, { song, titleChoices, artistChoices }) => ({
    ...state,
    currentSong: song,
    titleChoices,
    artistChoices,
    usedTrackIds: [...state.usedTrackIds, song.id],
    isLoading: false,
    gameStatus: 'playing' as const,
  })),

  on(GameActions.loadNextSongFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // Submit answer
  on(GameActions.submitAnswer, (state) => ({
    ...state,
    isLoading: true,
  })),

  on(GameActions.submitAnswerSuccess, (state, { correctTitle, correctArtist, result }) => {
    const pointsEarned = (correctTitle ? 1 : 0) + (correctArtist ? 1 : 0);
    return {
      ...state,
      correctTitle,
      correctArtist,
      score: state.score + pointsEarned,
      roundResults: [...state.roundResults, result],
      gameStatus: 'answered' as const,
      isLoading: false,
    };
  }),

  // Next round
  on(GameActions.nextRound, (state) => ({
    ...state,
    currentRound: state.currentRound + 1,
    correctTitle: null,
    correctArtist: null,
    gameStatus: 'playing' as const,
  })),

  // Finish game
  on(GameActions.finishGame, (state) => ({
    ...state,
    gameStatus: 'finished' as const,
  })),

  // Reset game
  on(GameActions.resetGame, (state) => ({
    ...initialGameState,
    // Preserve available tracks when resetting so music source selection is maintained
    availableTracks: state.availableTracks,
  })),

  // Playback actions (no state change, handled by effects)
  on(GameActions.startPlayback, (state) => state),
  on(GameActions.stopPlayback, (state) => state)
);

