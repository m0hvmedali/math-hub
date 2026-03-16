import React, { useEffect, useState } from 'react';
import WisdomCard from './WisdomCard';
import { WisdomItem, WisdomProgress } from '../hooks/useWisdom';
import { XIcon } from './Icons';

interface WisdomOverlayProps {
  item: WisdomItem | null;
  progress: WisdomProgress | null;
  onUpdate: (action: 'understand' | 'repeat' | 'favorite') => Promise<void>;
  onClose: () => void;
  duration?: number; // Duration in seconds
}

const WisdomOverlay: React.FC<WisdomOverlayProps> = ({ 
  item, 
  progress, 
  onUpdate, 
  onClose,
  duration = 20 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setIsVisible(true);
      setTimeLeft(duration);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [item, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 700); // Wait for fade-out animation
  };

  if (!item) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 transition-all duration-1000 backdrop-blur-3xl ${isVisible ? 'bg-black/80 opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-ott-gradient opacity-10 animate-slow-spin blur-[150px]" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-brand-cyan opacity-5 blur-[120px] rounded-full animate-premium-pulse" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-brand-purple opacity-5 blur-[120px] rounded-full animate-premium-pulse delay-1000" />
      </div>

      {/* Close Button & Timer Progress */}
      <div className="absolute top-12 right-12 flex items-center gap-6 z-10">
        <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90">
                <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                />
                <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="var(--brand-cyan)"
                    strokeWidth="3"
                    strokeDasharray="150"
                    strokeDashoffset={150 - (150 * timeLeft / duration)}
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>
            <span className="absolute text-[10px] font-black text-brand-cyan">{timeLeft}s</span>
        </div>
        
        <button 
          onClick={handleClose}
          className="p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-gray-400 hover:text-white transition-all group"
        >
          <XIcon className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Main Content */}
      <div className={`relative w-full transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <WisdomCard 
          item={item}
          progress={progress}
          onUpdate={onUpdate}
          variant="overlay"
        />
      </div>

      {/* Hint */}
      <div className={`absolute bottom-12 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        Reflecting on Universal Intelligence
      </div>
    </div>
  );
};

export default WisdomOverlay;
