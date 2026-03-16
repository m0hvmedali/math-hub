/// <reference types="../types/spotify" />
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// PKCE Helper Functions
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export interface SpotifySearchResult {
  uri: string;
  name: string;
  artist: string;
  image: string;
  type: 'track' | 'playlist';
}

export interface CurrentTrack {
  name: string;
  artist: string;
  album: string;
  image: string;
  uri: string;
  isPlaying: boolean;
}

interface SpotifyContextType {
  token: string | null;
  player: Spotify.Player | null;
  deviceId: string | null;
  isConnected: boolean;
  currentTrack: CurrentTrack | null;
  login: () => void;
  playPlaylist: (uri: string) => Promise<void>;
  playTrack: (uri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  searchSpotify: (query: string) => Promise<SpotifySearchResult[]>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

const CLIENT_ID = 'b6a162958bd84dd6a7eb11e23b22e28f'; // User's specific client ID
// Using the root origin because HashRouter won't work with Spotify's strict Redirect URI rules.
const REDIRECT_URI = window.location.origin + '/'; 
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state'
];

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('spotify_token'));
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId ] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);

  // Handle OAuth Redirect and Token Exchange
  useEffect(() => {
    const handleAuth = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code');

        // Flow 1: We just returned from Spotify with a code
        if (code && !token) {
            let codeVerifier = localStorage.getItem('spotify_code_verifier');

            if (!codeVerifier) {
               console.error("Missing code verifier");
               return;
            }

            const payload = {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier,
                }),
            };

            try {
                const body = await fetch('https://accounts.spotify.com/api/token', payload);
                const response = await body.json();

                if (response.access_token) {
                    setToken(response.access_token);
                    localStorage.setItem('spotify_token', response.access_token);
                    // Clear the URL and force HashRouter back to timer
                    window.history.replaceState({}, document.title, '/');
                    window.location.href = window.location.origin + '/#/timer';
                } else {
                    console.error("Token Error", response);
                }
            } catch (error) {
                console.error("Fetch Token Error", error);
            }
        }
    };
    handleAuth();
  }, [token]);

  // Initialize Spotify SDK
  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spPlayer = new window.Spotify.Player({
        name: 'Math Hub Focus Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(spPlayer);

      spPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsConnected(true);
      });

      spPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsConnected(false);
      });

      spPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;
        const track = state.track_window.current_track;
        if (track) {
          setCurrentTrack({
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            album: track.album.name,
            image: track.album.images?.[0]?.url || '',
            uri: track.uri,
            isPlaying: !state.paused,
          });
        }
      });

      spPlayer.connect();
    };

    return () => {
      script.remove();
    };
  }, [token]);

  const login = useCallback(async () => {
    const codeVerifier  = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    window.localStorage.setItem('spotify_code_verifier', codeVerifier);

    const params =  new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES.join(' '),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: REDIRECT_URI,
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    window.location.href = authUrl;
  }, []);

  const playPlaylist = useCallback(async (uri: string) => {
    if (!token || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: uri }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) { console.error("Spotify Play Error:", e); }
  }, [token, deviceId]);

  const pause = useCallback(async () => {
    if (player) await player.pause();
  }, [player]);

  const resume = useCallback(async () => {
    if (player) await player.resume();
  }, [player]);

  const skipNext = useCallback(async () => {
    if (player) await player.nextTrack();
  }, [player]);

  const skipPrev = useCallback(async () => {
    if (player) await player.previousTrack();
  }, [player]);

  const playTrack = useCallback(async (uri: string) => {
    if (!token || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [uri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) { console.error("Spotify Play Track Error:", e); }
  }, [token, deviceId]);

  const searchSpotify = useCallback(async (query: string): Promise<SpotifySearchResult[]> => {
    if (!token || !query) return [];
    try {
      const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,playlist&limit=8`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      const results: SpotifySearchResult[] = [];

      if (data.playlists?.items) {
          data.playlists.items.forEach((p: any) => {
              if (p) results.push({ type: 'playlist', uri: p.uri, name: p.name, artist: 'Playlist', image: p.images?.[0]?.url });
          });
      }
      if (data.tracks?.items) {
          data.tracks.items.forEach((t: any) => {
              if (t) results.push({ type: 'track', uri: t.uri, name: t.name, artist: t.artists?.[0]?.name, image: t.album?.images?.[0]?.url });
          });
      }
      return results;
    } catch (e) {
      console.error("Spotify Search Error", e);
      return [];
    }
  }, [token]);

  return (
    <SpotifyContext.Provider value={{ token, player, deviceId, isConnected, currentTrack, login, playPlaylist, playTrack, pause, resume, skipNext, skipPrev, searchSpotify }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
