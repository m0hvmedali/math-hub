import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { PomodoroPhase, StudySession, TimerState } from '../types/pomodoro';
import { ThemeManager } from '../utils/ThemeManager';

interface TimerContextType extends TimerState {
  startStudy: () => Promise<void>;
  startBreak: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const STUDY_DURATION = 50 * 60; // 50 minutes
const BREAK_DURATION = 10 * 60; // 10 minutes

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TimerState>({
    remainingSeconds: STUDY_DURATION,
    totalSeconds: STUDY_DURATION,
    phase: 'idle',
    sessionId: null,
    startTime: null,
    targetEndTime: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with Database on Mount
  useEffect(() => {
    const syncWithDB = async () => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: activeSession } = await supabase
        .from('study_sessions')
        .select('*')
        .neq('current_phase', 'idle')
        .single();

      if (activeSession) {
        const now = Date.now();
        const targetEnd = new Date(activeSession.target_end_time).getTime();
        let remaining = Math.max(0, Math.floor((targetEnd - now) / 1000));

        if (activeSession.current_phase === 'paused') {
            const pausedAt = new Date(activeSession.paused_at).getTime();
            remaining = Math.max(0, Math.floor((targetEnd - pausedAt) / 1000));
        }

        setState({
          phase: activeSession.current_phase as PomodoroPhase,
          sessionId: activeSession.id,
          startTime: new Date(activeSession.session_start_time).getTime(),
          targetEndTime: targetEnd,
          remainingSeconds: remaining,
          totalSeconds: activeSession.current_phase === 'study' ? STUDY_DURATION : BREAK_DURATION,
        });

        if (activeSession.current_phase === 'study' || activeSession.current_phase === 'break') {
            ThemeManager.applyTheme(ThemeManager.generatePalette());
        }
      }
    };

    syncWithDB();
  }, []);

  // Tick Logic
  useEffect(() => {
    if ((state.phase === 'study' || state.phase === 'break') && state.remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.remainingSeconds <= 1) {
            clearInterval(timerRef.current!);
            handlePhaseEnd(prev.phase);
            return { ...prev, remainingSeconds: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase]);

  const handlePhaseEnd = async (currentPhase: PomodoroPhase) => {
    if (currentPhase === 'study') {
      alert("Study session complete! Time for a break.");
      new Notification("Break Time!", { body: "50 minutes done! Enjoy your 10-minute break." });
      await startBreak();
    } else if (currentPhase === 'break') {
      alert("Break complete! Back to study.");
      new Notification("Back to Work!", { body: "Break's over. Let's get focused." });
      await startStudy();
    }
  };

  const startStudy = async () => {
    const now = new Date();
    const targetEnd = new Date(now.getTime() + STUDY_DURATION * 1000);
    
    const { data, error } = await supabase!
      .from('study_sessions')
      .upsert({
        user_id: (await supabase!.auth.getUser()).data.user?.id,
        current_phase: 'study',
        session_start_time: now.toISOString(),
        target_end_time: targetEnd.toISOString(),
        accumulated_pause_ms: 0
      })
      .select()
      .single();

    if (!error) {
      setState({
        phase: 'study',
        sessionId: data.id,
        startTime: now.getTime(),
        targetEndTime: targetEnd.getTime(),
        remainingSeconds: STUDY_DURATION,
        totalSeconds: STUDY_DURATION,
      });
      // Pause Spotify if playing (will implement later)
    }
  };

  const startBreak = async () => {
    const now = new Date();
    const targetEnd = new Date(now.getTime() + BREAK_DURATION * 1000);
    
    // Generate new theme for break
    const newTheme = ThemeManager.generatePalette();
    ThemeManager.applyTheme(newTheme);

    const { data, error } = await supabase!
      .from('study_sessions')
      .update({
        current_phase: 'break',
        target_end_time: targetEnd.toISOString(),
      })
      .eq('id', state.sessionId)
      .select()
      .single();

    if (!error) {
      setState(prev => ({
        ...prev,
        phase: 'break',
        targetEndTime: targetEnd.getTime(),
        remainingSeconds: BREAK_DURATION,
        totalSeconds: BREAK_DURATION,
      }));
      // Play Spotify (will implement later)
    }
  };

  const pauseTimer = async () => {
    if (state.phase === 'break' || state.phase === 'study') {
        const now = new Date();
        await supabase!.from('study_sessions').update({
            current_phase: 'paused',
            paused_at: now.toISOString()
        }).eq('id', state.sessionId);

        setState(prev => ({ ...prev, phase: 'paused' }));
    }
  };

  const resumeTimer = async () => {
    if (state.phase === 'paused') {
        const { data: session } = await supabase!.from('study_sessions').select('*').eq('id', state.sessionId).single();
        const pausedAt = new Date(session.paused_at).getTime();
        const now = Date.now();
        const pauseDiff = now - pausedAt;
        
        const newTargetEnd = new Date(new Date(session.target_end_time).getTime() + pauseDiff);

        await supabase!.from('study_sessions').update({
            current_phase: session.target_end_time ? 'study' : 'break', // simplified
            target_end_time: newTargetEnd.toISOString(),
            paused_at: null,
            accumulated_pause_ms: (session.accumulated_pause_ms || 0) + pauseDiff
        }).eq('id', state.sessionId);

        setState(prev => ({
            ...prev,
            phase: prev.totalSeconds === STUDY_DURATION ? 'study' : 'break',
            targetEndTime: newTargetEnd.getTime(),
        }));
    }
  };

  const stopTimer = async () => {
    await supabase!.from('study_sessions').update({ current_phase: 'idle' }).eq('id', state.sessionId);
    setState({
        remainingSeconds: STUDY_DURATION,
        totalSeconds: STUDY_DURATION,
        phase: 'idle',
        sessionId: null,
        startTime: null,
        targetEndTime: null,
    });
  };

  return (
    <TimerContext.Provider value={{ ...state, startStudy, startBreak, pauseTimer, resumeTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
