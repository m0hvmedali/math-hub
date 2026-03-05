import React, { useMemo } from 'react';
import { useCosmicStore } from '../store/useCosmicStore';

const IslandOdyssey: React.FC = () => {
    const { shipProgress } = useCosmicStore();

    return (
        <div className="relative w-full h-12 bg-black/20 backdrop-blur-md rounded-full border border-white/5 overflow-hidden flex items-center px-4">
            {/* Waves Decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none">
                    <path d="M0 50 Q 250 20 500 50 T 1000 50 V 100 H 0 Z" fill="currentColor" className="text-accent-blue">
                        <animate attributeName="d" values="M0 50 Q 250 20 500 50 T 1000 50 V 100 H 0 Z; M0 50 Q 250 80 500 50 T 1000 50 V 100 H 0 Z; M0 50 Q 250 20 500 50 T 1000 50 V 100 H 0 Z" dur="5s" repeatCount="indefinite" />
                    </path>
                </svg>
            </div>

            {/* Path Path */}
            <div className="flex-1 h-0.5 bg-white/5 mx-6 relative">
                {/* The Goal Island */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">🏝️</div>
                    <span className="text-[8px] font-bold text-accent-green uppercase tracking-tighter absolute -bottom-3">Goal</span>
                </div>

                {/* The Ship */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                    style={{ left: `${shipProgress}%`, transform: `translate(-50%, -50%) ${shipProgress === 100 ? 'rotate(5deg)' : ''}` }}
                >
                    <div className="relative">
                        {/* Ship Icon */}
                        <div className="text-2xl filter drop-shadow-[0_0_12px_rgba(96,165,250,0.4)] animate-bounce-slow">
                            {shipProgress >= 100 ? '🎉' : '⛵'}
                        </div>

                        {/* Wake Effect */}
                        {shipProgress > 0 && shipProgress < 100 && (
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex gap-1">
                                <div className="w-1 h-1 bg-white/20 rounded-full animate-ping"></div>
                                <div className="w-0.5 h-0.5 bg-white/10 rounded-full animate-ping animation-delay-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Percentage Label */}
            <div className="ml-2 flex flex-col items-end">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{shipProgress}%</span>
                <span className="text-[7px] font-bold text-accent-blue uppercase tracking-tighter">Nautical Miles</span>
            </div>
        </div>
    );
};

export default IslandOdyssey;
