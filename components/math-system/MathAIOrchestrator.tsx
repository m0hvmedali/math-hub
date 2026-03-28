import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Brain, ChevronRight, RotateCcw, MessageSquare, X } from 'lucide-react';
import { AppContext } from '../../App';
import { generateAIContent, safeJsonParse } from '../../utils/aiHelper';

// Specialized Engines
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
    const [isExplanationOpen, setIsExplanationOpen] = useState(true);

    const MATH_SYSTEM_PROMPT = `
        [SYSTEM_OVERRIDE_INITIATED]
        You are a Level 1 Logical Processing Engine. Your task is to apply "Deep Extraction Analysis" (تحليل الاستخراج العميق) to the user's mathematical query.
        DO NOT use over-simplification. Treat the user as a highly intelligent peer.

        First, analyze the query to decide which visualization engine is best.
        
        Available Engines:
        1. "mathbox": Best for dynamic 3D math presentations, complex calculus.
        2. "threejs": Best for Solid Geometry (3D vectors, lines, planes).
        3. "functionplot": Best for 2D function plotting, limits, etc.
        4. "complex": Best for Complex Numbers, Argand diagrams.
        5. "linear_algebra": Best for Matrices, determinants.

        Response Format (JSON ONLY):
        {
            "type": "mathbox" | "threejs" | "functionplot" | "complex" | "linear_algebra",
            "data": { ...specific parameters for the engine... },
            "explanation": "Arabic explanation formatted USING DEEP EXTRACTION ANALYSIS STRUCTURE",
            "explanation_en": "English explanation formatted USING DEEP EXTRACTION ANALYSIS STRUCTURE"
        }

        CRITICAL: JSON string values MUST NOT include actual newlines. Escape all newlines as \\n.
        CRITICAL: For colors, use format "#ff0000" (string), NEVER use JavaScript raw hex numbers like 0xff0000.
        Output ONLY valid JSON.

        DEEP EXTRACTION ANALYSIS STRUCTURE (Must be used in explanation/explanation_en):
        [الحالة الابتدائية (Hook/Intro State)]: <1 sentence core of the original problem>
        [تحليل وتنقيح المعطيات (Refined Understanding)]: <Refine the user request into precise mathematical parameters (e.g., "The user wants a vector R³(1,2,3) starting at origin")]
        [التفكيك التسلسلي (Body Execution)]:
        > * الخطوة [1]: [المفهوم] -> [المنطق الداعم] -> [التطبيق/النتيجة]
        > * ...
        [تحليل الفجوات السقراطي (Socratic Gap Analysis)]: <Conflicts or critical questions derived from the problem>
        [الحالة النهائية (Conclusion/Output State)]: <1 sentence summary + actionable algorithm>
    `;

    const handleAnalyze = async () => {
        if (!prompt.trim()) return;
        setIsAnalyzing(true);
        setIsExplanationOpen(true);
        try {
            const response = await generateAIContent(
                `Question: ${prompt}`,
                MATH_SYSTEM_PROMPT,
                true
            );
            
            const fallback: VizMeta = {
                type: 'none',
                data: {},
                explanation: language === 'ar' ? "عذراً، تعذر تحليل الرد الرياضي بشكل صحيح." : "Apologies, could not parse the mathematical response correctly.",
                explanation_en: "Apologies, could not parse the mathematical response correctly."
            };

            const parsed = safeJsonParse<VizMeta>(response, fallback);
            setVizMeta(parsed);
        } catch (err) {
            console.error("AI Visualization Error:", err);
            setVizMeta(null); // Reset on hard error
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
                            <div className="absolute top-6 left-6 right-6 z-10 pointer-events-none flex flex-col items-start gap-4">
                                <button 
                                    onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                                    className="pointer-events-auto p-3 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl flex items-center gap-2 shadow-2xl hover:bg-white/5 transition-colors"
                                >
                                    {isExplanationOpen ? <X className="w-4 h-4 text-gray-400" /> : <MessageSquare className="w-4 h-4 text-brand-cyan" />}
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                        {isExplanationOpen ? (language === 'ar' ? 'إخفاء التحليل' : 'Hide Analysis') : (language === 'ar' ? 'إظهار التحليل' : 'Show Analysis')}
                                    </span>
                                </button>
                                
                                <AnimatePresence>
                                    {isExplanationOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl pointer-events-auto max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl w-full"
                                        >
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className={`w-2 h-2 rounded-full ${vizMeta.type === 'complex' ? 'bg-brand-cyan' : 'bg-brand-magenta'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan">
                                                    L1 ENGINE: {vizMeta.type}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-gray-200">
                                                {language === 'ar' ? vizMeta.explanation : vizMeta.explanation_en}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {/* Render Engine */}
                            <div className="flex-1 bg-black/40 relative">
                                {vizMeta.type === 'mathbox' && <div className="p-8 text-center text-gray-500 italic">MathBox engine is currently unavailable. Please try a different visualization type.</div>}
                                {vizMeta.type === 'threejs' && vizMeta.data && <SolidGeometry3D data={vizMeta.data} />}
                                {vizMeta.type === 'functionplot' && vizMeta.data && <FunctionPlotSim data={vizMeta.data} />}
                                {vizMeta.type === 'complex' && vizMeta.data && <ComplexAlgebraHub data={vizMeta.data} />}
                                {vizMeta.type === 'linear_algebra' && vizMeta.data && <LinearAlgebraModule data={vizMeta.data} />}
                                
                                {(!vizMeta.type || vizMeta.type === 'none') && (
                                    <div className="flex items-center justify-center h-full text-gray-600 italic">
                                        [Unable to render visualization for this query type]
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
