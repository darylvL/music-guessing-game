# Features - Spotify Music Guessing Game

## 🎮 Game Features

### Two Difficulty Modes

#### Easy Mode
- **Multiple Choice Questions**: Select from 4 options for both title and artist
- **Separate Question Sets**: Independent choices for song title and artist
- **Visual Feedback**: Immediate color-coded feedback (green for correct, red for incorrect)
- **Show Correct Answer**: Displays the right answer after submission

#### Hard Mode
- **Text Input**: Type in your answers for both title and artist
- **Fuzzy Matching**: Smart algorithm that handles:
  - Case differences (e.g., "Bohemian Rhapsody" = "bohemian rhapsody")
  - Special characters (e.g., "Don't Stop" = "Dont Stop")
  - Extra spaces
  - Partial word matches (80% threshold)
- **Real-time Validation**: Input fields turn green/red based on correctness
- **Correct Answer Display**: Shows the actual title/artist if you got it wrong

### Game Flow

#### 1. Login & Authentication
- Spotify OAuth 2.0 with PKCE (no backend needed)
- Secure token storage in localStorage
- Automatic token expiration handling
- Clean logout functionality

#### 2. Game Setup
- Choose difficulty mode (Easy/Hard)
- View game configuration:
  - Number of songs (configurable, default: 10)
  - Preview duration (configurable, default: 20 seconds)
  - Music source (currently: Liked Songs)
- User profile display with logout option

#### 3. Game Play
- **Progress Tracking**: Round counter (e.g., "Round 3/10")
- **Score Display**: Real-time score updates
- **Album Artwork**: Visual display of the current song's album cover
- **Audio Playback**: 20-second preview with automatic stop
- **Listening Indicator**: Animated "🎧 Listen carefully..." message
- **Answer Submission**: Large, touch-friendly submit button
- **Immediate Feedback**: ✓/✗ indicators for title and artist
- **Next Round**: Smooth transition to the next song

#### 4. Results Screen
- **Final Score**: Points earned out of maximum possible
- **Percentage**: Accuracy percentage
- **Performance Message**: Encouraging message based on score
  - 90%+: "🏆 Outstanding!"
  - 75-89%: "🌟 Excellent!"
  - 60-74%: "👍 Good job!"
  - 40-59%: "💪 Not bad!"
  - <40%: "📚 Keep practicing!"
- **Statistics Grid**:
  - Total songs played
  - Correct answers
  - Missed answers
  - Accuracy percentage
- **Round-by-Round Breakdown**: Detailed results for each song
- **Play Again**: Start a new game with one click

## 🎵 Music Features

### Spotify Integration
- **Liked Songs**: Plays from your personal Spotify library
- **Random Selection**: No duplicate songs in the same game
- **Album Artwork**: Fetches and displays album covers
- **High-Quality Audio**: Uses Spotify Web Playback SDK
- **Pagination Handling**: Fetches all liked songs regardless of library size

### Audio Playback
- **Configurable Duration**: Default 20 seconds, adjustable via environment
- **Automatic Stop**: Playback stops after the configured duration
- **Playback Controls**: Pause, resume, stop functionality
- **Device Management**: Handles Spotify device initialization

## 🎨 UI/UX Features

### Mobile-First Design
- **Responsive Layout**: Adapts to all screen sizes
- **Touch-Friendly**: Minimum 44x44px touch targets
- **Optimized Breakpoints**: Special layouts for mobile, tablet, desktop
- **No Pull-to-Refresh**: Disabled to prevent accidental refreshes

### Visual Design
- **Spotify-Inspired**: Uses Spotify's signature green (#1db954)
- **Modern Gradients**: Attractive background gradients
- **Card-Based Layout**: Clean, organized component cards
- **Smooth Animations**: Transitions and hover effects
- **Loading States**: Spinners and loading indicators
- **Color-Coded Feedback**:
  - Green: Correct answers
  - Red: Incorrect answers
  - Blue: Selected choices

### Accessibility
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Touch Optimization**: Large, easy-to-tap buttons
- **Clear Feedback**: Visual and textual feedback for all actions

## 🔧 Technical Features

### State Management (NgRx)
- **Auth Store**: Manages authentication state
  - Login/logout actions
  - Token management
  - User profile
- **Game Store**: Manages game state
  - Game initialization
  - Song selection
  - Answer validation
  - Score calculation
  - Round progression
- **Effects**: Handles side effects
  - API calls
  - Audio playback
  - Navigation
- **Selectors**: Derived state
  - Score percentage
  - Game status
  - Current round info

### Services

#### SpotifyAuthService
- OAuth 2.0 with PKCE flow
- Code verifier generation (SHA-256)
- Token exchange
- Token validation and expiry checking
- Secure logout

#### SpotifyApiService
- User profile fetching
- Liked songs retrieval with pagination
- Track details fetching
- Automatic token inclusion in requests
- Error handling

#### SpotifyPlaybackService
- Web Playback SDK initialization
- Track playback control
- Timed playback (play for X seconds)
- Device management
- Playback state tracking

