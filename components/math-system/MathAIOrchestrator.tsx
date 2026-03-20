import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Brain, ChevronRight, RotateCcw } from 'lucide-react';
import { AppContext } from '../../App';
import { generateAIContent } from '../../utils/aiHelper';

// Specialized Engines
import MathBoxVisualizer from './ai-engines/MathBoxVisualizer';
import SolidGeometry3D from './ai-engines/SolidGeometry3D';
import FunctionPlotSim from './ai-engines/FunctionPlotSim';
import ComplexAlgebraHub from './ai-engines/ComplexAlgebraHub';
import LinearAlgebraModule from './ai-engines/LinearAlgebraModule';

interface VizMeta {
    type: 'mathbox' | 'threejs' | 'functionplot' | 'complex' | 'linear_algebra' | 'none';
    data: any;
    explanation: string;
    explanation_en: string;
}

const MathAIOrchestrator: React.FC = () => {
    const { language } = useContext(AppContext);
    const [prompt, setPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [vizMeta, setVizMeta] = useState<VizMeta | null>(null);

    const MATH_SYSTEM_PROMPT = `
        You are an advanced Math Visualization Expert. Your goal is to analyze a mathematical question and decide which visualization engine is best for it.
        
        Available Engines:
        1. "mathbox": Best for dynamic 3D math presentations, complex calculus (surfaces, vector fields), and animated coordinate transforms.
        2. "threejs": Best for Solid Geometry (3D vectors, lines, planes, and intersections).
        3. "functionplot": Best for 2D function plotting, limits, and implicit differentiation.
        4. "complex": Best for Complex Numbers, Argand diagrams, and De Moivre's theorem.
        5. "linear_algebra": Best for Matrices, determinants, and linear transformations.

        Response Format (JSON ONLY):
        {
            "type": "mathbox" | "threejs" | "functionplot" | "complex" | "linear_algebra",
            "data": { ...specific parameters for the engine... },
            "explanation": "Arabic explanation of what the visualization shows",
            "explanation_en": "English explanation of what the visualization shows"
        }

        Example for "find vector between (1,2,3) and (4,5,6)":
        {
            "type": "threejs",
            "data": { "vectors": [[1,2,3], [4,5,6]], "showSum": false },
            "explanation": "تمثيل المتجهات في الفضاء الثلاثي الأبعاد.",
            "explanation_en": "Visualization of vectors in 3D space."
        }
    `;

    const handleAnalyze = async () => {
        if (!prompt.trim()) return;
        setIsAnalyzing(true);
        try {
            const response = await generateAIContent(
                `Question: ${prompt}`,
                MATH_SYSTEM_PROMPT,
                true
            );
            const parsed = JSON.parse(response);
            setVizMeta(parsed);
        } catch (err) {
            console.error("AI Visualization Error:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl">
            {/* Input Header */}
            <div className="p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center border border-brand-cyan/30">
                        <Brain className="w-5 h-5 text-brand-cyan" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">
                            {language === 'ar' ? 'مختبر الذكاء الاصطناعي' : 'AI Visualization Lab'}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {language === 'ar' ? 'حول الأسئلة إلى تجارب بصرية' : 'Transform questions into visual experiences'}
                        </p>
                    </div>
                </div>

                <div className="relative group">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={language === 'ar' ? 'أدخل سؤالك الرياضي هنا... (مثال: ارسم المتجه [1,2,3] في الفضاء)' : 'Enter your math question... (e.g., Plot the vector [1,2,3] in space)'}
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-cyan/50 transition-all resize-none placeholder-gray-600"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !prompt.trim()}
                        className={`absolute bottom-4 right-4 p-3 rounded-xl bg-brand-cyan text-black font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 ${isAnalyzing ? 'animate-pulse' : ''}`}
                    >
                        {isAnalyzing ? (
                            <RotateCcw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span className="text-xs uppercase font-black">
                                    {language === 'ar' ? 'توليد المحاكاة' : 'Generate'}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Visualization Stage */}
            <div className="flex-1 relative min-h-[500px] overflow-hidden">
                <AnimatePresence mode="wait">
                    {!vizMeta ? (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                <Brain className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-400 mb-2">
                                {language === 'ar' ? 'في انتظار سؤالك' : 'Awaiting your question'}
                            </h3>
                            <p className="text-xs text-gray-600 max-w-xs">
                                {language === 'ar' 
                                    ? 'سأقوم بتحليل السؤال واختيار أفضل محرك رسومي لشرحه بشكل تفاعلي.'
                                    : 'I will analyze your question and pick the best graphics engine to explain it interactively.'}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="viz"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-0 flex flex-col"
                        >
                            {/* Explanation Overlay */}
                            <div className="absolute top-6 left-6 right-6 z-10 pointer-events-none">
                                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-md pointer-events-auto">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${vizMeta.type === 'mathbox' ? 'bg-brand-cyan' : 'bg-brand-magenta'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            {vizMeta.type} engine
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        {language === 'ar' ? vizMeta.explanation : vizMeta.explanation_en}
                                    </p>
                                </div>
                            </div>

                            {/* Render Engine */}
                            <div className="flex-1 bg-black/40 relative">
                                {vizMeta.type === 'mathbox' && <MathBoxVisualizer data={vizMeta.data} />}
                                {vizMeta.type === 'threejs' && <SolidGeometry3D data={vizMeta.data} />}
                                {vizMeta.type === 'functionplot' && <FunctionPlotSim data={vizMeta.data} />}
                                {vizMeta.type === 'complex' && <ComplexAlgebraHub data={vizMeta.data} />}
                                {vizMeta.type === 'linear_algebra' && <LinearAlgebraModule data={vizMeta.data} />}
                                
                                {!vizMeta.type && (
                                    <div className="flex items-center justify-center h-full text-gray-600 italic">
                                        [Engine {vizMeta.type} rendering data: {JSON.stringify(vizMeta.data)}]
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MathAIOrchestrator;
