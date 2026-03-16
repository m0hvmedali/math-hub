import React, { useState } from 'react';
import { useTimer } from '../store/TimerProvider';
import { PlayIcon, PauseIcon, RefreshIcon, SparkleIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const PomodoroTimer: React.FC = () => {
  const { 
    phase, 
    remainingSeconds, 
    totalSeconds, 
    startStudy, 
    startBreak, 
    pauseTimer, 
    resumeTimer, 
    stopTimer 
  } = useTimer();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12">
      {/* Timer Circle */}
      <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="var(--surface-color)"
            strokeWidth="8"
            className="opacity-20"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="var(--primary-color)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 1000" }}
            animate={{ strokeDasharray: `${(progress / 100) * 2 * Math.PI * 48}% 1000` }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          />
        </svg>

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-[var(--primary-glow)] rounded-full blur-[60px] opacity-30 animate-pulse" />

        <div className="relative z-10 text-center space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs font-black tracking-[0.4em] uppercase text-[var(--secondary-color)]"
            >
              {phase === 'study' ? 'Deep Study' : phase === 'break' ? 'Rejuvenation' : 'Standby'}
            </motion.div>
          </AnimatePresence>
          <div className="text-7xl md:text-8xl font-black tabular-nums tracking-tighter text-white font-outfit">
            {formatTime(remainingSeconds)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        {phase === 'idle' ? (
          <button
            onClick={startStudy}
            className="group flex flex-col items-center gap-3 transition-transform hover:scale-110 active:scale-95"
          >
            <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
              <PlayIcon className="w-8 h-8 ml-1" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Start Mission</span>
          </button>
        ) : (
          <>
            <button
              onClick={phase === 'paused' ? resumeTimer : pauseTimer}
              className="group flex flex-col items-center gap-3 transition-transform hover:scale-110 active:scale-95"
            >
              <div className="w-20 h-20 rounded-full bg-[var(--surface-color)] border border-white/10 text-white flex items-center justify-center shadow-xl">
                {phase === 'paused' ? <PlayIcon className="w-8 h-8 ml-1" /> : <PauseIcon className="w-8 h-8" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {phase === 'paused' ? 'Resume' : 'Pause'}
              </span>
            </button>

            <button
              onClick={stopTimer}
              className="group flex flex-col items-center gap-3 transition-transform hover:scale-110 active:scale-95"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-xl">
                <RefreshIcon className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500/50">Reset</span>
            </button>
          </>
        )}
      </div>

      {/* Quick Phase Selection */}
      <div className="flex gap-4">
        <button 
          onClick={startStudy}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${phase === 'study' ? 'bg-[var(--primary-color)] text-white shadow-glow' : 'bg-[var(--surface-color)] text-gray-500 border border-white/5'}`}
        >
          Study (50m)
        </button>
        <button 
          onClick={startBreak}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${phase === 'break' ? 'bg-[var(--secondary-color)] text-white shadow-glow' : 'bg-[var(--surface-color)] text-gray-500 border border-white/5'}`}
        >
          Break (10m)
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
