import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Lightbulb, CheckCircle, Navigation2, LayoutGrid, X, ImageDown, Network } from 'lucide-react';
import { Shimmer } from './ai-elements/shimmer';
import { OpenIn, OpenInContent, OpenInChatGPT, OpenInTrigger } from './ai-elements/open-in-chat';
import { Button } from './ui/button';

import { AICompanionInputForm, AICompanionFormData } from './AICompanionInputForm';
import { evaluateUnderstanding, buildCompanionContent } from '../services/ai-router/studyCompanion';
import type { CompanionContentResult } from '../services/ai-router/studyCompanion';
import type { EvaluatorResult } from '../utils/aiSDK';
import { StudyInfographic, ExportInfographicButton, useInfographicExport } from './StudyInfographic';

function getQuizBtnClass(sel: number | null, idx: number, correct: number): string {
    if (sel === null) return 'bg-black/30 hover:bg-black/50 border border-white/5 text-gray-200';
    if (idx === correct) return 'bg-accent-green/20 border border-accent-green text-accent-green';
    if (sel === idx)    return 'bg-red-500/20 border border-red-500 text-red-500';
    return 'bg-black/30 border border-white/5 opacity-40 text-gray-500';
}

type RightTab = 'map' | 'infographic';

export const AICompanionDashboard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [isLoading, setIsLoading]           = useState(false);
    const [statusText, setStatusText]         = useState('');
    const [evalResult, setEvalResult]         = useState<EvaluatorResult | null>(null);
    const [result, setResult]                 = useState<CompanionContentResult | null>(null);
    const [formData, setFormData]             = useState<AICompanionFormData | null>(null);
    const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
    const [rightTab, setRightTab]             = useState<RightTab>('map');

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const { infographicRef, exportAsPng } = useInfographicExport();

    const handleFormSubmit = async (data: AICompanionFormData) => {
        setIsLoading(true);
        setFormData(data);
        setResult(null);
        setEvalResult(null);
        setSelectedQuizAnswer(null);
        setRightTab('map');
        setStatusText(data.language === 'arabic' ? 'جاري تقييم مستوى الفهم...' : 'Evaluating Understanding...');

        try {
            // ── Phase 2: Evaluator Agent (via Vercel AI SDK generateObject) ──
            const ev = await evaluateUnderstanding(data.subject, data.level, data.explanation, data.language);
            setEvalResult(ev);

            setStatusText(data.language === 'arabic' ? 'جاري بناء المحتوى المخصص...' : 'Building Personalized Content...');

            // ── Phase 4: Content Builder Agent ──
            const built = await buildCompanionContent(data.subject, ev, data.preferences, data.language);
            setResult(built);

            // ── Transform to React Flow nodes/edges ──
            if (built.nodes && built.edges) {
                setNodes(built.nodes.map((n, i) => ({
                    id: n.id,
                    position: { x: (i % 3) * 220, y: Math.floor(i / 3) * 160 },
                    data: { label: n.label },
                    style: {
                        background: data.preferences.theme === 'neon' ? 'rgba(0,210,255,0.08)' : '#1a1a2e',
                        color: '#fff',
                        border: data.preferences.theme === 'neon' ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '10px 16px',
                        fontSize: '13px', fontWeight: 700,
                    }
                })));

                setEdges(built.edges.map((e, i) => ({
                    id: `e-${e.source}-${e.target}-${i}`,
                    source: e.source, target: e.target, label: e.label,
                    animated: true,
                    style: { stroke: '#00d2ff', strokeWidth: 2 },
                    labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 600 },
                })));
            }
        } catch (err) {
            console.error('Companion Error:', err);
            setStatusText(data.language === 'arabic' ? 'عذراً، حدث خطأ أثناء التحليل.' : 'Error during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    const lang = formData?.language ?? 'english';
    const isAr = lang === 'arabic';

    return (
        <div className="w-full min-h-[80vh] bg-[#0A0A0A] text-white p-6 md:p-10 rounded-[3rem] relative overflow-hidden border border-white/10 shadow-2xl">
            {onClose && (
                <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-full z-50">
                    <X className="w-6 h-6 text-gray-400" />
                </button>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-purple/5 pointer-events-none" />

            {/* ── Input Phase ── */}
            {!result && (
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full">
                        <AICompanionInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
                        {isLoading && (
                            <div className="mt-8 flex flex-col items-center">
                                <Shimmer className="text-center text-brand-cyan font-black tracking-widest uppercase text-sm mb-2">
                                    {statusText}
                                </Shimmer>
                                <div className="text-[10px] text-gray-500 animate-pulse">Neural Pathfinding in Progress...</div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* ── Result Phase ── */}
            {result && evalResult && formData && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8"
                    dir={isAr ? 'rtl' : 'ltr'}
                >
                    {/* ── Left Panel: Text, Takeaways, Quiz ── */}
                    <div className="lg:col-span-1 space-y-5 flex flex-col overflow-y-auto max-h-[85vh] custom-scrollbar pr-1">
                        <h2 className="text-xl font-black text-brand-cyan uppercase tracking-wide flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            {isAr ? 'تقرير الرفيق الذكي' : 'Smart Tutor Report'}
                        </h2>

                        {/* Summary */}
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {isAr ? 'الملخص' : 'Summary'}
                            </p>
                            <p className="text-sm text-gray-200 leading-relaxed">{result.summary}</p>
                            <div className="mt-4 flex justify-end">
                                <OpenIn query={`Study Topic: ${formData.subject}\n\nSummary: ${result.summary}\n\nKey Points: ${result.points.join(', ')}`}>
                                    <OpenInTrigger>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                                            {isAr ? 'تعمق أكثر في ChatGPT' : 'Dive Deeper in ChatGPT'}
                                        </Button>
                                    </OpenInTrigger>
                                    <OpenInContent>
                                        <OpenInChatGPT />
                                    </OpenInContent>
                                </OpenIn>
                            </div>
                        </div>

                        {/* Key Takeaways */}
                        <div className="bg-brand-purple/10 border border-brand-purple/20 p-5 rounded-2xl">
                            <p className="text-[10px] font-bold text-brand-purple uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Navigation2 className="w-3.5 h-3.5" />
                                {isAr ? 'النقاط الرئيسية' : 'Key Takeaways'}
                            </p>
                            <ul className="space-y-2">
                                {result.points.map((pt, i) => (
                                    <li key={i} className="flex gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                                        <span className="text-gray-300">{pt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Practice Quiz */}
                        {result.practice_question && (
                            <div className="bg-accent-green/10 border border-accent-green/20 p-5 rounded-2xl">
                                <p className="text-[10px] font-bold text-accent-green uppercase tracking-widest mb-3">
                                    {isAr ? 'اختبر نفسك' : 'Quick Challenge'}
                                </p>
                                <p className="font-bold text-sm mb-3">{result.practice_question.q}</p>
                                <div className="space-y-2">
                                    {result.practice_question.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            disabled={selectedQuizAnswer !== null}
                                            onClick={() => setSelectedQuizAnswer(i)}
                                            className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all ${getQuizBtnClass(selectedQuizAnswer, i, result.practice_question.answer)}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => { setResult(null); setEvalResult(null); setSelectedQuizAnswer(null); }}
                            className="w-full py-3 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-gray-400"
                        >
                            ↩ {isAr ? 'مفهوم جديد' : 'Start New Concept'}
                        </button>
                    </div>

                    {/* ── Right Panel: Tab: Map | Infographic ── */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Tab Bar */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRightTab('map')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${rightTab === 'map' ? 'bg-brand-cyan/20 border border-brand-cyan/40 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}
                            >
                                <Network className="w-4 h-4" />
                                {isAr ? 'الخريطة المفاهيمية' : 'Concept Map'}
                            </button>
                            <button
                                onClick={() => setRightTab('infographic')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${rightTab === 'infographic' ? 'bg-brand-purple/20 border border-brand-purple/40 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                {isAr ? 'الإنفوجرافيك' : 'Infographic'}
                            </button>
                            {rightTab === 'infographic' && (
                                <div className="ml-auto">
                                    <ExportInfographicButton
                                        language={lang}
                                        onExport={() => exportAsPng(`${formData.subject}-study`)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Map Panel */}
                        {rightTab === 'map' && (
                            <div className="bg-[#050505] rounded-3xl border border-white/10 overflow-hidden min-h-[500px] relative">
                                <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                    <Network className="w-4 h-4 text-brand-cyan" />
                                    <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Concept Map</span>
                                </div>
                                <ReactFlow
                                    nodes={nodes} edges={edges}
                                    onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                                    fitView className="bg-transparent"
                                >
                                    <Background color="#fff" variant={BackgroundVariant.Dots} gap={24} size={1} style={{ opacity: 0.04 }} />
                                    <Controls />
                                    <MiniMap className="bg-black/50 border border-white/10 rounded-xl" nodeStrokeColor="#00d2ff" nodeColor="rgba(0,210,255,0.2)" />
                                </ReactFlow>
                            </div>
                        )}

                        {/* Infographic Panel */}
                        {rightTab === 'infographic' && (
                            <div className="overflow-y-auto max-h-[75vh] rounded-3xl">
                                <StudyInfographic
                                    ref={infographicRef}
                                    topic={formData.subject}
                                    subject={formData.level}
                                    language={lang}
                                    evalResult={evalResult}
                                    content={result}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
