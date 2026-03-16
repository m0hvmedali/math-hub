export type PomodoroPhase = 'idle' | 'study' | 'break' | 'paused';

export interface StudySession {
  id?: string;
  user_id?: string;
  session_start_time: string; // ISO String
  current_phase: PomodoroPhase;
  target_end_time?: string; // ISO String
  paused_at?: string; // ISO String
  accumulated_pause_ms: number;
}

export interface StudyStats {
  id?: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  total_study_minutes: number;
  total_break_minutes: number;
  sessions_completed: number;
  ai_analysis?: any;
}

export interface ThemeColors {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  surface: string;
}

export interface TimerState {
  remainingSeconds: number;
  totalSeconds: number;
  phase: PomodoroPhase;
  sessionId: string | null;
  startTime: number | null;
  targetEndTime: number | null;
}
