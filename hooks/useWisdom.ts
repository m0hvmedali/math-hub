import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export type WisdomType = 'quran' | 'hadith' | 'poetry' | 'scholar_quote' | 'general_wisdom';

export interface WisdomItem {
  id: string;
  text: string;
  author: string;
  source: string;
  category: string;
  type: WisdomType;
  is_golden: boolean;
  metadata?: any;
}

export interface WisdomProgress {
  item_id: string;
  status: 'new' | 'learning' | 'remembered';
  is_favorite: boolean;
  next_review_date: string;
  show_count: number;
}

export const useWisdom = (userId: string | null) => {
  const [currentWisdom, setCurrentWisdom] = useState<WisdomItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<WisdomProgress | null>(null);

  const fetchNextWisdom = useCallback(async (options?: { 
    type?: WisdomType | WisdomType[], 
    category?: string,
    state?: 'study' | 'break' | 'focus' | 'night' | 'end'
  }) => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Determine target types based on app state if provided
      let targetTypes: WisdomType[] = [];
      if (options?.type) {
        targetTypes = Array.isArray(options.type) ? options.type : [options.type];
      } else if (options?.state) {
        switch (options.state) {
          case 'study': targetTypes = ['quran', 'hadith']; break;
          case 'focus': targetTypes = ['hadith', 'scholar_quote']; break;
          case 'break': targetTypes = ['poetry']; break;
          case 'night': targetTypes = ['quran', 'general_wisdom']; break;
          case 'end': targetTypes = ['general_wisdom', 'scholar_quote']; break;
          default: targetTypes = ['quran', 'hadith', 'poetry', 'scholar_quote'];
        }
      }

      // 2. Try to find an item due for review (Spaced Repetition)
      let query = supabase
        .from('user_wisdom_progress')
        .select('item_id, status, is_favorite, next_review_date, show_count')
        .eq('user_id', userId)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date', { ascending: true });

      const { data: dueItems } = await query.limit(1);

      let targetId: string | null = null;
      let existingProgress: WisdomProgress | null = null;

      if (dueItems && dueItems.length > 0) {
        targetId = dueItems[0].item_id;
        existingProgress = dueItems[0] as WisdomProgress;
      } else {
        // 3. Otherwise, fetch a new item not seen recently (History filter)
        // First get IDs of recently seen items to avoid immediate repetition
        const { data: history } = await supabase
          .from('user_wisdom_history')
          .select('item_id')
          .eq('user_id', userId)
          .order('shown_at', { ascending: false })
          .limit(200); // Bucket size roughly 200

        const seenList = history?.map(h => h.item_id) || [];

        // 4. Random Selection Logic (including Golden Quote probability)
        const isGoldenRoll = Math.random() < 0.05; // 5% chance for a golden quote
        
        let itemQuery = supabase.from('wisdom_items').select('id');
        
        if (targetTypes.length > 0) {
            itemQuery = itemQuery.in('type', targetTypes);
        }
        if (options?.category) {
            itemQuery = itemQuery.eq('category', options.category);
        }
        if (isGoldenRoll) {
            itemQuery = itemQuery.eq('is_golden', true);
        }
        if (seenList.length > 0) {
            itemQuery = itemQuery.not('id', 'in', `(${seenList.slice(0, 100).join(',')})`);
        }

        const { data: potentialItems } = await itemQuery.limit(50);

        if (potentialItems && potentialItems.length > 0) {
          const randomIdx = Math.floor(Math.random() * potentialItems.length);
          targetId = potentialItems[randomIdx].id;
        } else if (isGoldenRoll || seenList.length > 0) {
           // Fallback if golden or unseen bucket is empty: try again without filters
           const { data: fallbackItems } = await supabase.from('wisdom_items').select('id').limit(20);
           if (fallbackItems && fallbackItems.length > 0) {
               targetId = fallbackItems[Math.floor(Math.random() * fallbackItems.length)].id;
           }
        }
      }

      if (targetId) {
        const { data: itemData } = await supabase
          .from('wisdom_items')
          .select('*')
          .eq('id', targetId)
          .single();

        setCurrentWisdom(itemData);
        setProgress(existingProgress || {
          item_id: targetId,
          status: 'new',
          is_favorite: false,
          next_review_date: new Date().toISOString(),
          show_count: 0
        });

        // Save to History
        await supabase.from('user_wisdom_history').insert({
            user_id: userId,
            item_id: targetId
        });
      }
    } catch (error) {
      console.error('Error fetching next wisdom:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProgress = useCallback(async (action: 'understand' | 'repeat' | 'favorite') => {
    if (!userId || !currentWisdom || !progress) return;

    let newStatus = progress.status;
    let nextReview = new Date();
    let showCount = (progress.show_count || 0) + 1;
    let isFavorite = progress.is_favorite;

    if (action === 'understand') {
      if (progress.status === 'new') {
        newStatus = 'learning';
        nextReview.setDate(nextReview.getDate() + 1);
      } else if (progress.status === 'learning') {
        newStatus = 'remembered';
        nextReview.setDate(nextReview.getDate() + 7);
      } else {
        nextReview.setDate(nextReview.getDate() + 30);
      }
    } else if (action === 'repeat') {
      newStatus = 'learning';
      nextReview.setMinutes(nextReview.getMinutes() + 10);
    } else if (action === 'favorite') {
      isFavorite = !isFavorite;
    }

    try {
      const { data, error } = await supabase
        .from('user_wisdom_progress')
        .upsert({
          user_id: userId,
          item_id: currentWisdom.id,
          status: newStatus,
          is_favorite: isFavorite,
          next_review_date: nextReview.toISOString(),
          last_shown_at: new Date().toISOString(),
          show_count: showCount
        }, { onConflict: 'user_id,item_id' })
        .select()
        .single();

      if (!error) {
        setProgress({
          item_id: currentWisdom.id,
          status: data.status,
          is_favorite: data.is_favorite,
          next_review_date: data.next_review_date,
          show_count: data.show_count
        });
      }
    } catch (error) {
      console.error('Error updating wisdom progress:', error);
    }
  }, [userId, currentWisdom, progress]);

  return { currentWisdom, progress, loading, fetchNextWisdom, updateProgress };
};
