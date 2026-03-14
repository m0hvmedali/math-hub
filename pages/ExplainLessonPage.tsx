// src/pages/ExplainLessonPage.tsx
import React, { useState, useMemo, useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAiResponse } from "../utils/aiHelper";
import { AiStructuredResponse } from "../types";
import { AppContext } from "../App";
import { SparkleIcon, ChevronRightIcon, BeakerIcon } from "../components/Icons";

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

const ExplainLessonPage: React.FC = () => {
    const { language } = useContext(AppContext);
    const [explanation, setExplanation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [structured, setStructured] = useState<AiStructuredResponse | null>(null);
    const [rawResponse, setRawResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const wordCount = useMemo(() => {
        return explanation.trim() ? explanation.trim().split(/\s+/).length : 0;
    }, [explanation]);

    const handleExplain = async () => {
        if (!explanation.trim()) return;
        setIsLoading(true);
        setStructured(null);
        setRawResponse(null);
        setError(null);

        try {
            const { structured: s, raw } = await getAiResponse(
                explanation,
                null,
                null,
                { timeoutMs: 30000 }
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

    return (
        <div className="p-6 md:p-16 max-w-[1200px] mx-auto min-h-screen animate-premium-fade">
            
            {/* Professor AI Header */}
            <header className="mb-20 relative">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-brand-purple/10 blur-[120px] rounded-full -z-10" />
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-magenta flex items-center justify-center shadow-glow-brand">
                        <SparkleIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.4em] text-brand-magenta uppercase font-outfit">Neural Professor v4.0</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-6">
                    {language === 'ar' ? 'البروفيسور AI' : 'Explain Lab'}<span className="text-brand-magenta">.</span>
                </h1>
                <p className="text-gray-500 font-bold max-w-xl text-lg">
                    {language === 'ar' ? 'اشرح ما فهمته اليوم، وسيقوم البروفيسور بتقييم استيعابك وتصحيح مفاهيمك.' : 'Transcribe your internal understanding into the engine. The Professor will analyze your cognitive grasp.'}
                </p>
            </header>

            <div className="grid grid-cols-1 gap-16">
                
                {/* Input Section */}
                <section className="bg-cinematic-card border border-white/5 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-brand-purple/5 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-magenta" />
                                    {language === 'ar' ? 'محتوى الشرح الخاص بك' : 'Cognitive Content'}
                                </h2>
                                <div className="flex items-center gap-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                    <span>Words: <span className="text-white">{wordCount}</span></span>
                                    <span>{isArabic(explanation) ? "ARABIC DETECTED" : "LATIN DETECTED"}</span>
                                </div>
                            </div>
                            <textarea
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                placeholder={language === 'ar' ? 'اشرح هنا كل ما يدور في ذهنك حول الدرس...' : 'Start your internal debrief here. Be as detailed as possible...'}
                                className="w-full bg-black/40 border-2 border-white/5 rounded-3xl p-8 text-white focus:border-brand-magenta outline-none h-64 md:h-80 resize-none transition-all font-bold placeholder:text-gray-800 text-lg leading-relaxed focus:bg-black/60 focus:ring-4 focus:ring-brand-magenta/5"
                            />
                        </div>

                        <button
                            onClick={handleExplain}
                            disabled={isLoading || !explanation.trim()}
                            className="w-full bg-gradient-to-r from-brand-purple to-brand-magenta group relative py-6 md:py-8 rounded-[2rem] font-black text-white text-2xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:hover:scale-100 shadow-[0_20px_50px_rgba(168,85,247,0.3)] hover:shadow-glow-brand"
                        >
                            <div className="flex items-center justify-center gap-4">
                                {isLoading ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>{language === 'ar' ? 'جاري تحليل النبضات العصبية...' : 'ANALYZING NEURAL PULSES...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{language === 'ar' ? 'إرسال للبروفيسور AI' : 'SUBMIT TO PROFESSOR AI'}</span>
                                        <ChevronRightIcon className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </section>

                {error && <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl text-red-500 font-black text-center animate-shake">{error}</div>}

                {/* Analysis Results */}
                {structured && (
                    <div className="space-y-12 animate-fade-in-up">
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{language === 'ar' ? 'نتائج التقييم العصبي' : 'Neural Evaluation Protocol'}</span>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                            
                            {/* Score Card */}
                            <div className="md:col-span-4 bg-cinematic-card border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="relative">
                                    <svg className="w-40 h-40 transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                        <circle 
                                            cx="80" cy="80" r="70" 
                                            fill="transparent" 
                                            stroke="currentColor" 
                                            strokeWidth="12" 
                                            strokeDasharray={440} 
                                            strokeDashoffset={440 - (440 * structured.understanding_score) / 10} 
                                            className="text-brand-magenta transition-all duration-[2000ms] ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-6xl font-black text-white">{structured.understanding_score}</span>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Score / 10</span>
                                    </div>
                                    <div className="absolute inset-0 bg-brand-magenta/20 blur-[60px] rounded-full -z-10" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                                    {structured.understanding_score >= 8 ? (language === 'ar' ? 'استيعاب فائق' : 'Apex Grasp') :
                                     structured.understanding_score >= 5 ? (language === 'ar' ? 'استيعاب متوسط' : 'Core Grasp') :
                                     (language === 'ar' ? 'يحتاج مراجعة' : 'Critical Sync Required')}
                                </h3>
                            </div>

                            {/* Details Grid */}
                            <div className="md:col-span-8 space-y-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    {/* Mistakes */}
                                    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-4">
                                        <h4 className="text-[10px] font-black text-brand-magenta uppercase tracking-widest">Conceptual Hazards</h4>
                                        <ul className="space-y-4">
                                            {structured.mistakes.length ? structured.mistakes.map((m, i) => (
                                                <li key={i} className="flex gap-3 text-sm font-bold text-gray-400 group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-none" />
                                                    {m}
                                                </li>
                                            )) : <li className="text-gray-600 italic">No hazards detected.</li>}
                                        </ul>
                                    </div>

                                    {/* Missing Points */}
                                    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-4">
                                        <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">Missing Synapses</h4>
                                        <ul className="space-y-4">
                                            {structured.missing_points.length ? structured.missing_points.map((m, i) => (
                                                <li key={i} className="flex gap-3 text-sm font-bold text-gray-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 flex-none" />
                                                    {m}
                                                </li>
                                            )) : <li className="text-gray-600 italic">Transmission complete.</li>}
                                        </ul>
                                    </div>
                                </div>

                                {/* Simplified Explanation */}
                                <div className="bg-white/5 border border-white/5 rounded-[2rem] p-10 space-y-6">
                                    <h4 className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Optimized Debrief</h4>
                                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-bold leading-loose selection:bg-brand-cyan/30">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{structured.simplified_explanation}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>

                            {/* Deep Probing / Questions */}
                            <div className="col-span-1 md:col-span-12 bg-cinematic-card border border-white/5 rounded-[2.5rem] p-10 md:p-14">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-10 text-center">Neural Challenges</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {structured.probing_questions.map((q, i) => (
                                        <div key={i} className="group cursor-default">
                                            <div className="text-4xl font-black text-white/10 mb-4 group-hover:text-brand-magenta transition-colors">0{i+1}</div>
                                            <p className="text-lg font-black text-white leading-relaxed font-almarai">{q}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Study Plan */}
                            <div className="col-span-1 md:col-span-12 space-y-8">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Recovery Protocol (Study Plan)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {structured.study_plan.map((p, i) => (
                                        <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:bg-white/[0.08] transition-all group">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="px-4 py-1.5 bg-brand-purple/20 text-brand-purple text-[10px] font-black rounded-full uppercase tracking-widest">
                                                    {p.duration_minutes}m Session
                                                </div>
                                                <BeakerIcon className="w-5 h-5 text-gray-700 group-hover:text-brand-purple transition-colors" />
                                            </div>
                                            <h5 className="text-xl font-black text-white mb-3 font-almarai">{p.title}</h5>
                                            <p className="text-sm text-gray-500 font-bold mb-6 leading-relaxed">{p.why}</p>
                                            {p.tasks && (
                                                <ul className="space-y-3">
                                                    {p.tasks.map((t, idx) => (
                                                        <li key={idx} className="flex items-center gap-3 text-xs font-black text-gray-400">
                                                            <div className="w-1 h-1 rounded-full bg-brand-purple" />
                                                            {t}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplainLessonPage;
