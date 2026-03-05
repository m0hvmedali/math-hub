/**
 * WhiteboardBlock — Interactive canvas whiteboard using Excalidraw
 * A collaborative, rich drawing board that saves its state as JSON
 * to/from the lesson content block.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface WhiteboardBlockProps {
    savedData?: string; // JSON string of Excalidraw elements
    readOnly?: boolean;
    onSave?: (data: string) => void;
    title?: string;
}

const WhiteboardBlock: React.FC<WhiteboardBlockProps> = ({ savedData, readOnly, onSave, title }) => {
    const [ExcalidrawComponent, setExcalidrawComponent] = useState<React.ComponentType<any> | null>(null);
    const [initialData, setInitialData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const excalidrawRef = useRef<any>(null);

    // Dynamically import Excalidraw (heavy lib)
    useEffect(() => {
        import('@excalidraw/excalidraw').then(mod => {
            setExcalidrawComponent(() => mod.Excalidraw);
        }).catch(() => {
            setError('Could not load whiteboard. Run: npm install @excalidraw/excalidraw');
        });
    }, []);

    // Parse saved data
    useEffect(() => {
        if (savedData) {
            try {
                setInitialData(JSON.parse(savedData));
            } catch {
                setInitialData(null);
            }
        }
    }, [savedData]);

    const handleSave = useCallback(async () => {
        if (!excalidrawRef.current || !onSave) return;
        setIsSaving(true);
        try {
            const { getSceneElements, getAppState } = excalidrawRef.current;
            const elements = getSceneElements?.() ?? [];
            const appState = getAppState?.() ?? {};
            const data = JSON.stringify({ elements, appState });
            await onSave(data);
        } finally {
            setIsSaving(false);
        }
    }, [onSave]);

    const handleExportPNG = useCallback(async () => {
        if (!excalidrawRef.current) return;
        try {
            const { exportToCanvas } = await import('@excalidraw/excalidraw');
            const { getSceneElements } = excalidrawRef.current;
            const elements = getSceneElements?.() ?? [];
            const canvas = await exportToCanvas({ elements, appState: { exportWithDarkMode: true } as any, files: null });
            const link = document.createElement('a');
            link.download = `${title || 'whiteboard'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (e) {
            console.warn('Export failed:', e);
        }
    }, [title]);

    if (error) {
        return (
            <div className="p-8 text-center text-yellow-400 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <p className="font-bold">⚠️ {error}</p>
            </div>
        );
    }

    if (!ExcalidrawComponent) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-[#1a1a2e] rounded-xl">
                <div className="flex flex-col items-center gap-3 text-brand-cyan">
                    <div className="w-10 h-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                    <p className="font-bold text-sm">تحميل اللوح التفاعلي...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full rounded-xl overflow-hidden border border-white/10">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d0d0d] border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-lg">✏️</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-cyan">
                        {title || 'Whiteboard'}
                    </span>
                    {readOnly && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full uppercase tracking-widest">
                            عرض فقط
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPNG}
                        className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                    >
                        ⬇️ تصدير PNG
                    </button>
                    {!readOnly && onSave && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-xs font-bold bg-brand-cyan/20 hover:bg-brand-cyan/40 text-brand-cyan rounded-lg transition-all flex items-center gap-1 border border-brand-cyan/30 disabled:opacity-50"
                        >
                            {isSaving ? '⏳ حفظ...' : '💾 حفظ'}
                        </button>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div className="h-[600px] md:h-[700px] w-full" style={{ background: '#1a1a2e' }}>
                <ExcalidrawComponent
                    ref={excalidrawRef}
                    initialData={initialData}
                    viewModeEnabled={readOnly}
                    theme="dark"
                    langCode="ar-SA"
                    UIOptions={{
                        canvasActions: {
                            saveToActiveFile: false,
                            saveAsImage: false,
                            loadScene: false,
                            export: false,
                            toggleTheme: false,
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default WhiteboardBlock;
