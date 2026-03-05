
import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { LessonProgress } from '../types';

export const useLessonProgress = (userId: string | undefined) => {
    const [progress, setProgress] = useState<LessonProgress | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchProgress = useCallback(async (lessonId: string) => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('lesson_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('lesson_id', lessonId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Error fetching progress:', error);
            }

            if (data) {
                setProgress(data);
            } else {
                setProgress(null);
            }
        } catch (err) {
            console.error('Unexpected error fetching progress:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const saveProgress = useCallback(async (lessonId: string, blockId: string, state: any) => {
        if (!userId) return;

        // Optimistic update
        const currentData = progress?.data || {};
        const newData = {
            ...currentData,
            [blockId]: {
                ...(currentData[blockId] || {}),
                ...state,
                lastInteraction: new Date().toISOString()
            }
        };

        const newProgress = {
            ...(progress || { id: '', user_id: userId, lesson_id: lessonId, score: 0, updated_at: '' }),
            data: newData,
            updated_at: new Date().toISOString()
        };

        setProgress(newProgress as LessonProgress);

        try {
            const { error } = await supabase
                .from('lesson_progress')
                .upsert({
                    user_id: userId,
                    lesson_id: lessonId,
                    data: newData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, lesson_id' });

            if (error) throw error;
        } catch (err) {
            console.error('Error saving progress:', err);
            // Revert on error? For now, we just log it.
        }
    }, [userId, progress]);

    const resetProgress = useCallback(async (lessonId: string) => {
        if (!userId) return;

        setProgress(null);

        try {
            await supabase
                .from('lesson_progress')
                .delete()
                .eq('user_id', userId)
                .eq('lesson_id', lessonId);
        } catch (err) {
            console.error('Error resetting progress:', err);
        }
    }, [userId]);

    return {
        progress,
        loading,
        fetchProgress,
        saveProgress,
        resetProgress
    };
};
