import React, { useState, useEffect } from 'react';
import notifications from '../utils/notifications.json';
import { Sparkles } from 'lucide-react';

const NeuralNotifications: React.FC = () => {
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % notifications.length);
                setFade(true);
            }, 1000); // Wait for fade out
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full bg-black/40 backdrop-blur-md border-b border-white/5 py-3 px-6 overflow-hidden relative group">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 animate-pulse-glow">
                    <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                </div>
                
                <div className={`transition-all duration-1000 ease-in-out flex-1 text-center ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    <p className="text-[11px] md:text-xs font-black tracking-widest text-white/60 uppercase font-arabic leading-relaxed">
                        {notifications[index]}
                    </p>
                </div>

                <div className="flex-shrink-0 text-[8px] font-black text-white/20 uppercase tracking-[0.3em] font-mono ordinal hidden md:block">
                    {String(index + 1).padStart(2, '0')} / {notifications.length}
                </div>
            </div>
            
            {/* Animated Progress Bar */}
            <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent w-full origin-left animate-notification-progress" 
                 style={{ animationDuration: '15s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }} />
        </div>
    );
};

export default NeuralNotifications;
