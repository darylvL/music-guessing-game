# Spotify Web Playback SDK Fix

## Problem
The application was throwing an error in Firefox:
```
ERROR AnthemError: onSpotifyWebPlaybackSDKReady is not defined
```

## Root Cause
The Spotify Web Playback SDK expects a global callback function `window.onSpotifyWebPlaybackSDKReady` to be defined **before** the SDK script loads.

The previous implementation had a race condition:
1. SDK script was loaded asynchronously
2. The callback was defined inside `initializePlayer()` after the SDK loaded
3. The SDK would call `window.onSpotifyWebPlaybackSDKReady()` immediately upon loading
4. If the callback wasn't defined yet, it would throw an error

## Solution
The callback must be defined **before** appending the script to the DOM. The fix involves:

1. **In `loadSDK()` method**: Define `window.onSpotifyWebPlaybackSDKReady` before creating the script element
2. **In `initializePlayer()` method**: Remove the conditional callback assignment and directly create the player after SDK loads

### Before (Incorrect)
```typescript
loadSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    script.onload = () => {
      this.sdkLoaded = true;
      resolve();
    };

    document.body.appendChild(script);
  });
}

// Later in initializePlayer()
if (window.Spotify) {
  initPlayer();
} else {
  window.onSpotifyWebPlaybackSDKReady = initPlayer; // TOO LATE!
}
```

### After (Correct)
```typescript
loadSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Define callback BEFORE loading script
    window.onSpotifyWebPlaybackSDKReady = () => {
      this.sdkLoaded = true;
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    script.onerror = () => {
      reject(new Error('Failed to load Spotify Web Playback SDK'));
    };

    document.body.appendChild(script);
  });
}

// In initializePlayer()
await this.loadSDK(); // SDK is now loaded
// Directly create the player
this.player = new window.Spotify.Player({ ... });
```

## Key Changes

### 1. `loadSDK()` Method
- ✅ Defines `window.onSpotifyWebPlaybackSDKReady` **before** appending the script
- ✅ The callback resolves the Promise when SDK is ready
- ✅ Removed `script.onload` handler (SDK calls the callback instead)

### 2. `initializePlayer()` Method
- ✅ Removed the `initPlayer()` function wrapper
- ✅ Removed conditional callback assignment
- ✅ Directly creates the player after `await this.loadSDK()`

## Testing
After this fix, the application should:
1. ✅ Load the Spotify SDK without errors in Firefox
2. ✅ Initialize the player correctly
3. ✅ Log "Ready with Device ID [device_id]" to console
4. ✅ Transfer playback to the web player device
5. ✅ Show the device in Spotify Connect device list

## References
- [Spotify Web Playback SDK Documentation](https://developer.spotify.com/documentation/web-playback-sdk)
- [Web Playback SDK Quick Start](https://developer.spotify.com/documentation/web-playback-sdk/quick-start/)

## Browser Compatibility
This fix ensures proper SDK initialization in:
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari (with proper DRM support)

