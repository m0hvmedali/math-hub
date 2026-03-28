import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Brain, CheckCircle, Network } from 'lucide-react';
import type { CompanionContentResult } from '../services/ai-router/studyCompanion';
import type { EvaluatorResult } from '../utils/aiSDK';

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
        const isAr = language === 'arabic';
        const level = UNDERSTANDING_LABEL[evalResult.understanding] || UNDERSTANDING_LABEL.partial;

        return (
            <div
                ref={ref}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                className="w-full bg-[#050510] text-white rounded-3xl overflow-hidden relative"
            >
                {/* Background blobs */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-cyan/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 p-8 space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-cyan mb-1">
                                AI Study Companion Report
                            </p>
                            <h2 className="text-3xl font-black text-white capitalize">{topic}</h2>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">{subject}</p>
                        </div>
                        <div className="text-right">
                            <div
                                className="text-4xl font-black"
                                style={{ color: level.color }}
                            >
                                {level.pct}%
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                                {isAr ? level.ar : level.en}
                            </p>
                        </div>
                    </div>

                    {/* Understanding Bar */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                            <Brain className="w-3 h-3" />
                            {isAr ? 'مستوى الفهم' : 'Understanding Level'}
                        </p>
                        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${level.pct}%`, background: level.color }}
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                            {isAr ? 'الملخص الذكي' : 'Smart Summary'}
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed">{content.summary}</p>
                    </div>

                    {/* Key Takeaways + Concepts Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Key Points */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-accent-green" />
                                {isAr ? 'النقاط الرئيسية' : 'Key Takeaways'}
                            </p>
                            <ul className="space-y-2">
                                {content.points.slice(0, 5).map((pt, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-gray-300">
                                        <span className="text-brand-cyan font-black shrink-0">{i + 1}.</span>
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Concept Nodes Grid */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Network className="w-3 h-3 text-brand-cyan" />
                                {isAr ? 'المفاهيم المحورية' : 'Core Concepts'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {content.nodes.slice(0, 8).map((node, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 text-xs font-bold rounded-xl border"
                                        style={{
                                            background: `hsla(${(i * 47) % 360}, 70%, 50%, 0.1)`,
                                            borderColor: `hsla(${(i * 47) % 360}, 70%, 50%, 0.3)`,
                                            color: `hsl(${(i * 47) % 360}, 80%, 75%)`
                                        }}
                                    >
                                        {node.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Missed Concepts */}
                    {evalResult.missed_concepts?.length > 0 && (
                        <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">
                                {isAr ? 'النقاط المفقودة' : 'Knowledge Gaps'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {evalResult.missed_concepts.map((c, i) => (
                                    <span key={i} className="px-3 py-1 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">
                            MathHub · AI Study Companion
                        </p>
                        <p className="text-[9px] text-gray-600 font-bold">
                            {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium' })}
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
