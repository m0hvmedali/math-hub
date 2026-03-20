import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Maximize2, 
  RotateCcw, 
  Zap, 
  Activity,
  Plus
} from 'lucide-react';
import 'mathlive';
import { normalizeMath } from '../../utils/MathNormalization';

const MathGrapherModule: React.FC = () => {
    const [expr, setExpr] = useState('sin(x)');
    const containerRef = useRef<HTMLDivElement>(null);
    const mathfieldRef = useRef<any>(null);

    const draw = useCallback(async () => {
        if (!containerRef.current) return;
        
        try {
            const { default: functionPlot } = await import('function-plot');
            const normalized = normalizeMath(expr);
            
            // Map common functions for function-plot
            const plotExpr = normalized.replace(/diff\((.+?),x\)/g, "($1')").replace(/integrate\((.+?),x\)/g, "integral($1)");

            functionPlot({
                target: containerRef.current,
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
                yAxis: { domain: [-5, 5] },
                xAxis: { domain: [-10, 10] },
                grid: true,
                data: [
                    {
                        fn: plotExpr,
                        color: '#00e5ff',
                        graphType: 'polyline',
                        attr: { 'stroke-width': 2 }
                    }
                ]
            });
        } catch (err) {
            console.error("Plot Error:", err);
        }
    }, [expr]);

    useEffect(() => {
        draw();
        const handleResize = () => draw();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    return (
        <div className="p-6 h-full flex flex-col space-y-6">
            <header className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
                    <LineChart className="w-6 h-6 text-brand-cyan" />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Function Plotter</h2>
                    <p className="text-xs text-gray-500 font-medium">Interactive 2D Visualization</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                {/* Control Panel */}
                <div className="w-full md:w-80 space-y-4 shrink-0">
                    <div className="glass-card p-4 bg-white/5 border-white/10 rounded-2xl">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Function Input</label>
                        <div className="p-3 bg-black rounded-xl border border-white/10 mb-4">
                            <math-field
                                ref={mathfieldRef}
                                onInput={(e: any) => setExpr(e.target.value)}
                                style={{ 
                                    width: '100%',
                                    backgroundColor: 'transparent', 
                                    border: 'none', 
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            >
                                {expr}
                            </math-field>
                        </div>
                        
                        <div className="space-y-2">
                             {[
                                { name: 'Sine Wave', fn: 'sin(x)' },
                                { name: 'Parabola', fn: 'x^2' },
                                { name: 'Sigmoid', fn: '1/(1+exp(-x))' },
                                { name: 'Absolute', fn: 'abs(x)' }
                             ].map((ex, i) => (
                                <button 
                                    key={i}
                                    onClick={() => {
                                        setExpr(ex.fn);
                                        if (mathfieldRef.current) mathfieldRef.current.value = ex.fn;
                                    }}
                                    className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left text-xs font-bold hover:bg-white/5 transition-all flex items-center justify-between group"
                                >
                                    <span>{ex.name}</span>
                                    <code className="text-[10px] text-brand-cyan opacity-40 group-hover:opacity-100 transition-opacity">{ex.fn}</code>
                                </button>
                             ))}
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10">
                        <div className="flex items-center gap-2 text-brand-cyan mb-2">
                            <Activity className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Engine</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            Rendering at 60FPS using SVG optimization. Zoom and drag to explore the function space.
                        </p>
                    </div>
                </div>

                {/* Plot Area */}
                <div className="flex-1 glass-card bg-black/40 border-white/5 rounded-[2.5rem] overflow-hidden relative group">
                    <div ref={containerRef} className="absolute inset-0 p-4" />
                    <div className="absolute top-6 right-6 flex gap-2">
                        <button onClick={draw} className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MathGrapherModule;
