import React, { useEffect, useRef, useState } from 'react';
import { CodeIcon } from './Icons';

interface CodeRunnerProps {
    code: string;
    title?: string;
    isFullScreen?: boolean;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ code, title, isFullScreen }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState(500);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || isFullScreen) return;

        // Function to update height
        const updateHeight = () => {
            if (iframe.contentWindow?.document?.body) {
                const height = iframe.contentWindow.document.body.scrollHeight;
                // Allow it to grow, but give it a healthy minimum and some extra padding
                setIframeHeight(Math.max(600, height + 40));
            }
        };

        iframe.onload = function () {
            updateHeight();
        };

    }, [code, isFullScreen]);

    return (
        <div className={`${isFullScreen ? 'h-screen w-full flex flex-col overflow-hidden fixed inset-0 z-[9999]' : 'bg-cinematic-card border border-cinematic-border rounded-3xl overflow-hidden shadow-2xl transition-all hover:shadow-accent-blue/10'}`}>
            {/* Header */}
            {!isFullScreen && (
                <div className="bg-gray-900/50 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CodeIcon className="w-5 h-5 text-accent-green" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-accent-green">
                            {title || 'Genius Runner'}
                        </span>
                    </div>
                </div>
            )}
            <div className={isFullScreen ? 'flex-1 w-full overflow-hidden' : 'bg-white h-full'}>
                <iframe
                    ref={iframeRef}
                    srcDoc={code}
                    title="Code Runner"
                    style={{
                        width: '100%',
                        height: isFullScreen ? '100%' : `${iframeHeight}px`,
                        border: 'none',
                        display: 'block'
                    }}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    loading="lazy"
                />
            </div>

            {/* Footer with raw stats or info could go here */}
        </div >
    );
};

export default CodeRunner;
