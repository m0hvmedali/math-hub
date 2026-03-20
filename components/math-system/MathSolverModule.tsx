import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../App';
import { 
  Calculator, 
  Trash2, 
  Play, 
  ArrowRight, 
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
// @ts-ignore
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import 'nerdamer/Calculus';
import 'nerdamer/Solve';
// @ts-ignore
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'mathlive';
import { normalizeMath } from '../../utils/MathNormalization';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any;
    }
  }
}

const MathSolverModule: React.FC = () => {
    const { language } = useContext(AppContext);
    const [input, setInput] = useState('');
    const [result, setResult] = useState<{ latex: string; text: string; error?: string } | null>(null);
    const [history, setHistory] = useState<{ input: string; result: string }[]>([]);
    const mathfieldRef = useRef<any>(null);

    const solve = useCallback(() => {
        if (!input) return;
        try {
            const normalized = normalizeMath(input);
            let solution;
            
            // Intelligent solving logic
            if (normalized.includes('integrate')) {
                solution = nerdamer(normalized).toString();
            } else if (normalized.includes('diff')) {
                solution = nerdamer(normalized).toString();
            } else if (normalized.includes('=')) {
                const parts = normalized.split('=');
                solution = (nerdamer as any).solve(parts[0] + '-(' + parts[1] + ')', 'x').toString();
            } else {
                solution = nerdamer(normalized).evaluate().toString();
            }

            const latex = nerdamer(solution).toTeX();
            setResult({ latex, text: solution });
            setHistory(prev => [{ input: input, result: latex }, ...prev].slice(0, 5));
        } catch (err: any) {
            setResult({ latex: '', text: '', error: err.message || 'Error solving expression' });
        }
    }, [input]);

    const clear = () => {
        setInput('');
        setResult(null);
        if (mathfieldRef.current) mathfieldRef.current.value = '';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <header className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center border border-brand-purple/20">
                    <Calculator className="w-6 h-6 text-brand-purple" />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        {language === 'ar' ? 'المحلل الرمزي' : 'Symbolic Solver'}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        {language === 'ar' ? 'الجبر، التفاضل والتكامل، والتبسيط' : 'Algebra, Calculus, and Simplification'}
                    </p>
                </div>
            </header>

            {/* Input Section */}
            <div className="glass-card p-6 bg-white/[0.03] border-white/10 rounded-[2rem] space-y-6">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-purple to-brand-cyan rounded-[1.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center gap-4 bg-black rounded-[1.2rem] p-4 border border-white/10">
                        <math-field
                            ref={mathfieldRef}
                            onInput={(e: any) => setInput(e.target.value)}
                            style={{ 
                                flex: 1, 
                                backgroundColor: 'transparent', 
                                border: 'none', 
                                color: 'white', 
                                fontSize: '1.25rem',
                                outline: 'none',
                                direction: 'ltr'
                            }}
                            placeholder={language === 'ar' ? 'أدخل التعبير الرياضي...' : 'Enter expression (e.g. x^2 + 2x + 1)'}
                        >
                            {input}
                        </math-field>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={clear}
                                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={solve}
                                className="px-6 py-2.5 bg-brand-purple text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-glow-purple shadow-2xl transition-all active:scale-95"
                            >
                                {language === 'ar' ? 'حـل' : 'Solve'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Result Display */}
                {result && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl border ${result.error ? 'bg-red-500/5 border-red-500/20' : 'bg-brand-cyan/5 border-brand-cyan/20'}`}
                    >
                        {result.error ? (
                            <div className="flex items-center gap-3 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">{result.error}</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-brand-cyan mb-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {language === 'ar' ? 'تم إيجاد الحل' : 'Result Found'}
                                    </span>
                                </div>
                                <div 
                                    className="text-2xl overflow-x-auto py-2"
                                    dangerouslySetInnerHTML={{ 
                                        __html: katex.renderToString(result.latex, { throwOnError: false, displayMode: true }) 
                                    }}
                                />
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: language === 'ar' ? 'المشتقات' : 'Derivatives', example: 'diff(x^2, x)', color: 'text-brand-cyan' },
                    { title: language === 'ar' ? 'التكامل' : 'Integrals', example: 'integrate(sin(x), x)', color: 'text-brand-magenta' },
                    { title: language === 'ar' ? 'المعادلات' : 'Equations', example: 'x^2 = 4', color: 'text-brand-purple' }
                ].map((tip, i) => (
                    <button 
                        key={i}
                        onClick={() => {
                            setInput(tip.example);
                            if (mathfieldRef.current) mathfieldRef.current.value = tip.example;
                        }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left hover:border-white/20 transition-all group"
                    >
                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${tip.color}`}>{tip.title}</h4>
                        <code className="text-xs text-gray-400 font-mono group-hover:text-white transition-colors">{tip.example}</code>
                    </button>
                ))}
            </div>

            {/* History */}
            {history.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-2">
                        {language === 'ar' ? 'سجل العمليات الأخير' : 'Recent Lab History'}
                    </h3>
                    <div className="space-y-2">
                        {history.map((h, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 group">
                                <span className="text-sm font-mono text-gray-400 group-hover:text-white transition-colors">{h.input}</span>
                                <div 
                                    className="text-sm text-brand-cyan opacity-60 scale-75 origin-right"
                                    dangerouslySetInnerHTML={{ 
                                        __html: katex.renderToString(h.result, { throwOnError: false }) 
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MathSolverModule;
