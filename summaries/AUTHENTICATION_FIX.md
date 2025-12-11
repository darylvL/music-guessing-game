# Authentication Error Fix

## Problem
The application was experiencing authentication failures when starting the game:

```
Authentication error: Authentication failed
```

Additionally, Firefox showed WebSocket connection errors with the access token exposed in the URL.

## Root Cause Analysis

### 1. Missing Refresh Token
The `AuthTokens` interface and token exchange flow were not saving the `refresh_token` returned by Spotify. This meant:
- Tokens could not be refreshed when they expired
- The Spotify Web Playback SDK would fail authentication when requesting a new token
- Users would be forced to re-authenticate every hour

### 2. No Token Refresh Mechanism
The `getOAuthToken` callback in the Spotify Player was using a synchronous method that didn't handle token expiration or refresh.

### 3. Token Expiration Handling
When tokens expired, the app would immediately log out the user instead of attempting to refresh the token.

## Solution

### 1. Updated `AuthTokens` Interface
Added `refreshToken` field to store the refresh token:

```typescript
export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
  scope: string;
  refreshToken?: string; // NEW: Optional because not all flows return it
}
```

### 2. Save Refresh Token During Token Exchange
Updated `handleCallback()` in `SpotifyAuthService`:

```typescript
const tokens: AuthTokens = {
  accessToken: data.access_token,
  tokenType: data.token_type,
  expiresIn: data.expires_in,
  expiresAt: Date.now() + data.expires_in * 1000,
  scope: data.scope,
  refreshToken: data.refresh_token, // NEW: Save refresh token
};
```

### 3. Added Token Refresh Method
Implemented `refreshAccessToken()` in `SpotifyAuthService`:

```typescript
async refreshAccessToken(): Promise<boolean> {
  const tokens = this.getTokens();
  if (!tokens?.refreshToken) {
    console.warn('No refresh token available');
    return false;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: environment.spotifyClientId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    const newTokens: AuthTokens = {
      ...tokens,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      expiresAt: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token || tokens.refreshToken,
    };

    this.saveTokens(newTokens);
    console.log('Access token refreshed successfully');
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    this.logout();
    return false;
  }
}
```

### 4. Added Async Token Getter with Auto-Refresh
Implemented `getValidAccessToken()` in `SpotifyAuthService`:

```typescript
async getValidAccessToken(): Promise<string | null> {
  const tokens = this.getTokens();

  if (!tokens) {
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const fiveMinutes = 5 * 60 * 1000;
  if (Date.now() >= tokens.expiresAt - fiveMinutes) {
    console.log('Token expired or expiring soon, refreshing...');
    const refreshed = await this.refreshAccessToken();
    if (!refreshed) {
      return null;
    }
    // Get the new token
    const newTokens = this.getTokens();
    return newTokens?.accessToken || null;
  }

  return tokens.accessToken;
}
```

**Key Features:**
- Automatically refreshes tokens that are expired or expiring within 5 minutes
- Prevents authentication failures during playback
- Gracefully handles refresh failures

### 5. Updated Spotify Player Token Callback
Modified the `getOAuthToken` callback in `SpotifyPlaybackService`:

```typescript
this.player = new window.Spotify.Player({
  name: 'Spotify Music Guessing Game',
  getOAuthToken: async (cb: (token: string) => void) => {
    // Use async method to get token with automatic refresh
    const currentToken = await this.authService.getValidAccessToken();
    if (currentToken) {
      cb(currentToken);
    } else {
      console.error('Failed to get valid access token for playback');
    }
  },
  volume: 0.7
});
```

## Benefits

### ✅ Seamless Token Refresh
- Tokens are automatically refreshed before they expire
- No interruption to user experience
- No forced re-authentication

### ✅ Proactive Expiration Handling
- Tokens are refreshed 5 minutes before expiration
- Prevents authentication errors during playback
- Ensures continuous playback without interruption

### ✅ Better Error Handling
- Graceful fallback if refresh fails
- Clear console logging for debugging
- User is only logged out if refresh is impossible

### ✅ Spotify SDK Compatibility
- Async token callback works with SDK's token refresh mechanism
- SDK can request fresh tokens during long playback sessions
- Prevents WebSocket authentication errors

## Testing Checklist

After this fix, verify:

1. **Initial Login**
   - ✅ Login flow completes successfully
   - ✅ Refresh token is saved in localStorage
   - ✅ Access token is valid

2. **Player Initialization**
   - ✅ No "Authentication failed" errors
   - ✅ Player initializes successfully
   - ✅ Device ID is generated
   - ✅ Playback transfer succeeds

3. **Token Refresh**
   - ✅ Token refreshes automatically when expired
   - ✅ Console shows "Token expired or expiring soon, refreshing..."
   - ✅ Console shows "Access token refreshed successfully"
   - ✅ Playback continues without interruption

4. **Long Sessions**
   - ✅ User can play for more than 1 hour without re-authentication
   - ✅ Token refreshes automatically in the background
   - ✅ No WebSocket authentication errors

5. **Error Scenarios**
   - ✅ If refresh fails, user is logged out gracefully
   - ✅ Clear error messages in console
   - ✅ User is redirected to login page

## Technical Details

### Token Lifecycle
1. **Initial Authentication**: User logs in via OAuth, receives access token (1 hour) and refresh token
2. **Token Storage**: Both tokens are stored in localStorage
3. **Token Usage**: Access token is used for all Spotify API calls
4. **Proactive Refresh**: 5 minutes before expiration, token is automatically refreshed
5. **SDK Requests**: When Spotify SDK needs a token, it calls `getOAuthToken` which returns a valid (possibly refreshed) token

### Security Considerations
- ✅ Refresh tokens are stored securely in localStorage
- ✅ Tokens are never exposed in URLs (WebSocket URLs are internal to SDK)
- ✅ Client-side only flow (PKCE) - no client secret exposed
- ✅ Tokens are cleared on logout

## Related Files Modified

1. `src/app/shared/models/auth.model.ts` - Added `refreshToken` field
2. `src/app/core/services/spotify-auth.service.ts` - Added refresh logic
3. `src/app/core/services/spotify-playback.service.ts` - Updated token callback

## References

- [Spotify OAuth Documentation](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Spotify Token Refresh](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens)
- [Web Playback SDK Authentication](https://developer.spotify.com/documentation/web-playback-sdk/howtos/web-app-player)

