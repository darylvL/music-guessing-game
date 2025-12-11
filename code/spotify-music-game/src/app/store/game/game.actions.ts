import { createAction, props } from '@ngrx/store';
import { Track } from '../../shared/models/track.model';
import { GameMode, RoundResult } from '../../shared/models/game.model';

// Game setup actions
export const initializeGame = createAction(
  '[Game] Initialize Game',
  props<{ mode: GameMode; totalRounds: number }>()
);

// Preload tracks (called when game setup screen loads)
export const preloadTracks = createAction(
  '[Game] Preload Tracks',
  props<{ musicSourceType?: 'liked-songs' | 'playlist' | 'album' }>()
);

export const loadTracks = createAction('[Game] Load Tracks');

export const loadTracksSuccess = createAction(
  '[Game] Load Tracks Success',
  props<{ tracks: Track[] }>()
);

export const loadTracksFailure = createAction(
  '[Game] Load Tracks Failure',
  props<{ error: string }>()
);

// Game flow actions
export const startGame = createAction('[Game] Start Game');

export const loadNextSong = createAction('[Game] Load Next Song');

export const loadNextSongSuccess = createAction(
  '[Game] Load Next Song Success',
  props<{
    song: Track;
    titleChoices: string[];
    artistChoices: string[];
  }>()
);

export const loadNextSongFailure = createAction(
  '[Game] Load Next Song Failure',
  props<{ error: string }>()
);

// Answer submission actions
export const submitAnswer = createAction(
  '[Game] Submit Answer',
  props<{ titleAnswer: string; artistAnswer: string }>()
);

export const submitAnswerSuccess = createAction(
  '[Game] Submit Answer Success',
  props<{
    correctTitle: boolean;
    correctArtist: boolean;
    result: RoundResult;
  }>()
);

// Round navigation
export const nextRound = createAction('[Game] Next Round');

export const finishGame = createAction('[Game] Finish Game');

// Game reset
export const resetGame = createAction('[Game] Reset Game');

// Playback actions
export const startPlayback = createAction('[Game] Start Playback');

export const stopPlayback = createAction('[Game] Stop Playback');

