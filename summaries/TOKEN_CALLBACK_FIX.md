# Token Callback Fix for Spotify SDK

## Problem
Despite having a valid token, the Spotify Web Playback SDK was failing with:
```
Authentication error: Authentication failed
```

Additionally, CORS errors were appearing for Spotify's internal services.

## Root Cause

The issue was in how the `getOAuthToken` callback was implemented. The Spotify SDK expects this callback to:
1. **Call the callback function synchronously** with the token
2. **Not use async/await** inside the callback itself

### What Was Wrong

**Previous Implementation (Incorrect):**
```typescript
getOAuthToken: async (cb: (token: string) => void) => {
  const currentToken = await this.authService.getValidAccessToken();
  if (currentToken) {
    cb(currentToken);
  }
}
```

**Problems:**
- The callback was marked as `async`, which returns a Promise
- The SDK doesn't wait for async callbacks to complete
- The token retrieval happened **inside** the callback asynchronously
- By the time the token was retrieved, the SDK had already given up

## Solution

Following the pattern from the `angular-spotify` reference implementation:

### 1. Fetch Token BEFORE Player Initialization
```typescript
async initializePlayer(): Promise<void> {
  await this.loadSDK();

  // Get a valid token BEFORE creating the player
  const token = await this.authService.getValidAccessToken();
  if (!token) {
    console.warn('No access token available for Spotify player');
    return Promise.resolve();
  }

  // Now create the player with the token already available
  this.player = new window.Spotify.Player({
    // ...
  });
}
```

### 2. Synchronous Token Callback
```typescript
getOAuthToken: (cb: (token: string) => void) => {
  // Pass the token synchronously - it was already fetched above
  // The SDK may call this multiple times, so we provide the current token
  const currentToken = this.authService.getAccessToken();
  if (currentToken) {
    cb(currentToken);
  } else {
    console.error('Token not available in getOAuthToken callback');
  }
}
```

**Key Changes:**
- ✅ Token is fetched **before** player initialization using `await`
- ✅ Callback is **synchronous** (no `async` keyword)
- ✅ Callback uses `getAccessToken()` (synchronous) instead of `getValidAccessToken()` (async)
- ✅ Token is immediately available when the SDK calls the callback

## How It Works

### Flow Diagram
```
1. initializePlayer() called
   ↓
2. await loadSDK() - SDK script loads
   ↓
3. await getValidAccessToken() - Fetch/refresh token if needed
   ↓
4. Create new Spotify.Player with token ready
   ↓
5. SDK calls getOAuthToken callback
   ↓
6. Callback immediately returns token (synchronously)
   ↓
7. SDK authenticates successfully
   ↓
8. 'ready' event fires with device_id
```

## Reference Implementation

This fix follows the exact pattern used in the `angular-spotify` project:

**From `angular-spotify/libs/web/shared/data-access/store/src/lib/playback/playback.service.ts`:**
```typescript
async initPlaybackSDK(token: string, volume: number) {
  const { Player } = await this.waitForSpotifyWebPlaybackSDKToLoad();
  const player = new Player({
    name: 'Angular Spotify Web Player',
    getOAuthToken: (cb) => {
      cb(token);  // ← Simple, synchronous callback
    },
    volume
  });
  // ... rest of setup
}
```

## Testing

After this fix, you should see:

### ✅ Success Indicators
1. No "Authentication failed" errors
2. Console logs:
   - "Ready with Device ID [device_id]"
   - "Playback successfully transferred to device: [device_id]"
3. No CORS errors (those were side effects of auth failure)
4. Device appears in Spotify Connect device list

### ❌ If You Still See Errors
- Check that token is valid: `localStorage.getItem('spotify_auth_tokens')`
- Verify token has `streaming` scope
- Confirm Spotify Premium account
- Check browser console for other error messages

## Technical Details

### Why Synchronous Callbacks?

The Spotify Web Playback SDK is designed to call `getOAuthToken` synchronously and expects the token immediately. This is because:

1. **Performance**: The SDK needs the token right away to establish connections
2. **Simplicity**: The token should already be available in memory
3. **Reliability**: Async operations can fail or timeout

### Token Refresh Strategy

- Token is fetched/refreshed **before** player initialization
- If token is expired or expiring soon (< 5 minutes), it's automatically refreshed
- Once player is initialized, the callback provides the in-memory token
- For long sessions, the token refresh logic in `getValidAccessToken()` handles renewals

## Related Files Modified

1. `src/app/core/services/spotify-playback.service.ts`
   - Changed `initializePlayer()` to fetch token before player creation
   - Changed `getOAuthToken` callback to be synchronous
   - Uses `getAccessToken()` (sync) instead of `getValidAccessToken()` (async) in callback

## Additional Notes

### CORS Errors
The CORS errors you saw were **side effects** of the authentication failure. When the SDK couldn't authenticate, it failed to establish proper connections to Spotify's internal services (`apresolve.spotify.com`, `dealer.g2.spotify.com`, etc.). These should disappear once authentication succeeds.

### WebSocket Connections
The WebSocket connection to `dealer.g2.spotify.com` is part of Spotify's internal infrastructure for real-time playback control. It requires proper authentication to establish. With the fixed token callback, this connection should succeed.

## References

- [Spotify Web Playback SDK Documentation](https://developer.spotify.com/documentation/web-playback-sdk)
- [Angular Spotify Reference Implementation](https://github.com/trungvose/angular-spotify)
- [Spotify Authentication Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)

