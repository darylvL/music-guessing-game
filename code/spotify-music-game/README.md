# 🎵 Spotify Music Guessing Game

A mobile-first Angular application that lets you test your music knowledge by guessing songs from your Spotify library!

## Features

- 🎧 **Play from Your Library**: Uses your Spotify "Liked Songs" for the game
- 🎯 **Two Difficulty Modes**:
  - **Easy Mode**: Multiple choice questions for both title and artist
  - **Hard Mode**: Type in your answers with fuzzy matching
- 🏆 **Score Tracking**: Track your performance across multiple rounds
- 📱 **Mobile-First Design**: Optimized for touch screens and mobile devices
- 🎮 **Configurable**: Adjust songs per game and preview duration via environment variables
- 🔒 **Secure OAuth**: Uses Spotify OAuth 2.0 with PKCE flow (no backend required)

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- A Spotify account (Premium required for audio playback)
- A Spotify Developer App (see setup below)

## Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create app"
4. Fill in the app details:
   - **App name**: Spotify Music Guessing Game
   - **App description**: A music guessing game
   - **Redirect URI**: `http://localhost:4200/callback` (for development)
   - **API/SDKs**: Check "Web API" and "Web Playback SDK"
5. Save your app
6. Copy the **Client ID** from your app settings

## Installation

1. Clone or navigate to the project directory:
```bash
cd code/spotify-music-game
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Edit `src/environments/environment.ts` and replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Spotify Client ID:

```typescript
export const environment = {
  production: false,
  spotifyClientId: 'your_actual_client_id_here',
  spotifyRedirectUri: 'http://localhost:4200/callback',
  songPreviewDuration: 20, // Duration in seconds
  songsPerGame: 10, // Number of songs per game session
  // ... rest of config
};
```

## Running the Application

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## How to Play

1. **Login**: Click "Login with Spotify" and authorize the app
2. **Setup**: Choose your difficulty mode (Easy or Hard)
3. **Play**:
   - Listen to the 20-second preview of each song
   - **Easy Mode**: Select the correct title and artist from multiple choices
   - **Hard Mode**: Type in the title and artist
4. **Results**: View your final score and round-by-round breakdown

## Configuration

You can customize the game by editing `src/environments/environment.ts`:

- `songPreviewDuration`: How long each song plays (in seconds)
- `songsPerGame`: Number of songs per game session
- `spotifyScopes`: Spotify API permissions (modify with caution)

## Architecture

### Technology Stack

- **Framework**: Angular 21
- **State Management**: NgRx (Store, Effects)
- **Authentication**: Spotify OAuth 2.0 with PKCE
- **Audio Playback**: Spotify Web Playback SDK
- **Styling**: CSS (Mobile-first responsive design)

### Project Structure

```
src/app/
├── core/
│   ├── services/        # Spotify API, Auth, Playback services
│   └── guards/          # Route guards
├── store/
│   ├── auth/            # Authentication state management
│   ├── game/            # Game state management
│   └── app.state.ts     # Root state configuration
├── features/
│   ├── auth/            # Login and callback components
│   └── game/            # Game setup, play, and results components
└── shared/
    └── models/          # TypeScript interfaces and types
```

### State Management Flow

The app uses NgRx for predictable state management:
- **Auth Store**: Manages authentication tokens and user profile
- **Game Store**: Handles game logic, song selection, and scoring

### Extensibility

The architecture is designed to be easily extended:
- **Music Sources**: Currently supports "Liked Songs", but the `MusicSource` interface allows easy addition of playlists and albums
- **Game Modes**: Easy to add new difficulty modes or game variations
- **Scoring**: Simple to enhance with time-based bonuses or streak multipliers

## Troubleshooting

### "No access token available" error
- Make sure you've completed the Spotify OAuth flow
- Check that your Client ID is correctly configured
- Ensure your redirect URI matches exactly in both the Spotify Dashboard and environment config

### "Playback error" or audio not playing
- Spotify Premium is required for Web Playback SDK
- Make sure no other Spotify client is actively playing music
- Check browser console for specific error messages

### Songs not loading
- Ensure you have liked songs in your Spotify library
- Check network connectivity
- Verify Spotify API scopes are correctly configured

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 11+)

**Note**: The Spotify Web Playback SDK works best on Chrome/Edge.

## License

This project is for educational purposes. Spotify® is a registered trademark of Spotify AB.

## Contributing

Feel free to submit issues or pull requests to improve the game!

## Future Enhancements

- [ ] Support for playlist and album selection
- [ ] Multiplayer mode
- [ ] Leaderboards
- [ ] Time-based scoring
- [ ] Difficulty levels with partial credit
- [ ] Social sharing of results
