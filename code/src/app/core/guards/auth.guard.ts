import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SpotifyAuthService } from '../services/spotify-auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(SpotifyAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

