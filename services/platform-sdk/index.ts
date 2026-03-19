import { auth } from './auth';
import { drive } from './drive';
import { youtube } from './youtube';
import { tasks } from './tasks';
import { gmail } from './gmail';
import { calendar } from './calendar';
import { translate } from './translate';
import { keep } from './keep';
import { ai } from './ai';
import { voice } from './voice';

export interface GoogleOmni {
  drive: typeof drive;
  youtube: typeof youtube;
  gmail: typeof gmail;
  calendar: typeof calendar;
  tasks: typeof tasks;
  auth: typeof auth;
  translate: typeof translate;
  keep: typeof keep;
  ai: typeof ai;
  voice: typeof voice;
}

/**
 * Omni Hook for accessing all Google Platform APIs securely via the central orchestrator
 */
export const useGoogleOmni = (): GoogleOmni => {
  return {
    auth,
    drive,
    youtube,
    tasks,
    gmail,
    calendar,
    translate,
    keep,
    ai,
    voice
  };
};

// Export individual services for direct component use where preferred
export { auth, drive, youtube, tasks, gmail, calendar, translate, keep, ai, voice };
