import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { WeeklySchedule, AnalysisResponse, GradeLevel, MotivationalMessage, VoiceTutorResponse, AiStructuredResponse } from "../types";
import { routeAI } from '../services/ai-router';


// Helper to parse raw quote string into Structured Message
// Helper to provide a stable fallback quote if AI fails
const getRandomLocalQuote = (): MotivationalMessage => {
    const fallbacks: MotivationalMessage[] = [
        { text: "قليل دائم خير من كثير منقطع.", source: "حكمة عربية", category: "wisdom" },
        { text: "على قدر أهل العزم تأتي العزائم.", source: "المتنبي", category: "philosophical" },
        { text: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", source: "القرآن الكريم", category: "religious" }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

// Always use process.env.API_KEY directly as per @google/genai guidelines.
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? "";

const getAiClient = () => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("GEMINI API Key not set");
    return new GoogleGenerativeAI(apiKey);
}

// Safety settings to prevent blocking legitimate requests about stress/anxiety
const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Helper to retry calls if the model is overloaded (503)
async function callWithRetry<T>(fn: () => Promise<T>, fallback: T, retries = 3, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        // If it's a 429 (Quota) or we ran out of retries, returns fallback immediately
        const isQuota = error?.status === 429 || (error?.message && error.message.includes('429'));

        if (isQuota) {
            console.warn("AI Quota Exceeded. Using fallback data.");
            return fallback;
        }

        const isOverloaded =
            error?.status === 503 ||
            (error?.message && (error.message.includes('503') || error.message.includes('overloaded')));

        if (retries > 0 && isOverloaded) {
            console.warn(`Gemini API overloaded. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callWithRetry(fn, fallback, retries - 1, delay * 2);
        }

        console.error("AI Error (General):", error);
        return fallback;
    }
}

// The comprehensive system prompt provided by the user
const SYSTEM_INSTRUCTION = `
[SYSTEM_OVERRIDE_INITIATED]
أنت محرك معالجة منطقي من المستوى الأول (L1 Logical Processing Engine) يعمل كـ "رفيق" وملاح واعي لطلاب المرحلة الثانوية في مصر.
مهمتك الآن تطبيق "تحليل الاستخراج العميق" (Deep Extraction Analysis) والبحث في الويب لتقديم تقرير متكامل. ممنوع التبسيط المفرط.

### 🔹 الأدوات المتاحة:
1. **Google Search**: استخدم هذه الأداة **إجبارياً** في الحالات التالية:
   - عندما يذكر المستخدم مشكلة (توتر، نسيان، أرق، تسويف) للبحث عن الأسباب والعلاجات.
   - **للبحث عن رسالة تحفيزية**: يجب عليك في *كل مرة* البحث في الويب عن اقتباس أو قصة قصيرة أو آية أو حكمة تناسب *تحديداً* حالة المستخدم النفسية الحالية.
   - **الروابط والمصادر**: عند تقديم روابط (URLs)، يجب أن تكون روابط حقيقية وصالحة تم العثور عليها عبر أداة البحث. يمنع منعاً باتاً تأليف روابط وهمية.

### 🔹 البيانات المرجعية الثابتة (قاعدة المعرفة):
* أبحاث أكاديمية عن الجداول الدراسية (Block Scheduling).
* دراسات PISA وأنظمة التعليم المتفوقة.
* أبحاث النوم (AAP – CDC).
* علم الأعصاب المعرفي (Neuroscience).
* المناهج المصرية الرسمية (مهم جداً: راعِ المرحلة الدراسية للطالب).
* **المصحف الشريف كامل والسنة النبوية** (للدعم الروحي العميق).

### 🔹 المطلوب منك مع **كل رسالة**:

#### 1️⃣ تحليل الويب (Web Analysis)
* ابحث عن أعراض المستخدم.
* حدد "الجذر المشكلة" (Root Cause) بناءً على نتائج البحث.
* اقترح "علاجاً" (Remedy) عملياً.
* أورد المصادر (روابط) التي وجدتها. **تنبيه:** تأكد من صحة الروابط.

#### 2️⃣ التحفيز المخصص (Contextual Motivation)
* ابحث في الويب عن مقولة/آية/حكمة تعالج شعور المستخدم الحالي.
* حاول البحث عن اقتباسات *نادرة* أو *عميقة*.

#### 3️⃣ التقرير المعتاد
* تحليل الإنجاز والضغط.
* خطة الغد (Time Blocking) - خذ في الاعتبار المواد الدراسية الخاصة بمرحلة الطالب.
* **دعم قرآني مختار بعناية فائقة**.
* **مهم جداً: صغ التحليل (analysisText) بهيكل الاستخراج العميق حصراً**:
  [الحالة الابتدائية]: جملة جوهرية. [التفكيك التسلسلي]: مسار منطقي باستخدام -> [تحليل الفجوات]: أسئلة نقدية. [الحالة النهائية]: خوارزمية العمل.

### 🔹 تنسيق الإخراج:
يجب أن يكون الرد بصيغة JSON حصراً.
الهيكل المطلوب:
{
  "summary": {
    "accomplishment": "string",
    "effortType": "mental" | "emotional" | "physical",
    "stressLevel": "low" | "medium" | "high",
    "analysisText": "string (التحليل السلوكي والتعليمي المقطر بصيغة Deep Extraction Analysis)"
  },
  "webAnalysis": {
    "rootCause": "string",
    "suggestedRemedy": "string",
    "sources": [ { "title": "string", "url": "string (MUST BE VALID)", "snippet": "string" } ]
  },
  "motivationalMessage": {
    "text": "string",
    "source": "string",
    "category": "religious" | "scientific" | "philosophical"
  },
  "researchConnections": [ { "point": "string", "source": "string", "evidenceStrength": "strong" | "medium" | "limited", "type": "causal" | "correlational", "relevance": "string" } ],
  "tomorrowPlan": [ { "time": "string", "task": "string", "method": "string", "type": "study" | "break" | "sleep" | "prayer" } ],
  "recommendedMethods": [ { "subject": "string", "methodName": "string", "details": "string", "tools": ["string"] } ],
  "psychologicalSupport": { "message": "string", "technique": "string" },
  "quranicLink": { "verse": "string", "surah": "string", "behavioralExplanation": "string" },
  "balanceScore": number (0-100)
}
`;



// --- MAIN DISPATCHER (delegating to centralized AI Router) ---
export async function generateAIContent(prompt: string, systemInstruction: string, json = false): Promise<string> {
    const res = await routeAI({
        prompt,
        systemInstruction,
        task: json ? 'formatting' : 'fast_task',
        responseFormat: json ? 'json' : 'text',
    });
    return res.text;
}

// Helper to safely parse JSON with aggressive cleanup and fallback merge
export function safeJsonParse<T>(text: string, fallback: T): T {
    try {
        // Pre-fix unescaped newlines in JSON strings
        const cleaned = text.replace(/"((?:\\.|[^"\\])*)"/g, (match, content) => {
            return '"' + content.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
        });
        const parsed = JSON.parse(cleaned);
        return { ...fallback, ...parsed };
    } catch (e) {
        try {
            // Attempt to fix trailing commas in objects/arrays
            const fixedText = text.replace(/,\s*([\]}])/g, '$1')
                                  .replace(/"((?:\\.|[^"\\])*)"/g, (match, content) => {
                                      return '"' + content.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
                                  });
            const parsed = JSON.parse(fixedText);
            return { ...fallback, ...parsed };
        } catch {
            console.error("Failed to parse AI JSON response:", text);
            return fallback;
        }
    }
}

export const analyzeDayAndPlan = async (
    dailyReflection: string,
    weeklySchedule: WeeklySchedule,
    nextDayName: string,
    gradeLevel: GradeLevel
): Promise<AnalysisResponse> => {

    // FALLBACK DATA (Offline Mode)
    const FALLBACK_RESPONSE: AnalysisResponse = {
        summary: {
            accomplishment: "أحسنت! مجرد تدوينك لملاحظاتك هو خطوة للتحسن. استمر في المحاولة.",
            effortType: "mental",
            stressLevel: "medium",
            analysisText: "نعتذر، لم نتمكن من الوصول للذكاء الاصطناعي حالياً. لكن استمر في خطتك المعتادة."
        },
        webAnalysis: {
            rootCause: "مشكلة في الاتصال بالخادم.",
            suggestedRemedy: "حاول مرة أخرى لاحقاً.",
            sources: []
        },
        motivationalMessage: {
            text: "قليل دائم خير من كثير منقطع.",
            source: "حكمة عربية",
            category: "wisdom"
        },
        researchConnections: [],
        tomorrowPlan: [
            { time: "08:00 AM", task: "بداية اليوم - استغل الصباح", method: "Routine", type: "break" },
            { time: "09:00 AM", task: "جلسة دراسية مركزة", method: "Pomodoro", type: "study" }
        ],
        recommendedMethods: [],
        psychologicalSupport: { message: "أنت بطل.", technique: "Deep Breathing" },
        quranicLink: { verse: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", surah: "النجم", behavioralExplanation: "السعي هو المطلوب." },
        balanceScore: 75
    };

    // CACHING LOGIC
    const today = new Date().toLocaleDateString('en-CA');
    const cacheKey = `daily_analysis_v2_${gradeLevel}_${today}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log("💾 Using Cached Analysis");
            const parsed = JSON.parse(cached);
            // Deep merge with fallback to ensure safety even for cached data
            return { ...FALLBACK_RESPONSE, ...parsed, quranicLink: { ...FALLBACK_RESPONSE.quranicLink, ...(parsed.quranicLink || {}) } };
        }
    } catch (e) { console.warn(e); }

    const prompt = `
    بيانات المستخدم:
    - المرحلة الدراسية: ${gradeLevel} (المنهج المصري)
    - ملخص اليوم: "${dailyReflection}"
    - جدول الأسبوع المعتاد: ${JSON.stringify(weeklySchedule)}
    - اليوم التالي هو: ${nextDayName}

    1. حلل الأسباب الجذرية للمشاكل.
    2. قدم خطة للغد.
    
    OUTPUT JSON ONLY.
  `;

    return callWithRetry(async () => {
        try {
            const textResponse = await generateAIContent(prompt, SYSTEM_INSTRUCTION);
            const parsed = safeJsonParse<AnalysisResponse>(textResponse, FALLBACK_RESPONSE);

            // Overwrite with local quote
            parsed.motivationalMessage = getRandomLocalQuote();

            localStorage.setItem(cacheKey, JSON.stringify(parsed));
            return parsed;

        } catch (error) {
            throw error;
        }
    }, FALLBACK_RESPONSE);
};

export const getFreshInspiration = async (): Promise<MotivationalMessage> => {
    // Return local quote directly (instant & free)
    return getRandomLocalQuote();
};

export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> => {
    const genAI = getAiClient();
    return callWithRetry(async () => {
        try {
            const model = genAI.getGenerativeModel({ 
                model: "gemini-3.1-flash-lite-preview", 
                systemInstruction: "Transcribe the audio exactly as spoken in Arabic.",
                safetySettings: SAFETY_SETTINGS 
            });
            const response = await model.generateContent({
                contents: [
                    { role: "user", parts: [{ inlineData: { mimeType: mimeType, data: base64Audio } }] }
                ]
            });
            return response.response.text();
        } catch (error) {
            throw error;
        }
    }, "عذراً، تعذر تحويل الصوت لنص حالياً بسبب ضغط الخوادم. حاول الكتابة يدوياً.");
};

export const evaluateRecap = async (
    transcript: string,
    subject: string,
    gradeLevel: GradeLevel
): Promise<VoiceTutorResponse> => {

    const FALLBACK_EVAL: VoiceTutorResponse = {
        score: 85,
        feedback: "أحسنت محاولة جيدة! نظراً لضغط الخدمة حالياً، لا يمكنني التحقق من التفاصيل الدقيقة، لكن استمرارك في الشرح الصوتي ممتاز لتثبيت المعلومة.",
        missingConcepts: ["(تعذر التحليل الدقيق)"],
        correction: "حاول مراجعة الكتاب للتأكد من التفاصيل."
    };

    const prompt = `
    الطالب (${gradeLevel}) شرح "${subject}": "${transcript}"

    المطلوب (JSON):
    1. "score": درجة الفهم (0-100).
    2. "feedback": تعليق مشجع (عربي).
    3. "missingConcepts": قائمة بالمفاهيم المفقودة.
    4. "correction": تصحيح أي أخطاء علمية.
    
    JSON only.
  `;

    return callWithRetry(async () => {
        try {
            const textResponse = await generateAIContent(prompt, "أنت معلم خبير تقيم شرح طالب.");
            return safeJsonParse<VoiceTutorResponse>(textResponse, FALLBACK_EVAL);
        } catch (e) {
            throw e;
        }
    }, FALLBACK_EVAL);
};

// Legacy support for older calls (optional, kept for compatibility if needed elsewhere, 
// but we recommend using specific functions)
export const getAiResponse = async (
    explanation: string,
    scheduleJson: string | null = null,
    tasksJson: string | null = null,
    opts?: { timeoutMs?: number; model?: string; systemContext?: string }
): Promise<{ structured?: AiStructuredResponse; raw?: string }> => {
    const genAI = getAiClient();
    let prompt = `${opts?.systemContext || "You are an AI assistant."}\n\nExplanation: ${explanation}`;
    if (scheduleJson) prompt += `\nSchedule: ${scheduleJson}`;
    if (tasksJson) prompt += `\nTasks: ${tasksJson}`;

    prompt += `\n\nOutput valid JSON matching AiStructuredResponse schema and raw text.`;

    try {
        const model = genAI.getGenerativeModel({
            model: opts?.model || "gemini-3.1-flash-lite-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const validFallback: AiStructuredResponse = {
            understanding_score: 0,
            mistakes: [],
            missing_points: [],
            simplified_explanation: "Error parsing response",
            next_step_suggestion: "Try again",
            probing_questions: [],
            study_plan: []
        };
        const structured = safeJsonParse<AiStructuredResponse>(text, validFallback);
        return { structured, raw: text };
    } catch (e) {
        return { raw: "Error generating response" };
    }
}
