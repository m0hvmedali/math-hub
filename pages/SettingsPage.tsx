import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useGoogleOmni } from '../services/platform-sdk';
import { useSpotify } from '../store/SpotifyProvider';
import { SparkleIcon, GlobeIcon, LinkIcon, VideoIcon } from '../components/Icons';

const SettingsPage: React.FC = () => {
  const { auth, tasks: googleTasks, youtube } = useGoogleOmni();
  const { isConnected: isSpotifyConnected, login: loginSpotify, token: spotifyToken } = useSpotify();
  
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const googleToken = auth.getToken();

  const handleTestGoogle = async () => {
    setTestStatus(prev => ({ ...prev, google: 'loading' }));
    try {
      // Test by fetching task lists (lightweight)
      await googleTasks.getTaskLists();
      setTestStatus(prev => ({ ...prev, google: 'success' }));
      setTimeout(() => setTestStatus(prev => ({ ...prev, google: 'idle' })), 3000);
    } catch (err) {
      console.error("Google Test Failed:", err);
      setTestStatus(prev => ({ ...prev, google: 'error' }));
    }
  };

  const handleTestSpotify = async () => {
    setTestStatus(prev => ({ ...prev, spotify: 'loading' }));
    try {
      const resp = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      if (resp.ok) {
        setTestStatus(prev => ({ ...prev, spotify: 'success' }));
      } else {
        throw new Error("Spotify API returned error");
      }
      setTimeout(() => setTestStatus(prev => ({ ...prev, spotify: 'idle' })), 3000);
    } catch (err) {
      setTestStatus(prev => ({ ...prev, spotify: 'error' }));
    }
  };

  const handleTestSupabase = async () => {
    setTestStatus(prev => ({ ...prev, supabase: 'loading' }));
    try {
      const { error } = await supabase.from('subjects').select('count', { count: 'exact', head: true });
      if (error) throw error;
      setTestStatus(prev => ({ ...prev, supabase: 'success' }));
      setTimeout(() => setTestStatus(prev => ({ ...prev, supabase: 'idle' })), 3000);
    } catch (err) {
      setTestStatus(prev => ({ ...prev, supabase: 'error' }));
    }
  };

  const handleClearData = async () => {
    if (!supabase) {
      alert("Supabase is not configured. Cannot clear data.");
      return;
    }
    if (window.confirm('Are you absolutely sure? This will delete all branches, lessons, and timeline items from the database. This action cannot be undone.')) {
      try {
        // We use neq (not equal) to a dummy value to delete all rows.
        const { error: branchError } = await supabase.from('branches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (branchError) throw branchError;

        const { error: timelineError } = await supabase.from('timeline_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (timelineError) throw timelineError;
        
        alert('All data has been cleared successfully.');
        window.location.href = '/'; // Navigate to home to reload app state
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear all data. Please check the console for errors.');
      }
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-white mb-8">Settings</h1>
      
      <div className="space-y-6 max-w-2xl">
        <div className="bg-gray-800/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">Data Management</h2>
            <p className="text-gray-400 mb-4">
                All your data is stored in a secure, cloud-based database. Clearing the data will permanently remove all your content.
            </p>
            <button
                onClick={handleClearData}
                className="bg-red-600/20 text-red-500 border border-red-600/30 px-4 py-2 rounded-xl hover:bg-red-600/30 font-bold transition-all"
            >
                Clear All Data
            </button>
        </div>

        {/* Integrations Manager */}
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <SparkleIcon className="w-5 h-5 text-brand-cyan" />
                Integrations Manager
            </h2>
            
            <div className="space-y-4">
                {/* Google Workspace */}
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <GlobeIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Google Workspace</p>
                            <p className="text-xs text-gray-500">Tasks, Drive, YouTube, AI</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {googleToken ? (
                            <>
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider mr-2">Connected</span>
                                <button onClick={handleTestGoogle} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${testStatus.google === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-500' : testStatus.google === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                                    {testStatus.google === 'loading' ? 'Testing...' : testStatus.google === 'success' ? 'Healthy' : 'Test Health'}
                                </button>
                                <button onClick={() => { auth.logout(); window.location.reload(); }} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5">Disconnect</button>
                            </>
                        ) : (
                            <button onClick={() => auth.login().then(() => window.location.reload())} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-600/20">Connect Google</button>
                        )}
                    </div>
                </div>

                {/* Spotify */}
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                            <VideoIcon className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Spotify Music</p>
                            <p className="text-xs text-gray-500">Focus Playlists & Player</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {spotifyToken ? (
                            <>
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider mr-2">Connected</span>
                                <button onClick={handleTestSpotify} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${testStatus.spotify === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-500' : testStatus.spotify === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                                    {testStatus.spotify === 'loading' ? 'Testing...' : testStatus.spotify === 'success' ? 'Healthy' : 'Test Health'}
                                </button>
                                <button onClick={() => { localStorage.removeItem('spotify_token'); localStorage.removeItem('spotify_refresh_token'); window.location.reload(); }} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5">Disconnect</button>
                            </>
                        ) : (
                            <button onClick={loginSpotify} className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-500 shadow-lg shadow-green-600/20">Connect Spotify</button>
                        )}
                    </div>
                </div>

                {/* Supabase */}
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <LinkIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Supabase Sync</p>
                            <p className="text-xs text-gray-500">Cloud Database Status</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSupabaseConfigured ? (
                            <>
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider mr-2">Active</span>
                                <button onClick={handleTestSupabase} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${testStatus.supabase === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-500' : testStatus.supabase === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                                    {testStatus.supabase === 'loading' ? 'Pinging...' : testStatus.supabase === 'success' ? 'Online' : 'Check Sync'}
                                </button>
                            </>
                        ) : (
                            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Not Configured</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
         <div className="bg-gray-800/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">About</h2>
            <p className="text-gray-400">
                Math Study Hub v2.0. A personal, cloud-synced space for organizing your mathematical journey.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;