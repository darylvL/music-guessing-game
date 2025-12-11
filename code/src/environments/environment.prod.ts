export const environment = {
  production: true,
  spotifyClientId: '__SPOTIFY_CLIENT_ID__', // Will be replaced by GitHub Actions
  spotifyRedirectUri: '__SPOTIFY_REDIRECT_URI__', // Will be replaced by GitHub Actions
  songPreviewDuration: 20, // Duration in seconds
  songsPerGame: 10, // Number of songs per game session
  autoAdvanceDelay: 1500, // Delay before auto-advancing to next round (in milliseconds). Note that the css animation should be manually changed as well in: code\spotify-music-game\src\app\features\game\game-play\game-play.component.css
  spotifyAuthUrl: 'https://accounts.spotify.com/authorize',
  spotifyApiUrl: 'https://api.spotify.com/v1',
  spotifyScopes: [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ]
};

