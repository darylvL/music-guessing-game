import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store/app.state';
import { ConfigTileComponent } from '../../../shared/components/config-tile/config-tile.component';
import * as SettingsActions from '../../../store/settings/settings.actions';
import * as SettingsSelectors from '../../../store/settings/settings.selectors';

@Component({
  selector: 'app-game-settings',
  standalone: true,
  imports: [CommonModule, ConfigTileComponent],
  templateUrl: './game-settings.component.html',
  styleUrls: ['./game-settings.component.css']
})
export class GameSettingsComponent implements OnInit {
  songsPerGame$: Observable<number>;
  previewDuration$: Observable<number>;

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.songsPerGame$ = this.store.select(SettingsSelectors.selectSongsPerGame);
    this.previewDuration$ = this.store.select(SettingsSelectors.selectPreviewDuration);
  }

  ngOnInit(): void {
    // Load settings from localStorage via NgRx
    this.store.dispatch(SettingsActions.loadSettings());
  }

  onSongsPerGameChange(value: number): void {
    this.store.dispatch(SettingsActions.updateSongsPerGame({ songsPerGame: value }));
  }

  onPreviewDurationChange(value: number): void {
    this.store.dispatch(SettingsActions.updatePreviewDuration({ previewDuration: value }));
  }

  goBack(): void {
    this.router.navigate(['/game/setup']);
  }
}

