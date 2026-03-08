import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, Rect, Circle, Line, Triangle, PencilBrush, Image as FabricImage } from '../lib/fabric';
import type { FabricCanvasType } from '../lib/fabric';


import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface WhiteboardPage {
    id: string;
    json: any;
    thumbnail?: string;
}

interface WhiteboardBlockProps {
    savedData?: string; // Multi-page JSON state
    readOnly?: boolean;
    onSave?: (data: string) => void;
    title?: string;
    onSetHasChanges?: (hasChanges: boolean) => void;
}

/**
 * WhiteboardBlock — Professional Multi-page Whiteboard
 * Built with Fabric.js + PDF.js support
 */
const WhiteboardBlock: React.FC<WhiteboardBlockProps> = ({ savedData, readOnly, onSave, title }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvasType | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [pages, setPages] = useState<WhiteboardPage[]>([{ id: '1', json: null }]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [activeTool, setActiveTool] = useState<'pencil' | 'eraser' | 'rect' | 'circle' | 'line' | 'text' | 'select'>('pencil');
    const [activeColor, setActiveColor] = useState('#ffffff');
    const [brushWidth, setBrushWidth] = useState(3);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);

    // Initial Load
    useEffect(() => {
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (Array.isArray(parsed.pages)) {
                    setPages(parsed.pages);
                    setCurrentPageIndex(parsed.currentIndex || 0);
                }
            } catch (e) {
                console.warn('Failed to parse whiteboard data:', e);
            }
        }
    }, [savedData]);

    // Canvas Initialization
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: 1200,
            height: 800,
            backgroundColor: '#0a0a0a',
            isDrawingMode: true,
        });

        fabricRef.current = canvas;

        // Default tool setup
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = brushWidth;

        // Resize handling
        const updateSize = () => {
            if (!containerRef.current) return;
            const { clientWidth } = containerRef.current;
            const scale = clientWidth / 1200;
            canvas.setDimensions({ width: clientWidth, height: 800 * scale });
            canvas.setZoom(scale);
        };

        window.addEventListener('resize', updateSize);
        setTimeout(updateSize, 100);

        return () => {
            window.removeEventListener('resize', updateSize);
            canvas.dispose();
        };
    }, []);

    // Sync state tools when tool/color/width change
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = activeTool === 'pencil' || activeTool === 'eraser';

        if (activeTool === 'pencil') {
            canvas.freeDrawingBrush = new PencilBrush(canvas);
            canvas.freeDrawingBrush.color = activeColor;
            canvas.freeDrawingBrush.width = brushWidth;
        } else if (activeTool === 'eraser') {
            canvas.freeDrawingBrush = new PencilBrush(canvas);
            canvas.freeDrawingBrush.color = '#0a0a0a';
            canvas.freeDrawingBrush.width = brushWidth * 2;
        } else {
            canvas.isDrawingMode = false;
        }

    }, [activeTool, activeColor, brushWidth]);

    // Page Switching Logic
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        // Save current page to state before switching
        setPages(prev => {
            const next = [...prev];
            next[currentPageIndex] = { ...next[currentPageIndex], json: canvas.toJSON() };
            return next;
        });

        // Load new page
        const newPageData = pages[currentPageIndex]?.json;
        canvas.clear();
        canvas.backgroundColor = '#0a0a0a';
        if (newPageData) {
            canvas.loadFromJSON(newPageData).then(() => {
                canvas.renderAll();
            }).catch(err => {
                console.error('Failed to load page data:', err);
            });
        }
    }, [currentPageIndex]);

    const handleClearAll = () => {
        if (!fabricRef.current) return;
        if (window.confirm(title === 'ar' ? 'هل تريد مسح الصفحة بالكامل؟' : 'Clear entire page?')) {
            fabricRef.current.clear();
            fabricRef.current.backgroundColor = '#0a0a0a';
            fabricRef.current.renderAll();
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const canvas = fabricRef.current;
                if (canvas && canvas.getActiveObject()) {
                    canvas.remove(canvas.getActiveObject()!);
                    canvas.discardActiveObject();
                    canvas.renderAll();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSave = useCallback(async () => {
        if (!fabricRef.current || !onSave) return;
        setIsSaving(true);
        try {
            // Ensure current page is synced
            const canvas = fabricRef.current;
            const updatedPages = [...pages];
            updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], json: canvas.toJSON() };

            const state = {
                pages: updatedPages,
                currentIndex: currentPageIndex,
                lastSaved: new Date().toISOString()
            };
            await onSave(JSON.stringify(state));
        } finally {
            setIsSaving(false);
        }
    }, [onSave, pages, currentPageIndex]);

    const addPage = () => {
        const newId = (pages.length + 1).toString();
        setPages([...pages, { id: newId, json: null }]);
        setCurrentPageIndex(pages.length);
    };

    const deletePage = (index: number) => {
        if (pages.length <= 1) return;
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);
        setCurrentPageIndex(Math.min(currentPageIndex, newPages.length - 1));
    };

    // PDF Import Logic
    const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoadingPdf(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const typedarray = new Uint8Array(reader.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                const newPages: WhiteboardPage[] = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context!, viewport }).promise;
                    const dataUrl = canvas.toDataURL();

                    // Create a fabric JSON that has this image as background or centered object
                    newPages.push({
                        id: `pdf-${i}-${Date.now()}`,
                        json: {
                            objects: [{
                                type: 'image',
                                src: dataUrl,
                                left: 0,
                                top: 0,
                                scaleX: 1200 / canvas.width,
                                scaleY: 800 / canvas.height,
                                selectable: false,
                                evented: false
                            }],
                            background: '#0a0a0a'
                        }
                    });
                }

                setPages(prev => [...prev, ...newPages]);
                setCurrentPageIndex(pages.length); // Jump to first new PDF page
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            console.error('PDF Import failed:', err);
        } finally {
            setIsLoadingPdf(false);
        }
    };

    const addImage = async () => {
        const url = window.prompt(title === 'ar' ? 'أدخل رابط الصورة:' : 'Enter image URL:');
        if (!url || !fabricRef.current) return;

        try {
            const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
            img.scaleToWidth(400);
            fabricRef.current.add(img);
            fabricRef.current.centerObject(img);
            fabricRef.current.setActiveObject(img);
            fabricRef.current.renderAll();
        } catch (err) {
            console.error('Failed to load image:', err);
        }
    };

    const addShape = (type: 'rect' | 'circle' | 'line' | 'triangle') => {
        if (!fabricRef.current) return;
        let obj: any;

        const props = {
            left: 200,
            top: 200,
            fill: 'transparent',
            stroke: activeColor,
            strokeWidth: brushWidth,
        };

        if (type === 'rect') obj = new Rect({ ...props, width: 200, height: 100 });
        else if (type === 'circle') obj = new Circle({ ...props, radius: 100 });
        else if (type === 'triangle') obj = new Triangle({ ...props, width: 150, height: 150 });
        else obj = new Line([50, 50, 250, 250], props);

        fabricRef.current.add(obj);
        fabricRef.current.setActiveObject(obj);
    };

    return (
        <div className={`flex flex-col w-full bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 transition-all ${isFullscreen ? 'fixed inset-0 z-[100]' : 'relative'}`}>

            {/* Top Bar: Navigation & Page Controls */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#0d0d0d] border-b border-white/5 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-brand-cyan">
                        <span className="text-xl">👩‍🏫</span>
                        <span className="text-xs font-bold uppercase tracking-tighter">{title || 'HubBoard Pro'}</span>
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    {/* Page Nav */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                            disabled={currentPageIndex === 0}
                            className="p-1.5 hover:bg-white/10 disabled:opacity-20 rounded-md transition-all"
                        >
                            ⬅️
                        </button>
                        <span className="text-[10px] font-bold text-gray-400 min-w-[60px] text-center uppercase tracking-widest">
                            Page {currentPageIndex + 1} / {pages.length}
                        </span>
                        <button
                            onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                            disabled={currentPageIndex === pages.length - 1}
                            className="p-1.5 hover:bg-white/10 disabled:opacity-20 rounded-md transition-all"
                        >
                            ➡️
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={addPage}
                        className="px-3 py-1.5 text-[10px] font-bold bg-brand-cyan/20 text-brand-cyan rounded-lg border border-brand-cyan/30 hover:bg-brand-cyan/30 transition-all uppercase"
                    >
                        ➕ New Page
                    </button>
                    <button
                        onClick={() => deletePage(currentPageIndex)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all uppercase"
                    >
                        🗑️ Delete
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white"
                    >
                        {isFullscreen ? '🏁' : '🔲'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-all uppercase shadow-glow-emerald"
                    >
                        {isSaving ? '⏳ saving' : '💾 SAVE'}
                    </button>
                </div>
            </div>

            {/* Tool Side Bar (Floating / Vertical / Sleek) */}
            <div className="flex flex-1 relative overflow-hidden">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 p-2 bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <button
                        onClick={() => setActiveTool('select')}
                        className={`p-3 rounded-xl transition-all ${activeTool === 'select' ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Selection"
                    >
                        🖱️
                    </button>
                    <button
                        onClick={() => setActiveTool('pencil')}
                        className={`p-3 rounded-xl transition-all ${activeTool === 'pencil' ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Pen"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => setActiveTool('eraser')}
                        className={`p-3 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-brand-purple text-white shadow-glow-brand' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Eraser"
                    >
                        🧽
                    </button>
                    <div className="h-px w-full bg-white/10 my-1" />
                    <button onClick={() => addShape('rect')} className="p-3 text-gray-400 hover:bg-white/5 rounded-xl">⏹️</button>
                    <button onClick={() => addShape('circle')} className="p-3 text-gray-400 hover:bg-white/5 rounded-xl">⏺️</button>
                    <button onClick={() => addShape('triangle')} className="p-3 text-gray-400 hover:bg-white/5 rounded-xl">🔼</button>
                    <button onClick={addImage} className="p-3 text-gray-400 hover:bg-white/5 rounded-xl" title="Insert Image">🖼️</button>

                    <div className="h-px w-full bg-white/10 my-1" />

                    <button
                        onClick={handleClearAll}
                        className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl"
                        title="Clear All"
                    >
                        🗑️
                    </button>

                    <label className="p-3 text-gray-400 hover:bg-white/5 rounded-xl cursor-pointer" title="Import PDF">
                        {isLoadingPdf ? '⏳' : '📁'}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfImport} />
                    </label>

                    <div className="h-px w-full bg-white/10 my-1" />

                    {/* Colors */}
                    <div className="flex flex-col gap-2 p-1">
                        {['#ffffff', '#ff4757', '#2ed573', '#1e90ff', '#eccc68'].map(c => (
                            <button
                                key={c}
                                onClick={() => setActiveColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${activeColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-[#1a1a1a] flex items-center justify-center p-4 overflow-auto"
                >
                    <div className="shadow-2xl rounded-sm overflow-hidden bg-[#0a0a0a]">
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Thumbnail strip (optional) */}
            <div className="px-6 py-2 bg-[#0d0d0d] border-t border-white/5 flex items-center h-12 overflow-x-auto gap-2">
                {pages.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPageIndex(i)}
                        className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${currentPageIndex === i ? 'bg-brand-purple text-white' : 'bg-white/5 text-gray-500'}`}
                    >
                        PAGE {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WhiteboardBlock;
