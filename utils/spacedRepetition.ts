
import { ContentBlock } from '../types';

/**
 * SuperMemo 2 (SM-2) Algorithm Implementation
 * 
 * Grades:
 * 5 - perfect response
 * 4 - correct response after a hesitation
 * 3 - correct response recalled with serious difficulty
 * 2 - incorrect response; where the correct one seemed easy to recall
 * 1 - incorrect response; the correct one remembered
 * 0 - complete blackout.
 * 
 * In our UI:
 * - "Easy" -> Grade 5
 * - "Hard" -> Grade 3
 * - "Forgot" -> Grade 0
 */

export const calculateNextReview = (
    currentStats: ContentBlock['flashcardStats'],
    grade: number
): NonNullable<ContentBlock['flashcardStats']> => {
    // Default stats for new cards
    let reps = currentStats?.reps || 0;
    let interval = currentStats?.interval || 0;
    let easeFactor = currentStats?.easeFactor || 2.5;

    if (grade >= 3) {
        if (reps === 0) {
            interval = 1;
        } else if (reps === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        reps++;
    } else {
        reps = 0;
        interval = 1;
    }

    // Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    // q = grade
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate Next Date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    // Determine Mastery Level
    let masteryLevel: 'new' | 'learning' | 'review' | 'mastered' = 'brand_new' as any;
    if (reps === 0) masteryLevel = 'new';
    else if (reps < 3) masteryLevel = 'learning';
    else if (interval > 21) masteryLevel = 'mastered';
    else masteryLevel = 'review';

    return {
        reps,
        interval,
        easeFactor,
        nextReviewDate: nextDate.toISOString(),
        masteryLevel,
        lastGrade: grade
    };
};

export const getStatusColor = (level?: string) => {
    switch (level) {
        case 'new': return 'bg-gray-500';
        case 'learning': return 'bg-yellow-500';
        case 'review': return 'bg-blue-500';
        case 'mastered': return 'bg-green-500';
        default: return 'bg-gray-700';
    }
};
