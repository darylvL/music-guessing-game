export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url?: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  uri: string;
  albumImageUrl?: string;
  durationMs: number;
  previewUrl?: string;
}

