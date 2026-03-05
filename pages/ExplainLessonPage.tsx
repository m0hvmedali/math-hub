// src/pages/ExplainLessonPage.tsx
import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAiResponse } from "../utils/aiHelper";
import { AiStructuredResponse } from "../types";

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

const ExplainLessonPage: React.FC = () => {
    const [explanation, setExplanation] = useState("");
    const [scheduleJson, setScheduleJson] = useState(""); // paste a JSON schedule for testing
    const [tasksJson, setTasksJson] = useState(""); // paste a JSON tasks list for testing
    const [isLoading, setIsLoading] = useState(false);
    const [structured, setStructured] = useState<AiStructuredResponse | null>(null);
    const [rawResponse, setRawResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState("");

    const wordCount = useMemo(() => {
        return explanation.trim() ? explanation.trim().split(/\s+/).length : 0;
    }, [explanation]);

    const saveKey = () => {
        if (apiKeyInput.trim()) {
            localStorage.setItem("GROQ_API_KEY", apiKeyInput.trim());
            setApiKeyInput("");
            alert("API key saved locally. (You can remove it later from localStorage)");
        }
    };

    const handleExplain = async () => {
        if (!explanation.trim()) return;
        setIsLoading(true);
        setStructured(null);
        setRawResponse(null);
        setError(null);

        try {
            const { structured: s, raw } = await getAiResponse(
                explanation,
                scheduleJson || null,
                tasksJson || null,
                {
                    timeoutMs: 30000,
                    // you can override model here if needed
                }
            );

            if (s) {
                setStructured(s);
            } else if (raw) {
                setRawResponse(raw);
            } else {
                setError("No response from AI.");
            }
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const reExplainPrompt = async () => {
        if (!structured) return;
        // Ask the AI to give a shorter clearer version based on simplified_explanation
        setIsLoading(true);
        setError(null);
        try {
            const followUp = `Please provide a concise 2-3 sentence version of the simplified explanation shown, in the same language. Source: ${structured.simplified_explanation}`;
            const { structured: s2, raw } = await getAiResponse(followUp, null, null, { timeoutMs: 15000 });
            // s2 may not match schema, show raw if no structured
            if (s2) {
                // if model returned same schema, reuse simplified_explanation
                setStructured(prev => prev && { ...prev, simplified_explanation: (s2 as any).simplified_explanation || structured.simplified_explanation });
            } else if (raw) {
                setStructured(prev => prev && { ...prev, simplified_explanation: raw });
            }
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen text-white">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold mb-2">Explain Your Lesson — Professor AI</h1>
                <p className="text-gray-300">اكتب شرحك هنا وسنقيّم الفهم ونقترح خطة دراسة قصيرة مرتبطة بجدولك.</p>
            </header>

            <section className="grid gap-6">
                <div className="bg-space-900 border border-space-800 rounded-2xl p-5">
                    <label className="block mb-2 font-medium">Paste your API key (optional) &nbsp;<span className="text-sm text-gray-400">(saved to localStorage)</span></label>
                    <div className="flex gap-2">
                        <input className="flex-1 rounded-lg p-2 bg-space-950 text-white" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="Paste GROQ API key here" />
                        <button className="px-4 py-2 bg-neon-violet rounded-lg" onClick={saveKey}>Save Key</button>
                    </div>
                </div>

                <div className="bg-space-900 border border-space-800 rounded-2xl p-5">
                    <label className="block mb-2 font-medium">Explain the concept (text):</label>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder={isArabic(explanation || "") ? "اشرح هنا..." : "Start typing your explanation..."}
                        className="w-full h-56 bg-space-950 rounded-xl p-4 text-white focus:outline-none"
                    />
                    <div className="mt-2 flex justify-between items-center text-sm text-gray-400">
                        <div>Words: {wordCount}</div>
                        <div>Language: {isArabic(explanation) ? "العربية" : "English / Other"}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <textarea value={scheduleJson} onChange={(e) => setScheduleJson(e.target.value)} placeholder='Optional: paste schedule JSON e.g. {"today":["17:00-18:00"]}' className="col-span-1 md:col-span-1 h-24 p-3 bg-space-950 rounded-lg text-white" />
                        <textarea value={tasksJson} onChange={(e) => setTasksJson(e.target.value)} placeholder='Optional: paste tasks JSON e.g. [{"title":"Revise Newton","due":"2026-02-20"}]' className="col-span-1 md:col-span-1 h-24 p-3 bg-space-950 rounded-lg text-white" />
                        <div className="flex items-end">
                            <button
                                onClick={handleExplain}
                                disabled={isLoading || !explanation.trim()}
                                className="w-full bg-neon-violet rounded-lg py-3 font-semibold disabled:opacity-50"
                            >
                                {isLoading ? "Analyzing..." : "Submit to Professor AI"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Response */}
                <div>
                    {error && <div className="bg-red-700 p-4 rounded-lg text-white mb-4">Error: {error}</div>}

                    {structured ? (
                        <div className="bg-space-900 border border-space-800 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">تقييم البروفيسور</h2>
                                <div className="text-sm text-gray-300">مستوى الفهم: {structured.understanding_score}/10</div>
                            </div>

                            <section>
                                <h3 className="font-medium">أخطاء مفاهيمية</h3>
                                <ul className="list-disc list-inside text-gray-300">
                                    {structured.mistakes.length ? structured.mistakes.map((m, i) => <li key={i}>{m}</li>) : <li>None detected</li>}
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-medium">نقاط ناقصة</h3>
                                <ul className="list-disc list-inside text-gray-300">
                                    {structured.missing_points.length ? structured.missing_points.map((m, i) => <li key={i}>{m}</li>) : <li>None</li>}
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-medium">تبسيط الفكرة</h3>
                                <div className="prose prose-invert">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{structured.simplified_explanation}</ReactMarkdown>
                                </div>
                                <div className="mt-2">
                                    <button className="px-3 py-2 bg-space-800 rounded-lg" onClick={reExplainPrompt}>Shorten further</button>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-medium">3 أسئلة عميقة</h3>
                                <ol className="list-decimal list-inside text-gray-300">
                                    {structured.probing_questions.map((q, i) => <li key={i}>{q}</li>)}
                                </ol>
                            </section>

                            <section>
                                <h3 className="font-medium">خطة دراسة مقترحة / Study plan</h3>
                                <div className="space-y-2">
                                    {structured.study_plan.map((p, i) => (
                                        <div key={i} className="p-3 bg-space-950 rounded-md">
                                            <div className="font-semibold">{p.title} — {p.duration_minutes} min</div>
                                            <div className="text-sm text-gray-300">{p.why}</div>
                                            {p.when_suggestion && <div className="text-xs text-gray-400 mt-1">Suggested: {p.when_suggestion}</div>}
                                            {p.tasks && p.tasks.length > 0 && (
                                                <ul className="list-disc list-inside text-gray-300 mt-2">
                                                    {p.tasks.map((t, idx) => <li key={idx}>{t}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {structured.raw_md && (
                                <section>
                                    <h3 className="font-medium">Raw feedback (markdown)</h3>
                                    <div className="prose prose-invert">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{structured.raw_md}</ReactMarkdown>
                                    </div>
                                </section>
                            )}
                        </div>
                    ) : rawResponse ? (
                        <div className="bg-space-900 border border-space-800 rounded-2xl p-6">
                            <h2 className="text-xl font-semibold">Raw AI Response</h2>
                            <pre className="whitespace-pre-wrap text-sm text-gray-300">{rawResponse}</pre>
                        </div>
                    ) : (
                        <div className="text-gray-400">No feedback yet. Submit your explanation to get an evaluation.</div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ExplainLessonPage;
