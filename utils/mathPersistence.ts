import { supabase } from '../supabaseClient';

export type MathCategory = 'ai_lab' | 'solver' | 'grapher' | 'curriculum';

export interface MathActivity {
    id?: string;
    user_id: string;
    category: MathCategory;
    type?: string;
    query: string;
    content: any;
    timestamp?: string;
}

const DEFAULT_USER = 'guest_math_user';

/**
 * Saves a math activity to the cloud.
 */
export const saveMathActivity = async (activity: Omit<MathActivity, 'user_id'>) => {
    if (!supabase) return null;

    // Get user from localStorage or use default (matching app's pattern)
    const storedUser = localStorage.getItem('activeUser');
    const userId = storedUser ? JSON.parse(storedUser).id || storedUser : DEFAULT_USER;

    try {
        const { data, error } = await supabase
            .from('math_activities')
            .insert([{
                ...activity,
                user_id: userId
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error saving math activity:', err);
        return null;
    }
};

/**
 * Fetches recent math activities for the current user.
 */
export const fetchMathActivities = async (category?: MathCategory): Promise<MathActivity[]> => {
    if (!supabase) return [];

    const storedUser = localStorage.getItem('activeUser');
    const userId = storedUser ? JSON.parse(storedUser).id || storedUser : DEFAULT_USER;

    try {
        let query = supabase
            .from('math_activities')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(20);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching math activities:', err);
        return [];
    }
};

/**
 * Deletes a math activity.
 */
export const deleteMathActivity = async (id: string) => {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('math_activities')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting math activity:', err);
        return false;
    }
};
