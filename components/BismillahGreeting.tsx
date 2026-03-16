import React, { useEffect, useState } from 'react';

interface BismillahGreetingProps {
  onComplete: () => void;
  language: 'ar' | 'en';
}

const BismillahGreeting: React.FC<BismillahGreetingProps> = ({ onComplete, language }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="text-center space-y-8 animate-smooth-float">
        <div className="w-32 h-32 mx-auto relative">
           <div className="absolute inset-0 bg-brand-cyan/20 blur-3xl rounded-full animate-pulse"></div>
           <svg className="w-full h-full text-brand-cyan relative z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M50 20 L50 80 M20 50 L80 50" strokeLinecap="round" className="animate-draw-path" />
              <circle cx="50" cy="50" r="40" strokeOpacity="0.2" />
           </svg>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-widest animate-fade-in-up">
            {language === 'ar' ? 'بِسْمِ اللَّهِ نَبْدَأُ' : 'IN GOD\'S NAME WE BEGIN'}
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.5em] text-sm animate-fade-in-up [animation-delay:500ms]">
            Initiating Focus Nexus
          </p>
        </div>
        
        <div className="flex justify-center gap-1">
          {[1,2,3].map(i => (
            <div key={i} className={`w-2 h-2 rounded-full bg-brand-cyan animate-pulse [animation-delay:${i*200}ms]`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BismillahGreeting;
