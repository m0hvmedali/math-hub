import { hubCore, assistant } from './HubCore';

/**
 * Standard Command Library for Math Hub Assistant
 */
export const initializeAssistantCommands = () => {
  // --- POMODORO COMMANDS ---
  assistant.registerCommand({
    id: "startStudy",
    description: "Start a 50-minute deep study session",
    execute: () => hubCore.execute("TimerService", "startStudy")
  });

  assistant.registerCommand({
    id: "startBreak",
    description: "Start a 10-minute break session",
    execute: () => hubCore.execute("TimerService", "startBreak")
  });

  assistant.registerCommand({
    id: "pauseTimer",
    description: "Pause the current timer",
    execute: () => hubCore.execute("TimerService", "pause")
  });

  assistant.registerCommand({
    id: "resumeTimer",
    description: "Resume the current timer",
    execute: () => hubCore.execute("TimerService", "resume")
  });

  // --- SPOTIFY COMMANDS ---
  assistant.registerCommand({
    id: "playStudyMusic",
    description: "Play the default Deep Focus playlist",
    execute: () => hubCore.execute("SpotifyService", "play", "spotify:playlist:37i9dQZF1DWZeKCadgRdKQ")
  });

  assistant.registerCommand({
    id: "playBreakMusic",
    description: "Play energetic break music",
    execute: () => hubCore.execute("SpotifyService", "play", "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M")
  });

  assistant.registerCommand({
    id: "pauseMusic",
    description: "Pause Spotify playback",
    execute: () => hubCore.execute("SpotifyService", "pause")
  });

  // --- NAVIGATION COMMANDS ---
  assistant.registerCommand({
    id: "goToDashboard",
    description: "Navigate to the main dashboard",
    execute: () => hubCore.execute("DashboardPage", "navigate", "/")
  });

  // --- MACROS (Sequences) ---
  assistant.registerCommand({
    id: "macro_deep_study",
    description: "Sequence: Start 50min timer + Play study music",
    execute: () => {
      assistant.runCommand("startStudy");
      assistant.runCommand("playStudyMusic");
    }
  });

  assistant.registerCommand({
    id: "macro_take_break",
    description: "Sequence: Start break timer + Play break music",
    execute: () => {
      assistant.runCommand("startBreak");
      assistant.runCommand("playBreakMusic");
    }
  });

  assistant.registerCommand({
    id: "macro_total_stop",
    description: "Sequence: Stop music + Pause timer",
    execute: () => {
      assistant.runCommand("pauseMusic");
      assistant.runCommand("pauseTimer");
    }
  });

  assistant.registerCommand({
    id: "macro_night_mode",
    description: "Sequence: Deep study music + Switch to dark theme",
    execute: () => {
      assistant.runCommand("playStudyMusic");
      hubCore.execute("AppShell", "toggleTheme");
    }
  });

  console.log(`[Assistant] Command Library Initialized: ${assistant.getAvailableCommands().length} commands.`);
};
