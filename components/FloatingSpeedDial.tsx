import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XIcon, SparkleIcon, GoogleIcon, CommandIcon } from './Icons';
import FloatingAIAssistant from './FloatingAIAssistant';
import FloatingSpotifyWidget from './FloatingSpotifyWidget';
import FloatingQuickNote from './FloatingQuickNote';
import GoogleServicesFAB from './GoogleServicesFAB';

const FloatingSpeedDial: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTool, setActiveTool] = useState<'AI' | 'SPOTIFY' | 'NOTE' | 'GOOGLE' | null>(null);

    const tools = [
        { id: 'AI', icon: <SparkleIcon className="w-5 h-5" />, color: 'from-purple-500 to-indigo-600', label: 'AI Assistant' },
        { id: 'SPOTIFY', icon: <span>🎵</span>, color: 'from-green-500 to-emerald-600', label: 'Spotify' },
        { id: 'NOTE', icon: <span>📝</span>, color: 'from-amber-400 to-orange-500', label: 'Quick Note' },
        { id: 'GOOGLE', icon: <GoogleIcon className="w-5 h-5" />, color: 'from-blue-500 to-blue-700', label: 'Google Services' },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-4">
            {/* Tool Panels */}
            <FloatingAIAssistant 
                hideButton 
                forceOpen={activeTool === 'AI'} 
                onClose={() => setActiveTool(null)} 
            />
            <FloatingSpotifyWidget 
                hideButton 
                forceOpen={activeTool === 'SPOTIFY'} 
                onClose={() => setActiveTool(null)} 
            />
            <FloatingQuickNote 
                hideButton 
                forceOpen={activeTool === 'NOTE'} 
                onClose={() => setActiveTool(null)} 
            />
            <GoogleServicesFAB 
                hideButton 
                forceOpen={activeTool === 'GOOGLE'} 
                onClose={() => setActiveTool(null)}
                // Reusing props from App.tsx - will be passed down via context or similar if needed
                onOpenGmail={() => { window.location.href = '/gmail'; setActiveTool(null); }}
                onOpenCalendar={() => { /* This might need a trigger in App.tsx */ setActiveTool(null); }}
                onOpenTasks={() => { setActiveTool(null); }}
                onOpenDrive={() => { setActiveTool(null); }}
                onOpenYouTube={() => { setActiveTool(null); }}
            />

            {/* Speed Dial Menu */}
            <div className="relative flex flex-col items-end gap-3">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            className="flex flex-col items-end gap-3 mb-2"
                        >
                            {tools.map((tool, i) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-3 group"
                                >
                                    <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {tool.label}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setActiveTool(tool.id as any);
                                            setIsOpen(false);
                                        }}
                                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg border border-white/20 hover:scale-110 transition-transform active:scale-95`}
                                    >
                                        {tool.icon}
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Toggle Button */}
                <button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (activeTool) setActiveTool(null);
                    }}
                    className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 border relative overflow-hidden group ${
                        isOpen 
                        ? 'bg-white/10 border-white/20 rotate-45' 
                        : 'bg-black/80 backdrop-blur-xl border-white/10 hover:border-brand-purple/50'
                    }`}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity`} />
                    {isOpen ? (
                        <XIcon className="w-8 h-8 text-white relative z-10" />
                    ) : (
                        <div className="relative z-10 flex items-center justify-center">
                            <PlusIcon className="w-8 h-8 text-white transition-transform group-hover:rotate-90" />
                            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default FloatingSpeedDial;
