import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { CallbackComponent } from './features/auth/callback/callback.component';
import { GameSetupComponent } from './features/game/game-setup/game-setup.component';
import { GameSettingsComponent } from './features/game/game-settings/game-settings.component';
import { GamePlayComponent } from './features/game/game-play/game-play.component';
import { GameResultsComponent } from './features/game/game-results/game-results.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'callback', component: CallbackComponent },
  {
    path: 'game',
    canActivate: [authGuard],
    children: [
      { path: 'setup', component: GameSetupComponent },
      { path: 'settings', component: GameSettingsComponent },
      { path: 'play', component: GamePlayComponent },
      { path: 'results', component: GameResultsComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
