import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, forkJoin } from 'rxjs';
import { map, expand, reduce, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyTrack, Track } from '../../shared/models/track.model';
import { SpotifyUser } from '../../shared/models/auth.model';

interface SpotifyPaginatedResponse<T> {
  items: T[];
  next: string | null;
  total: number;
  limit: number;
  offset: number;
}

interface SavedTrack {
  track: SpotifyTrack;
  added_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService {
  private readonly API_URL = environment.spotifyApiUrl;

  constructor(
    private http: HttpClient,
    private authService: SpotifyAuthService
  ) {}

  /**
   * Get HTTP headers with authorization
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<SpotifyUser> {
    return this.http.get<SpotifyUser>(`${this.API_URL}/me`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get user's liked songs with pagination handling
   */
  getUserLikedSongs(): Observable<Track[]> {
    return this.getLikedSongsPage(0, 50).pipe(
      expand((response) =>
        response.next
          ? this.getLikedSongsPage(response.offset + response.limit, 50)
          : []
      ),
      reduce((acc: SavedTrack[], response) => [...acc, ...response.items], []),
      map((savedTracks) => savedTracks.map(st => this.mapSpotifyTrackToTrack(st.track)))
    );
  }

  /**
   * Get a single page of liked songs
   */
  private getLikedSongsPage(offset: number, limit: number): Observable<SpotifyPaginatedResponse<SavedTrack>> {
    return this.http.get<SpotifyPaginatedResponse<SavedTrack>>(
      `${this.API_URL}/me/tracks?offset=${offset}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get specific track by ID
   */
  getTrack(trackId: string): Observable<Track> {
    return this.http.get<SpotifyTrack>(`${this.API_URL}/tracks/${trackId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(track => this.mapSpotifyTrackToTrack(track))
    );
  }

  /**
   * Map Spotify API track to our Track model
   */
  private mapSpotifyTrackToTrack(spotifyTrack: SpotifyTrack): Track {
    return {
      id: spotifyTrack.id,
      title: spotifyTrack.name,
      artist: spotifyTrack.artists.map(a => a.name).join(', '),
      artistId: spotifyTrack.artists[0]?.id || '',
      uri: spotifyTrack.uri,
      albumImageUrl: spotifyTrack.album.images[0]?.url,
      durationMs: spotifyTrack.duration_ms,
      previewUrl: spotifyTrack.preview_url
    };
  }
}

