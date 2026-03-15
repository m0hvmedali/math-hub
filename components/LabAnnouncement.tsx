import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, X, ArrowRight } from 'lucide-react';

const LabAnnouncement: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Show after a short delay
        const showTimeout = setTimeout(() => {
            setIsVisible(true);
        }, 1000);

        // Auto-hide after 5 seconds of being visible
        const hideTimeout = setTimeout(() => {
            setIsVisible(false);
        }, 7000); // 1s delay + 5s display + 1s buffer

        return () => {
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-up">
            <div className="bg-black/60 backdrop-blur-2xl border border-brand-cyan/30 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm group relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/10 to-transparent opacity-50" />
                
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-brand-cyan/20 rounded-2xl border border-brand-cyan/30 text-brand-cyan animate-pulse-glow">
                            <Beaker className="w-6 h-6" />
                        </div>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                        Explore Labs
                    </h3>
                    
                    <p className="text-sm text-white/60 font-arabic leading-relaxed mb-6">
                        اكتشف تجارب المعامل التفاعلية والذكية المتطورة في قسم المختبرات الجديد.
                    </p>

                    <button
                        onClick={() => {
                            navigate('/labs');
                            setIsVisible(false);
                        }}
                        className="w-full py-3 bg-brand-cyan text-black font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span>دخول المختبرات</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress Bar (5s Timer) */}
                <div className="absolute bottom-0 left-0 h-1 bg-brand-cyan/40 w-full origin-left animate-progress-shrink" />
            </div>
        </div>
    );
};

export default LabAnnouncement;
