# Quick Start - Spotify Music Guessing Game

## 🚀 Get Started in 5 Minutes

### 1. Create Spotify App (2 minutes)
1. Go to https://developer.spotify.com/dashboard
2. Click "Create app"
3. Add redirect URI: `http://localhost:4200/callback`
4. Copy your **Client ID**

### 2. Configure & Run (3 minutes)
```bash
cd spotify-music-game
npm install
```

Edit `src/environments/environment.ts`:
```typescript
spotifyClientId: 'YOUR_CLIENT_ID_HERE'
```

```bash
npm start
```

### 3. Play! 🎮
Open http://localhost:4200 and start guessing!

---

📖 **Need more details?** See [SETUP_GUIDE.md](./spotify-music-game/SETUP_GUIDE.md)

📚 **Full documentation:** See [README.md](./spotify-music-game/README.md)

