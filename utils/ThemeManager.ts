import chroma from 'chroma-js';
import { ThemeColors } from '../types/pomodoro';

export interface FullTheme extends ThemeColors {
  brandCyan: string;
  brandPurple: string;
  brandMagenta: string;
  brandSecondary: string;
  accentBlue: string;
  accentGreen: string;
  accentRed: string;
  accentAmber: string;
  accentCyan: string;
  accentViolet: string;
  accentPink: string;
}

export class ThemeManager {
  private static rotationTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Generates a full harmonic palette using chroma.js.
   * Every call produces a completely unique theme.
   */
  public static generatePalette(): FullTheme {
    const baseHue = Math.random() * 360;

    // Core colors from hue rotation
    const bg = chroma.hcl(baseHue, 10, 8).hex();
    const surface = chroma.hcl(baseHue, 12, 14).hex();
    const primary = chroma.hcl(baseHue, 60, 60).hex();
    const secondary = chroma.hcl((baseHue + 120) % 360, 55, 65).hex();
    const accent = chroma.hcl((baseHue + 240) % 360, 65, 55).hex();
    const text = chroma.hcl(baseHue, 5, 95).hex();

    // Brand colors — triadic harmony
    const brandCyan = chroma.hcl(baseHue, 70, 65).hex();
    const brandPurple = chroma.hcl((baseHue + 90) % 360, 65, 55).hex();
    const brandMagenta = chroma.hcl((baseHue + 180) % 360, 70, 50).hex();
    const brandSecondary = chroma.hcl((baseHue + 270) % 360, 60, 55).hex();

    // Accent colors — spread across hue wheel
    const accentBlue = chroma.hcl((baseHue + 30) % 360, 60, 55).hex();
    const accentGreen = chroma.hcl((baseHue + 120) % 360, 55, 55).hex();
    const accentRed = chroma.hcl((baseHue + 210) % 360, 70, 50).hex();
    const accentAmber = chroma.hcl((baseHue + 60) % 360, 65, 65).hex();
    const accentCyan = chroma.hcl((baseHue + 150) % 360, 60, 60).hex();
    const accentViolet = chroma.hcl((baseHue + 270) % 360, 65, 50).hex();
    const accentPink = chroma.hcl((baseHue + 300) % 360, 60, 55).hex();

    return {
      background: bg,
      surface,
      primary,
      secondary,
      accent,
      text,
      brandCyan,
      brandPurple,
      brandMagenta,
      brandSecondary,
      accentBlue,
      accentGreen,
      accentRed,
      accentAmber,
      accentCyan,
      accentViolet,
      accentPink,
    };
  }

  /**
   * Applies the FULL theme to the document root as CSS variables.
   * This covers every single dynamic color in the system.
   */
  public static applyTheme(colors: FullTheme) {
    const root = document.documentElement;

    // Core theme
    root.style.setProperty('--bg-color', colors.background);
    root.style.setProperty('--surface-color', colors.surface);
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--text-color', colors.text);

    // Brand colors
    root.style.setProperty('--brand-cyan', colors.brandCyan);
    root.style.setProperty('--brand-purple', colors.brandPurple);
    root.style.setProperty('--brand-magenta', colors.brandMagenta);
    root.style.setProperty('--brand-secondary', colors.brandSecondary);

    // Accent colors
    root.style.setProperty('--accent-blue', colors.accentBlue);
    root.style.setProperty('--accent-green', colors.accentGreen);
    root.style.setProperty('--accent-red', colors.accentRed);
    root.style.setProperty('--accent-amber', colors.accentAmber);
    root.style.setProperty('--accent-cyan', colors.accentCyan);
    root.style.setProperty('--accent-violet', colors.accentViolet);
    root.style.setProperty('--accent-pink', colors.accentPink);

    // Glow variants for glassmorphism
    root.style.setProperty('--primary-glow', chroma(colors.primary).alpha(0.25).css());
    root.style.setProperty('--accent-glow', chroma(colors.accent).alpha(0.2).css());
    root.style.setProperty('--accent-primary', colors.primary);
    root.style.setProperty('--accent-secondary', colors.secondary);

    // Glass hover border
    root.style.setProperty('--glass-hover-border', chroma(colors.primary).alpha(0.45).css());

    // Card shadow hover
    root.style.setProperty('--card-shadow-hover', `0 16px 48px ${chroma(colors.primary).alpha(0.2).css()}`);

    // Subject gradients
    root.style.setProperty('--subject-gradient-start', colors.brandCyan);
    root.style.setProperty('--subject-gradient-end', colors.brandPurple);
    root.style.setProperty('--subject-glow', chroma(colors.brandCyan).alpha(0.4).css());
  }

  /**
   * Starts the auto-rotation engine.
   * Generates a new theme every `intervalMs` milliseconds (default: 60s).
   */
  public static startAutoRotation(intervalMs: number = 60_000) {
    // Apply first theme immediately
    const firstTheme = ThemeManager.generatePalette();
    ThemeManager.applyTheme(firstTheme);

    // Clear any existing rotation
    if (ThemeManager.rotationTimer) {
      clearInterval(ThemeManager.rotationTimer);
    }

    // Rotate
    ThemeManager.rotationTimer = setInterval(() => {
      const newTheme = ThemeManager.generatePalette();
      ThemeManager.applyTheme(newTheme);
    }, intervalMs);
  }

  /**
   * Stops the auto-rotation and resets to default colors.
   */
  public static stopAutoRotation() {
    if (ThemeManager.rotationTimer) {
      clearInterval(ThemeManager.rotationTimer);
      ThemeManager.rotationTimer = null;
    }
    // Reset to defaults
    ThemeManager.resetToDefaults();
  }

  /**
   * Resets all CSS variables to their default values.
   */
  public static resetToDefaults() {
    const root = document.documentElement;
    const defaults: Record<string, string> = {
      '--bg-color': '#0A0A0A',
      '--surface-color': '#121212',
      '--primary-color': '#3B82F6',
      '--secondary-color': '#2DD4BF',
      '--accent-color': '#F43F5E',
      '--text-color': '#FFFFFF',
      '--brand-cyan': '#11D3EE',
      '--brand-purple': '#8A3FFC',
      '--brand-magenta': '#D2267D',
      '--brand-secondary': '#6366F1',
      '--accent-blue': '#3B82F6',
      '--accent-green': '#22C55E',
      '--accent-red': '#EF4444',
      '--accent-amber': '#F59E0B',
      '--accent-cyan': '#06B6D4',
      '--accent-violet': '#8B5CF6',
      '--accent-pink': '#EC4899',
      '--primary-glow': 'rgba(59, 130, 246, 0.2)',
      '--accent-glow': 'rgba(244, 63, 94, 0.15)',
    };

    Object.entries(defaults).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}
