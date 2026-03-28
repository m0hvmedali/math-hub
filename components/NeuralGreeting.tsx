import React, { useState, useEffect } from 'react';
import { CinematicPresentation } from './CinematicPresentation';
import { useCosmicStore } from '../store/useCosmicStore';

export const NeuralGreeting: React.FC<{ user: string | null; isAr: boolean }> = ({ user, isAr }) => {
    const [showGreeting, setShowGreeting] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [overlayText, setOverlayText] = useState('');
    const shipProgress = useCosmicStore(state => state.shipProgress);

    useEffect(() => {
        if (!user) return;

        const lastSeen = localStorage.getItem('last_neuro_greeting');
        const today = new Date().toDateString();

        if (lastSeen !== today) {
            const isFirstTime = !localStorage.getItem('first_welcome_seen');
            
            if (isFirstTime) {
                setPrompt(`Cinematic high-tech welcome video for a student named ${user} entering a futuristic floating math laboratory in cosmos, 8k, unreal engine 5 style`);
                setOverlayText(isAr ? `أهلاً بك يا ${user} في مجرة الإبداع` : `Welcome to the Galaxy, ${user}`);
                localStorage.setItem('first_welcome_seen', 'true');
            } else {
                setPrompt(`Triumphant achievement reel in space, futuristic UI elements showing progress, golden light, ${shipProgress}% goal reached, cinematic 8k`);
                setOverlayText(isAr ? `مستوى تقدمك الحالي: ${shipProgress}%` : `Neural Progress: ${shipProgress}%`);
            }

            setShowGreeting(true);
            localStorage.setItem('last_neuro_greeting', today);
        }
    }, [user, shipProgress, isAr]);

    if (!showGreeting) return null;

    return (
        <CinematicPresentation 
            prompt={prompt} 
            overlayText={overlayText} 
            onComplete={() => setShowGreeting(false)} 
            duration={6000}
        />
    );
};
