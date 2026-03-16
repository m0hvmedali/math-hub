import chroma from 'chroma-js';
import { ThemeColors } from '../types/pomodoro';

export class ThemeManager {
  private static readonly COLOR_STEPS = 6;

  /**
   * Generates a harmonic palette based on a random seed or specific color
   */
  public static generatePalette(): ThemeColors {
    const baseColor = chroma.random();
    
    // Generate a complementary or triadic scheme
    const hue = baseColor.hcl()[0];
    const complementaryHue = (hue + 180) % 360;
    
    const bg = baseColor.darken(3).desaturate(0.5).hex();
    const surface = baseColor.darken(2.5).desaturate(0.3).hex();
    const primary = baseColor.brighten(1).saturate(1).hex();
    const secondary = chroma.hcl(complementaryHue, 50, 70).hex();
    const accent = baseColor.brighten(2).hex();
    const text = chroma.hcl(hue, 10, 95).hex();

    return {
      background: bg,
      surface: surface,
      primary: primary,
      secondary: secondary,
      accent: accent,
      text: text
    };
  }

  /**
   * Applies the theme to the document root as CSS variables
   */
  public static applyTheme(colors: ThemeColors) {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', colors.background);
    root.style.setProperty('--surface-color', colors.surface);
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--text-color', colors.text);
    
    // Low opacity variants for glassmorphism
    root.style.setProperty('--primary-glow', chroma(colors.primary).alpha(0.2).css());
    root.style.setProperty('--accent-glow', chroma(colors.accent).alpha(0.15).css());
  }
}
