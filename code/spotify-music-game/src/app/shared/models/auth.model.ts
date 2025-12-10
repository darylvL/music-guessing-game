export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

