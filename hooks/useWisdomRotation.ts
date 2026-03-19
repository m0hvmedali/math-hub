import { useState, useEffect } from 'react';

export type WisdomMode = 'AI_BRIEFING' | 'SUPABASE_WISDOM' | 'LOCAL_QUOTE';

export const useWisdomRotation = (intervalMs: number = 30000) => {
    const [activeMode, setActiveMode] = useState<WisdomMode>('AI_BRIEFING');

    useEffect(() => {
        const modes: WisdomMode[] = ['AI_BRIEFING', 'SUPABASE_WISDOM', 'LOCAL_QUOTE'];
        let currentIndex = 0;

        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % modes.length;
            setActiveMode(modes[currentIndex]);
            console.log(`[WisdomRotation] Switched to ${modes[currentIndex]}`);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    return { activeMode };
};

// Fallback local quotes if DB is unavailable or for variety
export const localQuotes = [
    { ar: "العلم صيدٌ والكتابة قيده.. قيّد صيودك بالجبال الواثقة", en: "Knowledge is prey, and writing is its shackle.. shacke your prey with trustworthy chains." },
    { ar: "ما الفضلُ إلا لأهلِ العلمِ إنهمُ.. على الهُدى لمن استهدى أدلاءُ", en: "Virtue belongs only to the people of knowledge, for they guide those who seek guidance." },
    { ar: "بقوة العلم تقوى شوكة الأمم.. فالحكم في الدهر منسوب إلى القلم", en: "By the power of knowledge, the strength of nations grows.. for judgment in time is attributed to the pen." },
    { ar: "الوقت كالسيف إن لم تقطعه قطعك", en: "Time is like a sword; if you do not cut it, it will cut you." }
];
