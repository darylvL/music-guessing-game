export const environment = {
  production: false,
  spotifyClientId: 'YOUR_SPOTIFY_CLIENT_ID', // Replace with your Spotify app client ID
  spotifyRedirectUri: 'http://127.0.0.1:4200/callback',
  songPreviewDuration: 20, // Duration in seconds
  songsPerGame: 10, // Number of songs per game session
  spotifyAuthUrl: 'https://accounts.spotify.com/authorize',
  spotifyApiUrl: 'https://api.spotify.com/v1',
  spotifyScopes: [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' ')
};

