/**
 * YouTubeBrowserModal - Full YouTube browser in a modal window
 * Shows user's playlists, channel, and allows searching with an internal player.
 */
import React, { useState, useEffect } from 'react';
import { useGoogleOmni } from '../services/platform-sdk';

interface YouTubeBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const YouTubeBrowserModal: React.FC<YouTubeBrowserModalProps> = ({ isOpen, onClose }) => {
  const { youtube, auth } = useGoogleOmni();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'playlists'>('home');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && auth.getToken()) {
      loadHome();
    }
  }, [isOpen]);

  const loadHome = async () => {
    setIsLoading(true);
    try {
      const [playlistRes, videoRes] = await Promise.all([
        youtube.getPlaylists().catch(() => ({ items: [] })),
        youtube.searchMyVideos('').catch(() => ({ items: [] })),
      ]);
      setPlaylists(playlistRes.items || []);
      setVideos(videoRes.items || []);
    } catch {
      setPlaylists([]); setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const res = await youtube.searchMyVideos(searchQuery);
      setVideos(res.items || []);
      setActiveTab('search');
    } catch {
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getVideoId = (item: any): string | null => {
    return item?.id?.videoId || item?.snippet?.resourceId?.videoId || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl h-[85vh] bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-[#111] shrink-0">
          <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="currentColor">
              <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg flex-1">YouTube</h2>
          <div className="flex gap-1 mr-4">
            {(['home', 'playlists'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${activeTab === tab ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:text-white'}`}
              >
                {tab === 'home' ? 'Videos' : 'Playlists'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2 px-5 py-3 border-b border-white/5 shrink-0">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search your YouTube channel..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
          <button onClick={handleSearch} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-sm transition-all">
            Search
          </button>
          <button
            onClick={() => window.open('https://youtube.com', '_blank')}
            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-sm transition-all"
            title="Open YouTube in new tab"
          >
            Open ↗
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left: Video/Playlist List */}
          <div className="w-full md:w-80 border-r border-white/5 overflow-y-auto shrink-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading...</div>
            ) : activeTab === 'playlists' ? (
              <div className="divide-y divide-white/5">
                {playlists.length === 0 && <p className="p-5 text-gray-600 text-sm text-center">No playlists found</p>}
                {playlists.map(pl => (
                  <div key={pl.id} className="flex gap-3 p-3 hover:bg-white/5 transition-all cursor-pointer" onClick={() => window.open(`https://youtube.com/playlist?list=${pl.id}`, '_blank')}>
                    <img src={pl.snippet?.thumbnails?.default?.url} className="w-12 h-9 object-cover rounded-lg bg-white/10 shrink-0" alt="" />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{pl.snippet?.title}</p>
                      <p className="text-xs text-gray-600">{pl.contentDetails?.itemCount} videos</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {videos.length === 0 && <p className="p-5 text-gray-600 text-sm text-center">No videos found</p>}
                {videos.map(item => {
                  const vid = getVideoId(item);
                  return (
                    <div
                      key={item.id?.videoId || item.id}
                      onClick={() => vid && setSelectedVideoId(vid)}
                      className={`flex gap-3 p-3 hover:bg-white/5 transition-all cursor-pointer ${selectedVideoId === vid ? 'bg-white/[0.08] border-l-2 border-red-500' : ''}`}
                    >
                      <img src={item.snippet?.thumbnails?.default?.url} className="w-16 h-12 object-cover rounded-lg bg-white/10 shrink-0" alt="" />
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium line-clamp-2 leading-snug">{item.snippet?.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(item.snippet?.publishedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Player */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedVideoId ? (
              <div className="flex-1 flex flex-col">
                <div className="aspect-video bg-black shrink-0">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="YouTube Player"
                  />
                </div>
                <div className="flex gap-3 p-4 border-t border-white/5">
                  <button
                    onClick={() => window.open(`https://youtube.com/watch?v=${selectedVideoId}`, '_blank')}
                    className="text-xs text-gray-400 hover:text-white transition-all flex items-center gap-1"
                  >
                    Open in YouTube ↗
                  </button>
                  <button onClick={() => setSelectedVideoId(null)} className="text-xs text-gray-600 hover:text-gray-400 transition-all ml-auto">
                    Close player
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
                <svg viewBox="0 0 24 24" className="w-16 h-16 opacity-20" fill="currentColor">
                  <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>
                </svg>
                <p className="text-sm">Select a video to play</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeBrowserModal;
