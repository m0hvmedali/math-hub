/**
 * 🎨 Pollinations.ai Integration Utility
 * 
 * Provides static and dynamic methods to bridge Math Hub with Pollinations visuals.
 */

export const POLLINATIONS_BASE_IMAGE = 'https://image.pollinations.ai/prompt/';

/**
 * Generates a cinematic image URL for a given prompt.
 * Automatically appends high-quality parameters.
 * @param prompt - The visual description (best in English).
 * @param options - width, height, seed, etc.
 */
export function getPollinationsImageUrl(prompt: string, options: { width?: number; height?: number; nologo?: boolean; seed?: number } = {}) {
    const { width = 1024, height = 768, nologo = true, seed = Math.floor(Math.random() * 10000) } = options;
    
    // Clean and encode prompt
    const cleanPrompt = encodeURIComponent(prompt.trim());
    
    return `${POLLINATIONS_BASE_IMAGE}${cleanPrompt}?width=${width}&height=${height}&nologo=${nologo}&seed=${seed}&model=flux&key=${POLLINATIONS_KEY}`;
}

export const POLLINATIONS_KEY = 'sk_2QN0KMQFuzJo5NCVlaIoxMHruxaAAYA8';

/**
 * Generates a cinematic video URL via Pollinations.
 * Note: Video generation typically returns an MP4 file.
 */
export function getPollinationsVideoUrl(prompt: string) {
    // Pollinations video works best with English prompts
    const cleanPrompt = encodeURIComponent(prompt.trim());
    return `https://gen.pollinations.ai/video/${cleanPrompt}?key=${POLLINATIONS_KEY}`;
}

/**
 * Helper to generate a standardized prompt for "Scientific/Mathematical" scenes.
 */
export function generateScienceScene(topic: string, description: string): string {
    return `Cinematic 3D render of ${topic}, ${description}, futuristic laboratory aesthetic, glowing particles, deep purple and cyan lighting, hyper-realistic, 8k resolution, mathematical elegance.`;
}

/**
 * Voice Tutor Utility (Web Speech API Wrapper)
 */
export class VoiceTutor {
    private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    static speak(text: string, lang: 'ar-EG' | 'en-US' = 'ar-EG') {
        if (!this.synth) return;
        
        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;

        // Try to find a high-quality voice
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]) && (v.name.includes('Google') || v.name.includes('Natural')));
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        this.synth.speak(utterance);
    }

    static stop() {
        if (this.synth) this.synth.cancel();
    }
}
