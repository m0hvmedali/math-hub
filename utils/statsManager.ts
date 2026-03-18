import { supabase } from '../supabaseClient';

export interface StudyLevel {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
  totalMinutes: number;
}

/**
 * Calculates level based on total study minutes.
 * Formula: 1 level per 60 minutes (1 hour).
 */
export const calculateLevel = (totalMinutes: number): StudyLevel => {
  const level = Math.floor(totalMinutes / 60) + 1;
  const currentXP = totalMinutes % 60;
  const nextLevelXP = 60;
  const progress = (currentXP / nextLevelXP) * 100;

  return {
    level,
    currentXP,
    nextLevelXP,
    progress,
    totalMinutes
  };
};

/**
 * Updates study_stats table in Supabase.
 * Increments total_study_minutes and sessions_completed for the current date.
 */
export const updateStudyStats = async (userId: string, minutes: number, isSessionComplete: boolean = false) => {
  if (!supabase) return;

  const today = new Date().toISOString().split('T')[0];

  // Try to find existing record for today
  const { data: existing, error: fetchError } = await supabase
    .from('study_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching study stats:", fetchError);
    return;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('study_stats')
      .update({
        total_study_minutes: existing.total_study_minutes + minutes,
        sessions_completed: isSessionComplete ? existing.sessions_completed + 1 : existing.sessions_completed
      })
      .eq('id', existing.id);

    if (updateError) console.error("Error updating study stats:", updateError);
  } else {
    const { error: insertError } = await supabase
      .from('study_stats')
      .insert({
        user_id: userId,
        date: today,
        total_study_minutes: minutes,
        sessions_completed: isSessionComplete ? 1 : 0
      });

    if (insertError) console.error("Error inserting study stats:", insertError);
  }
};
