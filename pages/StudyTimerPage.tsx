import React, { useContext } from 'react';
import { AppContext } from '../App';
import PomodoroTimer from '../components/PomodoroTimer';
import SpotifyPlayer from '../components/SpotifyPlayer';
import { useTimer } from '../store/TimerProvider';
import { SparkleIcon } from '../components/Icons';

const StudyTimerPage: React.FC = () => {
  const { language } = useContext(AppContext);
  const { phase } = useTimer();
  const [isDeepFocus, setIsDeepFocus] = React.useState(false);

  // Auto-enable Deep Focus during study
  React.useEffect(() => {
    if (phase === 'study') {
        const timer = setTimeout(() => setIsDeepFocus(true), 3000); // Activate after 3s of study
        return () => clearTimeout(timer);
    } else {
        setIsDeepFocus(false);
    }
  }, [phase]);

  return (
    <div className={`p-6 md:px-16 md:py-12 max-w-[1400px] mx-auto min-h-screen transition-all duration-1000 ${isDeepFocus ? 'bg-black opacity-90' : 'animate-premium-fade'}`}>
      
      {/* Exit Deep Focus Overlay */}
      {isDeepFocus && (
          <div 
            className="fixed inset-0 z-[100] cursor-pointer"
            onClick={() => setIsDeepFocus(false)}
            onMouseMove={() => setIsDeepFocus(false)} // Wake up on mouse move
          />
      )}

      {/* Header */}
      <header className={`mb-12 relative transition-opacity duration-700 ${isDeepFocus ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[var(--primary-color)] opacity-10 blur-[1200px] rounded-full -z-10" />
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)] flex items-center justify-center shadow-glow">
            <SparkleIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-black tracking-[0.4em] text-[var(--secondary-color)] uppercase">
            Chronos Intelligence v5.0
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
          {language === 'ar' ? 'مختبر التركيز ' : 'Focus Laboratory'}<span className="text-[var(--primary-color)]">.</span>
        </h1>
        <p className="text-gray-500 font-bold max-w-xl mt-4">
          {language === 'ar' 
            ? 'نظام متطور للمذاكرة العميقة. 50 دقيقة تركيز تام و10 دقائق لتجديد طاقتك بألوان متغيرة موسيقى ذكية.' 
            : 'Advanced deep study system. 50 minutes of absolute focus and 10 minutes to recharge with dynamic themes and smart audio.'}
        </p>
      </header>

      {/* Main Timer Display */}
      <div className="glass-card p-8 md:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--secondary-color)] opacity-5 blur-[100px] rounded-full" />
        <PomodoroTimer />
      </div>

      <div className={`mt-8 flex justify-center transition-opacity duration-700 ${isDeepFocus ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <SpotifyPlayer currentPhase={phase} />
      </div>

      {/* Features Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 transition-all duration-700 ${isDeepFocus ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary-color)]">Real-time Sync</h3>
          <p className="text-sm text-gray-500 font-medium">Session state is preserved across devices and browser restarts.</p>
        </div>
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--secondary-color)]">Dynamic Atmosphere</h3>
          <p className="text-sm text-gray-500 font-medium">Colors and themes shift automatically to optimize your cognitive state.</p>
        </div>
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--accent-color)]">Deep Focus</h3>
          <p className="text-sm text-gray-500 font-medium">Minimal interface during work phases to eliminate distractions.</p>
        </div>
      </div>
    </div>
  );
};

export default StudyTimerPage;
