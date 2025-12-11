# Testing Audio Playback - Quick Guide

## How to Test the Fixes

### 1. Restart the Development Server

The new code needs to be loaded. Stop and restart the dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd code/spotify-music-game
npm start
```

### 2. Clear Browser Cache

To ensure the new code is loaded:

1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or simply: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### 3. Open Console for Detailed Logs

1. Press `F12` to open DevTools
2. Go to the "Console" tab
3. You should see detailed `[Playback]` logs

### 4. Start a Game

1. Navigate to `http://127.0.0.1:4200/`
2. Log in with Spotify
3. Click "Start Game"
4. Watch the console logs

### Expected Console Output

You should see logs like:

```
[Playback] Service initialized
[Playback] Initialization attempt 1/3
[Playback] Checking browser compatibility...
[Playback] Browser compatibility: { mediaSource: true, encryptedMedia: true, ... }
[Playback] Loading Spotify Web Playback SDK...
[Playback] SDK script loaded successfully
[Playback] SDK ready callback fired
[Playback] Creating Spotify.Player instance...
[Playback] Player instance created successfully
[Playback] Connecting player...
```

### Scenario 1: Web Playback SDK Success

If everything works (Premium + proper DRM):

```
[Playback] ✓ Player ready with Device ID: abc123...
[Game Effects] Using Web Playback SDK
[Playback] Attempting to play track: spotify:track:...
[Playback] ✓ Track playback started successfully
```

### Scenario 2: Web Playback SDK Fails (Expected)

If SDK fails (EME/DRM issue):

```
EMEError: No supported keysystem was found.
[Playback] Initialization error: Failed to initialize player
[Playback] Retrying in 2000ms...
[Playback] Initialization attempt 2/3
...
[Playback] Max retry attempts reached, initialization failed permanently
[Game Effects] Player not ready, using preview URL fallback
[Playback] Using preview URL fallback
[Playback] Playing preview URL: https://p.scdn.co/mp3-preview/...
[Playback] ✓ Preview URL playback started
```

### Scenario 3: Audio Status Indicator

In the game UI, if Web Playback SDK is not available, you should see:

```
🎧 Listen carefully...
ℹ️ Audio preview mode (Web Playback unavailable)
```

## What to Listen For

### With Preview URLs (Fallback)
- 30-second audio clips from Spotify
- Standard HTML5 audio playback
- Works without Premium

### With Web Playback SDK (If Successful)
- Full track playback capability
- Better audio quality
- Requires Premium

## Troubleshooting

### No Audio at All

1. **Check Console Logs**: Look for error messages
2. **Check Track Data**: Some tracks may not have preview URLs
3. **Browser Audio**: Ensure browser audio is not muted
4. **Autoplay Policy**: Some browsers block autoplay

### Web Playback SDK Fails

This is expected and normal. The fallback will handle it.

**Common Reasons**:
- No Spotify Premium
- EME/DRM not available
- Browser security settings
- Running on localhost (not HTTPS)

**Solution**: The preview URL fallback will automatically activate.

### Preview URL Also Fails

**Check**:
1. Network connection
2. Spotify API returning preview URLs
3. Browser console for specific errors

## Testing Checklist

- [ ] Restart dev server
- [ ] Clear browser cache
- [ ] Open console (F12)
- [ ] Log in to Spotify
- [ ] Start game
- [ ] Observe console logs
- [ ] Listen for audio playback
- [ ] Check UI status indicator
- [ ] Test multiple rounds
- [ ] Verify fallback works

## Success Criteria

✅ Game loads without errors
✅ Detailed logs appear in console
✅ Audio plays (either SDK or preview URL)
✅ Game continues normally
✅ UI shows appropriate status message

## Need Help?

If issues persist:

1. **Copy Console Logs**: Select all console output and copy
2. **Take Screenshots**: Capture any error messages
3. **Note Behavior**: What happens vs. what you expect
4. **Browser Info**: Chrome version, OS, etc.

## Advanced: Enabling Web Playback SDK

To get the SDK working (instead of fallback):

### 1. Check Widevine CDM

Chrome: `chrome://components/`
- Find "Widevine Content Decryption Module"
- Should show "Up-to-date"
- If not, click "Check for update"

### 2. Enable Hardware Acceleration

Chrome Settings:
1. Settings → System
2. Enable "Use hardware acceleration when available"
3. Restart browser

### 3. Check DRM Settings

Chrome Flags: `chrome://flags/`
- Search for "DRM"
- Ensure nothing is disabled

### 4. Use HTTPS (Production)

For production deployment:
- Deploy to HTTPS server
- Update redirect URI in Spotify app
- Test with proper SSL certificate

## Summary

The audio playback fixes ensure the game works reliably:

1. **Detailed logging** helps diagnose issues
2. **Retry logic** handles transient failures
3. **Preview URL fallback** ensures audio always works
4. **User feedback** shows playback status

Even if Web Playback SDK fails, the game continues with preview URLs!

