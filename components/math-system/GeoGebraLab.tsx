import React from 'react';
import { Box, ExternalLink, Maximize2 } from 'lucide-react';

const GeoGebraLab: React.FC = () => {
    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-magenta/10 flex items-center justify-center border border-brand-magenta/20">
                        <Box className="w-6 h-6 text-brand-magenta" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">GeoGebra Lab</h2>
                        <p className="text-xs text-gray-500 font-medium">Dynamic Geometry & 3D Calculator</p>
                    </div>
                </div>
                <a 
                    href="https://www.geogebra.org/calculator" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Full App
                </a>
            </header>

            <div className="flex-1 glass-card bg-black border-white/5 rounded-[2.5rem] overflow-hidden relative group">
                {/* We use an iframe to embed the official GeoGebra calculator */}
                <iframe 
                    src="https://www.geogebra.org/calculator?embed" 
                    className="w-full h-full border-none"
                    allow="geolocation; microphone; camera; midi; encrypted-media;"
                    title="GeoGebra Calculator"
                />
                
                {/* Overlay for premium feel */}
                <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest text-brand-magenta">
                        Embedded Lab High Precision
                    </div>
                </div>
            </div>

            <footer className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: 'Geometry', desc: 'Construct points, lines, circles, and polygons.' },
                    { title: '3D Graphing', desc: 'Plot surfaces and solids in three-dimensional space.' },
                    { title: 'CAS', desc: 'Exact symbolic calculations and solving.' }
                ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.title}</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </footer>
        </div>
    );
};

export default GeoGebraLab;
