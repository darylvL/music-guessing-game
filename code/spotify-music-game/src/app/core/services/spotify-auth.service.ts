import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthTokens } from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class SpotifyAuthService {
  private readonly TOKEN_KEY = 'spotify_auth_tokens';
  private readonly CODE_VERIFIER_KEY = 'spotify_code_verifier';

  constructor(private router: Router) {}

  /**
   * Generate a random string for PKCE code verifier
   */
  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  }

  /**
   * Generate SHA256 hash and base64 encode for PKCE code challenge
   */
  private async sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
  }

  private base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * Initiate Spotify OAuth login with PKCE
   */
  async login(): Promise<void> {
    const codeVerifier = this.generateRandomString(64);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);

    // Store code verifier for later use
    localStorage.setItem(this.CODE_VERIFIER_KEY, codeVerifier);

    const params = new URLSearchParams({
      client_id: environment.spotifyClientId,
      response_type: 'code',
      redirect_uri: environment.spotifyRedirectUri,
      scope: environment.spotifyScopes,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    window.location.href = `${environment.spotifyAuthUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string): Promise<boolean> {
    const codeVerifier = localStorage.getItem(this.CODE_VERIFIER_KEY);

    if (!codeVerifier) {
      console.error('Code verifier not found');
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: environment.spotifyClientId,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: environment.spotifyRedirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const data = await response.json();

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt: Date.now() + data.expires_in * 1000,
        scope: data.scope,
      };

      this.saveTokens(tokens);
      localStorage.removeItem(this.CODE_VERIFIER_KEY);

      return true;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return false;
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
  }

  /**
   * Get stored tokens
   */
  getTokens(): AuthTokens | null {
    const tokensStr = localStorage.getItem(this.TOKEN_KEY);
    if (!tokensStr) {
      return null;
    }

    try {
      return JSON.parse(tokensStr);
    } catch {
      return null;
    }
  }

  /**
   * Get access token if valid
   */
  getAccessToken(): string | null {
    const tokens = this.getTokens();

    if (!tokens) {
      return null;
    }

    // Check if token is expired
    if (Date.now() >= tokens.expiresAt) {
      this.logout();
      return null;
    }

    return tokens.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CODE_VERIFIER_KEY);
    this.router.navigate(['/login']);
  }
}

