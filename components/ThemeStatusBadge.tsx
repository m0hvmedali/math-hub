import React from 'react';
import { ThemePhase, PALETTES } from '../hooks/useThemeEngine';

interface ThemeStatusBadgeProps {
  phase: ThemePhase;
  enabled: boolean;
  onToggle: () => void;
}

const PHASE_COLORS: Record<ThemePhase, string> = {
  idle:  'hsl(240, 70%, 55%)',
  focus: 'hsl(220, 75%, 55%)',
  warn:  'hsl(38, 85%, 55%)',
  break: 'hsl(145, 60%, 55%)',
};

const ThemeStatusBadge: React.FC<ThemeStatusBadgeProps> = ({ phase, enabled, onToggle }) => {
  const p = PALETTES[phase];
  const color = PHASE_COLORS[phase];

  return (
    <button
      onClick={onToggle}
      title={enabled ? `نظام الألوان نشط — ${p.label}` : 'تفعيل نظام الألوان الديناميكي'}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        background: enabled ? `${color}15` : 'rgba(255,255,255,0.05)',
        borderColor: enabled ? `${color}50` : 'rgba(255,255,255,0.08)',
        boxShadow: enabled ? `0 0 12px ${color}30` : 'none',
      }}
    >
      {/* Animated dot */}
      <span
        className={`w-2 h-2 rounded-full ${enabled ? 'animate-pulse' : ''}`}
        style={{ background: enabled ? color : '#4b5563' }}
      />
      <span
        className="text-[10px] font-black uppercase tracking-widest"
        style={{ color: enabled ? color : '#6b7280' }}
      >
        {enabled ? `${p.emoji} ${p.label}` : '○ THEME OFF'}
      </span>
    </button>
  );
};

export default ThemeStatusBadge;
