import React, { useEffect, useRef, useState } from 'react';
import { XIcon, CodeIcon } from './Icons';

interface HTMLCodeViewerProps {
    html: string;
    css: string;
    js: string;
    title?: string;
    isFullScreen?: boolean;
}

const HTMLCodeViewer: React.FC<HTMLCodeViewerProps> = ({ html, css, js, title, isFullScreen }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showSource, setShowSource] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        try {
            // Clear previous content
            containerRef.current.innerHTML = '';

            // Create Shadow DOM
            const shadowRoot = containerRef.current.attachShadow({ mode: 'open' });

            // Build combined HTML
            const fullHTML = `
                <style>
                    :host {
                        all: initial;
                        display: block;
                        width: 100%;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    ${css}
                </style>
                ${html}
            `;

            // Inject HTML
            shadowRoot.innerHTML = fullHTML;

            // Execute JavaScript in isolated context
            if (js.trim()) {
                try {
                    const script = document.createElement('script');
                    script.textContent = `
                        (function() {
                            ${js}
                        })();
                    `;
                    shadowRoot.appendChild(script);
                } catch (jsError: any) {
                    console.error('JS Execution Error:', jsError);
                    setError(`JavaScript Error: ${jsError.message}`);
                }
            }

            setError(null);
        } catch (err: any) {
            console.error('Shadow DOM Error:', err);
            setError(`Rendering Error: ${err.message}`);
        }
    }, [html, css, js]);

    return (
        <div className={isFullScreen ? 'w-full h-full flex flex-col overflow-hidden bg-white' : "bg-cinematic-card border border-cinematic-border rounded-3xl overflow-hidden shadow-2xl"}>
            {/* Header */}
            {!isFullScreen && (
                <div className="bg-gray-900/50 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CodeIcon className="w-5 h-5 text-accent-blue" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-accent-blue">
                            {title || 'Custom Code'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowSource(!showSource)}
                        className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                    >
                        {showSource ? 'Hide Source' : 'View Source'}
                    </button>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-900/20 border-b border-red-500/30 px-8 py-4">
                    <p className="text-red-400 text-sm font-mono">{error}</p>
                </div>
            )}

            {/* Content */}
            {showSource ? (
                <div className={`p-8 space-y-6 ${isFullScreen ? 'flex-1 overflow-y-auto' : 'max-h-[600px] overflow-y-auto'}`}>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2">HTML</h4>
                        <pre className="bg-black/40 p-4 rounded-xl overflow-x-auto text-sm text-gray-300 font-mono border border-white/5">
                            {html}
                        </pre>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2">CSS</h4>
                        <pre className="bg-black/40 p-4 rounded-xl overflow-x-auto text-sm text-gray-300 font-mono border border-white/5">
                            {css}
                        </pre>
                    </div>
                    {js && (
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2">JavaScript</h4>
                            <pre className="bg-black/40 p-4 rounded-xl overflow-x-auto text-sm text-gray-300 font-mono border border-white/5">
                                {js}
                            </pre>
                        </div>
                    )}
                </div>
            ) : (
                <div className={isFullScreen ? 'flex-1 flex flex-col overflow-hidden' : 'p-8'}>
                    <div
                        ref={containerRef}
                        className={`${isFullScreen ? 'flex-1 border-none' : 'min-h-[200px] bg-white/5 rounded-2xl border border-white/10'} overflow-auto`}
                    />
                </div>
            )}
        </div>
    );
};

export default HTMLCodeViewer;
