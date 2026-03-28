/**
 * 🧠 AI Study Companion — Service Layer v2
 * 
 * Upgraded to use Vercel AI SDK's generateObject (Zod-validated).
 * Falls back to routeAI + JSON if SDK is unavailable.
 */

import {
    generateSDKObject,
    EvaluatorSchema,
    CompanionContentSchema,
    type EvaluatorResult,
    type CompanionContent,
} from '../../utils/aiSDK';

export type { EvaluatorResult, CompanionContent as CompanionContentResult };

export interface CompanionPreferences {
    length: 'concise' | 'detailed';
    theme: 'dark' | 'light' | 'neon';
    tone: 'academic' | 'casual' | 'visual';
}

// ── Phase 2: Evaluator Agent ─────────────────────────────────────────────────
export async function evaluateUnderstanding(
    topic: string,
    level: string,
    explanation: string,
    language: 'arabic' | 'english'
): Promise<EvaluatorResult> {
    return generateSDKObject({
        schema: EvaluatorSchema,
        system: 'You are an expert instructional designer and cognitive psychologist analyzing student comprehension gaps.',
        prompt: `
Analyze the student's explanation for the topic: "${topic}" (Level: ${level}).

Student's Explanation: "${explanation}"

Determine:
1. Their level of understanding (none, partial, full).
2. Exactly what concepts they missed or misunderstood.
3. Essential keywords to search for to fill the gaps.

Translate all concept names and keywords into: ${language}.
        `.trim(),
        fallback: {
            understanding: 'partial',
            missed_concepts: ['Unable to analyze. Please review core concepts.'],
            keywords_for_rag: [topic],
        },
    });
}

// ── Phase 4: Content Builder Agent ──────────────────────────────────────────
export async function buildCompanionContent(
    topic: string,
    evalResults: EvaluatorResult,
    prefs: CompanionPreferences,
    language: 'arabic' | 'english'
): Promise<CompanionContent> {
    const tone  = prefs.tone === 'casual' ? 'friendly and simple' :
                  prefs.tone === 'visual' ? 'highly descriptive and metaphorical' : 'academic and formal';
    const length = prefs.length === 'concise' ? 'very brief and bulleted' : 'detailed and comprehensive';

    return generateSDKObject({
        schema: CompanionContentSchema,
        system: 'You are a world-class tutor. Output ONLY a structured educational JSON payload. Be precise and concise.',
        prompt: `
Build a structured learning response to address a student's knowledge gaps.

Topic: "${topic}"
Student understanding level: ${evalResults.understanding}.
Concepts they missed: ${evalResults.missed_concepts.join(', ')}.

Instructions:
- Tone: ${tone}.
- Length: ${length}.
- Language: ${language}.
- Write a "summary" that directly corrects their missed concepts.
- Create a "header_image_prompt" in EN: a cinematic, high-quality visual description of the topic (e.g. "Space-time curvature with glowing grids").
- List 3-5 actionable "points", each with a "text" and a "image_prompt" (short EN description for visuals).
- Design a concept map: provide "nodes" and "edges".
- Create 1 multiple-choice "practice_question".
        `.trim(),
        fallback: {
            summary: `Core concept summary for: ${topic}`,
            header_image_prompt: `Cinematic 3D render of ${topic}`,
            points: [{ text: 'Review the fundamentals', image_prompt: 'Foundation icon' }],
            nodes: [{ id: '1', label: topic }],
            edges: [],
            practice_question: {
                q: `What is the core principle of ${topic}?`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                answer: 0,
            },
        },
    });
}
