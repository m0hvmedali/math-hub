import { routeAI } from './index';

export interface EvaluatorResult {
    understanding: 'none' | 'partial' | 'full';
    missed_concepts: string[];
    keywords_for_rag: string[];
}

export interface CompanionPreferences {
    length: 'concise' | 'detailed';
    theme: 'dark' | 'light' | 'neon';
    tone: 'academic' | 'casual' | 'visual';
}

export interface CompanionContentResult {
    summary: string;
    points: string[];
    nodes: { id: string; label: string }[];
    edges: { source: string; target: string; label: string }[];
    practice_question: { q: string; options: string[]; answer: number };
}

/**
 * Phase 1 & 2: Evaluate Student Understanding
 */
export async function evaluateUnderstanding(
    topic: string, 
    level: string, 
    explanation: string, 
    language: 'arabic' | 'english'
): Promise<EvaluatorResult> {
    const prompt = `
    Analyze the student's explanation for the topic: "${topic}" (Level: ${level}).
    
    Student's Explanation: "${explanation}"
    
    Determine:
    1. Their level of understanding (none, partial, full).
    2. Exactly what concepts they missed or misunderstood.
    3. Essential keywords to search for to fill these gaps.
    
    Respond STRICTLY in JSON:
    {
      "understanding": "none" | "partial" | "full",
      "missed_concepts": ["concept 1", "concept 2"],
      "keywords_for_rag": ["x", "y"]
    }
    Ensure the JSON keys are exactly as requested. Translate concepts into the language: ${language}.
    `;

    const res = await routeAI({
        prompt,
        systemInstruction: "You are an expert instructional designer and cognitive psychologist analyzing student gaps.",
        task: 'brain',
        responseFormat: 'json'
    });

    try {
        return JSON.parse(res.text) as EvaluatorResult;
    } catch (e) {
        console.error("Evaluation Parse Error:", e, res.text);
        return {
            understanding: 'partial',
            missed_concepts: ['Unable to analyze gaps definitively. Please review core concepts.'],
            keywords_for_rag: [topic]
        };
    }
}

/**
 * Phase 4: Build Comprehensive Learning Content
 */
export async function buildCompanionContent(
    topic: string,
    evalResults: EvaluatorResult,
    prefs: CompanionPreferences,
    language: 'arabic' | 'english'
): Promise<CompanionContentResult> {
    
    const toneTarget = prefs.tone === 'casual' ? 'friendly, relatable, and simple' : 
                       prefs.tone === 'visual' ? 'highly descriptive and metaphorical' : 'academic and formal';

    const lengthTarget = prefs.length === 'concise' ? 'very brief, bulleted' : 'detailed, comprehensive';

    const prompt = `
    Build a structured learning response to address a student's knowledge gaps.
    
    Topic: "${topic}"
    Student's current understanding: ${evalResults.understanding}.
    Concepts they missed: ${evalResults.missed_concepts.join(', ')}.
    
    Instructions:
    1. Tone: ${toneTarget}.
    2. Length: ${lengthTarget}.
    3. Language: ${language}.
    4. Create a 'Summary' that directly corrects their missed concepts.
    5. Create 3-5 'points' of key takeaways.
    6. Design a Map Graph. Provide 'nodes' (id, label) and 'edges' (source, target, label) representing the concepts.
    7. Create 1 multiple-choice 'practice_question' to test their understanding.
    
    Respond STRICTLY in JSON:
    {
      "summary": "...",
      "points": ["...", "..."],
      "nodes": [{"id": "1", "label": "Concept A"}],
      "edges": [{"source": "1", "target": "2", "label": "relates to"}],
      "practice_question": {
          "q": "Question here?",
          "options": ["A", "B", "C", "D"],
          "answer": 0 // index of correct option
      }
    }
    `;

    const res = await routeAI({
        prompt,
        systemInstruction: "You are a world-class tutor generating precise, structured educational payloads. Output ONLY valid JSON.",
        task: 'lesson_explanation',
        responseFormat: 'json'
    });

    try {
        return JSON.parse(res.text) as CompanionContentResult;
    } catch (e) {
        console.error("Content Build Parse Error:", e, res.text);
        throw new Error("Failed to build reliable JSON educational content structure.");
    }
}
