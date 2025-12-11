# Track Loading Fix

## Problem

After fixing the authentication and interceptor issues, the game page loaded but showed no song titles, artists, or any Spotify content. The game was stuck showing empty question fields.

## Root Cause

The game effects were missing the logic to **load tracks** when the game starts. The flow was:

1. ✅ User clicks "Start Game"
2. ✅ `startGame` action dispatched
3. ✅ Playback SDK initialized
4. ❌ **No tracks loaded**
5. ❌ **No first song loaded**
6. ❌ Game shows empty state

## Solution

Added two new effects to handle track loading:

### 1. Load Tracks Effect

```typescript
loadTracks$ = createEffect(() =>
  this.actions$.pipe(
    ofType(GameActions.startGame),
    switchMap(() =>
      this.apiService.getUserLikedTracks(50).pipe(
        map((response) => {
          console.log('[Game Effects] Loaded tracks:', response.items.length);
          const tracks = response.items.map(savedTrack => ({
            id: savedTrack.track.id,
            title: savedTrack.track.name,
            artist: savedTrack.track.artists.map(a => a.name).join(', '),
            // ... other fields
          }));
          return GameActions.loadTracksSuccess({ tracks });
        }),
        catchError((error) => {
          console.error('[Game Effects] Failed to load tracks:', error);
          return of(GameActions.loadTracksFailure({ error: error.message }));
        })
      )
    )
  )
);
```

**What it does:**
- Listens for `startGame` action
- Calls Spotify API to get user's liked tracks (first 50)
- Maps the response to our Track model
- Dispatches `loadTracksSuccess` with the tracks

### 2. Load First Song Effect

```typescript
loadFirstSong$ = createEffect(() =>
  this.actions$.pipe(
    ofType(GameActions.loadTracksSuccess),
    map(() => {
      console.log('[Game Effects] Dispatching loadNextSong');
      return GameActions.loadNextSong();
    })
  )
);
```

**What it does:**
- Listens for `loadTracksSuccess` action
- Dispatches `loadNextSong` to load the first song for the game
- This triggers the reducer to select a random song and generate choices

## API Service Update

Added `getUserLikedTracks()` method to `SpotifyApiService`:

```typescript
getUserLikedTracks(limit: number = 50): Observable<SpotifyPaginatedResponse<SavedTrack>> {
  return this.http.get<SpotifyPaginatedResponse<SavedTrack>>(
    `${this.API_URL}/me/tracks?limit=${limit}`
  );
}
```

**Why this method:**
- Returns a single page of liked tracks (not all pages)
- Faster for game initialization
- Returns the raw Spotify API response format
- Interceptor automatically adds Authorization header

## Complete Flow Now

```
1. User clicks "Start Game"
   ↓
2. startGame action dispatched
   ↓
3. Two effects triggered in parallel:
   a) initializePlayback$ → Initialize Spotify SDK
   b) loadTracks$ → Load user's liked tracks
   ↓
4. loadTracksSuccess action dispatched
   ↓
5. loadFirstSong$ effect triggered
   ↓
6. loadNextSong action dispatched
   ↓
7. Reducer selects random song and generates choices
   ↓
8. loadNextSongSuccess action dispatched
   ↓
9. playTrackPreview$ effect triggered
   ↓
10. Music plays! 🎵
```

## Expected Console Logs

After this fix, you should see:

```
[Game Effects] Loaded tracks: 50
[Game Effects] Dispatching loadNextSong
[Playback] Token from auth service: BQCoDXtNNXbjPXWvzVp0...
[Interceptor] Token for API request: BQCoDXtNNXbjPXWvzVp0...
[Interceptor] Request URL: https://api.spotify.com/v1/me/tracks?limit=50
[Interceptor] Authorization header added
```

And the game should show:
- ✅ Song title choices (easy mode) or input field (hard mode)
- ✅ Artist choices (easy mode) or input field (hard mode)
- ✅ Album art (hidden until answer submitted)
- ✅ Music playing through Spotify SDK

## Files Modified

1. `src/app/store/game/game.effects.ts`
   - Added `loadTracks$` effect
   - Added `loadFirstSong$` effect

2. `src/app/core/services/spotify-api.service.ts`
   - Added `getUserLikedTracks()` method

## Testing

1. **Refresh browser**
2. **Login** with Spotify
3. **Click "Start Game"**
4. **Check console** for track loading logs
5. **Verify game shows:**
   - Song title question with choices/input
   - Artist question with choices/input
   - Submit button enabled when selections made
   - Music playing

## Why This Wasn't Implemented Before

The effects file had placeholder effects for playback control but was missing the critical data loading effects. This is a common pattern in NgRx where:
- Actions are defined ✅
- Reducers handle state updates ✅
- Effects to trigger the actions are missing ❌

The game reducer likely had logic to handle `loadTracksSuccess` and `loadNextSong`, but nothing was dispatching these actions.

## Related NgRx Patterns

This follows the standard NgRx pattern for async data loading:

```
Action → Effect → API Call → Success/Failure Action → Reducer → State Update
```

With chained effects:
```
startGame → loadTracks$ → loadTracksSuccess → loadFirstSong$ → loadNextSong
```

## Additional Notes

- The interceptor automatically adds the Authorization header, so no manual token handling needed
- The API service no longer needs `getHeaders()` method for these calls (interceptor handles it)
- The effect handles errors gracefully with `catchError`
- Console logging helps debug the flow

