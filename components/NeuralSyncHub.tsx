import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useSpotify } from '../store/SpotifyProvider';
import { Globe, Music, Link as LinkIcon, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

const NeuralSyncHub: React.FC = () => {
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const { isConnected: isSpotifyConnected, login: spotifyLogin } = useSpotify();

    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsGoogleConnected(!!session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsGoogleConnected(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const googleLogin = async () => {
        if (!supabase) return;
        try {
            const redirectTo = new URL('/dashboard', window.location.origin).href;
            console.log('[Auth] Attempting Google sync with redirect:', redirectTo);
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { 
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                }
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('[Auth] Google Sync Error:', err.message);
        }
    };

    if (isGoogleConnected && isSpotifyConnected) return null;

    return (
        <section className="mb-12">
            <div className="p-1 px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full inline-flex items-center gap-2 mb-4">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan">Neural Sync Priority</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {!isGoogleConnected && (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onClick={googleLogin}
                            className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 group-hover:scale-110 transition-transform">
                                    <Globe className="w-6 h-6 text-brand-cyan" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">Google Cloud Sync</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Connect to enable persistent backups</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
                        </motion.button>
                    )}

                    {!isSpotifyConnected && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={spotifyLogin}
                            className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-all group relative overflow-hidden"
                        >
                             <div className="absolute inset-0 bg-gradient-to-r from-accent-green/5 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-accent-green/10 rounded-2xl border border-accent-green/20 group-hover:scale-110 transition-transform">
                                    <Music className="w-6 h-6 text-accent-green" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">Spotify Harmony</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Link account for focused audio</p>
                                </div>
                            </div>
                             <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-accent-green group-hover:translate-x-1 transition-all" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default NeuralSyncHub;
