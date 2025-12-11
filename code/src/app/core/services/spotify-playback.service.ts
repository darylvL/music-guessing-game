import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private currentToken: string | null = null; // Store token for SDK callback
  private playbackState$ = new BehaviorSubject<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    position: 0,
    duration: 0,
    trackUri: null
  });

  constructor(
    private authService: SpotifyAuthService,
    private http: HttpClient
  ) {}

  /**
   * Load Spotify Web Playback SDK
   */
  loadSDK(): Promise<void> {
    if (this.sdkLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // IMPORTANT: Define the callback BEFORE loading the script
      // The SDK will call this when it's ready
      window.onSpotifyWebPlaybackSDKReady = () => {
        this.sdkLoaded = true;
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

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
    try {
      await this.loadSDK();

      // Get a valid token before initializing the player
      const token = await this.authService.getValidAccessToken();
      console.log('[Playback] Token fetched for player initialization:', token ? `${token.substring(0, 20)}...` : 'NULL');
      if (!token) {
        console.warn('No access token available for Spotify player');
        return Promise.resolve(); // Continue without player
      }

      // Store the token for use in the SDK callback
      this.currentToken = token;

      return new Promise((resolve, reject) => {
        // Timeout after 5 seconds if player doesn't initialize
        const timeout = setTimeout(() => {
          console.warn('Spotify player initialization timed out - continuing without playback');
          resolve();
        }, 5000);

        // SDK is now loaded, create the player
        if (!window.Spotify) {
          console.warn('Spotify SDK not loaded');
          clearTimeout(timeout);
          resolve();
          return;
        }

        this.player = new window.Spotify.Player({
          name: 'Spotify Music Guessing Game',
          getOAuthToken: (cb: (token: string) => void) => {
            // Use the stored token that was fetched during initialization
            // This ensures we use the exact same token that was validated
            console.log('[Playback] SDK requesting token via getOAuthToken callback');
            console.log('[Playback] Using stored token:', this.currentToken ? `${this.currentToken.substring(0, 20)}...` : 'NULL');
            if (this.currentToken) {
              console.log('[Playback] Calling SDK callback with stored token');
              cb(this.currentToken);
            } else {
              console.error('[Playback] Stored token not available in getOAuthToken callback');
            }
          },
          volume: 0.7
        });

        // Error handling
        this.player.addListener('initialization_error', ({ message }: any) => {
          console.error('Initialization error:', message);
          clearTimeout(timeout);
          resolve(); // Continue without player
        });

        this.player.addListener('authentication_error', ({ message }: any) => {
          console.error('Authentication error:', message);
          clearTimeout(timeout);
          resolve(); // Continue without player
        });

        this.player.addListener('account_error', ({ message }: any) => {
          console.error('Account error (Spotify Premium required):', message);
          clearTimeout(timeout);
          resolve(); // Continue without player
        });

        this.player.addListener('playback_error', ({ message }: any) => {
          console.error('Playback error:', message);
        });

        // Ready
        this.player.addListener('ready', async ({ device_id }: any) => {
          console.log('Ready with Device ID', device_id);
          this.deviceId = device_id;

          // Transfer playback to this device
          try {
            await this.transferUserPlayback(device_id);
            console.log('Playback successfully transferred to device:', device_id);
          } catch (error) {
            console.error('Failed to transfer playback:', error);
          }

          clearTimeout(timeout);
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
      });
    } catch (error) {
      console.error('Failed to initialize player:', error);
      return Promise.resolve(); // Continue without player
    }
  }

  /**
   * Transfer playback to this web player device
   * This is CRITICAL - without this, the device won't be active for playback
   */
  private async transferUserPlayback(deviceId: string): Promise<void> {
    console.log('[Playback] Transferring playback to device:', deviceId);
    console.log('[Playback] Current stored token:', this.currentToken ? `${this.currentToken.substring(0, 20)}...` : 'NULL');
    console.log('[Playback] Token from auth service:', this.authService.getAccessToken() ? `${this.authService.getAccessToken()!.substring(0, 20)}...` : 'NULL');

    try {
      await this.http.put(
        `${environment.spotifyApiUrl}/me/player`,
        {
          device_ids: [deviceId],
          play: false // Don't auto-play, just transfer control
        }
      ).toPromise();
    } catch (error) {
      console.error('Error transferring playback:', error);
      throw error;
    }
  }

  /**
   * Play a track by URI
   */
  async playTrack(trackUri: string, positionMs: number = 0): Promise<void> {
    if (!this.deviceId) {
      console.warn('Player not initialized - playback unavailable (Spotify Premium required)');
      return; // Silently fail if player isn't available
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('No access token available for playback');
      return;
    }

    try {
      // Use HttpClient instead of fetch - the interceptor will add the Bearer token automatically
      await this.http.put(
        `${environment.spotifyApiUrl}/me/player/play?device_id=${this.deviceId}`,
        {
          uris: [trackUri],
          position_ms: positionMs
        }
      ).toPromise();
    } catch (error) {
      console.warn('Error playing track (playback unavailable):', error);
      return;
    }
  }

  /**
   * Play track for a specific duration (for game preview)
   */
  async playTrackForDuration(trackUri: string, durationSeconds?: number): Promise<void> {
    // Get duration from session storage (set by game setup) or use environment default
    const duration = durationSeconds ||
      parseInt(sessionStorage.getItem('previewDuration') || String(environment.songPreviewDuration));

    await this.playTrack(trackUri, 0);

    // Stop playback after duration
    setTimeout(() => {
      this.pause();
    }, duration * 1000);
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

