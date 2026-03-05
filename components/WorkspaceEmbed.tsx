import React, { useState } from 'react';

interface WorkspaceEmbedProps {
    url: string;
    title?: string;
    type: 'google-docs' | 'google-slides' | 'google-sites' | 'google-drive';
}

const WORKSPACE_META: Record<string, { label: string; icon: string; color: string; bgClass: string }> = {
    'google-docs': { label: 'Google Docs', icon: '📄', color: '#4285F4', bgClass: 'from-[#1a237e]/30' },
    'google-slides': { label: 'Google Slides', icon: '📊', color: '#F4B400', bgClass: 'from-[#4a2600]/30' },
    'google-sites': { label: 'Google Sites', icon: '🌐', color: '#0F9D58', bgClass: 'from-[#003300]/30' },
    'google-drive': { label: 'Google Drive', icon: '☁️', color: '#34A853', bgClass: 'from-[#002200]/30' },
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
    const meta = WORKSPACE_META[type] || WORKSPACE_META['google-drive'];
    const embedUrl = toEmbedUrl(url, type);

    return (
        <div className={`relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${isFullscreen ? 'fixed inset-0 z-[9998] rounded-none' : ''}`}
            style={{ background: `linear-gradient(135deg, ${meta.bgClass} 0%, #050505 100%)` }}
        >
            {/* Branded Header — no Google chrome visible, it's "our" toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/60 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: meta.color + '20', border: `1px solid ${meta.color}40` }}>
                        {meta.icon}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">{title || meta.label}</p>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href={url} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        title="Open in new tab"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <button onClick={() => setIsFullscreen(f => !f)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        {isFullscreen ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* The Document — full height, no visible border */}
            <div className={isFullscreen ? 'h-[calc(100vh-52px)]' : 'h-[650px] md:h-[800px]'}>
                <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 bg-white"
                    allowFullScreen
                    loading="lazy"
                    allow="fullscreen"
                    style={{ colorScheme: 'light' }}
                />
            </div>
        </div>
    );
};

export default WorkspaceEmbed;
