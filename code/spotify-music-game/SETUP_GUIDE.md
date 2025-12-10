# Setup Guide - Spotify Music Guessing Game

This guide will walk you through setting up the Spotify Music Guessing Game from scratch.

## Step 1: Create a Spotify Developer App

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Create a New App**
   - Click the "Create app" button
   - Fill in the required information:
     - **App name**: `Spotify Music Guessing Game` (or any name you prefer)
     - **App description**: `A fun music guessing game using my Spotify library`
     - **Website**: Leave blank or add your website
     - **Redirect URI**: `http://localhost:4200/callback`
     - **Which API/SDKs are you planning to use?**: Check both:
       - ✅ Web API
       - ✅ Web Playback SDK
   - Accept the Terms of Service
   - Click "Save"

3. **Get Your Client ID**
   - After creating the app, you'll see your app's dashboard
   - Click on "Settings" in the top right
   - Copy the **Client ID** (you'll need this in Step 3)
   - **Important**: Keep this Client ID secure, but note that it's okay to use in a frontend app

4. **Verify Redirect URI**
   - In Settings, scroll down to "Redirect URIs"
   - Make sure `http://localhost:4200/callback` is listed
   - If you plan to deploy this app, add your production callback URL here too (e.g., `https://yourdomain.com/callback`)

## Step 2: Install Dependencies

1. **Navigate to the project directory**:
```bash
cd code/spotify-music-game
```

2. **Install npm packages**:
```bash
npm install
```

This will install all required dependencies including:
- Angular 21
- NgRx (Store, Effects, DevTools)
- RxJS
- And other required packages

## Step 3: Configure Your Spotify Client ID

1. **Open the environment file**:
   - Navigate to: `src/environments/environment.ts`

2. **Replace the placeholder with your Client ID**:
```typescript
export const environment = {
  production: false,
  spotifyClientId: 'paste_your_client_id_here', // ← Replace this
  spotifyRedirectUri: 'http://localhost:4200/callback',
  songPreviewDuration: 20,
  songsPerGame: 10,
  // ... rest of the config
};
```

3. **Optional: Customize game settings**:
   - `songPreviewDuration`: How long each song preview plays (default: 20 seconds)
   - `songsPerGame`: Number of songs per game session (default: 10)

4. **For production deployment**, also update `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  spotifyClientId: 'your_client_id_here',
  spotifyRedirectUri: 'https://yourdomain.com/callback', // Your production URL
  // ... rest of the config
};
```

## Step 4: Run the Application

1. **Start the development server**:
```bash
npm start
```

2. **Open your browser**:
   - Navigate to: http://localhost:4200
   - You should see the login screen

3. **Test the OAuth flow**:
   - Click "Login with Spotify"
   - You'll be redirected to Spotify's authorization page
   - Authorize the app
   - You should be redirected back to the game setup screen

## Step 5: Prepare Your Spotify Library

For the best experience:

1. **Add songs to your "Liked Songs"**:
   - Open Spotify (desktop or mobile app)
   - Like at least 10-20 songs (more is better!)
   - The game randomly selects from your liked songs

2. **Spotify Premium Required**:
   - Audio playback requires a Spotify Premium account
   - Free accounts can see the game but won't hear audio

## Troubleshooting

### Issue: "Invalid Client ID" error

**Solution**:
- Double-check that you copied the Client ID correctly
- Make sure there are no extra spaces or characters
- Verify the Client ID in your Spotify Developer Dashboard

### Issue: "Redirect URI mismatch" error

**Solution**:
- Ensure `http://localhost:4200/callback` is added to your Spotify app's Redirect URIs
- The URI must match exactly (including the protocol `http://`)
- After adding it, save the settings in the Spotify Dashboard

### Issue: "No songs available" error

**Solution**:
- Make sure you have liked songs in your Spotify library
- The app requires at least 4 songs to generate multiple choice options
- Like more songs in the Spotify app and refresh the game

### Issue: Audio not playing

**Solution**:
- Verify you have Spotify Premium (required for Web Playback SDK)
- Close any other Spotify clients that might be playing
- Check browser console for specific error messages
- Try a different browser (Chrome/Edge work best)

### Issue: Build errors

**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
npm run ng cache clean

# Try building again
npm run build
```

## Development Tips

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```
The output will be in `dist/spotify-music-game/`

### Linting
```bash
npm run lint
```

### Serving Production Build Locally
```bash
npm run build
npx http-server dist/spotify-music-game -p 8080
```

## Deployment

### Prerequisites for Deployment

1. **Update Redirect URI in Spotify Dashboard**:
   - Add your production URL: `https://yourdomain.com/callback`

2. **Update environment.prod.ts**:
   - Set your production Client ID
   - Set your production Redirect URI

### Deploy to Netlify/Vercel

1. **Build the app**:
```bash
npm run build
```

2. **Deploy the `dist/spotify-music-game` folder**

3. **Configure redirects** (for Angular routing):

   For Netlify, create `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

   For Vercel, create `vercel.json`:
```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

## Next Steps

Once everything is set up:

1. **Play the game** and test both difficulty modes
2. **Customize the styling** in component CSS files
3. **Extend functionality**:
   - Add playlist support (see architecture notes in README)
   - Implement time-based scoring
   - Add more game modes

## Need Help?

- Check the main [README.md](./README.md) for more information
- Review the [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- Check the [Spotify Web Playback SDK Documentation](https://developer.spotify.com/documentation/web-playback-sdk)

## Security Notes

- The Client ID is safe to expose in frontend code
- Never commit your `.env` files if you create them
- Tokens are stored in localStorage (cleared on logout)
- The app uses OAuth 2.0 with PKCE for secure authentication

