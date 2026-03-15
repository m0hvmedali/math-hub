import React, { useState, useEffect, useCallback } from 'react';
import notificationsData from '../utils/notifications.json';
import { Sparkles, Copy, Check } from 'lucide-react';

// Flatten the categorized data for the shuffle engine
const allNotifications = Object.values(notificationsData).flat() as string[];

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
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setShuffledNotifications(shuffleArray(allNotifications));
    }, []);

    const handleNext = useCallback(() => {
        setFade(false);
        setTimeout(() => {
            setCurrentIndex((prev) => {
                const next = prev + 1;
                if (next >= shuffledNotifications.length) {
                    setShuffledNotifications(shuffleArray(allNotifications));
                    return 0;
                }
                return next;
            });
            setFade(true);
        }, 1000);
    }, [shuffledNotifications]);

    useEffect(() => {
        if (shuffledNotifications.length === 0) return;
        const interval = setInterval(handleNext, 15000);
        return () => clearInterval(interval);
    }, [shuffledNotifications, handleNext]);

    const copyToClipboard = async () => {
        const textToCopy = shuffledNotifications[currentIndex];
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (shuffledNotifications.length === 0) return null;

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 py-5 px-8 rounded-[2rem] overflow-hidden relative group shadow-2xl animate-cinematic">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                <div className="flex-shrink-0 p-2 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 animate-pulse-glow shadow-[0_0_15px_rgba(0,210,255,0.3)]">
                    <Sparkles className="w-5 h-5 text-brand-cyan" />
                </div>
                
                <div 
                    onClick={copyToClipboard}
                    className={`transition-all duration-1000 ease-in-out flex-1 text-center cursor-pointer hover:scale-[1.01] active:scale-95 relative group/text ${fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}
                    title="اضغط للنسخ"
                >
                    <p className="text-sm md:text-base font-black tracking-wide text-white/90 font-arabic leading-relaxed drop-shadow-sm px-4">
                        {shuffledNotifications[currentIndex]}
                    </p>
                    
                    {/* Floating Copy Feedback */}
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 transition-all duration-300 flex items-center gap-2 bg-brand-cyan text-black px-3 py-1 rounded-full text-[10px] font-bold shadow-lg ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                        <Check className="w-3 h-3" />
                        تم النسخ!
                    </div>

                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover/text:opacity-40 transition-opacity">
                       <Copy className="w-4 h-4 text-white" />
                    </div>
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
