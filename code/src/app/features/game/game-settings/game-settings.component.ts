import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppState } from '../../../store/app.state';
import { ConfigTileComponent } from '../../../shared/components/config-tile/config-tile.component';
import * as SettingsActions from '../../../store/settings/settings.actions';
import * as SettingsSelectors from '../../../store/settings/settings.selectors';
import * as PlaylistActions from '../../../store/playlist/playlist.actions';
import * as PlaylistSelectors from '../../../store/playlist/playlist.selectors';
import { SpotifyPlaylist, MusicSourceSelection } from '../../../store/playlist/playlist.state';

@Component({
  selector: 'app-game-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfigTileComponent],
  templateUrl: './game-settings.component.html',
  styleUrls: ['./game-settings.component.css']
})
export class GameSettingsComponent implements OnInit {
  songsPerGame$: Observable<number>;
  previewDuration$: Observable<number>;

  selectedSourceType: 'liked-songs' | 'single-playlist' | 'multiple-playlists' = 'liked-songs';
  selectedPlaylistId: string = '';
  selectedPlaylistIds: Set<string> = new Set();

  userPlaylists$: Observable<SpotifyPlaylist[]>;
  isLoadingPlaylists$: Observable<boolean>;
  musicSourceDisplay$: Observable<string>;
  selectedMusicSource$: Observable<MusicSourceSelection | null>;

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.songsPerGame$ = this.store.select(SettingsSelectors.selectSongsPerGame);
    this.previewDuration$ = this.store.select(SettingsSelectors.selectPreviewDuration);
    this.userPlaylists$ = this.store.select(PlaylistSelectors.selectUserPlaylists);
    this.isLoadingPlaylists$ = this.store.select(PlaylistSelectors.selectIsLoadingPlaylists);
    this.musicSourceDisplay$ = this.store.select(PlaylistSelectors.selectMusicSourceDisplay);
    this.selectedMusicSource$ = this.store.select(PlaylistSelectors.selectSelectedMusicSource);
  }

  ngOnInit(): void {
    // Load settings from localStorage via NgRx
    this.store.dispatch(SettingsActions.loadSettings());

    // Load user playlists
    this.store.dispatch(PlaylistActions.loadUserPlaylists());

    // Get current music source selection and update local state
    this.selectedMusicSource$.pipe(take(1)).subscribe(source => {
      if (source) {
        this.selectedSourceType = source.type;
        if (source.type === 'single-playlist') {
          this.selectedPlaylistId = source.playlistId;
        } else if (source.type === 'multiple-playlists') {
          this.selectedPlaylistIds = new Set(source.playlistIds);
        }
      }
    });
  }

  onSongsPerGameChange(value: number): void {
    this.store.dispatch(SettingsActions.updateSongsPerGame({ songsPerGame: value }));
  }

  onPreviewDurationChange(value: number): void {
    this.store.dispatch(SettingsActions.updatePreviewDuration({ previewDuration: value }));
  }

  selectSourceType(type: 'liked-songs' | 'single-playlist' | 'multiple-playlists'): void {
    this.selectedSourceType = type;

    if (type === 'liked-songs') {
      this.store.dispatch(PlaylistActions.selectMusicSource({
        source: { type: 'liked-songs' }
      }));
    }
    // For playlist types, wait for user to select specific playlist(s)
  }

  onPlaylistSelected(): void {
    if (!this.selectedPlaylistId) return;

    this.userPlaylists$.subscribe(playlists => {
      const playlist = playlists.find(p => p.id === this.selectedPlaylistId);
      if (playlist) {
        this.store.dispatch(PlaylistActions.selectMusicSource({
          source: {
            type: 'single-playlist',
            playlistId: playlist.id,
            playlistName: playlist.name
          }
        }));
      }
    }).unsubscribe();
  }

  onPlaylistCheckboxChange(event: Event, playlistId: string): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedPlaylistIds.add(playlistId);
    } else {
      this.selectedPlaylistIds.delete(playlistId);
    }

    if (this.selectedPlaylistIds.size > 0) {
      this.userPlaylists$.subscribe(playlists => {
        const selectedPlaylists = playlists.filter(p =>
          this.selectedPlaylistIds.has(p.id)
        );

        this.store.dispatch(PlaylistActions.selectMusicSource({
          source: {
            type: 'multiple-playlists',
            playlistIds: Array.from(this.selectedPlaylistIds),
            playlistNames: selectedPlaylists.map(p => p.name)
          }
        }));
      }).unsubscribe();
    }
  }

  goBack(): void {
    this.router.navigate(['/game/setup']);
  }
}

