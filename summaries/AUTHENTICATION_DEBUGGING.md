# Authentication Error Debugging Guide

## Current Status

We're experiencing an "Authentication failed" error when initializing the Spotify Web Playback SDK, despite having what appears to be a valid token.

## Deep Analysis

### Research Findings

After researching the web and analyzing the working `angular-spotify` reference implementation, I've identified several critical insights:

#### 1. Token Callback Must Be Synchronous
The Spotify SDK's `getOAuthToken` callback **must** provide the token synchronously. Any async operations will cause authentication to fail.

✅ **Correct Pattern (from angular-spotify):**
```typescript
getOAuthToken: (cb) => {
  cb(token);  // Immediate, synchronous callback
}
```

❌ **Incorrect Pattern:**
```typescript
getOAuthToken: async (cb) => {
  const token = await fetchToken();  // SDK won't wait
  cb(token);
}
```

#### 2. Token Must Be Fetched Before Player Initialization
The reference implementation fetches the token **before** creating the player:

```typescript
// From angular-spotify application.effects.ts (line 42-44)
withLatestFrom(combineLatest([this.authStore.token$, this.settingsFacade.volume$])),
tap(([_, [token, volume]]) => {
  this.playbackService.initPlaybackSDK(token, volume);  // Token passed as parameter
})
```

Then in `initPlaybackSDK`:
```typescript
async initPlaybackSDK(token: string, volume: number) {
  const { Player } = await this.waitForSpotifyWebPlaybackSDKToLoad();
  const player = new Player({
    name: 'Angular Spotify Web Player',
    getOAuthToken: (cb) => {
      cb(token);  // Token already available from parameter
    },
    volume
  });
}
```

#### 3. Token Storage in angular-spotify
The reference app stores tokens in localStorage with specific keys:
- `access_token`
- `token_type`
- `refresh_token`
- `expires_at`

## Debugging Steps Added

I've added comprehensive logging to help diagnose the issue:

### In `spotify-playback.service.ts`:

1. **Line 80** - Logs the token when fetched for initialization:
   ```typescript
   console.log('[Playback] Token fetched for player initialization:', token ? `${token.substring(0, 20)}...` : 'NULL');
   ```

2. **Lines 105-110** - Logs when SDK requests token:
   ```typescript
   console.log('[Playback] SDK requesting token via getOAuthToken callback');
   console.log('[Playback] Token from getAccessToken():', currentToken ? `${currentToken.substring(0, 20)}...` : 'NULL');
   console.log('[Playback] Calling SDK callback with token');
   ```

### In `spotify-auth.service.ts`:

1. **Lines 144-149** - Logs token retrieval status:
   ```typescript
   console.log('[Auth] getAccessToken: No tokens found in storage');
   console.log('[Auth] getAccessToken: Token expired');
   console.log('[Auth] getAccessToken: Returning valid token');
   ```

## What to Check Next

### 1. Refresh Your Browser and Check Console Logs

Look for this sequence of logs:

```
[Playback] Token fetched for player initialization: BQAej1SGoJRvSJuiauys...
[Playback] SDK requesting token via getOAuthToken callback
[Auth] getAccessToken: Returning valid token
[Playback] Token from getAccessToken(): BQAej1SGoJRvSJuiauys...
[Playback] Calling SDK callback with token
```

### 2. Possible Issues to Identify

#### Issue A: Token is NULL when SDK requests it
**Symptoms:**
```
[Playback] Token fetched for player initialization: BQAej1SGoJRvSJuiauys...
[Playback] SDK requesting token via getOAuthToken callback
[Auth] getAccessToken: No tokens found in storage  ← PROBLEM
[Playback] Token from getAccessToken(): NULL
```

**Cause:** Token is being cleared or lost between initialization and callback

**Solution:** Store the token in a class variable instead of relying on localStorage

#### Issue B: Token expires between fetch and callback
**Symptoms:**
```
[Playback] Token fetched for player initialization: BQAej1SGoJRvSJuiauys...
[Playback] SDK requesting token via getOAuthToken callback
[Auth] getAccessToken: Token expired  ← PROBLEM
[Playback] Token from getAccessToken(): NULL
```

**Cause:** Token has very short TTL or system clock issue

**Solution:** Use the token captured at initialization time

#### Issue C: Token is provided but SDK still fails auth
**Symptoms:**
```
[Playback] Token fetched for player initialization: BQAej1SGoJRvSJuiauys...
[Playback] SDK requesting token via getOAuthToken callback
[Auth] getAccessToken: Returning valid token
[Playback] Token from getAccessToken(): BQAej1SGoJRvSJuiauys...
[Playback] Calling SDK callback with token
Authentication error: Authentication failed  ← PROBLEM
```

**Possible Causes:**
1. Token doesn't have required scopes (especially `streaming`)
2. Token format is incorrect
3. Account doesn't have Spotify Premium
4. Token was revoked

**Solution:** Check token scopes and account status

### 3. Verify Token Scopes

Check localStorage for your token data:
```javascript
JSON.parse(localStorage.getItem('spotify_auth_tokens'))
```

Verify it includes these scopes:
- `streaming` ← **CRITICAL for Web Playback SDK**
- `user-read-playback-state`
- `user-modify-playback-state`
- `user-read-private`
- `user-read-email`

### 4. Verify Token Format

The token should:
- Start with `BQA` or `BQDB`
- Be a long string (100+ characters)
- Not contain any whitespace or special characters

### 5. Test Token Validity

Try making a direct API call with the token:
```javascript
const token = JSON.parse(localStorage.getItem('spotify_auth_tokens')).accessToken;
fetch('https://api.spotify.com/v1/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

If this fails, the token itself is invalid.

## Potential Fix: Store Token in Class Variable

If the logs show the token becomes NULL between initialization and callback, we need to store it:

```typescript
export class SpotifyPlaybackService {
  private player: any = null;
  private deviceId: string | null = null;
  private currentToken: string | null = null;  // ADD THIS

  async initializePlayer(): Promise<void> {
    // ...
    const token = await this.authService.getValidAccessToken();
    this.currentToken = token;  // STORE IT

    this.player = new window.Spotify.Player({
      getOAuthToken: (cb: (token: string) => void) => {
        if (this.currentToken) {  // USE STORED TOKEN
          cb(this.currentToken);
        }
      }
    });
  }
}
```

## Next Steps

1. **Refresh browser** and start the game
2. **Check console logs** for the diagnostic messages
3. **Report back** what you see in the logs
4. Based on the logs, we'll implement the appropriate fix

## Reference Implementation Differences

### angular-spotify Approach:
- Token passed as parameter to `initPlaybackSDK(token, volume)`
- Token comes from NgRx store observable (`authStore.token$`)
- Callback simply uses the parameter: `cb(token)`

### Our Current Approach:
- Token fetched inside `initializePlayer()` via `getValidAccessToken()`
- Token retrieved again in callback via `getAccessToken()`
- Two separate retrievals from localStorage

**Potential Issue:** The second retrieval might fail or return a different value.

**Proposed Solution:** Store the token in a class variable after the first fetch, use that in the callback.

