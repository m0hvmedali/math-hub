import React, { useState } from 'react';
import { useSpotify, SpotifySearchResult } from '../store/SpotifyProvider';

interface FloatingSpotifyWidgetProps {
  hideButton?: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}

const FloatingSpotifyWidget: React.FC<FloatingSpotifyWidgetProps> = ({ hideButton, forceOpen, onClose }) => {
  const { token, isConnected, currentTrack, login, pause, resume, skipNext, skipPrev, searchSpotify, playTrack, playPlaylist, volume, setVolume } = useSpotify();
  const [isExpanded, setIsExpanded] = useState(false);
  const effectiveExpanded = forceOpen !== undefined ? forceOpen : isExpanded;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Don't render if not connected to Spotify
  if (!token) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchSpotify(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleCopyTrackName = () => {
    if (!currentTrack) return;
    navigator.clipboard.writeText(`${currentTrack.name} - ${currentTrack.artist}`);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handlePlayResult = async (item: SpotifySearchResult) => {
    if (item.type === 'track') {
      await playTrack(item.uri);
    } else {
      await playPlaylist(item.uri);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className={hideButton ? "" : "fixed bottom-[104px] md:bottom-6 right-4 md:right-6 z-[95] flex flex-col items-end gap-2"}>
      {/* Expanded Panel */}
      {effectiveExpanded && (
        <div className="w-[340px] max-h-[480px] overflow-hidden rounded-3xl border border-[var(--glass-border)] shadow-2xl animate-scale-in origin-bottom-right"
             style={{ background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(24px)' }}>
          
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#1DB954] animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]">
                {isConnected ? 'Spotify Online' : 'Connecting...'}
              </span>
            </div>
            <button onClick={() => onClose ? onClose() : setIsExpanded(false)} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Current Track */}
          {currentTrack && (
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                {currentTrack.image && (
                  <img src={currentTrack.image} alt={currentTrack.name} className="w-14 h-14 rounded-xl object-cover shadow-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{currentTrack.name}</p>
                  <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
                  <p className="text-[10px] text-gray-600 truncate">{currentTrack.album}</p>
                </div>
                <button
                  onClick={handleCopyTrackName}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors relative group"
                  title="Copy track name"
                >
                  {showCopied ? (
                    <svg className="w-4 h-4 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  )}
                </button>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <button onClick={skipPrev} className="text-gray-400 hover:text-white transition-colors hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button
                  onClick={() => currentTrack.isPlaying ? pause() : resume()}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {currentTrack.isPlaying ? (
                    <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button onClick={skipNext} className="text-gray-400 hover:text-white transition-colors hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="mt-6 flex items-center gap-3 px-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full relative group cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute inset-y-0 left-0 bg-[#1DB954] rounded-full transition-all"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `${volume * 100}%`, marginLeft: '-6px' }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-500 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          )}

          {!currentTrack && isConnected && (
            <div className="p-6 text-center border-b border-white/5">
              <p className="text-xs text-gray-500">No track playing. Search for a song below!</p>
            </div>
          )}

          {/* Search Section */}
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search songs or playlists..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#1DB954] transition-colors placeholder-gray-600"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-[#1DB954] text-black p-2.5 rounded-xl hover:bg-[#1ed760] transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePlayResult(item)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-sm">🎵</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{item.artist} • {item.type}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!hideButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 shadow-xl hover:border-[#1DB954]/50 transition-all hover:scale-105 active:scale-95"
          style={{ background: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(16px)' }}
        >
          {/* Spotify Icon */}
          <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>

          {/* Track info mini */}
          {currentTrack ? (
            <div className="hidden md:flex items-center gap-2 max-w-[180px]">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{currentTrack.name}</p>
                <p className="text-[9px] text-gray-500 truncate">{currentTrack.artist}</p>
              </div>
              {currentTrack.isPlaying && (
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[3px] bg-[#1DB954] rounded-full animate-bounce" style={{ height: '40%', animationDelay: '0s' }} />
                  <span className="w-[3px] bg-[#1DB954] rounded-full animate-bounce" style={{ height: '70%', animationDelay: '0.15s' }} />
                  <span className="w-[3px] bg-[#1DB954] rounded-full animate-bounce" style={{ height: '50%', animationDelay: '0.3s' }} />
                </div>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-gray-400 font-bold hidden md:inline">Spotify</span>
          )}

          {/* Arrow */}
          <svg className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default FloatingSpotifyWidget;
