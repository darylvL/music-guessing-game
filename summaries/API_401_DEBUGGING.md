# API 401 Unauthorized Error - Debugging Guide

## Current Status

The Spotify Web Playback SDK **successfully authenticates** and creates a device, but the API call to transfer playback returns **401 Unauthorized**.

## Error Details

```
✅ SDK Authentication: SUCCESS
✅ Device Created: f8185f3590e46f40170c3b2ae583c340f0583db7
❌ API Call: PUT https://api.spotify.com/v1/me/player → 401 Unauthorized
```

## What This Means

1. **The token works for the SDK** - The SDK accepted the token and created a player
2. **The token fails for the API** - The same token is rejected by the Spotify Web API

This suggests one of the following:
- Token is not being sent correctly in the API request
- Token doesn't have the required scopes for the API endpoint
- Token format issue in the HTTP header
- Different token being used for API vs SDK

## Debugging Steps Added

### 1. Interceptor Logging
Added logging to see what token the interceptor is using:

```typescript
console.log('[Interceptor] Token for API request:', token);
console.log('[Interceptor] Request URL:', req.url);
console.log('[Interceptor] Authorization header added');
```

### 2. Token Comparison Logging
Added logging to compare tokens:

```typescript
console.log('[Playback] Current stored token:', this.currentToken);
console.log('[Playback] Token from auth service:', this.authService.getAccessToken());
```

### 3. Token Exchange Logging
Added logging to see what Spotify returns:

```typescript
console.log('[Auth] Token exchange response:', {
  hasAccessToken: !!data.access_token,
  tokenType: data.token_type,
  expiresIn: data.expires_in,
  scope: data.scope,
  hasRefreshToken: !!data.refresh_token
});
```

## What to Check Next

### Step 1: Refresh Browser and Check Logs

Look for these specific log sequences:

#### A. During Login/Token Exchange:
```
[Auth] Token exchange response: {
  hasAccessToken: true,
  tokenType: "Bearer",
  expiresIn: 3600,
  scope: "user-read-private user-read-email user-library-read streaming user-read-playback-state user-modify-playback-state",
  hasRefreshToken: true
}
[Auth] Saving tokens to localStorage
```

**Check:** Does the scope include `user-modify-playback-state`? This is REQUIRED for the transfer playback API.

#### B. During Player Initialization:
```
[Playback] Token fetched for player initialization: BQC8LUP_SAumd2pmJEg9...
[Playback] SDK requesting token via getOAuthToken callback
[Playback] Using stored token: BQC8LUP_SAumd2pmJEg9...
Ready with Device ID f8185f3590e46f40170c3b2ae583c340f0583db7
```

**Check:** Do all the token prefixes match?

#### C. During Transfer Playback:
```
[Playback] Transferring playback to device: f8185f3590e46f40170c3b2ae583c340f0583db7
[Playback] Current stored token: BQC8LUP_SAumd2pmJEg9...
[Playback] Token from auth service: BQC8LUP_SAumd2pmJEg9...
[Interceptor] Token for API request: BQC8LUP_SAumd2pmJEg9...
[Interceptor] Request URL: https://api.spotify.com/v1/me/player
[Interceptor] Authorization header added
```

**Check:**
1. Do all three tokens match?
2. Is the interceptor actually adding the header?
3. Is the token the same one that worked for the SDK?

### Step 2: Possible Issues and Solutions

#### Issue A: Tokens Don't Match
**Symptom:** The token prefixes are different between SDK and API calls

**Solution:** There's a race condition or the token is being refreshed between calls

#### Issue B: Missing Scope
**Symptom:** The scope in token exchange response doesn't include `user-modify-playback-state`

**Solution:** Need to re-authorize the app with correct scopes

#### Issue C: Interceptor Not Adding Header
**Symptom:** No "[Interceptor] Authorization header added" log

**Solution:** Interceptor not configured correctly or URL check failing

#### Issue D: Token Format Issue
**Symptom:** Token looks correct but still 401

**Possible causes:**
1. Token has whitespace or newlines
2. Token is being double-encoded
3. Header format is wrong (should be `Bearer <token>`)

### Step 3: Manual Token Test

Open browser console and run:

```javascript
// Get the token from localStorage
const tokens = JSON.parse(localStorage.getItem('spotify_auth_tokens'));
console.log('Stored tokens:', tokens);

// Try the API call manually
fetch('https://api.spotify.com/v1/me/player', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${tokens.accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    device_ids: ['f8185f3590e46f40170c3b2ae583c340f0583db7'],
    play: false
  })
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => console.log('Response:', text))
.catch(e => console.error('Error:', e));
```

**Expected Results:**
- ✅ Status: 204 (No Content) = Success
- ❌ Status: 401 = Token is invalid for this endpoint
- ❌ Status: 403 = Missing required scope
- ❌ Status: 404 = Device ID not found

### Step 4: Check Spotify App Configuration

1. Go to https://developer.spotify.com/dashboard
2. Find your app (Client ID: `fa48a0cea1e94b4ea5707cd8d188a224`)
3. Check "Edit Settings"
4. Verify Redirect URIs include: `http://127.0.0.1:4200/callback`

### Step 5: Verify Scopes in Environment

Current scopes in `environment.ts`:
```typescript
spotifyScopes: [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'streaming',                      // ← For SDK playback
  'user-read-playback-state',       // ← For reading player state
  'user-modify-playback-state'      // ← For transferring playback ⚠️ CRITICAL
].join(' ')
```

The `user-modify-playback-state` scope is REQUIRED for the transfer playback API endpoint.

## Common Causes of This Specific Issue

### 1. Scope Not Granted
If you authorized the app before adding `user-modify-playback-state` to the scopes, you need to:
1. Logout of the app
2. Revoke access at https://www.spotify.com/account/apps/
3. Login again to re-authorize with new scopes

### 2. Token Mismatch
The SDK might be using a different token than the API calls. Our logging will reveal this.

### 3. Interceptor Not Firing
The interceptor might not be intercepting the request. Check if it's properly registered in `app.config.ts`.

### 4. Token Encoding Issue
The token might have special characters that need encoding, or it's being double-encoded.

## Next Actions

1. **Clear all data and re-login:**
   ```javascript
   localStorage.clear();
   // Then login again
   ```

2. **Check the logs** for the patterns described above

3. **Report back** with:
   - The complete log sequence
   - Whether tokens match
   - The scope from token exchange response
   - Result of manual API test

## Expected Log Sequence (Success)

```
[Auth] Token exchange response: { hasAccessToken: true, scope: "...user-modify-playback-state..." }
[Auth] Saving tokens to localStorage
[Playback] Token fetched for player initialization: BQC8LUP_SAumd2pmJEg9...
[Playback] SDK requesting token via getOAuthToken callback
[Playback] Using stored token: BQC8LUP_SAumd2pmJEg9...
Ready with Device ID f8185f3590e46f40170c3b2ae583c340f0583db7
[Playback] Transferring playback to device: f8185f3590e46f40170c3b2ae583c340f0583db7
[Playback] Current stored token: BQC8LUP_SAumd2pmJEg9...
[Playback] Token from auth service: BQC8LUP_SAumd2pmJEg9...
[Interceptor] Token for API request: BQC8LUP_SAumd2pmJEg9...
[Interceptor] Request URL: https://api.spotify.com/v1/me/player
[Interceptor] Authorization header added
Playback successfully transferred to device: f8185f3590e46f40170c3b2ae583c340f0583db7
```

All tokens should match, and no 401 error should occur.

