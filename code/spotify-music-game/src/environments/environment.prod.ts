export const environment = {
  production: true,
  spotifyClientId: 'YOUR_SPOTIFY_CLIENT_ID', // Replace with your Spotify app client ID
  spotifyRedirectUri: 'https://yourdomain.com/callback', // Replace with your production URL
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

