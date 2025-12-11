# Missing Implementations Analysis

## Critical Missing Effects

### 1. ❌ `loadNextSong` Effect (CRITICAL)

**Action Defined:** ✅ `GameActions.loadNextSong`
**Reducer Handles:** ✅ `on(GameActions.loadNextSong, ...)`
**Effect Exists:** ❌ **MISSING**

**Impact:** When `loadNextSong` is dispatched, nothing happens. The reducer sets `isLoading: true`, but no effect actually:
- Selects a random song from available tracks
- Generates multiple choice options
- Dispatches `loadNextSongSuccess`

**Where it's dispatched:**
- `loadFirstSong$` effect (after tracks load)
- `nextRound$` effect (should exist but doesn't)

**Solution Needed:**
```typescript
loadNextSong$ = createEffect(() =>
  this.actions$.pipe(
    ofType(GameActions.loadNextSong),
    withLatestFrom(
      this.store.select(GameSelectors.selectAvailableTracks),
      this.store.select(GameSelectors.selectUsedTrackIds)
    ),
    map(([_, availableTracks, usedTrackIds]) => {
      // Filter out used tracks
      const unusedTracks = availableTracks.filter(
        track => !usedTrackIds.includes(track.id)
      );

      if (unusedTracks.length === 0) {
        return GameActions.finishGame();
      }

      // Select random song
      const randomIndex = Math.floor(Math.random() * unusedTracks.length);
      const song = unusedTracks[randomIndex];

      // Generate choices
      const titleChoices = this.generateChoices(
        song.title,
        availableTracks.map(t => t.title)
      );
      const artistChoices = this.generateChoices(
        song.artist,
        availableTracks.map(t => t.artist)
      );

      return GameActions.loadNextSongSuccess({
        song,
        titleChoices,
        artistChoices
      });
    })
  )
);
```

### 2. ❌ `submitAnswer` Effect (CRITICAL)

**Action Defined:** ✅ `GameActions.submitAnswer`
**Reducer Handles:** ✅ `on(GameActions.submitAnswer, ...)`
**Effect Exists:** ❌ **MISSING**

**Impact:** When user submits an answer, nothing happens. The reducer sets `isLoading: true`, but no effect:
- Compares submitted answers with correct answers
- Calculates points
- Dispatches `submitAnswerSuccess`

**Solution Needed:**
```typescript
submitAnswer$ = createEffect(() =>
  this.actions$.pipe(
    ofType(GameActions.submitAnswer),
    withLatestFrom(
      this.store.select(GameSelectors.selectCurrentSong),
      this.store.select(GameSelectors.selectCurrentRound)
    ),
    map(([{ titleAnswer, artistAnswer }, currentSong, currentRound]) => {
      if (!currentSong) {
        return GameActions.loadNextSongFailure({
          error: 'No current song'
        });
      }

      // Check answers (case-insensitive, trimmed)
      const correctTitle = titleAnswer.trim().toLowerCase() ===
                          currentSong.title.toLowerCase();
      const correctArtist = artistAnswer.trim().toLowerCase() ===
                           currentSong.artist.toLowerCase();

      const result = {
        round: currentRound,
        song: currentSong,
        userTitleAnswer: titleAnswer,
        userArtistAnswer: artistAnswer,
        correctTitle,
        correctArtist,
        pointsEarned: (correctTitle ? 1 : 0) + (correctArtist ? 1 : 0)
      };

      return GameActions.submitAnswerSuccess({
        correctTitle,
        correctArtist,
        result
      });
    })
  )
);
```

### 3. ❌ `nextRound` Effect (CRITICAL)

**Action Defined:** ✅ `GameActions.nextRound`
**Reducer Handles:** ✅ `on(GameActions.nextRound, ...)`
**Effect Exists:** ❌ **MISSING**

**Impact:** When user clicks "Next Round", the reducer updates the round number, but no effect:
- Checks if game is finished
- Loads next song OR finishes game

**Solution Needed:**
```typescript
nextRound$ = createEffect(() =>
  this.actions$.pipe(
    ofType(GameActions.nextRound),
    withLatestFrom(
      this.store.select(GameSelectors.selectCurrentRound),
      this.store.select(GameSelectors.selectTotalRounds)
    ),
    map(([_, currentRound, totalRounds]) => {
      if (currentRound >= totalRounds) {
        return GameActions.finishGame();
      }
      return GameActions.loadNextSong();
    })
  )
);
```

### 4. ❌ `loadUser` Effect (Auth)

**Action Defined:** ✅ `AuthActions.loadUser`
**Reducer Handles:** ✅ `on(AuthActions.loadUser, ...)`
**Effect Exists:** ✅ In `auth.effects.ts` (line 64)

**Status:** ✅ **EXISTS** - This one is implemented

### 5. ❌ `login` Effect (Auth)

**Action Defined:** ✅ `AuthActions.login`
**Reducer Handles:** ✅ `on(AuthActions.login, ...)`
**Effect Exists:** ✅ In `auth.effects.ts` (line 19)

**Status:** ✅ **EXISTS** - This one is implemented

## Missing Helper Functions

The `loadNextSong` effect needs a helper function to generate multiple choice options:

```typescript
private generateChoices(correct: string, allOptions: string[]): string[] {
  // Remove duplicates and the correct answer
  const uniqueOptions = Array.from(new Set(allOptions))
    .filter(opt => opt.toLowerCase() !== correct.toLowerCase());

  // Shuffle and take 3 wrong answers
  const shuffled = uniqueOptions.sort(() => Math.random() - 0.5);
  const wrongChoices = shuffled.slice(0, 3);

  // Add correct answer and shuffle again
  const choices = [...wrongChoices, correct];
  return choices.sort(() => Math.random() - 0.5);
}
```

## Summary of Missing Pieces

| Component | Action | Reducer | Effect | Status |
|-----------|--------|---------|--------|--------|
| Load Tracks | ✅ | ✅ | ✅ | **COMPLETE** |
| Load Next Song | ✅ | ✅ | ❌ | **MISSING EFFECT** |
| Submit Answer | ✅ | ✅ | ❌ | **MISSING EFFECT** |
| Next Round | ✅ | ✅ | ❌ | **MISSING EFFECT** |
| Finish Game | ✅ | ✅ | N/A | **COMPLETE** |
| Auth Login | ✅ | ✅ | ✅ | **COMPLETE** |
| Auth Callback | ✅ | ✅ | ✅ | **COMPLETE** |
| Load User | ✅ | ✅ | ✅ | **COMPLETE** |

## Impact on User Experience

### Current State:
1. ✅ User logs in → Works
2. ✅ User starts game → Works
3. ✅ Tracks load → Works
4. ❌ **First song never loads** → `loadNextSong` effect missing
5. ❌ **Can't submit answers** → `submitAnswer` effect missing
6. ❌ **Can't go to next round** → `nextRound` effect missing
7. ❌ **Game never finishes** → Depends on `nextRound` effect

### After Fix:
1. ✅ User logs in
2. ✅ User starts game
3. ✅ Tracks load
4. ✅ **First song loads with choices**
5. ✅ **User can submit answers and see results**
6. ✅ **User can progress through rounds**
7. ✅ **Game finishes after all rounds**

## Priority Order

1. **HIGH PRIORITY:** `loadNextSong` effect - Without this, no songs appear
2. **HIGH PRIORITY:** `submitAnswer` effect - Without this, can't answer questions
3. **HIGH PRIORITY:** `nextRound` effect - Without this, can't progress
4. **MEDIUM:** Helper function `generateChoices` - Needed by `loadNextSong`

## Additional Observations

### Selectors - All Present ✅
All necessary selectors exist in `game.selectors.ts`:
- `selectCurrentSong`
- `selectTitleChoices`
- `selectArtistChoices`
- `selectAvailableTracks`
- `selectUsedTrackIds`
- etc.

### Actions - All Defined ✅
All necessary actions exist in `game.actions.ts`:
- `loadNextSong`
- `loadNextSongSuccess`
- `loadNextSongFailure`
- `submitAnswer`
- `submitAnswerSuccess`
- `nextRound`
- `finishGame`

### Reducers - All Implemented ✅
All reducers properly handle their actions in `game.reducer.ts`

### The Gap: Effects ❌
The effects layer is incomplete. Actions are dispatched, reducers are ready to handle them, but the effects that bridge the gap are missing.

## Testing After Implementation

After implementing the missing effects, test this flow:

1. Login → Setup → Start Game
2. Check: Song title and artist choices appear
3. Select answers → Submit
4. Check: Correct/incorrect feedback shows
5. Click "Next Round"
6. Check: New song loads
7. Repeat until round 10
8. Check: Game finishes and shows results

## Files to Modify

1. `src/app/store/game/game.effects.ts`
   - Add `loadNextSong$` effect
   - Add `submitAnswer$` effect
   - Add `nextRound$` effect
   - Add `generateChoices()` helper method

