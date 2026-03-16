import React, { useState, useEffect } from 'react';
import { useSpotify } from '../store/SpotifyProvider';
import { PlayIcon, PauseIcon } from './Icons';

interface SpotifyPlayerProps {
  currentPhase: 'idle' | 'study' | 'break' | 'paused';
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ currentPhase }) => {
  const { isConnected, login, token, playPlaylist, pause, resume } = useSpotify();
  const [studyUri, setStudyUri] = useState('spotify:playlist:37i9dQZF1DWZeKCadgRdKQ'); // Deep Focus
  const [breakUri, setBreakUri] = useState('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'); // Today's Top Hits

  // Automatic Play/Pause based on Timer Phase
  useEffect(() => {
    if (!isConnected) return;

    const handlePhaseChange = async () => {
      try {
        if (currentPhase === 'study') {
          // Play Study Music
          await playPlaylist(studyUri);
        } else if (currentPhase === 'break') {
          // Play Break Music
          await playPlaylist(breakUri);
        } else if (currentPhase === 'paused' || currentPhase === 'idle') {
          await pause();
        }
      } catch (err) {
        console.error("Spotify Playback Error", err);
      }
    };

    handlePhaseChange();
  }, [currentPhase, isConnected, studyUri, breakUri, playPlaylist, pause]);

  if (!token) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center space-y-4 text-center">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Acoustic Synchronization</h3>
        <p className="text-xs text-gray-500 font-bold max-w-xs">Connect your Spotify account to automatically switch between deep focus and high-energy break playlists.</p>
        <button 
          onClick={login}
          className="bg-[#1DB954] text-white px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#1DB954] animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]">
            {isConnected ? 'Neural Audio Online' : 'Connecting to Node...'}
          </span>
        </div>
        <button onClick={() => { if (currentPhase === 'study') resume(); else pause(); }} className="text-gray-400 hover:text-white">
            <PlayIcon className="w-5 h-5 inline-block" />
        </button>
      </div>

      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Study Frequency (Playlist URI)</label>
          <input 
            value={studyUri}
            onChange={(e) => setStudyUri(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-[#1DB954] transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Break Energy (Playlist URI)</label>
          <input 
            value={breakUri}
            onChange={(e) => setBreakUri(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-[#1DB954] transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
