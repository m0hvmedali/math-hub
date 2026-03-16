/// <reference types="../types/spotify" />
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useHubCore } from '../utils/HubCore';

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
  volume: number;
  setVolume: (v: number) => Promise<void>;
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
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('spotify_refresh_token'));
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('spotify_volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  const refreshPromise = useRef<Promise<string | null> | null>(null);
  const lastRefreshAttempt = useRef<number>(0);
  const REFRESH_COOLDOWN = 30000; // 30 seconds minimum between hard failures

  const refreshAccessToken = useCallback(async () => {
    // If a refresh is already in progress, return the existing promise
    if (refreshPromise.current) {
      console.log("[Spotify] Waiting for existing refresh...");
      return refreshPromise.current;
    }

    // Check cooldown to avoid 429 spamming
    const now = Date.now();
    if (now - lastRefreshAttempt.current < REFRESH_COOLDOWN) {
      console.warn("[Spotify] Refresh on cooldown. Skipping request.");
      return null;
    }

    const performRefresh = async () => {
      const rfToken = localStorage.getItem('spotify_refresh_token');
      if (!rfToken) {
        console.warn("[Spotify] No refresh token available.");
        return null;
      }

      console.log("[Spotify] Refreshing access token...");
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: rfToken,
          }),
        });

        const data = await response.json();
        if (data.access_token) {
          setToken(data.access_token);
          localStorage.setItem('spotify_token', data.access_token);
          if (data.refresh_token) {
            setRefreshToken(data.refresh_token);
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
          }
          console.log("[Spotify] Token refreshed successfully.");
          return data.access_token;
        } else {
          console.error("[Spotify] Refresh Error:", data);

          // Handle specific revocation errors
          if (data.error === 'invalid_grant' || data.error === 'invalid_client' || data.error_description?.includes('revoked')) {
            console.warn("[Spotify] Refresh token revoked. Logging out...");
            setToken(null);
            setRefreshToken(null);
            localStorage.removeItem('spotify_token');
            localStorage.removeItem('spotify_refresh_token');
          }
          return null;
        }
      } catch (e) {
        console.error("[Spotify] Refresh Fetch Error:", e);
        return null;
      } finally {
        lastRefreshAttempt.current = Date.now();
        refreshPromise.current = null;
      }
    };

    refreshPromise.current = performRefresh();
    return refreshPromise.current;
  }, []);

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
            if (response.refresh_token) {
              setRefreshToken(response.refresh_token);
              localStorage.setItem('spotify_refresh_token', response.refresh_token);
            }
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

  // Initialize Spotify SDK - One time only
  useEffect(() => {
    // Only load the script if the user has a token (indicating they are logged in)
    // but don't re-run this entire block when the token changes.
    const hasInitialToken = !!localStorage.getItem('spotify_token');
    if (!hasInitialToken) return;

    if (window.Spotify) return; // Already loaded or loading

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spPlayer = new window.Spotify.Player({
        name: 'Math Hub Focus Player',
        getOAuthToken: async cb => { 
          console.log("[Spotify SDK] getOAuthToken requested");
          // Always try to get a fresh token or use current one
          const newToken = await refreshAccessToken();
          if (newToken) {
            cb(newToken);
          } else {
            // If refresh fails or is on cooldown, try the existing token as fallback
            const existingToken = localStorage.getItem('spotify_token');
            cb(existingToken || "");
          }
        },
        volume: volume
      });

      setPlayer(spPlayer);

      spPlayer.addListener('ready', async ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsConnected(true);
        
        // Auto-resume last played if exists
        const savedUri = await loadPlaybackHistory();
        if (savedUri && device_id) {
          console.log("[Spotify] Auto-resuming last played:", savedUri);
          // Small delay to ensure SDK is fully active
          setTimeout(() => {
            if (savedUri.includes(':playlist:')) {
              playPlaylist(savedUri, device_id);
            } else {
              playTrack(savedUri, device_id);
            }
          }, 1000);
        }
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

      spPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate', message);
        // Do not call refreshAccessToken directly here as it might loop.
        // Let the next API call or SDK retry handle it via getOAuthToken.
      });

      spPlayer.connect();
    };

    return () => {
      // Cleanup script only if we are the ones who added it
      // script.remove(); // Usually safer to keep it once loaded in a SPA
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const login = useCallback(async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    window.localStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = new URLSearchParams({
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

  const spotifyFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    let currentToken = token;
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`
    };

    let resp = await fetch(url, { ...options, headers });

    if (resp.status === 401) {
      console.log("[Spotify] 401 detected in API call, attempting refresh...");
      const newToken = await refreshAccessToken();
      if (newToken) {
        console.log("[Spotify] Retrying API call with fresh token...");
        const newHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
        resp = await fetch(url, { ...options, headers: newHeaders });
      } else {
        console.error("[Spotify] Refresh failed, cannot retry API call.");
      }
    } else if (resp.status === 429) {
      console.error("[Spotify] 429 Rate Limit Hit. Pausing requests.");
      lastRefreshAttempt.current = Date.now() + 60000; // Extends cooldown by 60s
    }
    return resp;
  }, [token, refreshAccessToken]);
  const savePlaybackHistory = useCallback(async (uri: string) => {
    const activeUser = localStorage.getItem('study_user');
    if (!activeUser || !supabase) return;
    try {
      // Upsert into timeline_items for persistence
      const { error } = await supabase
        .from('timeline_items')
        .upsert({ 
          user_id: activeUser, 
          type: 'spotify_history', 
          content: uri,
          timestamp: new Date().toISOString()
        }, { onConflict: 'user_id,type' });

      if (error) console.error("[Spotify] History Save Error:", error);
    } catch (e) {
      console.error("[Spotify] History Save Exception:", e);
    }
  }, []);

  const loadPlaybackHistory = useCallback(async (): Promise<string | null> => {
    const activeUser = localStorage.getItem('study_user');
    if (!activeUser || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('timeline_items')
        .select('content')
        .eq('user_id', activeUser)
        .eq('type', 'spotify_history')
        .maybeSingle();

      if (error) {
        console.error("[Spotify] History Load Error:", error);
        return null;
      }
      return data?.content || null;
    } catch (e) {
      console.error("[Spotify] History Load Exception:", e);
      return null;
    }
  }, []);

  const playPlaylist = useCallback(async (uri: string, targetDeviceId?: string) => {
    const activeDeviceId = targetDeviceId || deviceId;
    if (!token || !activeDeviceId) return;
    try {
      await spotifyFetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: uri }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      savePlaybackHistory(uri);
    } catch (e) { console.error("Spotify Play Error:", e); }
  }, [token, deviceId, spotifyFetch, savePlaybackHistory]);

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

  const playTrack = useCallback(async (uri: string, targetDeviceId?: string) => {
    const activeDeviceId = targetDeviceId || deviceId;
    if (!token || !activeDeviceId) return;
    try {
      await spotifyFetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [uri] }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      savePlaybackHistory(uri);
    } catch (e) { console.error("Spotify Play Track Error:", e); }
  }, [token, deviceId, spotifyFetch, savePlaybackHistory]);

  const searchSpotify = useCallback(async (query: string): Promise<SpotifySearchResult[]> => {
    if (!token || !query) return [];
    try {
      const resp = await spotifyFetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,playlist&limit=8`);
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

  // Register with HubCore
  useHubCore({
    id: 'SpotifyService',
    state: { isConnected, token: !!token },
    actions: {
      login: () => login(),
      play: (uri?: string) => uri ? playPlaylist(uri) : resume(),
      pause: () => pause(),
      next: () => skipNext(),
      prev: () => skipPrev(),
      search: (q: string) => searchSpotify(q)
    }
  });

  const setVolume = useCallback(async (v: number) => {
    if (player) {
      await player.setVolume(v);
      setVolumeState(v);
      localStorage.setItem('spotify_volume', v.toString());
    }
  }, [player]);

  return (
    <SpotifyContext.Provider value={{ 
      token, player, deviceId, isConnected, currentTrack, 
      login, playPlaylist, playTrack, pause, resume, 
      skipNext, skipPrev, searchSpotify, volume, setVolume 
    }}>
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
