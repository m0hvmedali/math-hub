import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, X } from 'lucide-react';
import { getPollinationsVideoUrl } from '../utils/pollinations';

interface CinematicPresentationProps {
    prompt: string;
    onComplete: () => void;
    overlayText?: string;
    duration?: number; // In ms
    canSkip?: boolean;
}

export const CinematicPresentation: React.FC<CinematicPresentationProps> = ({ 
    prompt, 
    onComplete, 
    overlayText, 
    duration = 5000,
    canSkip = true 
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const videoUrl = getPollinationsVideoUrl(prompt, 1280, 720);

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration + 1000); // Buffer for fade out

        return () => clearTimeout(timer);
    }, [onComplete, duration]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
        >
            {/* Background Video */}
            <div className="absolute inset-0 w-full h-full">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050510] gap-4">
                        <Loader2 className="w-12 h-12 text-brand-cyan animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500/50 animate-pulse">
                            Neural Synthesis in Progress
                        </span>
                    </div>
                )}
                <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-60'}`}
                    onLoadedData={() => setIsLoading(false)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 text-center px-10 space-y-6 max-w-4xl">
                <AnimatePresence>
                    {!isLoading && (
                        <>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 12 }}
                                className="w-20 h-20 mx-auto rounded-full bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center shadow-[0_0_50px_rgba(17,211,238,0.2)]"
                            >
                                <Sparkles className="w-10 h-10 text-brand-cyan" />
                            </motion.div>

                            <motion.h1 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight"
                            >
                                {overlayText || 'Initializing Simulation...'}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="h-1 w-64 mx-auto bg-white/10 rounded-full overflow-hidden"
                            >
                                <motion.div 
                                    className="h-full bg-brand-cyan"
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: duration / 1000 }}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Skip Button */}
            {canSkip && !isLoading && (
                <button 
                    onClick={onComplete}
                    className="absolute bottom-10 right-10 flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                    <X className="w-4 h-4" />
                    Skip Intro
                </button>
            )}
        </motion.div>
    );
};
