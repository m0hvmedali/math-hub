import React, { useState } from 'react';

interface WorkspaceEmbedProps {
    url: string;
    title?: string;
    type: 'google-docs' | 'google-slides' | 'google-sites' | 'google-drive' | 'link';
}

const WORKSPACE_META: Record<string, { label: string; icon: string; color: string; bgClass: string }> = {
    'google-docs': { label: 'Google Docs', icon: '📄', color: '#4285F4', bgClass: 'from-[#1a237e]/30' },
    'google-slides': { label: 'Google Slides', icon: '📊', color: '#F4B400', bgClass: 'from-[#4a2600]/30' },
    'google-sites': { label: 'Google Sites', icon: '🌐', color: '#0F9D58', bgClass: 'from-[#003300]/30' },
    'google-drive': { label: 'Google Drive', icon: '☁️', color: '#34A853', bgClass: 'from-[#002200]/30' },
    'link': { label: 'Web Page', icon: '🌐', color: '#8b5cf6', bgClass: 'from-[#2e1065]/30' },
};

/** Convert raw Google share link to the cleanest embeddable URL possible */
const toEmbedUrl = (url: string, type: string): string => {
    try {
        // Google Docs
        const docsMatch = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
        if (docsMatch) {
            const kind = docsMatch[1];
            const id = docsMatch[2];
            if (kind === 'document') return `https://docs.google.com/document/d/${id}/preview?rm=minimal`;
            if (kind === 'spreadsheets') return `https://docs.google.com/spreadsheets/d/${id}/preview?rm=minimal`;
            if (kind === 'presentation') return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&rm=minimal`;
        }

        // Canva
        if (url.includes('canva.com/')) {
            const canvaMatch = url.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)/);
            if (canvaMatch) return `https://www.canva.com/design/${canvaMatch[1]}/view?embed`;
        }

        // Miro
        if (url.includes('miro.com/')) {
            const miroMatch = url.match(/miro\.com\/app\/board\/([a-zA-Z0-9_-]+)/);
            if (miroMatch) return `https://miro.com/app/live-embed/${miroMatch[1]}/`;
        }

        // Google Drive file
        const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview?usp=sharing`;

        // Google Sites — just use as-is
        if (url.includes('sites.google.com')) return url;

        return url;
    } catch {
        return url;
    }
};

const WorkspaceEmbed: React.FC<WorkspaceEmbedProps> = ({ url, title, type }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const meta = WORKSPACE_META[type] || WORKSPACE_META['google-drive'];
    const embedUrl = toEmbedUrl(url, type);

    return (
        <div className={`relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-massive transition-all duration-700 ${isFullscreen ? 'fixed inset-0 z-[9998] rounded-none' : 'hover:border-white/20'}`}
            style={{
                background: `#050505`,
                boxShadow: isFullscreen ? 'none' : `0 20px 50px -12px ${meta.color}20`
            }}
        >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: `radial-gradient(circle at 0% 0%, ${meta.color} 0%, transparent 50%)` }}
            />

            {/* Premium Braded Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl relative z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-glow-brand"
                        style={{ backgroundColor: meta.color + '20', border: `1px solid ${meta.color}40`, boxShadow: `0 0 20px ${meta.color}20` }}>
                        {meta.icon}
                    </div>
                    <div>
                        <p className="text-white font-black text-sm tracking-tight leading-tight">{title || meta.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: meta.color }}>
                                {type === 'link' ? 'Encapsulated Web Portal' : `${meta.label} Immersive Tunnel`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <a href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white border border-white/5 text-xs font-bold"
                        title="Open Source"
                    >
                        <span>Original</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <button onClick={() => setIsFullscreen(f => !f)}
                        className="p-2.5 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 transition-all text-brand-cyan hover:scale-105 active:scale-95"
                    >
                        {isFullscreen ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Immersive Viewport */}
            <div className={`relative bg-white transition-all duration-1000 ${isFullscreen ? 'h-[calc(100vh-73px)]' : 'h-[650px] md:h-[800px] shadow-inner'}`}>
                {isLoading && (
                    <div className="absolute inset-0 z-30 bg-[#050505] flex flex-col items-center justify-center p-8 text-center gap-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-2 border-white/5 rounded-full scale-150 animate-ping opacity-20" style={{ borderColor: meta.color }} />
                            <div className="absolute inset-0 border-[3px] border-white/5 rounded-full" />
                            <div className="absolute inset-0 border-[3px] border-t-brand-cyan rounded-full animate-spin" style={{ borderTopColor: meta.color }} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white font-black text-xs tracking-[0.3em] uppercase animate-pulse">Launching Digital Environment</p>
                            <p className="text-gray-500 text-[10px] font-medium max-w-xs mx-auto">Connecting to external node via secure immersive protocol...</p>
                        </div>

                        {/* Fallback button shown during loading for safety */}
                        <div className="mt-4 pt-8 border-t border-white/5 w-full max-w-xs">
                            <p className="text-gray-600 text-[10px] italic mb-3">If the content doesn't appear below, it may be restricted by the provider.</p>
                            <a href={url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black transition-all border border-white/10"
                            >
                                🚀 VISIT SITE DIRECTLY
                            </a>
                        </div>
                    </div>
                )}
                <iframe
                    src={embedUrl}
                    onLoad={() => setIsLoading(false)}
                    className={`w-full h-full border-0 transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    allowFullScreen
                    loading="lazy"
                    allow="fullscreen; clipboard-read; clipboard-write"
                    style={{ colorScheme: 'light' }}
                />
            </div>
        </div>
    );
};

export default WorkspaceEmbed;
