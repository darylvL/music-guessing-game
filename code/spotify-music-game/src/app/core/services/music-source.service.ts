import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { MusicSource } from '../../shared/models/game.model';
import { SpotifyApiService } from './spotify-api.service';

/**
 * Implementation of MusicSource for user's liked songs
 */
export class LikedSongsMusicSource implements MusicSource {
  type: 'liked-songs' = 'liked-songs';

  constructor(private apiService: SpotifyApiService) {}

  fetchTracks(): Promise<Track[]> {
    return new Promise((resolve, reject) => {
      this.apiService.getUserLikedSongs().subscribe({
        next: (tracks) => resolve(tracks),
        error: (error) => reject(error)
      });
    });
  }
}

/**
 * Service to manage different music sources
 * This architecture allows easy extension to playlists, albums, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class MusicSourceService {
  constructor(private apiService: SpotifyApiService) {}

  /**
   * Get music source based on type
   * Future: extend with playlist and album sources
   */
  getMusicSource(type: 'liked-songs' | 'playlist' | 'album'): MusicSource {
    switch (type) {
      case 'liked-songs':
        return new LikedSongsMusicSource(this.apiService);
      // Future implementations:
      // case 'playlist':
      //   return new PlaylistMusicSource(this.apiService, playlistId);
      // case 'album':
      //   return new AlbumMusicSource(this.apiService, albumId);
      default:
        return new LikedSongsMusicSource(this.apiService);
    }
  }

  /**
   * Get default music source (liked songs)
   */
  getDefaultMusicSource(): MusicSource {
    return this.getMusicSource('liked-songs');
  }
}

