import React, { useEffect, useRef } from 'react';
// @ts-ignore
import functionPlot from 'function-plot';

interface FunctionPlotSimProps {
    data: any;
}

const FunctionPlotSim: React.FC<FunctionPlotSimProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        if (!data) return;
        const { fn = 'x^2', derivative, point, domain = [-10, 10], range = [-10, 10] } = data;

        const plotData: any[] = [{
            fn: fn,
            color: '#00ffff'
        }];

        if (derivative && point !== undefined) {
            // Add tangent line: y = f'(a)(x - a) + f(a)
            // This is handled by function-plot with 'derivative' property
            plotData[0].derivative = {
                fn: derivative,
                updateOnMouseMove: true
            };
        }

        try {
            const width = containerRef.current.clientWidth;
            functionPlot({
                target: containerRef.current,
                width: width > 0 ? width : 600,
                height: 450,
                yAxis: { domain: range, label: 'y' },
                xAxis: { domain: domain, label: 'x' },
                grid: true,
                data: plotData
            });
        } catch (e) {
            console.error("FunctionPlot Error:", e);
        }
    }, [data]);

    return (
        <div className="flex items-center justify-center p-8 bg-black/40 h-full overflow-hidden">
            <div ref={containerRef} className="bg-white/5 rounded-2xl border border-white/10 p-4" />
        </div>
    );
};

export default FunctionPlotSim;
