import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, forkJoin, EMPTY, of } from 'rxjs';
import { map, expand, reduce, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SpotifyAuthService } from './spotify-auth.service';
import { Track } from '../../shared/models/track.model';
import { SpotifyUser } from '../../shared/models/auth.model';
import { SpotifyPaginatedResponse, SpotifyPlaylistSimplified, PlaylistTrack, SpotifyTrack } from '../../shared/models/spotify-api.model';
import { SpotifyPlaylist } from '../../store/playlist/playlist.state';

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
   * Get user's liked songs with pagination handling (all pages)
   */
  getUserLikedTracks(): Observable<Track[]> {
    return this.getUserLikedTracksPage(0, 50).pipe(
      expand((response) =>
        response.next
          ? this.getUserLikedTracksPage(response.offset + response.limit, 50)
          : []
      ),
      reduce((acc: SavedTrack[], response) => [...acc, ...response.items], []),
      map((savedTracks) => savedTracks.map(st => this.mapSpotifyTrackToTrack(st.track)))
    );
  }

  /**
   * Get a single page of liked songs
   */
  private getUserLikedTracksPage(offset: number, limit: number): Observable<SpotifyPaginatedResponse<SavedTrack>> {
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
   * Get user's playlists with pagination handling (all pages)
   */
  getUserPlaylists(): Observable<SpotifyPlaylist[]> {
    return this.getUserPlaylistsPage(0, 50).pipe(
      expand((response) =>
        response.next
          ? this.getUserPlaylistsPage(response.offset + response.limit, 50)
          : EMPTY
      ),
      reduce((acc: SpotifyPlaylistSimplified[], response) => [...acc, ...response.items], []),
      map((playlists) => playlists.map(p => this.mapSpotifyPlaylist(p)))
    );
  }

  /**
   * Get a single page of user playlists
   */
  private getUserPlaylistsPage(offset: number, limit: number): Observable<SpotifyPaginatedResponse<SpotifyPlaylistSimplified>> {
    return this.http.get<SpotifyPaginatedResponse<SpotifyPlaylistSimplified>>(
      `${this.API_URL}/me/playlists?offset=${offset}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get playlist tracks with pagination handling (all pages)
   */
  getPlaylistTracks(playlistId: string): Observable<Track[]> {
    return this.getPlaylistTracksPage(playlistId, 0, 100).pipe(
      expand((response) =>
        response.next
          ? this.getPlaylistTracksPage(playlistId, response.offset + response.limit, 100)
          : EMPTY
      ),
      reduce((acc: PlaylistTrack[], response) => [...acc, ...response.items], []),
      map((playlistTracks) =>
        playlistTracks
          .filter(pt => pt.track && !pt.is_local) // Filter out null tracks and local tracks
          .map(pt => this.mapSpotifyTrackToTrack(pt.track!))
      )
    );
  }

  /**
   * Get a single page of playlist tracks
   */
  private getPlaylistTracksPage(playlistId: string, offset: number, limit: number): Observable<SpotifyPaginatedResponse<PlaylistTrack>> {
    return this.http.get<SpotifyPaginatedResponse<PlaylistTrack>>(
      `${this.API_URL}/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get tracks from multiple playlists in parallel
   * Deduplicates tracks by ID
   */
  getMultiplePlaylistsTracks(playlistIds: string[]): Observable<Track[]> {
    if (playlistIds.length === 0) {
      return of([]);
    }

    const requests = playlistIds.map(id => this.getPlaylistTracks(id));
    return forkJoin(requests).pipe(
      map(trackArrays => {
        // Flatten and deduplicate tracks by ID
        const allTracks = trackArrays.flat();
        const uniqueTracks = new Map<string, Track>();
        allTracks.forEach(track => uniqueTracks.set(track.id, track));
        return Array.from(uniqueTracks.values());
      })
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
      previewUrl: spotifyTrack.preview_url ?? undefined
    };
  }

  /**
   * Map Spotify API playlist to our SpotifyPlaylist model
   */
  private mapSpotifyPlaylist(spotifyPlaylist: SpotifyPlaylistSimplified): SpotifyPlaylist {
    return {
      id: spotifyPlaylist.id,
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description,
      imageUrl: spotifyPlaylist.images && spotifyPlaylist.images.length > 0 ? spotifyPlaylist.images[0].url : null,
      trackCount: spotifyPlaylist.tracks.total,
      owner: spotifyPlaylist.owner.display_name || spotifyPlaylist.owner.id,
      isPublic: spotifyPlaylist.public,
      isCollaborative: spotifyPlaylist.collaborative
    };
  }
}

