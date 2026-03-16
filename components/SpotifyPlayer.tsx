import React, { useState, useEffect, useRef } from 'react';
import { useSpotify, SpotifySearchResult } from '../store/SpotifyProvider';
import { PlayIcon, PauseIcon } from './Icons';

interface SpotifyPlayerProps {
  currentPhase: 'idle' | 'study' | 'break' | 'paused';
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ currentPhase }) => {
  const { isConnected, login, token, playPlaylist, pause, resume, searchSpotify } = useSpotify();
  const [studyUri, setStudyUri] = useState('spotify:playlist:37i9dQZF1DWZeKCadgRdKQ'); // Deep Focus
  const [breakUri, setBreakUri] = useState('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'); // Today's Top Hits
  const lastPhase = useRef<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      const results = await searchSpotify(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
  };

  // Automatic Play/Pause based on Timer Phase
  useEffect(() => {
    if (!isConnected || !token) return;
    if (lastPhase.current === currentPhase) return;

    const handlePhaseChange = async () => {
      try {
        if (currentPhase === 'study') {
          await playPlaylist(studyUri);
        } else if (currentPhase === 'break') {
          await playPlaylist(breakUri);
        } else if (currentPhase === 'paused' || currentPhase === 'idle') {
          await pause();
        }
        lastPhase.current = currentPhase;
      } catch (err) {
        console.error("Spotify Playback Error", err);
      }
    };

    handlePhaseChange();
  }, [currentPhase, isConnected, token, studyUri, breakUri, playPlaylist, pause]);

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
        {/* Search Bar */}
        <div className="flex gap-2">
            <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search tracks or playlists..."
                className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white font-medium outline-none focus:border-[#1DB954] transition-colors"
            />
            <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
            <div className="bg-black/40 border border-white/5 rounded-xl max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {searchResults.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                        {item.image ? (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center">
                                <span className="text-xs">🎵</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{item.artist} • {item.type}</p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => setStudyUri(item.uri)}
                                className="text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/40"
                            >
                                Set Study
                            </button>
                            <button 
                                onClick={() => setBreakUri(item.uri)}
                                className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/40"
                            >
                                Set Break
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Selected URIs Display */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Study Frequency (Playlist URI)</label>
          <input 
            value={studyUri}
            readOnly
            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white/50 font-mono outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Break Energy (Playlist URI)</label>
          <input 
            value={breakUri}
            readOnly
            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white/50 font-mono outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
