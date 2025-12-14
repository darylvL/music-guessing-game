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
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ],

  // Cache Configuration
  cacheTtlLikedSongs: 15 * 60 * 1000, // 15 minutes in milliseconds - TTL for liked songs cache
  cacheTtlPlaylists: 15 * 60 * 1000, // 15 minutes in milliseconds - TTL for playlist tracks cache
  cacheTtlUserPlaylists: 30 * 60 * 1000, // 30 minutes in milliseconds - TTL for user playlists list cache
  cacheMaxSize: 100 * 1024 * 1024, // 100MB in bytes - Maximum total cache size
  cacheMaxPlaylists: 100, // Maximum number of cached playlists

  // API Retry Configuration
  apiRetryMaxAttempts: 3, // Maximum retry attempts for failed API calls
  apiRetryInitialDelay: 1000, // Initial retry delay in milliseconds (exponential backoff starts here)
  apiRetryMaxDelay: 10000, // Maximum retry delay in milliseconds (exponential backoff cap)

  // Answer Evaluation Configuration
  artistSeparators: [
    ',',
    'feat',
    'ft',
    'ft.',
    'featuring',
    'and',
    '&',
    '/',
    '\\'
  ], // Separators to ignore when comparing artist names
};

