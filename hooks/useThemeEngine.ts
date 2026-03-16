// useThemeEngine.ts
// Pomodoro-synced Dynamic HSL Color Theme Engine
// Modes:
//   🔵 FOCUS (0-25 min)  → Cool Blue  — Hue ~220
//   🟡 WARN  (23-25 min) → Amber Fade — Hue ~45 (gradual transition)
//   🟢 BREAK (0-5 min)   → Mint Green — Hue ~145
//
// Colors are generated purely from HSL to guarantee visual harmony.
// Only the Hue changes. Saturation and Lightness stay constant.

import { useEffect, useRef } from 'react';
import { useHubCore } from '../utils/HubCore';

export type ThemePhase = 'focus' | 'warn' | 'break' | 'idle';

interface ThemeEngineOptions {
  enabled: boolean;
  pomodoroMinutes?: number; // default 25
  breakMinutes?: number;    // default 5
}

// ─── Palette definitions (HSL) ────────────────────────────────────────────
const PALETTES: Record<ThemePhase, { hue: number; saturation: number; label: string; emoji: string }> = {
  idle:  { hue: 240, saturation: 70, label: 'Idle',          emoji: '⚪' },
  focus: { hue: 220, saturation: 75, label: 'Deep Focus',    emoji: '🔵' },
  warn:  { hue: 38,  saturation: 85, label: 'Break Warning', emoji: '🟡' },
  break: { hue: 145, saturation: 60, label: 'Neural Recharge', emoji: '🟢' },
};

// ─── Helper: Apply palette to CSS root variables ──────────────────────────
function applyPalette(hue: number, sat: number) {
  const root = document.documentElement;
  const l = 55; // Lightness stays fixed for readability

  // Main accent
  root.style.setProperty('--dynamic-hue', String(hue));
  root.style.setProperty('--accent-primary',          `hsl(${hue}, ${sat}%, ${l}%)`);
  root.style.setProperty('--accent-glow',             `hsla(${hue}, ${sat}%, ${l}%, 0.4)`);
  root.style.setProperty('--glass-hover-border',      `hsla(${hue}, ${sat}%, ${l}%, 0.45)`);
  root.style.setProperty('--card-shadow-hover',       `0 16px 48px hsla(${hue}, ${sat}%, ${l}%, 0.2)`);
  root.style.setProperty('--subject-gradient-start',  `hsl(${hue}, ${sat}%, ${l}%)`);
  root.style.setProperty('--subject-gradient-end',    `hsl(${(hue + 40) % 360}, ${sat}%, ${l}%)`);
  root.style.setProperty('--subject-glow',            `hsla(${hue}, ${sat}%, ${l}%, 0.5)`);
}

// ─── Lerp helper for smooth hue transition ────────────────────────────────
function lerpHue(from: number, to: number, t: number) {
  // Handle wrapping (e.g., 350→10)
  let delta = ((to - from + 540) % 360) - 180;
  return (from + delta * t + 360) % 360;
}

let engineInterval: ReturnType<typeof setInterval> | null = null;
let animFrame: ReturnType<typeof requestAnimationFrame> | null = null;

// Active session tracking (module-level, persisted across re-renders via ref)
let sessionStart: number | null = null;
let currentPhase: ThemePhase = 'idle';
let targetHue = PALETTES.idle.hue;
let currentHue = PALETTES.idle.hue;
let currentSat = PALETTES.idle.saturation;

export function useThemeEngine({ enabled, pomodoroMinutes = 25, breakMinutes = 5 }: ThemeEngineOptions) {
  // Register with HubCore (Service level)
  useHubCore({
    id: 'ThemeEngineService',
    state: { enabled },
    actions: {
      setEnabled: (val: boolean) => {
        const next = !!val;
        localStorage.setItem('theme_engine', next ? 'on' : 'off');
        window.location.reload(); 
      }
    }
  });

  const phaseLabelRef = useRef<ThemePhase>('idle');

  useEffect(() => {
    if (!enabled) {
      // Reset to idle palette and stop engine
      applyPalette(PALETTES.idle.hue, PALETTES.idle.saturation);
      if (engineInterval) clearInterval(engineInterval);
      if (animFrame) cancelAnimationFrame(animFrame);
      return;
    }

    // Start a new Pomodoro session
    sessionStart = Date.now();
    currentPhase = 'focus';
    phaseLabelRef.current = 'focus';

    const focusMs  = pomodoroMinutes * 60 * 1000;
    const warnMs   = (pomodoroMinutes - 2) * 60 * 1000; // 2 min before end
    const breakMs  = breakMinutes * 60 * 1000;

    // ── Smooth animation loop (rAF) ────────────────────────────────────────
    let lastTs = 0;
    function animate(ts: number) {
      const dt = ts - lastTs;
      lastTs = ts;

      // Smoothly interpolate hue toward target (ease speed: 0.02 per frame)
      if (Math.abs(currentHue - targetHue) > 0.5) {
        currentHue = lerpHue(currentHue, targetHue, 0.025);
        applyPalette(currentHue, currentSat);
      }

      animFrame = requestAnimationFrame(animate);
    }
    animFrame = requestAnimationFrame(animate);

    // ── Phase ticker (every 10s, no need for ms precision) ─────────────────
    const FOCUS_PALETTE = PALETTES.focus;
    const WARN_PALETTE  = PALETTES.warn;
    const BREAK_PALETTE = PALETTES.break;

    // Initial apply
    targetHue  = FOCUS_PALETTE.hue;
    currentSat = FOCUS_PALETTE.saturation;
    applyPalette(FOCUS_PALETTE.hue, FOCUS_PALETTE.saturation);

    let breakStart: number | null = null;

    engineInterval = setInterval(() => {
      if (!sessionStart) return;
      const elapsed = Date.now() - sessionStart;

      if (breakStart !== null) {
        // In break phase
        const breakElapsed = Date.now() - breakStart;
        if (breakElapsed >= breakMs) {
          // Break over — restart focus
          sessionStart = Date.now();
          breakStart = null;
          currentPhase = 'focus';
          phaseLabelRef.current = 'focus';
          targetHue  = FOCUS_PALETTE.hue;
          currentSat = FOCUS_PALETTE.saturation;

          // Fire a subtle browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('🔵 وقت الحصة!', { body: 'انتهت فترة الراحة. جاهز للتركيز؟', icon: '/favicon.ico' });
          }
        }
        return;
      }

      if (elapsed >= focusMs) {
        // Focus session complete → enter break
        breakStart = Date.now();
        currentPhase = 'break';
        phaseLabelRef.current = 'break';
        targetHue  = BREAK_PALETTE.hue;
        currentSat = BREAK_PALETTE.saturation;
        if (Notification.permission === 'granted') {
          new Notification('🟢 استراحة مكتسبة!', { body: 'أحسنت! خذ 5 دقائق وتمدّد.', icon: '/favicon.ico' });
        }
      } else if (elapsed >= warnMs) {
        // Warning zone
        if (currentPhase !== 'warn') {
          currentPhase = 'warn';
          phaseLabelRef.current = 'warn';
          targetHue  = WARN_PALETTE.hue;
          currentSat = WARN_PALETTE.saturation;
        }
      }
    }, 10_000); // check every 10 seconds

    return () => {
      if (engineInterval) clearInterval(engineInterval);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [enabled, pomodoroMinutes, breakMinutes]);

  // Returns current phase so parent can display status badge
  return { phase: phaseLabelRef.current, palettes: PALETTES };
}

// ─── Standalone getter for phase info ─────────────────────────────────────
export { PALETTES };
export type { ThemePhase as ThemePhaseType };