#### MusicSourceService
- Extensible architecture
- Currently: Liked Songs
- Ready for: Playlists, Albums, Artist Radio
- Interface-based design for easy extension

### Routing & Guards
- **Auth Guard**: Protects game routes
- **Lazy Loading**: Optimized bundle loading
- **Route Configuration**:
  - `/login`: Login screen
  - `/callback`: OAuth callback handler
  - `/game/setup`: Game configuration
  - `/game/play`: Active gameplay
  - `/game/results`: Results screen

### Error Handling
- **Network Errors**: User-friendly error messages
- **API Errors**: Graceful degradation
- **Playback Errors**: Fallback and retry logic
- **Token Expiration**: Automatic logout and redirect
- **Edge Cases**:
  - Insufficient liked songs
  - No Spotify Premium
  - Playback SDK initialization failure

## ⚙️ Configuration Features

### Environment Variables
- `spotifyClientId`: Your Spotify app credentials
- `spotifyRedirectUri`: OAuth callback URL
- `songPreviewDuration`: Configurable preview length
- `songsPerGame`: Configurable game length
- `spotifyScopes`: API permissions

### Customizable Settings
- **Songs per Game**: Change in environment.ts
- **Preview Duration**: Adjust playback length
- **Difficulty Modes**: Easy to add new modes
- **Scoring Rules**: Simple to modify point system

## 🚀 Performance Features

### Optimization
- **Lazy Loading**: Components loaded on demand
- **Change Detection**: Optimized with OnPush where applicable
- **Bundle Size**: ~342 KB (89 KB gzipped)
- **Fast Build**: ~3 seconds
- **Tree Shaking**: Unused code eliminated

### Caching
- **Token Storage**: localStorage for persistence
- **Track Caching**: Fetched tracks stored in state
- **Image Loading**: Browser caching for album art

## 🔒 Security Features

### Authentication
- **OAuth 2.0**: Industry-standard authentication
- **PKCE Flow**: Enhanced security for public clients
- **No Backend**: No server-side secrets to compromise
- **Token Storage**: Secure localStorage with expiry
- **Automatic Logout**: On token expiration

### Data Privacy
- **No User Data Storage**: Everything stays in browser
- **Session-Only**: Data cleared on logout
- **Spotify-Managed**: User data handled by Spotify
- **Minimal Permissions**: Only required scopes requested

## 📱 Mobile Features

### Touch Optimization
- **Large Touch Targets**: Minimum 44x44px
- **Swipe-Friendly**: No conflicting gestures
- **Tap Highlight**: Visual feedback on touch
- **No Accidental Actions**: Confirmation for important actions

### Mobile-Specific
- **Viewport Meta Tags**: Proper mobile scaling
- **Apple Web App**: Can be added to home screen
- **Theme Color**: Matches Spotify green
- **Responsive Images**: Optimized for mobile bandwidth

## 🎯 Game Logic Features

### Song Selection
- **Random Selection**: Fisher-Yates shuffle algorithm
- **No Duplicates**: Tracks used only once per game
- **Fair Distribution**: Equal chance for all songs

### Multiple Choice Generation
- **Smart Selection**: Wrong answers from same library
- **Shuffled Options**: Random order every time
- **Balanced Difficulty**: Similar-sounding options

### Answer Validation
- **Exact Match** (Easy Mode): Selected choice must match exactly
- **Fuzzy Match** (Hard Mode):
  - Normalize strings (lowercase, remove special chars)
  - Word-based matching
  - 80% similarity threshold
  - Handles common typos and variations

### Scoring
- **2 Points per Song**: 1 for title, 1 for artist
- **Immediate Feedback**: See results after each round
- **Cumulative Score**: Tracks total across all rounds
- **Percentage Calculation**: Score / Max Score × 100

## 🔮 Extensibility Features

### Future-Ready Architecture
- **Music Source Interface**: Easy to add playlists/albums
- **Game Mode System**: Simple to add new modes
- **Scoring System**: Flexible point calculation
- **Component Structure**: Modular and reusable

### Extension Points
- **New Music Sources**: Implement `MusicSource` interface
- **New Game Modes**: Add to `GameMode` type
- **Custom Scoring**: Modify effects in game store
- **Additional Features**: NgRx makes it easy to add state

## 📊 Analytics-Ready

### Trackable Metrics
- Score per game
- Accuracy per difficulty mode
- Most missed songs
- Average completion time
- User engagement

### Easy Integration
- NgRx Effects can dispatch analytics events
- All user actions flow through store
- Simple to add tracking service

## 🎉 User Experience Features

### Feedback & Guidance
- **Loading Indicators**: Never leave users guessing
- **Error Messages**: Clear, actionable error text
- **Success Messages**: Positive reinforcement
- **Tooltips & Hints**: Helpful guidance throughout

### Smooth Transitions
- **Page Transitions**: Smooth navigation
- **State Changes**: Animated feedback
- **Loading States**: Skeleton screens and spinners
- **Hover Effects**: Visual feedback on interaction

### Engagement
- **Performance Messages**: Encouraging feedback
- **Score Display**: Motivating progress tracking
- **Play Again**: Easy to start new game
- **Visual Appeal**: Attractive, modern design

