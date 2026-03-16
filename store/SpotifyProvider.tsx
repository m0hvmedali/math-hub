/// <reference types="../types/spotify" />
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SpotifyContextType {
  token: string | null;
  player: Spotify.Player | null;
  deviceId: string | null;
  isConnected: boolean;
  login: () => void;
  playPlaylist: (uri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

const CLIENT_ID = 'b6a162958bd84dd6a7eb11e23b22e28f'; // User's specific client ID
const REDIRECT_URI = window.location.origin + '/timer';
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

  // Handle OAuth Redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem('spotify_token', accessToken);
        window.location.hash = '';
      }
    }
  }, []);

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

      spPlayer.connect();
    };

    return () => {
      script.remove();
    };
  }, [token]);

  const login = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
    window.location.href = authUrl;
  };

  const playPlaylist = async (uri: string) => {
    if (!token || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ context_uri: uri }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  };

  const pause = async () => {
    if (player) await player.pause();
  };

  const resume = async () => {
    if (player) await player.resume();
  };

  return (
    <SpotifyContext.Provider value={{ token, player, deviceId, isConnected, login, playPlaylist, pause, resume }}>
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
