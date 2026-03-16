import React, { useState, useEffect } from 'react';
import { WisdomItem } from '../hooks/useWisdom';
import { SparkleIcon, XIcon } from './Icons';

interface FloatingWisdomProps {
  item: WisdomItem;
  onClose: () => void;
  duration?: number;
}

const FloatingWisdom: React.FC<FloatingWisdomProps> = ({ item, onClose, duration = 8000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed bottom-24 right-8 z-[100] transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
      <div className="relative group">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-brand-cyan/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
        
        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl max-w-sm relative z-10 overflow-hidden ring-1 ring-brand-cyan/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan"></div>
          
          <div className="flex items-start gap-4">
            <div className="p-2 bg-brand-cyan/10 rounded-xl mt-1">
              <SparkleIcon className="w-5 h-5 text-brand-cyan" />
            </div>
            
            <div className="flex-1 text-right" dir="rtl">
              <p className="text-sm font-black text-white leading-relaxed mb-3">
                "{item.text}"
              </p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                — {item.author || item.source}
              </p>
            </div>
            
            <button onClick={() => setIsVisible(false)} className="text-gray-600 hover:text-white transition-colors p-1">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-[1px] bg-brand-cyan/50 animate-progress-shrink" style={{ width: '100%', animationDuration: `${duration}ms` }}></div>
        </div>
      </div>
    </div>
  );
};

export default FloatingWisdom;
