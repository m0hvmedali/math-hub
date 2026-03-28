import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Brain, CheckCircle, Network, Play, Square, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shimmer } from './ai-elements/shimmer';
import type { CompanionContentResult } from '../services/ai-router/studyCompanion';
import type { EvaluatorResult } from '../utils/aiSDK';
import { getPollinationsImageUrl, VoiceTutor, POLLINATIONS_KEY } from '../utils/pollinations';

interface StudyInfographicProps {
    topic: string;
    subject: string;
    language: 'arabic' | 'english';
    evalResult: EvaluatorResult;
    content: CompanionContentResult;
}

const UNDERSTANDING_LABEL: Record<string, { ar: string; en: string; color: string; pct: number }> = {
    none:    { ar: 'لا يوجد فهم',  en: 'No Grasp',      color: '#ef4444', pct: 10 },
    partial: { ar: 'فهم جزئي',     en: 'Partial Grasp', color: '#f59e0b', pct: 55 },
    full:    { ar: 'فهم كامل',     en: 'Full Grasp',    color: '#10b981', pct: 95 },
};
export const StudyInfographic = React.forwardRef<HTMLDivElement, StudyInfographicProps>(
    ({ topic, subject, language, evalResult, content }, ref) => {
        const [isSpeaking, setIsSpeaking] = React.useState(false);
        const [fastNote, setFastNote] = React.useState<string | null>(null);
        const [isLoadingNote, setIsLoadingNote] = React.useState(false);
        const isAr = language === 'arabic';
        const level = UNDERSTANDING_LABEL[evalResult.understanding] || UNDERSTANDING_LABEL.partial;

        const generateFastNote = async () => {
            setIsLoadingNote(true);
            try {
                const prompt = `Give me a very short, creative metaphor or analogy for ${topic} in ${isAr ? 'Arabic' : 'English'}. Be cinematic.`;
                const res = await fetch(`https://text.pollinations.ai/prompt/${encodeURIComponent(prompt)}?json=true&key=${POLLINATIONS_KEY}`);
                const text = await res.text();
                setFastNote(text);
            } catch (e) {
                console.error("Fast Note Error:", e);
            } finally {
                setIsLoadingNote(false);
            }
        };

        const toggleVoice = () => {
            if (isSpeaking) {
                VoiceTutor.stop();
                setIsSpeaking(false);
            } else {
                const textToSpeak = `${isAr ? 'ملخص دراسي لـ' : 'Study summary for'} ${topic}. ${content.summary}. ${content.points.map(p => p.text).join('. ')}`;
                VoiceTutor.speak(textToSpeak, isAr ? 'ar-EG' : 'en-US');
                setIsSpeaking(true);
            }
        };

        const headerImg = getPollinationsImageUrl(content.header_image_prompt || topic, { width: 1200, height: 400 });

        return (
            <div
                ref={ref}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                className="w-full bg-[#020205] text-white rounded-[2.5rem] overflow-hidden relative border border-white/5 shadow-2xl"
            >
                {/* Cinematic Header */}
                <div className="relative h-64 overflow-hidden group">
                    <img 
                        src={headerImg} 
                        alt={topic} 
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                        <div>
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-cyan mb-2"
                            >
                                AI Neural Summary Notebook
                            </motion.p>
                            <motion.h2 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl font-black text-white capitalize drop-shadow-lg"
                            >
                                {topic}
                            </motion.h2>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleVoice}
                            className={`p-4 rounded-2xl backdrop-blur-md border border-white/10 transition-all ${isSpeaking ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 hover:bg-brand-cyan/30'}`}
                        >
                            {isSpeaking ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </motion.button>
                    </div>
                </div>

                <div className="relative z-10 p-8 pt-4 space-y-10">
                    {/* Progress & Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                    <Brain className="w-3 h-3" />
                                    {isAr ? 'تحليل الإدراك' : 'Cognitive Analysis'}
                                </p>
                                <span className="text-xs font-bold" style={{ color: level.color }}>
                                    {isAr ? level.ar : level.en} · {level.pct}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${level.pct}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ background: level.color }}
                                />
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
                                <p className="text-lg text-gray-200 leading-relaxed font-medium italic">
                                    "{content.summary}"
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-brand-purple" />
                                {isAr ? 'المفاهيم المحورية' : 'Core Logic Nodes'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {content.nodes.slice(0, 10).map((node, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="px-3 py-1.5 text-[10px] font-black rounded-lg border uppercase tracking-widest"
                                        style={{
                                            background: `hsla(${(i * 47) % 360}, 70%, 50%, 0.1)`,
                                            borderColor: `hsla(${(i * 47) % 360}, 70%, 50%, 0.2)`,
                                            color: `hsl(${(i * 47) % 360}, 80%, 75%)`
                                        }}
                                    >
                                        {node.label}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Visual Key Takeaways - THE GRID */}
                    <div className="space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 px-2">
                            <CheckCircle className="w-3 h-3 text-accent-green" />
                            {isAr ? 'مذكرة النقاط المصورة' : 'Visual Key Takeaways'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {content.points.slice(0, 3).map((pt, i) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className="group relative h-64 rounded-3xl overflow-hidden border border-white/10"
                                >
                                    <img 
                                        src={getPollinationsImageUrl(pt.image_prompt, { width: 400, height: 400, seed: i })} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                                        alt={pt.text}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <span className="inline-block px-2 py-1 bg-brand-cyan/20 text-brand-cyan text-[8px] font-black uppercase tracking-widest rounded mb-2">
                                            Insight {i + 1}
                                        </span>
                                        <p className="text-sm font-bold text-white leading-tight">
                                            {pt.text}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Knowledge Gaps */}
                    {evalResult.missed_concepts?.length > 0 && (
                        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-[2rem]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                                    <Network className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                                        {isAr ? 'تحليل الفجوات المعرفية' : 'Neural Knowledge Gaps'}
                                    </p>
                                    <h4 className="text-sm font-bold text-white">
                                        {isAr ? 'مواضيع تتطلب تعميق البحث' : 'Suggested areas for reinforcement'}
                                    </h4>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {evalResult.missed_concepts.map((c, i) => (
                                    <span key={i} className="px-4 py-2 text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl uppercase tracking-widest hover:bg-red-500/20 transition-colors">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fast Note / Analogy Section */}
                    <div className="relative p-6 bg-brand-cyan/5 border border-brand-cyan/10 rounded-[2rem] overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="w-12 h-12 text-brand-cyan" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-cyan mb-2">
                                    {isAr ? 'الخلاصة الإبداعية' : 'Creative Neural Metaphor'}
                                </h4>
                                {isLoadingNote ? (
                                    <Shimmer className="h-4 w-full opacity-50">
                                        Synthesizing neural analogy...
                                    </Shimmer>
                                ) : (
                                    <p className="text-sm text-gray-300 font-medium">
                                        {fastNote || (isAr ? 'اضغط لتوليد تشبيه إبداعي للمفهوم...' : 'Click to generate a creative analogy for this concept...')}
                                    </p>
                                )}
                            </div>
                            {!fastNote && !isLoadingNote && (
                                <button 
                                    onClick={generateFastNote}
                                    className="px-6 py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-cyan/20 transition-all"
                                >
                                    {isAr ? 'توليد وميض ذكي' : 'Generate Flash'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/5 pt-6 flex justify-between items-center px-2">
                        <div className="flex items-center gap-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600">
                                Powered by Pollinations & MathHub Brain
                            </p>
                        </div>
                        <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">
                            Verified AI Report · {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium' })}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
);

StudyInfographic.displayName = 'StudyInfographic';

// ── Export Hook ─────────────────────────────────────────────────────────────
export function useInfographicExport() {
    const infographicRef = useRef<HTMLDivElement>(null);

    const exportAsPng = async (filename = 'study-companion-report') => {
        if (!infographicRef.current) return;
        try {
            const dataUrl = await toPng(infographicRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#050510',
                cacheBust: true,
                includeQueryParams: true,
            });
            const link = document.createElement('a');
            link.download = `${filename}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('[Infographic] Export failed:', err);
        }
    };

    return { infographicRef, exportAsPng };
}

// ── Export Button ────────────────────────────────────────────────────────────
export const ExportInfographicButton: React.FC<{
    onExport: () => void;
    language?: 'arabic' | 'english';
}> = ({ onExport, language = 'english' }) => (
    <button
        onClick={onExport}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 text-white border border-white/10 bg-white/5 hover:bg-brand-cyan/10 hover:border-brand-cyan/30"
    >
        <Download className="w-4 h-4" />
        {language === 'arabic' ? 'تصدير كصورة' : 'Export as PNG'}
    </button>
);
