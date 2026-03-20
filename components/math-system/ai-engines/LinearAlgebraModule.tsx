import React, { useMemo } from 'react';
// @ts-ignore
import * as math from 'mathjs';
import { motion } from 'framer-motion';

interface LinearAlgebraModuleProps {
    data: any;
}

const LinearAlgebraModule: React.FC<LinearAlgebraModuleProps> = ({ data }) => {
    // data example: { "matrix": [[1,2], [3,4]], "operation": "inverse" }
    const { matrix = [[1, 0], [0, 1]], operation = 'determinant' } = data;

    const result = useMemo(() => {
        try {
            const m = math.matrix(matrix);
            if (operation === 'determinant') return math.det(m);
            if (operation === 'inverse') return math.inv(m).toArray();
            if (operation === 'transpose') return math.transpose(m).toArray();
            return null;
        } catch (e) {
            return "Error";
        }
    }, [matrix, operation]);

    const renderMatrix = (m: any[][], label: string, color: string) => (
        <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase font-black mb-2">{label}</span>
            <div className="relative p-4 border-l-2 border-r-2 rounded-lg" style={{ borderColor: color }}>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${m[0]?.length || 1}, minmax(40px, auto))` }}>
                    {m.flat().map((val: any, i: number) => (
                        <div key={i} className="text-center font-bold text-sm tabular-nums">
                            {typeof val === 'number' ? val.toFixed(1) : val}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/40 h-full overflow-auto">
            <div className="flex flex-wrap items-center justify-center gap-12 mb-8">
                {renderMatrix(matrix, "Input Matrix", "#00ffff")}
                
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-sm">→</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-brand-magenta">{operation}</span>
                </div>

                {Array.isArray(result) ? (
                    renderMatrix(result as any[][], "Result Matrix", "#ff00ff")
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 uppercase font-black mb-2">Scalar Result</span>
                        <div className="text-4xl font-black text-brand-magenta tabular-nums">
                            {typeof result === 'number' ? result.toFixed(2) : result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinearAlgebraModule;
