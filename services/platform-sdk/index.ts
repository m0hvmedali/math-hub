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

/**
 * Omni Hook for accessing all Google Platform APIs securely via the central orchestrator
 */
export const useGoogleOmni = () => {
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
