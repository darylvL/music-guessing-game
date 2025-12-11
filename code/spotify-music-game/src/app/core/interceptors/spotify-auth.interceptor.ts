import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpotifyAuthService } from '../services/spotify-auth.service';

/**
 * HTTP Interceptor that automatically adds Spotify Bearer token to all Spotify API requests
 */
@Injectable()
export class SpotifyAuthInterceptor implements HttpInterceptor {
  constructor(private authService: SpotifyAuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth interceptor for Spotify token exchange endpoint
    if (req.url.includes('accounts.spotify.com/api/token')) {
      return next.handle(req);
    }

    // Only add token to Spotify API requests
    if (req.url.includes('api.spotify.com')) {
      const token = this.authService.getAccessToken();
      // console.log('[Interceptor] Token for API request:', token ? `${token.substring(0, 20)}...` : 'NULL');
      // console.log('[Interceptor] Request URL:', req.url);

      if (token) {
        // Clone the request and add Authorization header
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        // console.log('[Interceptor] Authorization header added');
        return next.handle(authReq);
      } else {
        console.error('[Interceptor] No token available for API request');
      }
    }

    // For non-Spotify requests, pass through unchanged
    return next.handle(req);
  }
}

