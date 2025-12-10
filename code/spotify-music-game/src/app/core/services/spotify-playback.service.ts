import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SpotifyAuthService } from './spotify-auth.service';
import { environment } from '../../../environments/environment';

// Spotify Web Playback SDK types
declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  position: number;
  duration: number;
  trackUri: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SpotifyPlaybackService {
  private player: any = null;
  private deviceId: string | null = null;
  private sdkLoaded = false;
  private playbackState$ = new BehaviorSubject<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    position: 0,
    duration: 0,
    trackUri: null
  });

  constructor(private authService: SpotifyAuthService) {}

  /**
   * Load Spotify Web Playback SDK
   */
  loadSDK(): Promise<void> {
    if (this.sdkLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

      script.onload = () => {
        this.sdkLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Spotify Web Playback SDK'));
      };

      document.body.appendChild(script);
    });
  }

  /**
   * Initialize Spotify player
   */
  async initializePlayer(): Promise<void> {
    await this.loadSDK();

    const token = this.authService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    return new Promise((resolve, reject) => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        this.player = new window.Spotify.Player({
          name: 'Spotify Music Guessing Game',
          getOAuthToken: (cb: (token: string) => void) => {
            const currentToken = this.authService.getAccessToken();
            if (currentToken) {
              cb(currentToken);
            }
          },
          volume: 0.7
        });

        // Error handling
        this.player.addListener('initialization_error', ({ message }: any) => {
          console.error('Initialization error:', message);
          reject(new Error(message));
        });

        this.player.addListener('authentication_error', ({ message }: any) => {
          console.error('Authentication error:', message);
          reject(new Error(message));
        });

        this.player.addListener('account_error', ({ message }: any) => {
          console.error('Account error:', message);
          reject(new Error(message));
        });

        this.player.addListener('playback_error', ({ message }: any) => {
          console.error('Playback error:', message);
        });

        // Ready
        this.player.addListener('ready', ({ device_id }: any) => {
          console.log('Ready with Device ID', device_id);
          this.deviceId = device_id;
          resolve();
        });

        // Not Ready
        this.player.addListener('not_ready', ({ device_id }: any) => {
          console.log('Device ID has gone offline', device_id);
        });

        // Player state changed
        this.player.addListener('player_state_changed', (state: any) => {
          if (state) {
            this.playbackState$.next({
              isPlaying: !state.paused,
              isPaused: state.paused,
              position: state.position,
              duration: state.duration,
              trackUri: state.track_window.current_track.uri
            });
          }
        });

        // Connect to the player
        this.player.connect();
      };
    });
  }

  /**
   * Play a track by URI
   */
  async playTrack(trackUri: string, positionMs: number = 0): Promise<void> {
    if (!this.deviceId) {
      throw new Error('Player not initialized');
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uris: [trackUri],
            position_ms: positionMs
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }

  /**
   * Play track for a specific duration (for game preview)
   */
  async playTrackForDuration(trackUri: string, durationSeconds: number = environment.songPreviewDuration): Promise<void> {
    await this.playTrack(trackUri, 0);

    // Stop playback after duration
    setTimeout(() => {
      this.pause();
    }, durationSeconds * 1000);
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.player) {
      this.player.pause();
    }
  }

  /**
   * Resume playback
   */
  resume(): void {
    if (this.player) {
      this.player.resume();
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.player) {
      this.player.pause();
      this.player.seek(0);
    }
  }

  /**
   * Get playback state observable
   */
  getPlaybackState(): Observable<PlaybackState> {
    return this.playbackState$.asObservable();
  }

  /**
   * Get device ID
   */
  getDeviceId(): string | null {
    return this.deviceId;
  }

  /**
   * Disconnect player
   */
  disconnect(): void {
    if (this.player) {
      this.player.disconnect();
      this.player = null;
      this.deviceId = null;
    }
  }
}

