import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { PomodoroPhase, StudySession, TimerState } from '../types/pomodoro';
import { ThemeManager } from '../utils/ThemeManager';
import { useHubCore } from '../utils/HubCore';
import { updateStudyStats } from '../utils/statsManager';
import { useTasks } from './TasksProvider';

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
  const { activeTaskId, addNoteToTask } = useTasks();
  const [state, setState] = useState<TimerState>({
    remainingSeconds: STUDY_DURATION,
    totalSeconds: STUDY_DURATION,
    phase: 'idle',
    sessionId: null,
    startTime: null,
    targetEndTime: null,
  });

  // Register with HubCore
  useHubCore({
    id: 'TimerService',
    state: state,
    actions: {
      startStudy: () => startStudy(),
      startBreak: () => startBreak(),
      pause: () => pauseTimer(),
      resume: () => resumeTimer(),
      stop: () => stopTimer(),
      reset: () => { stopTimer(); setState(prev => ({ ...prev, remainingSeconds: STUDY_DURATION })); }
    }
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with Database on Mount
  useEffect(() => {
    const syncWithDB = async () => {
      if (!supabase) return;
      
      // Math Hub uses custom localStorage strings for users, not Supabase Auth
      const userId = localStorage.getItem('study_user');
      if (!userId) return;

      const { data: activeSession, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .neq('current_phase', 'idle')
        .maybeSingle();

      if (error) {
        console.error("Timer Sync Error:", error);
      }

      if (activeSession && !error) {
        const now = Date.now();
        const startTime = new Date(activeSession.session_start_time).getTime();
        const targetEnd = new Date(activeSession.target_end_time).getTime();
        const phase = activeSession.current_phase as PomodoroPhase;
        
        if (phase === 'study' || phase === 'break') {
          if (now > targetEnd) {
              // Timer finished while user was away!
              // Calculate how many cycles passed
              const totalElapsedMs = now - startTime;
              const studyCycleMs = STUDY_DURATION * 1000;
              const breakCycleMs = BREAK_DURATION * 1000;
              const fullCycleMs = studyCycleMs + breakCycleMs;
              
              const completedFullCycles = Math.floor(totalElapsedMs / fullCycleMs);
              const remainingMs = totalElapsedMs % fullCycleMs;
              
              // 1. Record completed study sessions
              if (completedFullCycles > 0) {
                  const totalMinutes = completedFullCycles * (STUDY_DURATION / 60);
                  await updateStudyStats(userId, totalMinutes, true);
              }
              
              // 2. Determine current phase based on remaining time in the current cycle
              let currentPhase: PomodoroPhase = 'study';
              let currentRemaining = 0;
              let currentTargetEnd = now;
              
              if (remainingMs < studyCycleMs) {
                  currentPhase = 'study';
                  currentRemaining = Math.max(0, Math.floor((studyCycleMs - remainingMs) / 1000));
                  currentTargetEnd = now + currentRemaining * 1000;
              } else {
                  currentPhase = 'break';
                  currentRemaining = Math.max(0, Math.floor((fullCycleMs - remainingMs) / 1000));
                  currentTargetEnd = now + currentRemaining * 1000;
                  ThemeManager.applyTheme(ThemeManager.generatePalette());
              }

              // Update database with new corrected state
              await supabase
                .from('study_sessions')
                .update({ 
                    current_phase: currentPhase,
                    target_end_time: new Date(currentTargetEnd).toISOString() 
                })
                .eq('id', activeSession.id);

              setState({
                phase: currentPhase,
                sessionId: activeSession.id,
                startTime: startTime,
                targetEndTime: currentTargetEnd,
                remainingSeconds: currentRemaining,
                totalSeconds: currentPhase === 'study' ? STUDY_DURATION : BREAK_DURATION,
              });
          } else {
              // Still within the current phase
              setState({
                phase,
                sessionId: activeSession.id,
                startTime,
                targetEndTime: targetEnd,
                remainingSeconds: Math.max(0, Math.floor((targetEnd - now) / 1000)),
                totalSeconds: phase === 'study' ? STUDY_DURATION : BREAK_DURATION,
              });
              if (phase === 'break') ThemeManager.applyTheme(ThemeManager.generatePalette());
          }
        } else if (phase === 'paused') {
            const pausedAt = new Date(activeSession.paused_at).getTime();
            const remaining = Math.max(0, Math.floor((targetEnd - pausedAt) / 1000));
            setState({
              phase: 'paused',
              sessionId: activeSession.id,
              startTime,
              targetEndTime: targetEnd,
              remainingSeconds: remaining,
              totalSeconds: STUDY_DURATION, // Assume study if paused
            });
        }
      }
    };

    syncWithDB();
  }, []);

  // Tick Logic
  useEffect(() => {
    if (state.phase === 'study' || state.phase === 'break') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.targetEndTime) return prev;
          
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((prev.targetEndTime - now) / 1000));
          
          if (remaining <= 0 && prev.remainingSeconds > 0) {
            clearInterval(timerRef.current!);
            // Trigger phase end asynchronously to avoid calling inside setState
            setTimeout(() => handlePhaseEnd(prev.phase), 0);
            return { ...prev, remainingSeconds: 0 };
          }
          
          return { ...prev, remainingSeconds: remaining };
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
    const userId = localStorage.getItem('study_user');
    if (currentPhase === 'study') {
      if (userId) {
        // Record completed session
        await updateStudyStats(userId, STUDY_DURATION / 60, true);
      }

      if (activeTaskId) {
        try {
          await addNoteToTask(activeTaskId, `🍅 Focused for ${STUDY_DURATION / 60}m`);
        } catch (err) {
          console.error("Failed to sync Pomodoro with task", err);
        }
      }

      alert(localStorage.getItem('study_lang') === 'ar' ? "انتهت فترة المذاكرة! وقت الاستراحة." : "Study session complete! Time for a break.");
      new Notification("Break Time!", { body: "50 minutes done! Enjoy your 10-minute break." });
      await startBreak();
    } else if (currentPhase === 'break') {
      alert(localStorage.getItem('study_lang') === 'ar' ? "انتهت الاستراحة! عودة للمذاكرة." : "Break complete! Back to study.");
      new Notification("Back to Work!", { body: "Break's over. Let's get focused." });
      await startStudy();
    }
  };

  const startStudy = async () => {
    const now = new Date();
    const targetEnd = new Date(now.getTime() + STUDY_DURATION * 1000);
    
    // Auth for Math Hub
    const userId = localStorage.getItem('study_user');
    if (!userId) return; // Guard clause

    // Clear any existing active sessions to prevent duplicates
    await supabase!
        .from('study_sessions')
        .update({ current_phase: 'idle' })
        .eq('user_id', userId)
        .neq('current_phase', 'idle');

    const { data, error } = await supabase!
      .from('study_sessions')
      .insert({
        user_id: userId,
        current_phase: 'study',
        session_start_time: now.toISOString(),
        target_end_time: targetEnd.toISOString(),
        accumulated_pause_ms: 0
      })
      .select()
      .single();

    if (error) {
        console.error("Start Study Error:", error);
    }

    if (!error && data) {
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
    if (!state.sessionId) return; // Must have an active session

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

    if (error) {
        console.error("Start Break Error:", error);
    }

    if (!error && data) {
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
    if (!state.sessionId) return;
    
    if (state.phase === 'break' || state.phase === 'study') {
        const now = new Date();
        const { error } = await supabase!.from('study_sessions').update({
            current_phase: 'paused',
            paused_at: now.toISOString()
        }).eq('id', state.sessionId);

        if (error) console.error("Pause Error:", error);

        setState(prev => ({ ...prev, phase: 'paused' }));
    }
  };

  const resumeTimer = async () => {
    if (!state.sessionId) return;

    if (state.phase === 'paused') {
        const { data: session, error } = await supabase!.from('study_sessions').select('*').eq('id', state.sessionId).single();
        if (error || !session) return;
        
        const pausedAt = new Date(session.paused_at).getTime();
        const now = Date.now();
        const pauseDiff = now - pausedAt;
        
        const newTargetEnd = new Date(new Date(session.target_end_time).getTime() + pauseDiff);

        const { error: updateError } = await supabase!.from('study_sessions').update({
            current_phase: session.target_end_time ? 'study' : 'break', // simplified
            target_end_time: newTargetEnd.toISOString(),
            paused_at: null,
            accumulated_pause_ms: (session.accumulated_pause_ms || 0) + pauseDiff
        }).eq('id', state.sessionId);

        if (updateError) console.error("Resume Update Error:", updateError);

        setState(prev => ({
            ...prev,
            phase: prev.totalSeconds === STUDY_DURATION ? 'study' : 'break',
            targetEndTime: newTargetEnd.getTime(),
        }));
    }
  };

  const stopTimer = async () => {
    if (state.sessionId) {
        const { error } = await supabase!.from('study_sessions').update({ current_phase: 'idle' }).eq('id', state.sessionId);
        if (error) console.error("Stop Timer Error:", error);
    }
    
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
