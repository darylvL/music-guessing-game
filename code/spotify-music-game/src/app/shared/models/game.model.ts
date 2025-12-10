import { Track } from './track.model';

export type GameMode = 'easy' | 'hard';
export type GameStatus = 'setup' | 'playing' | 'answered' | 'finished';

export interface GameState {
  currentRound: number;
  totalRounds: number;
  score: number;
  currentSong: Track | null;
  titleChoices: string[];
  artistChoices: string[];
  gameMode: GameMode;
  gameStatus: GameStatus;
  availableTracks: Track[];
  usedTrackIds: string[];
  correctTitle: boolean | null;
  correctArtist: boolean | null;
  roundResults: RoundResult[];
  isLoading: boolean;
  error: string | null;
}

export interface RoundResult {
  round: number;
  track: Track;
  userTitleAnswer: string;
  userArtistAnswer: string;
  correctTitle: boolean;
  correctArtist: boolean;
  pointsEarned: number;
}

export interface MusicSource {
  type: 'liked-songs' | 'playlist' | 'album';
  fetchTracks(): Promise<Track[]>;
}

