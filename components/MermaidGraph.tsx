import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidGraphProps {
    chart: string;
}

const MermaidGraph: React.FC<MermaidGraphProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Outfit'
        });
    }, []);

    useEffect(() => {
        if (ref.current && chart) {
            ref.current.removeAttribute('data-processed');
            mermaid.contentLoaded();
        }
    }, [chart]);

    return (
        <div className="bg-cinematic-card/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 my-8 overflow-x-auto">
            <div className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-4">Neural Relationship Map</div>
            <div ref={ref} className="mermaid flex justify-center">
                {chart}
            </div>
        </div>
    );
};

export default MermaidGraph;
