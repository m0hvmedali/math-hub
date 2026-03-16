import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Hadith {
  id: string;
  external_id: number;
  book_id: number;
  chapter_id: number;
  text_ar: string;
  text_en: string;
  narrator_en: string;
  book_name_ar: string;
  book_name_en: string;
  chapter_name_ar: string;
  chapter_name_en: string;
  category: string;
}

export interface UserHadithProgress {
  hadith_id: string;
  status: 'new' | 'learning' | 'remembered';
  is_favorite: boolean;
  next_review_date: string;
  show_count: number;
}

export const useWisdom = (userId: string | null) => {
  const [currentHadith, setCurrentHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<UserHadithProgress | null>(null);

  const fetchNextHadith = useCallback(async (category?: string) => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Try to find a hadith due for review
      const { data: dueItems } = await supabase
        .from('user_hadith_progress')
        .select('hadith_id, status, is_favorite, next_review_date, show_count')
        .eq('user_id', userId)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date', { ascending: true })
        .limit(1);

      let targetId: string | null = null;
      let existingProgress: UserHadithProgress | null = null;

      if (dueItems && dueItems.length > 0) {
        targetId = dueItems[0].hadith_id;
        existingProgress = dueItems[0] as UserHadithProgress;
      } else {
        // 2. Otherwise, fetch a new hadith not seen yet
        // First get IDs of seen hadiths
        const { data: seenIds } = await supabase
          .from('user_hadith_progress')
          .select('hadith_id')
          .eq('user_id', userId);

        const seenList = seenIds?.map(s => s.hadith_id) || [];

        let query = supabase.from('hadiths').select('*');
        if (seenList.length > 0) {
          query = query.not('id', 'in', `(${seenList.slice(0, 100).join(',')})`); // Limit exclusion for performance
        }
        if (category) {
          query = query.eq('category', category);
        }

        const { data: newHadiths } = await query.limit(20); // Get a small pool

        if (newHadiths && newHadiths.length > 0) {
          // Pick one randomly from the pool
          const randomIdx = Math.floor(Math.random() * newHadiths.length);
          const picked = newHadiths[randomIdx];
          targetId = picked.id;
        }
      }

      if (targetId) {
        const { data: hadithData } = await supabase
          .from('hadiths')
          .select('*')
          .eq('id', targetId)
          .single();

        setCurrentHadith(hadithData);
        setProgress(existingProgress || {
          hadith_id: targetId,
          status: 'new',
          is_favorite: false,
          next_review_date: new Date().toISOString(),
          show_count: 0
        });
      }
    } catch (error) {
      console.error('Error fetching next hadith:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProgress = useCallback(async (action: 'understand' | 'repeat' | 'favorite') => {
    if (!userId || !currentHadith || !progress) return;

    let newStatus = progress.status;
    let nextReview = new Date();
    let showCount = progress.show_count + 1;
    let isFavorite = progress.is_favorite;

    if (action === 'understand') {
      if (progress.status === 'new') {
        newStatus = 'learning';
        nextReview.setDate(nextReview.getDate() + 1); // Review tomorrow
      } else if (progress.status === 'learning') {
        newStatus = 'remembered';
        nextReview.setDate(nextReview.getDate() + 7); // Review in a week
      } else {
        nextReview.setDate(nextReview.getDate() + 30); // Review in a month
      }
    } else if (action === 'repeat') {
      newStatus = 'learning';
      nextReview.setMinutes(nextReview.getMinutes() + 10); // Review in 10 mins
    } else if (action === 'favorite') {
      isFavorite = !isFavorite;
    }

    try {
      const { data, error } = await supabase
        .from('user_hadith_progress')
        .upsert({
          user_id: userId,
          hadith_id: currentHadith.id,
          status: newStatus,
          is_favorite: isFavorite,
          next_review_date: nextReview.toISOString(),
          last_shown_date: new Date().toISOString(),
          show_count: showCount
        }, { onConflict: 'user_id,hadith_id' })
        .select()
        .single();

      if (!error) {
        setProgress({
          hadith_id: currentHadith.id,
          status: data.status,
          is_favorite: data.is_favorite,
          next_review_date: data.next_review_date,
          show_count: data.show_count
        });
      }
    } catch (error) {
      console.error('Error updating hadith progress:', error);
    }
  }, [userId, currentHadith, progress]);

  return { currentHadith, progress, loading, fetchNextHadith, updateProgress };
};
