import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Canvas,
    PencilBrush,
    SprayBrush,
    CircleBrush,
    PatternBrush,
    Rect,
    Circle,
    Line,
    Triangle,
    Image as FabricImage,
    ActiveSelection,
    util,
    Point
} from '../lib/fabric';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker src for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface WhiteboardPage {
    id: string;
    json: any;
}

interface WhiteboardBlockProps {
    savedData?: string;
    onSave: (data: string) => Promise<any>;
    onClose?: () => void;
    title?: string;
    onSetHasChanges?: (val: boolean) => void;
}

const WhiteboardBlock: React.FC<WhiteboardBlockProps> = ({ savedData, onSave, onClose, title, onSetHasChanges }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Tools State
    const [activeTool, setActiveTool] = useState<'pencil' | 'eraser' | 'rect' | 'circle' | 'line' | 'text' | 'select'>('pencil');
    const [activeColor, setActiveColor] = useState('#ffffff');
    const [brushWidth, setBrushWidth] = useState(3);
    const [eraserWidth, setEraserWidth] = useState(30);
    const [brushType, setBrushType] = useState<'pencil' | 'spray' | 'circle' | 'pattern'>('pencil');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Initial Load - Only once
    const initialLoadDone = useRef(false);
    const [pages, setPages] = useState<WhiteboardPage[]>([{ id: '1', json: null }]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    useEffect(() => {
        if (savedData && !initialLoadDone.current) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.pages) {
                    setPages(parsed.pages);
                    setCurrentPageIndex(parsed.currentIndex || 0);
                    initialLoadDone.current = true;
                }
            } catch (e) {
                console.error("Failed to parse saved whiteboard data", e);
            }
        }
    }, [savedData]);

    // Canvas Initialization & Responsiveness
    useEffect(() => {
        if (!canvasRef.current) return;

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();

        const canvas = new Canvas(canvasRef.current, {
            width: window.innerWidth < 768 ? window.innerWidth - 32 : 1200,
            height: window.innerWidth < 768 ? window.innerHeight * 0.7 : 800,
            backgroundColor: '#0a0a0a',
            isDrawingMode: true,
        });

        fabricRef.current = canvas;

        // Resize handling - Professional fluid scaling
        const updateSize = () => {
            checkMobile();
            if (!containerRef.current) return;
            const { clientWidth, clientHeight } = containerRef.current;

            // Adjust base dimensions for mobile vs desktop
            const baseWidth = window.innerWidth < 768 ? clientWidth : 1200;
            const baseHeight = window.innerWidth < 768 ? clientHeight : 800;

            const scale = clientWidth / baseWidth;
            canvas.setDimensions({ width: clientWidth, height: baseHeight * scale });
            canvas.setZoom(scale);
        };

        window.addEventListener('resize', updateSize);
        setTimeout(updateSize, 100);

        // Autosave Logic - Listen for any canvas changes
        const saveTimeout = { current: null as any };
        const triggerAutosave = () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(() => {
                // We use a custom event to trigger the save because handleSave is in a closure
                const event = new CustomEvent('whiteboard:autosave');
                window.dispatchEvent(event);
            }, 5000); // 5 second debounce for cloud autosave to avoid rate limits
        };

        canvas.on('object:added', triggerAutosave);
        canvas.on('object:modified', triggerAutosave);
        canvas.on('object:removed', triggerAutosave);
        canvas.on('path:created', triggerAutosave);

        return () => {
            window.removeEventListener('resize', updateSize);
            canvas.off('object:added', triggerAutosave);
            canvas.off('object:modified', triggerAutosave);
            canvas.off('object:removed', triggerAutosave);
            canvas.off('path:created', triggerAutosave);
            canvas.dispose();
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, []);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const canvas = fabricRef.current;
            if (!canvas) return;
            const currentJson = canvas.toJSON();
            const updatedPages = [...pages];
            updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], json: currentJson };

            setPages(updatedPages);

            const state = {
                pages: updatedPages,
                currentIndex: currentPageIndex,
                lastSaved: new Date().toISOString()
            };
            const serialized = JSON.stringify(state);
            await onSave(serialized);
            if (onSetHasChanges) onSetHasChanges(false);
            return serialized;
        } finally {
            setIsSaving(false);
        }
    }, [onSave, pages, currentPageIndex, onSetHasChanges]);

    const handleFinish = async () => {
        await handleSave();
        if (onClose) onClose();
    };

    // Listen for the autosave event to trigger the handleSave callback
    useEffect(() => {
        const handleAutosaveEvent = () => {
            handleSave();
        };
        window.addEventListener('whiteboard:autosave', handleAutosaveEvent);
        return () => window.removeEventListener('whiteboard:autosave', handleAutosaveEvent);
    }, [handleSave]);

    // Sync state tools when tool/color/width/type change
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = activeTool === 'pencil' || activeTool === 'eraser';

        if (activeTool === 'pencil') {
            // Instantiate correct brush type
            let brush;
            switch (brushType) {
                case 'spray': brush = new SprayBrush(canvas); break;
                case 'circle': brush = new CircleBrush(canvas); break;
                case 'pattern': brush = new PatternBrush(canvas); break;
                default: brush = new PencilBrush(canvas);
            }
            canvas.freeDrawingBrush = brush;
            canvas.freeDrawingBrush.color = activeColor;
            canvas.freeDrawingBrush.width = brushWidth;
        } else if (activeTool === 'eraser') {
            canvas.freeDrawingBrush = new PencilBrush(canvas);
            canvas.freeDrawingBrush.color = '#0a0a0a'; // Background color acting as eraser
            canvas.freeDrawingBrush.width = eraserWidth;
        } else {
            canvas.isDrawingMode = false;
        }

    }, [activeTool, activeColor, brushWidth, eraserWidth, brushType]);

    // Page Switching Logic - Refactored for stability
    const changePage = async (newIndex: number) => {
        const canvas = fabricRef.current;
        if (!canvas || newIndex === currentPageIndex) return;

        // Save current page
        const currentData = canvas.toJSON();
        const updatedPages = [...pages];
        updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], json: currentData };
        setPages(updatedPages);

        // Clear and load new page
        canvas.clear();
        canvas.backgroundColor = '#0a0a0a';
        setCurrentPageIndex(newIndex);

        const targetJson = updatedPages[newIndex]?.json;
        if (targetJson) {
            await canvas.loadFromJSON(targetJson);
            canvas.renderAll();
        }
    };

    const handleClearAll = () => {
        if (!fabricRef.current) return;
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = '#0a0a0a';
        fabricRef.current.renderAll();
    };


    const addPage = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        // Save current page first
        const currentData = canvas.toJSON();
        const updatedPages = [...pages];
        updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], json: currentData };

        const newId = (pages.length + 1).toString();
        const finalPages = [...updatedPages, { id: newId, json: null }];

        setPages(finalPages);

        // Switch to new page
        canvas.clear();
        canvas.backgroundColor = '#0a0a0a';
        setCurrentPageIndex(finalPages.length - 1);
    };

    const deletePage = (index: number) => {
        if (pages.length <= 1) return;
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);

        const nextIndex = Math.min(currentPageIndex, newPages.length - 1);
        setCurrentPageIndex(nextIndex);

        // Load the new active page
        const canvas = fabricRef.current;
        if (canvas) {
            canvas.clear();
            canvas.backgroundColor = '#0a0a0a';
            const data = newPages[nextIndex]?.json;
            if (data) {
                canvas.loadFromJSON(data).then(() => canvas.renderAll());
            }
        }
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

    const [pointerPos, setPointerPos] = useState({ x: 100, y: 100 });
    const [showTools, setShowTools] = useState(true);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    // Track mouse movement for floating toolbar - ONLY when closed
    useEffect(() => {
        if (isPaletteOpen) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Smoothly move the magic button
            setPointerPos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isPaletteOpen]);

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
                            onClick={() => changePage(Math.max(0, currentPageIndex - 1))}
                            disabled={currentPageIndex === 0}
                            className="p-1.5 hover:bg-white/10 disabled:opacity-20 rounded-md transition-all"
                        >
                            ⬅️
                        </button>
                        <span className="text-[10px] font-bold text-gray-400 min-w-[60px] text-center uppercase tracking-widest">
                            Page {currentPageIndex + 1} / {pages.length}
                        </span>
                        <button
                            onClick={() => changePage(Math.min(pages.length - 1, currentPageIndex + 1))}
                            disabled={currentPageIndex === pages.length - 1}
                            className="p-1.5 hover:bg-white/10 disabled:opacity-20 rounded-md transition-all"
                        >
                            ➡️
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTools(!showTools)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all uppercase ${showTools ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' : 'bg-white/5 text-gray-400 border-white/10'}`}
                    >
                        {showTools ? 'Hide Tools' : 'Show Tools'}
                    </button>
                    {onClose && (
                        <button
                            onClick={handleFinish}
                            className="px-4 py-1.5 text-xs font-bold bg-brand-cyan text-black rounded-lg hover:bg-brand-cyan/80 transition-all uppercase flex items-center gap-2"
                        >
                            <span>✅</span>
                            <span>{title === 'ar' ? 'إنهاء وحفظ' : 'Finish & Return'}</span>
                        </button>
                    )}
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

            {/* Main Canvas Area */}
            <div className="flex flex-1 relative overflow-hidden">
                {/* Magic Button / Palette (Follows Cursor when closed) */}
                {showTools && (
                    <div
                        className={`fixed pointer-events-none z-[2000] p-1 transition-all ${isPaletteOpen ? 'duration-500 scale-100' : 'duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]'}`}
                        style={{
                            left: 0,
                            top: 0,
                            transform: `translate(${Math.min(window.innerWidth - (isPaletteOpen ? (isMobile ? 100 : 120) : 60), Math.max(20, pointerPos.x + 20))}px, ${Math.min(window.innerHeight - (isPaletteOpen ? (isMobile ? 400 : 450) : 60), Math.max(20, pointerPos.y - (isPaletteOpen ? (isMobile ? 150 : 200) : 30)))}px)`
                        }}
                    >
                        {!isPaletteOpen ? (
                            /* COMPACT MAGIC BUTTON - Follows Finger/Pointer */
                            <button
                                onClick={() => setIsPaletteOpen(true)}
                                className={`pointer-events-auto ${isMobile ? 'w-14 h-14' : 'w-12 h-12'} bg-brand-purple text-white rounded-full shadow-[0_10px_30px_rgba(139,92,246,0.6)] border-2 border-white/20 flex items-center justify-center ${isMobile ? 'text-3xl' : 'text-2xl'} hover:scale-110 active:scale-95 transition-all shadow-glow-brand animate-pulse-purple`}
                                title="Open Tools"
                            >
                                ✨
                            </button>
                        ) : (
                            /* EXPANDED PALETTE - Locked in Position */
                            <div className={`pointer-events-auto flex flex-col gap-1.5 p-2 bg-[#0d0d0d]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-l-brand-purple border-l-4 group ${isMobile ? 'scale-90' : ''}`}>
                                <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/5 pb-1 select-none">
                                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest pl-1">Tools</span>
                                    <button
                                        onClick={() => setIsPaletteOpen(false)}
                                        className="p-1 hover:bg-white/10 rounded-md text-[10px] text-white/40 hover:text-white transition-colors"
                                    >
                                        ❌
                                    </button>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => setActiveTool('pencil')}
                                        className={`p-3 rounded-xl transition-all ${activeTool === 'pencil' ? 'bg-brand-purple text-white shadow-glow-brand scale-110' : 'text-gray-400 hover:bg-white/5'}`}
                                        title="Pen"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('eraser')}
                                        className={`p-3 rounded-xl transition-all ${activeTool === 'eraser' ? 'bg-brand-purple text-white shadow-glow-brand scale-110' : 'text-gray-400 hover:bg-white/5'}`}
                                        title="Eraser"
                                    >
                                        🧽
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('select')}
                                        className={`p-3 rounded-xl transition-all ${activeTool === 'select' ? 'bg-brand-purple text-white shadow-glow-brand scale-110' : 'text-gray-400 hover:bg-white/5'}`}
                                        title="Selection"
                                    >
                                        🖱️
                                    </button>
                                </div>

                                <div className="h-px w-full bg-white/10 my-0.5" />

                                {/* Brush/Eraser Options */}
                                <div className="px-1 py-1 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="flex items-center justify-between text-[8px] text-white/40 font-bold uppercase tracking-wider">
                                            <span>Size</span>
                                            <span>{activeTool === 'eraser' ? eraserWidth : brushWidth}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="100"
                                            value={activeTool === 'eraser' ? eraserWidth : brushWidth}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (activeTool === 'eraser') setEraserWidth(val);
                                                else setBrushWidth(val);
                                            }}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                                        />
                                    </div>

                                    {activeTool === 'pencil' && (
                                        <div className="grid grid-cols-2 gap-1 mt-1">
                                            {(['pencil', 'spray', 'circle', 'pattern'] as const).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setBrushType(t)}
                                                    className={`p-1.5 rounded-md text-[8px] transition-all capitalize ${brushType === t ? 'bg-white/10 text-brand-cyan shadow-inner' : 'text-white/30 hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="h-px w-full bg-white/10 my-0.5" />

                                <div className={`flex flex-col gap-1 ${isMobile ? 'text-base' : 'text-lg'}`}>
                                    <button onClick={() => addShape('rect')} className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-transform hover:scale-110">⏹️</button>
                                    <button onClick={() => addShape('circle')} className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-transform hover:scale-110">⏺️</button>
                                    <button onClick={() => addShape('triangle')} className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-transform hover:scale-110">🔼</button>
                                </div>

                                <div className="h-px w-full bg-white/10 my-0.5" />

                                {/* Unlimited Color Picker - Enhanced */}
                                <div className="relative flex justify-center py-1">
                                    <input
                                        type="color"
                                        value={activeColor}
                                        onChange={(e) => setActiveColor(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div
                                        className="w-8 h-8 rounded-full border-2 border-white/40 shadow-glow-brand flex items-center justify-center overflow-hidden transition-transform hover:scale-110"
                                        style={{ backgroundColor: activeColor }}
                                    >
                                        <div className="w-full h-full bg-gradient-to-tr from-black/20 to-transparent flex items-center justify-center text-xs">
                                            🎨
                                        </div>
                                    </div>
                                    <div className="absolute -right-2 -top-1 w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-glow-brand" />
                                </div>

                                <div className="h-px w-full bg-white/10 my-0.5" />

                                <button
                                    onClick={handleClearAll}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm"
                                    title="Clear All"
                                >
                                    🗑️
                                </button>
                                <label className="p-2 text-gray-400 hover:bg-white/5 rounded-lg cursor-pointer text-sm" title="Import PDF">
                                    {isLoadingPdf ? '⏳' : '📁'}
                                    <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfImport} />
                                </label>
                            </div>
                        )}
                    </div>
                )}

                <div
                    ref={containerRef}
                    className="flex-1 bg-[#1a1a1a] flex items-center justify-center p-4 overflow-auto"
                >
                    <div className="shadow-2xl rounded-sm overflow-hidden bg-[#0a0a0a]">
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>

            {/* Bottom Bar: Thumbnail strip */}
            <div className="px-6 py-2 bg-[#0d0d0d] border-t border-white/5 flex items-center h-12 overflow-x-auto gap-2">
                {pages.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => changePage(i)}
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
