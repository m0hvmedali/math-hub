/**
 * 🧠 Vercel AI SDK — Central Integration Layer
 * 
 * Provides:
 *  - generateObject<T>  → type-safe structured output via Zod schemas
 *  - streamAIText       → streaming text via Google AI provider
 *  - routeObject<T>     → falls back to routeAI if @ai-sdk/google fails
 *
 * Used by all AI consumers across the project.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject as aiGenerateObject, streamText as aiStreamText } from 'ai';
import { z } from 'zod';
import { routeAI } from '../services/ai-router';

// ── Google Provider Instance ────────────────────────────────────────────────
const getGoogleProvider = () => {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set');
    return createGoogleGenerativeAI({ apiKey });
};

const GOOGLE_MODEL_ID = 'gemini-2.0-flash';

// ── generateObject: Type-Safe Structured Output ─────────────────────────────
/**
 * Generates a structured object guaranteed to match the Zod schema.
 * Falls back to routeAI + manual JSON parse on failure.
 */
export async function generateSDKObject<T>(options: {
    schema: z.ZodType<T>;
    prompt: string;
    system?: string;
    fallback: T;
}): Promise<{ object: T; provider: string }> {
    try {
        const res = await routeAI({
            prompt: options.prompt,
            systemInstruction: (options.system || '') + "\n\nCRITICAL: Respond ONLY with a valid raw JSON object. No conversational filler, no markdown blocks (```), no headers (###). The response must be parsable by JSON.parse() immediately.",
            task: 'formatting',
            responseFormat: 'json',
        });
        
        return { 
            object: options.schema.parse(JSON.parse(res.text)), 
            provider: res.provider 
        };
    } catch (err) {
        console.error('[AI SDK] Resilience route failed:', err);
        return { object: options.fallback, provider: 'fallback-static' };
    }
}

// ── streamText: For streamed plain text ─────────────────────────────────────
export async function streamSDKText(options: {
    prompt: string;
    system?: string;
    onChunk: (chunk: string) => void;
    onDone: (full: string) => void;
}): Promise<void> {
    try {
        const google = getGoogleProvider();
        const { textStream } = await aiStreamText({
            model: google(GOOGLE_MODEL_ID),
            system: (options.system || '') + "\n\nNote: Provide direct information concisely.",
            prompt: options.prompt,
        });
        let full = '';
        for await (const chunk of textStream) {
            full += chunk;
            options.onChunk(chunk);
        }
        options.onDone(full);
    } catch (err) {
        console.warn('[AI SDK] streamText failed, using routeAI:', err);
        const res = await routeAI({
            prompt: options.prompt,
            systemInstruction: options.system,
            task: 'fast_task',
        });
        options.onDone(res.text);
    }
}

// ── Common Zod Schemas shared across the project ────────────────────────────

export const EvaluatorSchema = z.object({
    understanding: z.enum(['none', 'partial', 'full']),
    missed_concepts: z.array(z.string()),
    keywords_for_rag: z.array(z.string()),
});

export const CompanionContentSchema = z.object({
    summary: z.string(),
    header_image_prompt: z.string().describe("English prompt for Pollinations cinematic background image"),
    points: z.array(z.object({
        text: z.string(),
        image_prompt: z.string().describe("Short English visual prompt for this point"),
    })),
    nodes: z.array(z.object({ id: z.string(), label: z.string() })),
    edges: z.array(z.object({
        source: z.string(),
        target: z.string(),
        label: z.string()
    })),
    practice_question: z.object({
        q: z.string(),
        options: z.array(z.string()),
        answer: z.number(),
    }),
});

export const EvaluateRecapSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    missingConcepts: z.array(z.string()),
    correction: z.string(),
});

export type EvaluatorResult   = z.infer<typeof EvaluatorSchema>;
export type CompanionContent  = z.infer<typeof CompanionContentSchema>;
export type EvaluateRecapResult = z.infer<typeof EvaluateRecapSchema>;
