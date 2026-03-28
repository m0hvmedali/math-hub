import React, { useMemo } from 'react';
// @ts-ignore
import Complex from 'complex.js';
import { motion } from 'framer-motion';

interface ComplexAlgebraHubProps {
    data: any;
}

const ComplexAlgebraHub: React.FC<ComplexAlgebraHubProps> = ({ data }) => {
    // data example: { "number": "3 + 4i", "operation": "roots", "n": 3 }
    const complexNum = useMemo(() => {
        try {
            if (!data || !data.number) return new Complex(0, 0);
            return new Complex(data.number);
        } catch (e) {
            return new Complex(0, 0);
        }
    }, [data.number]);

    const roots = useMemo(() => {
        if (data.operation === 'roots' && data.n) {
            // De Moivre's Roots: z^(1/n)
            const r = Math.pow(complexNum.abs(), 1 / data.n);
            const theta = complexNum.arg();
            return Array.from({ length: data.n }).map((_, k) => {
                const angle = (theta + 2 * Math.PI * k) / data.n;
                return {
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle)
                };
            });
        }
        return [];
    }, [complexNum, data.operation, data.n]);

    const size = 300;
    const padding = 20;
    const scale = (size / 2 - padding) / Math.max(complexNum.abs() * 1.5, 5);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/40 h-full">
            <div className="relative mb-8">
                {/* Argand Diagram SVG */}
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                    {/* Grid */}
                    <line x1="0" y1={size/2} x2={size} y2={size/2} stroke="#333" strokeWidth="1" />
                    <line x1={size/2} y1="0" x2={size/2} y2={size} stroke="#333" strokeWidth="1" />
                    
                    {/* Main Axes */}
                    <line x1="5" y1={size/2} x2={size-5} y2={size/2} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="5 5" />
                    <line x1={size/2} y1="5" x2={size/2} y2={size-5} stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="5 5" />
                    
                    {/* Unit Circle (optional) */}
                    <circle cx={size/2} cy={size/2} r={scale} fill="none" stroke="rgba(0,255,255,0.1)" strokeDasharray="4 2" />

                    {/* Vector for original number */}
                    <motion.line
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        x1={size/2}
                        y1={size/2}
                        x2={size/2 + complexNum.re * scale}
                        y2={size/2 - complexNum.im * scale}
                        stroke="#00ffff"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead)"
                    />
                    <circle cx={size/2 + complexNum.re * scale} cy={size/2 - complexNum.im * scale} r="4" fill="#00ffff" />

                    {/* Roots */}
                    {roots.map((root, i) => (
                        <React.Fragment key={i}>
                            <motion.line
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                x1={size/2}
                                y1={size/2}
                                x2={size/2 + root.x * scale}
                                y2={size/2 - root.y * scale}
                                stroke="#ff00ff"
                                strokeWidth="1"
                            />
                            <circle cx={size/2 + root.x * scale} cy={size/2 - root.y * scale} r="3" fill="#ff00ff" />
                        </React.Fragment>
                    ))}

                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#00ffff" />
                        </marker>
                    </defs>
                </svg>

                {/* Labels */}
                <div className="absolute top-0 right-0 bg-black/60 px-2 py-0.5 rounded border border-white/10 text-[10px] text-gray-400 font-black uppercase tracking-widest">Im (j)</div>
                <div className="absolute bottom-0 left-full ml-4 bg-black/60 px-2 py-0.5 rounded border border-white/10 text-[10px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">Re (Real)</div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Rectangular</div>
                    <div className="text-sm font-bold text-brand-cyan">{complexNum.toString()}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Polar</div>
                    <div className="text-sm font-bold text-brand-magenta">
                        {complexNum.abs().toFixed(2)} ∠ {(complexNum.arg() * 180 / Math.PI).toFixed(1)}°
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplexAlgebraHub;
