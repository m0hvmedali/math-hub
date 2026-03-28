/**
 * 🎨 Pollinations.ai Integration Utility
 * 
 * Provides static and dynamic methods to bridge Math Hub with Pollinations visuals.
 */

export const POLLINATIONS_BASE_IMAGE = 'https://gen.pollinations.ai/image/';

/**
 * Generates a cinematic image URL for a given prompt.
 * Uses the LTX-2 model with enhancement for maximum fidelity.
 */
export function getPollinationsImageUrl(prompt: string, options: { width?: number; height?: number; seed?: number; enhance?: boolean } = {}) {
    const { width = 1280, height = 720, seed = Math.floor(Math.random() * 10000), enhance = true } = options;
    
    const cleanPrompt = encodeURIComponent(prompt.trim());
    return `${POLLINATIONS_BASE_IMAGE}${cleanPrompt}?model=ltx-2&width=${width}&height=${height}&seed=${seed}&enhance=${enhance}&key=${POLLINATIONS_KEY}`;
}

export const POLLINATIONS_KEY = 'sk_2QN0KMQFuzJo5NCVlaIoxMHruxaAAYA8';

/**
 * Generates a high-quality AI audio URL via Pollinations (Whisper/Echo).
 */
export function getPollinationsAudioUrl(text: string, voice: 'echo' | 'alloy' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'echo') {
    const cleanText = encodeURIComponent(text.trim());
    return `https://gen.pollinations.ai/audio/${cleanText}?model=whisper&voice=${voice}&key=${POLLINATIONS_KEY}`;
}

/**
 * Generates a cinematic video URL via Pollinations.
 */
export function getPollinationsVideoUrl(prompt: string, width = 1280, height = 720) {
    const cleanPrompt = encodeURIComponent(prompt.trim());
    return `https://gen.pollinations.ai/video/${cleanPrompt}?width=${width}&height=${height}&key=${POLLINATIONS_KEY}`;
}

/**
 * Helper to generate a standardized prompt for "Scientific/Mathematical" scenes.
 */
export function generateScienceScene(topic: string, description: string): string {
    return `Cinematic 3D render of ${topic}, ${description}, futuristic laboratory aesthetic, glowing particles, deep purple and cyan lighting, hyper-realistic, 8k resolution, mathematical elegance.`;
}

/**
 * Voice Tutor Utility (Web Speech & AI Audio Bridge)
 */
export class VoiceTutor {
    private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    private static currentAudio: HTMLAudioElement | null = null;

    /**
     * Plays high-quality AI generated voice (Whisper/Echo)
     */
    static async playAIVoice(text: string) {
        this.stop();
        const url = getPollinationsAudioUrl(text);
        this.currentAudio = new Audio(url);
        return this.currentAudio.play();
    }

    /**
     * Classic browser synthesis (Fallback)
     */
    static speak(text: string, lang: 'ar-EG' | 'en-US' = 'ar-EG') {
        if (!this.synth) return;
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]) && (v.name.includes('Google') || v.name.includes('Natural')));
        
        if (preferredVoice) utterance.voice = preferredVoice;
        this.synth.speak(utterance);
    }

    static stop() {
        if (this.synth) this.synth.cancel();
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }
}
