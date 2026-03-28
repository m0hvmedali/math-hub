import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Lightbulb, CheckCircle, Navigation2, LayoutGrid, X } from 'lucide-react';

import { AICompanionInputForm, AICompanionFormData } from './AICompanionInputForm';
import { evaluateUnderstanding, buildCompanionContent, CompanionContentResult } from '../services/ai-router/studyCompanion';

function getQuizBtnClass(selectedAnswer: number | null, btnIndex: number, correctIndex: number): string {
    if (selectedAnswer === null) {
        return 'bg-black/30 hover:bg-black/50 border border-white/5 text-gray-200';
    }
    if (btnIndex === correctIndex) {
        return 'bg-accent-green/20 border border-accent-green text-accent-green';
    }
    if (selectedAnswer === btnIndex) {
        return 'bg-red-500/20 border border-red-500 text-red-500';
    }
    return 'bg-black/30 border border-white/5 opacity-50 text-gray-500';
}

export const AICompanionDashboard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [result, setResult] = useState<CompanionContentResult | null>(null);
    const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const handleFormSubmit = async (data: AICompanionFormData) => {
        setIsLoading(true);
        setStatusText(data.language === 'arabic' ? 'جاري تقييم مستوى الفهم...' : 'Evaluating Understanding...');
        setResult(null);
        setSelectedQuizAnswer(null);

        try {
            const evalResults = await evaluateUnderstanding(
                data.subject, data.level, data.explanation, data.language
            );

            setStatusText(data.language === 'arabic' ? 'جاري بناء المحتوى المخصص...' : 'Building Personalized Content...');

            const buildResults = await buildCompanionContent(
                data.subject, evalResults, data.preferences, data.language
            );

            setResult(buildResults);

            if (buildResults.nodes && buildResults.edges) {
                const newNodes = buildResults.nodes.map((n, i) => ({
                    id: n.id,
                    position: { x: (i % 3) * 220, y: Math.floor(i / 3) * 160 },
                    data: { label: n.label },
                    style: {
                        background: data.preferences.theme === 'neon' ? 'rgba(0,210,255,0.08)' : '#1a1a2e',
                        color: '#fff',
                        border: data.preferences.theme === 'neon' ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                    }
                }));

                const newEdges = buildResults.edges.map((e, i) => ({
                    id: `e-${e.source}-${e.target}-${i}`,
                    source: e.source,
                    target: e.target,
                    label: e.label,
                    animated: true,
                    style: { stroke: '#00d2ff', strokeWidth: 2 },
                    labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 600 },
                }));

                setNodes(newNodes);
                setEdges(newEdges);
            }
        } catch (error) {
            console.error('Companion Error:', error);
            setStatusText(data.language === 'arabic' ? 'عذراً، حدث خطأ أثناء التحليل.' : 'Error during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-[80vh] bg-[#0A0A0A] text-white p-6 md:p-12 rounded-[3rem] relative overflow-hidden border border-white/10 shadow-2xl">
            {onClose && (
                <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-50">
                    <X className="w-6 h-6 text-gray-400" />
                </button>
            )}

            <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-purple/5 pointer-events-none" />

            {/* Input Phase */}
            {!result && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 w-full"
                    >
                        <AICompanionInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
                        {isLoading && (
                            <p className="text-center text-accent-cyan mt-6 animate-pulse font-black tracking-widest uppercase text-sm">
                                {statusText}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Result Phase */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* ── Left Panel ── */}
                    <div className="lg:col-span-1 space-y-6 flex flex-col overflow-y-auto pr-2 custom-scrollbar max-h-[85vh]">
                        <h2 className="text-2xl font-black text-brand-cyan uppercase tracking-wide flex items-center gap-3">
                            <Lightbulb className="w-6 h-6" />
                            Smart Tutor Feedback
                        </h2>

                        {/* Summary */}
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Core Summary</h3>
                            <p className="leading-relaxed text-sm text-gray-200">{result.summary}</p>
                        </div>

                        {/* Key Takeaways */}
                        <div className="bg-brand-purple/10 border border-brand-purple/20 p-6 rounded-3xl backdrop-blur-md space-y-3">
                            <h3 className="text-xs font-bold text-brand-purple uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Navigation2 className="w-4 h-4" /> Key Takeaways
                            </h3>
                            <ul className="space-y-3">
                                {result.points.map((pt, i) => (
                                    <li key={i} className="flex gap-3 text-sm">
                                        <CheckCircle className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
                                        <span className="text-gray-300">{pt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Practice Quiz */}
                        {result.practice_question && (
                            <div className="bg-accent-green/10 border border-accent-green/20 p-6 rounded-3xl">
                                <h3 className="text-xs font-bold text-accent-green uppercase tracking-widest mb-4">
                                    Quick Challenge
                                </h3>
                                <p className="font-bold mb-4 text-sm">{result.practice_question.q}</p>
                                <div className="space-y-2">
                                    {result.practice_question.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            disabled={selectedQuizAnswer !== null}
                                            onClick={() => setSelectedQuizAnswer(i)}
                                            className={`w-full text-left p-4 rounded-xl text-sm font-medium transition-all ${getQuizBtnClass(selectedQuizAnswer, i, result.practice_question.answer)}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => { setResult(null); setSelectedQuizAnswer(null); }}
                            className="w-full py-4 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-gray-400"
                        >
                            ↩ Start New Concept
                        </button>
                    </div>

                    {/* ── Right Panel: React Flow Mind Map ── */}
                    <div className="lg:col-span-2 bg-[#050505] rounded-3xl border border-white/10 overflow-hidden relative min-h-[500px]">
                        <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-brand-cyan" />
                            <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Concept Map</span>
                        </div>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            fitView
                            className="bg-transparent"
                        >
                            <Background color="#ffffff" variant={BackgroundVariant.Dots} gap={24} size={1} style={{ opacity: 0.05 }} />
                            <Controls />
                            <MiniMap
                                className="bg-black/50 border border-white/10 rounded-xl"
                                nodeStrokeColor="#00d2ff"
                                nodeColor="rgba(0, 210, 255, 0.2)"
                            />
                        </ReactFlow>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
