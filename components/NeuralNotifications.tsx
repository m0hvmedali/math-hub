import React, { useState, useEffect } from 'react';
import notificationsData from '../utils/notifications.json';
import { Sparkles } from 'lucide-react';

const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const NeuralNotifications: React.FC = () => {
    const [shuffledNotifications, setShuffledNotifications] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        setShuffledNotifications(shuffleArray(notificationsData));
    }, []);

    useEffect(() => {
        if (shuffledNotifications.length === 0) return;

        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentIndex((prev) => {
                    const next = prev + 1;
                    if (next >= shuffledNotifications.length) {
                        setShuffledNotifications(shuffleArray(notificationsData));
                        return 0;
                    }
                    return next;
                });
                setFade(true);
            }, 1000); // Wait for fade out
        }, 15000);

        return () => clearInterval(interval);
    }, [shuffledNotifications]);

    if (shuffledNotifications.length === 0) return null;

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 py-5 px-8 rounded-[2rem] overflow-hidden relative group shadow-2xl animate-cinematic">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                <div className="flex-shrink-0 p-2 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 animate-pulse-glow shadow-[0_0_15px_rgba(0,210,255,0.3)]">
                    <Sparkles className="w-5 h-5 text-brand-cyan" />
                </div>
                
                <div className={`transition-all duration-1000 ease-in-out flex-1 text-center ${fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}>
                    <p className="text-sm md:text-base font-black tracking-wide text-white/90 font-arabic leading-relaxed drop-shadow-sm">
                        {shuffledNotifications[currentIndex]}
                    </p>
                </div>

                <div className="flex-shrink-0 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] font-mono ordinal hidden lg:block bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {String(currentIndex + 1).padStart(3, '0')} <span className="text-white/10">/</span> {shuffledNotifications.length}
                </div>
            </div>
            
            {/* Cinematic Progress Layer */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-cyan/20 via-brand-cyan to-brand-cyan/20 w-full origin-left animate-notification-progress" 
                     style={{ animationDuration: '15s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }} />
            </div>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/0 via-brand-cyan/5 to-brand-cyan/0 opacity-50 pointer-events-none" />
        </div>
    );
};

export default NeuralNotifications;
