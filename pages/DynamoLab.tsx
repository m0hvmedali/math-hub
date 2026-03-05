import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Play, Pause, RotateCcw, Box, Activity,
    ChevronRight, Cpu, Zap, Beaker, Settings, FlaskConical,
    TrendingUp, Maximize2, Microscope, Book, ExternalLink
} from 'lucide-react';

// @ts-ignore
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import 'nerdamer/Calculus';
import 'nerdamer/Solve';

import * as THREE from 'three';

// @ts-ignore
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { normalizeMath, arabizeMath, compileExpr, CompiledExpr } from '../utils/MathNormalization';
import { SparkleIcon } from '../components/Icons';
import 'mathlive';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'math-field': any;
        }
    }
}

// ============= PERFORMANCE OPTIMIZATION =============
const KeyBtn = React.memo<{ label: string; action: () => void; className?: string }>(
    ({ label, action, className }) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                action();
            }}
            className={`bg-[var(--glass-bg)] hover:bg-brand-cyan/10 border border-[var(--glass-border)] hover:border-brand-cyan/30 rounded-xl py-2.5 text-xs font-mono transition-all active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm ${className}`}
        >
            {label}
        </button>
    )
);

KeyBtn.displayName = 'KeyBtn';

const LabPanel = ({
    title,
    badge,
    subtitle,
    children,
    colorClass = "text-brand-cyan",
    borderColor = "border-brand-cyan/20",
    isActive = true
}: {
    title: string;
    badge: string;
    subtitle?: string;
    children: React.ReactNode;
    colorClass?: string;
    borderColor?: string;
    isActive?: boolean;
}) => (
    <div className={`flex flex-col h-full glass-card bg-[var(--input-bg)] overflow-hidden relative group ${isActive ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
        <div className="flex-shrink-0 flex items-center gap-2 md:gap-3 p-2 md:p-4 border-b border-[var(--glass-border)] bg-black/5">
            <div className={`p-1 md:p-1.5 rounded-lg bg-black/20 border ${borderColor}`}>
                <Activity className={`w-3 h-3 md:w-3.5 md:h-3.5 ${colorClass}`} />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5 md:gap-2">
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{title}</span>
                    <span className={`text-[7px] md:text-[8px] font-mono px-1 md:px-1.5 py-0.5 rounded border ${borderColor} opacity-60`}>{badge}</span>
                </div>
                {subtitle && <span className="text-[7px] md:text-[9px] text-[var(--text-muted)] font-medium truncate max-w-[100px] md:max-w-[150px]">{subtitle}</span>}
            </div>
            <Maximize2 className="w-2.5 h-2.5 md:w-3 md:h-3 ml-auto text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
        </div>
        <div className="flex-1 relative min-h-0">
            {children}
        </div>
    </div>
);

const KEYBOARD_LAYOUTS: Record<'algebra' | 'calculus' | 'physics', Array<{ label: string; action: string; highlight?: string }>> = {
    algebra: [
        { label: 'س', action: 'x' }, { label: 'ن', action: 'n' }, { label: '²', action: '^2' }, { label: '³', action: '^3' },
        { label: '+', action: '+' }, { label: '-', action: '-' }, { label: '*', action: '*' }, { label: '/', action: '/' },
        { label: '(', action: '(' }, { label: ')', action: ')' }, { label: '=', action: '=' }, { label: '√', action: '\\sqrt{}' }
    ],
    calculus: [
        { label: 'd/dx', action: '\\frac{d}{dx}', highlight: 'border-accent-amber/40 text-accent-amber' },
        { label: '∫', action: '\\int', highlight: 'border-accent-green/40 text-accent-green' },
        { label: 'lim', action: '\\lim_{x\\to0}', highlight: 'border-brand-cyan/40 text-brand-cyan' },
        { label: 'Σ', action: '\\sum', highlight: 'border-brand-magenta/40 text-brand-magenta' },
        { label: '∞', action: '\\infty' }, { label: 'π', action: '\\pi' }, { label: 'e', action: 'e' }, { label: 'ln', action: '\\ln' }
    ],
    physics: [
        { label: 'س(ن)', action: 's(n)' }, { label: 'ع(ن)', action: 'v(n)' }, { label: 'جـ(ن)', action: 'a(n)' },
        { label: 'Δt', action: '\\Delta t' }, { label: 'm', action: 'm' }, { label: 'F', action: 'F' },
        { label: 'θ', action: '\\theta' }, { label: 'sin', action: '\\sin' }, { label: 'cos', action: '\\cos' }, { label: 'tan', action: '\\tan' }
    ]
};

const DynamoLab: React.FC = () => {
    const navigate = useNavigate();
    const [expr, setExpr] = useState('6*x^2 - x^3');
    const [variable, setVariable] = useState('x');
    const [keyboardTab, setKeyboardTab] = useState<'algebra' | 'calculus' | 'physics'>('algebra');
    const [isExamplesOpen, setIsExamplesOpen] = useState(false);
    const mathfieldRef = useRef<any>(null);

    // Optimized math engine cache
    const [compiled, setCompiled] = useState<CompiledExpr | null>(null);
    const [criticalPoints, setCriticalPoints] = useState<any[]>([]);
    const [inflectionPoints, setInflectionPoints] = useState<any[]>([]);
    const [stats, setStats] = useState({ n: 0, s: 0, v: 0, a: 0, dist: 0 });

    const containerRefs = {
        main: useRef<HTMLDivElement>(null),
        deriv: useRef<HTMLDivElement>(null),
        integ: useRef<HTMLDivElement>(null),
        sim: useRef<HTMLDivElement>(null),
    };
    const threeRef = useRef<any>(null);
    const requestRef = useRef<number>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [dimensions, setDimensions] = useState({ main: { w: 0, h: 0 }, deriv: { w: 0, h: 0 }, integ: { w: 0, h: 0 }, sim: { w: 0, h: 0 } });

    // ============= DYNAMO PALETTE =============
    const DYNAMO = {
        CYAN: '#00e5ff',
        ORANGE: '#ff7b00',
        GREEN: '#00ff88',
        VIOLET: '#c44dff',
        RED: '#ff2255'
    };

    const insertSymbol = useCallback((snippet: string) => {
        if (mathfieldRef.current) {
            mathfieldRef.current.insert(snippet);
            mathfieldRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (mathfieldRef.current && mathfieldRef.current.value !== expr) {
            mathfieldRef.current.value = expr;
        }
    }, [expr]);

    useEffect(() => {
        analyzeMath();
    }, [expr, variable]);

    useEffect(() => {
        initThree();
        return () => cleanupThree();
    }, []);

    const analyzeMath = useCallback(() => {
        try {
            const normalized = normalizeMath(expr, variable);
            const compiledObj = compileExpr(nerdamer, normalized, variable);
            setCompiled(compiledObj);
            runDeepAnalysis(compiledObj);
        } catch (err: any) {
            // Silently ignore transient parse errors during typing
            if (!err?.message?.includes('ParseError') && !err?.message?.includes('SyntaxError')) {
                console.error("Analysis Error:", err);
            }
        }
    }, [expr, variable]);

    const runDeepAnalysis = useCallback((compiledData: CompiledExpr) => {
        try {
            const { expr: normalized, d1: d1str, d2: d2str } = compiledData;
            const solutions = (nerdamer as any).solve(d1str, variable);
            const points = solutions.symbol.elements.map((s: any) => {
                const xVal = parseFloat(s.text());
                const yVal = parseFloat(nerdamer(normalized, { [variable]: xVal.toString() }).evaluate().text());
                const secondDerivVal = parseFloat(nerdamer(d2str, { [variable]: xVal.toString() }).evaluate().text());
                return { x: xVal, y: yVal, type: secondDerivVal < 0 ? 'نهاية عظمى' : 'نهاية صغرى' };
            });
            setCriticalPoints(points.filter((p: any) => !isNaN(p.x)));

            const inflSols = (nerdamer as any).solve(d2str, variable);
            const inflPoints = inflSols.symbol.elements.map((s: any) => {
                const xVal = parseFloat(s.text());
                const yVal = parseFloat(nerdamer(normalized, { [variable]: xVal.toString() }).evaluate().text());
                return { x: xVal, y: yVal };
            });
            setInflectionPoints(inflPoints.filter((p: any) => !isNaN(p.x)));
        } catch (e) {
            console.warn("Analysis failed:", e);
        }
    }, [variable]);

    useEffect(() => {
        const obs = new ResizeObserver((entries) => {
            setDimensions(prev => {
                const updates: any = {};
                let changed = false;
                entries.forEach(entry => {
                    const target = entry.target as HTMLDivElement;
                    const nw = target.clientWidth;
                    const nh = target.clientHeight;

                    let key: 'main' | 'deriv' | 'integ' | 'sim' = 'main';
                    if (target === containerRefs.main.current) key = 'main';
                    else if (target === containerRefs.deriv.current) key = 'deriv';
                    else if (target === containerRefs.integ.current) key = 'integ';
                    else if (target === containerRefs.sim.current) key = 'sim';
                    else return;

                    // Absolute positioning makes this much more stable
                    if (Math.abs(prev[key].w - nw) > 1 || Math.abs(prev[key].h - nh) > 1) {
                        updates[key] = { w: nw, h: nh };
                        changed = true;
                    }
                });
                return changed ? { ...prev, ...updates } : prev;
            });
        });

        [containerRefs.main, containerRefs.deriv, containerRefs.integ, containerRefs.sim].forEach(ref => {
            if (ref.current) obs.observe(ref.current);
        });

        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (compiled && dimensions.main.w > 0 && dimensions.main.h > 0) {
            updatePlots();
        }
    }, [compiled, dimensions, criticalPoints, variable]);

    const updatePlots = useCallback(() => {
        if (!compiled) return;

        // Map any variable to 'x' for function-plot compatibility
        const plotFn = compiled.expr.replace(new RegExp(`\\b${variable}\\b`, 'g'), 'x');
        const plotD1 = compiled.d1.replace(new RegExp(`\\b${variable}\\b`, 'g'), 'x');

        // @ts-ignore
        import('function-plot').then(({ default: functionPlot }) => {
            const common = {
                xAxis: { domain: [-10, 10], label: variable === 'x' ? 'س' : 'ن' },
                yAxis: { domain: [-10, 10], label: 'ص' },
                grid: true,
                disableZoom: false // Allow zooming for better inspection
            };

            // Main Function
            if (containerRefs.main.current && dimensions.main.w > 0 && dimensions.main.h > 20) {
                functionPlot({
                    ...common,
                    target: containerRefs.main.current,
                    width: dimensions.main.w,
                    height: dimensions.main.h,
                    data: [
                        { fn: plotFn, color: DYNAMO.CYAN, graphType: 'polyline', closed: true, attr: { 'stroke-width': 3 }, nSamples: 800 },
                        { points: criticalPoints.map(p => [p.x, p.y]), fnType: 'points', graphType: 'scatter', color: DYNAMO.ORANGE, attr: { r: 5 } }
                    ]
                });
            }

            // Derivative
            if (containerRefs.deriv.current && dimensions.deriv.w > 0 && dimensions.deriv.h > 20) {
                functionPlot({
                    ...common,
                    target: containerRefs.deriv.current,
                    width: dimensions.deriv.w,
                    height: dimensions.deriv.h,
                    data: [
                        { fn: plotD1, color: DYNAMO.ORANGE, attr: { 'stroke-width': 2 }, nSamples: 600 },
                        { fn: '0', color: 'rgba(255,255,255,0.1)' }
                    ]
                });
            }

            // Integral
            if (containerRefs.integ.current && dimensions.integ.w > 0 && dimensions.integ.h > 20) {
                try {
                    const intFnRaw = nerdamer.integrate(compiled.expr, variable).toString();
                    const plotInteg = intFnRaw.replace(new RegExp(`\\b${variable}\\b`, 'g'), 'x');
                    functionPlot({
                        ...common,
                        target: containerRefs.integ.current,
                        width: dimensions.integ.w,
                        height: dimensions.integ.h,
                        data: [{ fn: plotInteg, color: DYNAMO.GREEN, attr: { 'stroke-width': 2 }, nSamples: 600 }]
                    });
                } catch (e) { }
            }
        });
    }, [compiled, criticalPoints, dimensions, variable, DYNAMO]);

    // ============= 3D SIMULATION =============
    useEffect(() => {
        if (threeRef.current && dimensions.sim.w > 0) {
            const { renderer, camera } = threeRef.current;
            camera.aspect = dimensions.sim.w / dimensions.sim.h;
            camera.updateProjectionMatrix();
            renderer.setSize(dimensions.sim.w, dimensions.sim.h);
        }
    }, [dimensions.sim]);

    const initThree = useCallback(() => {
        if (!containerRefs.sim.current || threeRef.current) return;
        const W = containerRefs.sim.current.clientWidth || 300, H = containerRefs.sim.current.clientHeight || 200;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        containerRefs.sim.current.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0x404040));
        const light = new THREE.PointLight(DYNAMO.CYAN, 1, 100); light.position.set(10, 10, 10); scene.add(light);
        const grid = new THREE.GridHelper(20, 20, 0x1e2d52, 0x0d1525); grid.material.opacity = 0.1; grid.material.transparent = true; scene.add(grid);

        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshPhongMaterial({ color: DYNAMO.VIOLET, emissive: DYNAMO.VIOLET, emissiveIntensity: 0.5 }));
        scene.add(particle);

        const velArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2, DYNAMO.GREEN);
        const accArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2, DYNAMO.ORANGE);
        scene.add(velArrow); scene.add(accArrow);

        camera.position.set(0, 5, 10); camera.lookAt(0, 0, 0);
        threeRef.current = { scene, camera, renderer, particle, velArrow, accArrow };

        const animate = () => { renderer.render(scene, camera); requestRef.current = requestAnimationFrame(animate); };
        requestRef.current = requestAnimationFrame(animate);
    }, [DYNAMO]);

    const cleanupThree = useCallback(() => {
        if (threeRef.current) {
            threeRef.current.renderer.dispose();
            if (containerRefs.sim.current) containerRefs.sim.current.innerHTML = '';
            threeRef.current = null;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    }, []);

    const updateSimState = useCallback((t: number) => {
        if (!compiled || !threeRef.current) return;
        try {
            const evalScope = { [variable]: t.toString() };
            const s = parseFloat(nerdamer(compiled.expr, evalScope).evaluate().text());
            const v = parseFloat(nerdamer(compiled.d1, evalScope).evaluate().text());
            const a = parseFloat(nerdamer(compiled.d2, evalScope).evaluate().text());

            const { particle, velArrow, accArrow } = threeRef.current;
            particle.position.x = s;
            velArrow.position.copy(particle.position);
            velArrow.setDirection(new THREE.Vector3(v >= 0 ? 1 : -1, 0, 0));
            velArrow.setLength(Math.min(Math.abs(v), 5));
            velArrow.visible = Math.abs(v) > 0.1;

            accArrow.position.copy(particle.position);
            accArrow.setDirection(new THREE.Vector3(a >= 0 ? 1 : -1, 0, 0));
            accArrow.setLength(Math.min(Math.abs(a), 5));
            accArrow.visible = Math.abs(a) > 0.1;

            return { n: t, s, v, a };
        } catch (e) {
            setIsPlaying(false);
            return null;
        }
    }, [compiled, variable]);

    useEffect(() => {
        let frame: number;
        if (isPlaying) {
            const loop = () => {
                setStats(curr => {
                    const nextT = curr.n + 0.05;
                    const result = updateSimState(nextT);
                    if (result) {
                        return { ...curr, ...result, dist: curr.dist + Math.abs(result.v * 0.05) };
                    }
                    return curr;
                });
                frame = requestAnimationFrame(loop);
            };
            frame = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(frame);
    }, [isPlaying, updateSimState]);

    const resetSim = () => { setStats({ n: 0, s: 0, v: 0, a: 0, dist: 0 }); setIsPlaying(false); };

    return (
        <div className="h-[100dvh] flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] font-sans relative overflow-hidden dynamo-theme sm:select-none">
            {/* Dynamo Overlays */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] z-50 bg-[length:100%_4px]" />

            <header className="h-12 md:h-16 border-b border-[var(--glass-border)] flex items-center justify-between px-4 md:px-6 glass-nav z-10 shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => navigate('/labs')} className="p-1.5 md:p-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg hover:border-brand-cyan/50 transition-all group">
                        <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-muted)] group-hover:text-brand-cyan" />
                    </button>
                    <div className="flex items-center gap-2 md:gap-3">
                        <Beaker className="w-4 h-4 md:w-5 md:h-5 text-brand-cyan" />
                        <h1 className="text-sm md:text-lg font-black tracking-tight uppercase">DYNAMO <span className="text-brand-cyan">LAB</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => setIsExamplesOpen(true)} className="h-8 md:h-9 px-3 md:px-4 glass-card border-brand-magenta/30 hover:border-brand-magenta/60 rounded-lg flex items-center gap-2 text-[8px] md:text-[9px] font-black text-brand-magenta uppercase tracking-widest transition-all">
                        <Book className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden xs:inline">Examples</span>
                    </button>
                    <div className="h-8 md:h-9 px-3 md:px-4 glass-card rounded-lg hidden sm:flex items-center gap-2 md:gap-3 text-[8px] md:text-[9px] font-black text-brand-cyan/80 uppercase tracking-[0.2em]">
                        <Activity className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden md:inline">Telemetry: Online</span>
                    </div>
                    <button className="p-2 md:p-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg hover:border-brand-cyan/50">
                        <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-muted)]" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Input Bar */}
                <div className="p-2 md:p-4 border-b border-[var(--glass-border)] bg-black/5 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
                    <div className="flex-1 glass-card bg-[var(--input-bg)] p-2 md:p-3 flex items-center gap-2 md:gap-4 relative overflow-hidden">
                        <span className="font-black text-brand-cyan text-xs md:text-sm italic tracking-tighter shrink-0">f({variable === 'x' ? 'س' : 'ن'}) = </span>
                        <math-field
                            ref={mathfieldRef}
                            onInput={(e: any) => setExpr(e.target.value)}
                            style={{ flex: '1', backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '900', outline: 'none', '--caret-color': 'var(--brand-cyan)', minWidth: '0' }}
                        >
                            {expr}
                        </math-field>

                        <div className="hidden md:flex gap-1 ml-4 border-l border-[var(--glass-border)] pl-4 shrink-0">
                            {[
                                { id: 'algebra', label: 'جبر' },
                                { id: 'calculus', label: 'تفاضل' },
                                { id: 'physics', label: 'فيزياء' }
                            ].map((t) => (
                                <button key={t.id} onClick={() => setKeyboardTab(t.id as any)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${keyboardTab === t.id ? 'bg-brand-cyan text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Tabs & Sync Row */}
                    <div className="flex items-center gap-2 md:hidden">
                        <div className="flex-1 glass-card bg-[var(--input-bg)] p-1 flex gap-1 items-center">
                            {[
                                { id: 'algebra', label: 'جبر' },
                                { id: 'calculus', label: 'تفاضل' },
                                { id: 'physics', label: 'فيزياء' }
                            ].map((t) => (
                                <button key={t.id} onClick={() => setKeyboardTab(t.id as any)} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${keyboardTab === t.id ? 'bg-brand-cyan text-white' : 'text-[var(--text-muted)]'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <button className="btn-power h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">SYNC</button>
                    </div>

                    <button className="hidden md:block btn-power h-full px-8 rounded-xl font-black text-xs uppercase tracking-widest min-w-[120px]">SYNC</button>
                </div>

                {/* Keyboard Grid (Shared) */}
                <div className="px-4 py-2 border-b border-[var(--glass-border)] bg-black/10 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                        {KEYBOARD_LAYOUTS[keyboardTab].map((key, i) => (
                            <KeyBtn key={i} label={key.label} action={() => insertSymbol(key.action)} className={`min-w-[70px] ${key.highlight}`} />
                        ))}
                    </div>
                </div>

                {/* 2x2 Grid Layout */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 gap-4 md:gap-6 p-4 md:p-6 min-h-0 overflow-y-auto lg:overflow-hidden lg:max-h-full">
                    <div className="lg:col-span-3 lg:row-span-2 min-h-[350px] md:min-h-0 relative">
                        <LabPanel title="Function (الدالة)" badge="f(x)" subtitle={expr} colorClass="text-brand-cyan" borderColor="border-brand-cyan/20">
                            <div ref={containerRefs.main} className="absolute inset-0 p-2 overflow-hidden" />
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                <div className="text-[8px] font-black text-brand-cyan bg-black/40 px-2 py-0.5 rounded backdrop-blur-md">LIVE MAPPING</div>
                                <div className="text-[7px] text-[var(--text-muted)] uppercase tracking-tighter">Samples: 800ns</div>
                            </div>
                        </LabPanel>
                    </div>

                    <div className="lg:col-span-6 lg:row-span-2 flex flex-col gap-4 md:gap-6 min-h-[700px] md:min-h-0">
                        <div className="flex-1 md:h-[60%] flex flex-col md:flex-row gap-4 md:gap-6">
                            <div className="flex-1 min-h-[350px] md:min-h-0">
                                <LabPanel title="Derivative (تفاضل)" badge="f'(x)" subtitle="Rate of Change" colorClass="text-accent-amber" borderColor="border-accent-amber/20">
                                    <div ref={containerRefs.deriv} className="absolute inset-0 p-2 grayscale-[0.2] overflow-hidden" />
                                </LabPanel>
                            </div>
                            <div className="flex-1 min-h-[350px] md:min-h-0">
                                <LabPanel title="Integration (تكامل)" badge="∫f(x)" subtitle="Area Accumulation" colorClass="text-accent-green" borderColor="border-accent-green/20">
                                    <div ref={containerRefs.integ} className="absolute inset-0 p-2 grayscale-[0.2] overflow-hidden" />
                                </LabPanel>
                            </div>
                        </div>

                        <div className="h-1/2 md:h-[40%] min-h-[350px] md:min-h-0">
                            <LabPanel title="Simulation (محاكاة)" badge="3D" subtitle="Kinetic Path" colorClass="text-brand-magenta" borderColor="border-brand-magenta/20">
                                <div ref={containerRefs.sim} className="absolute inset-0 overflow-hidden" />
                                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-end">
                                    <div className="flex items-center justify-between pointer-events-auto">
                                        <div className="flex gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/5 shadow-2xl">
                                            <button onClick={() => setIsPlaying(!isPlaying)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isPlaying ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                            </button>
                                            <button onClick={resetSim} className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
                                                <RotateCcw className="w-5 h-5 text-[var(--text-muted)]" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,1)]" /> ع = {stats.v.toFixed(2)}
                                            </div>
                                            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest text-amber-400">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,1)]" /> جـ = {stats.a.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </LabPanel>
                        </div>
                    </div>

                    <div className="lg:col-span-3 lg:row-span-2 min-h-[500px] md:min-h-0 pb-20 md:pb-0">
                        <LabPanel title="Telemetry (البيانات)" badge="ENGINE" subtitle="Core Processing" colorClass="text-brand-magenta" borderColor="border-brand-magenta/20">
                            <div className="p-4 h-full flex flex-col gap-4 overflow-y-auto no-scrollbar scroll-smooth" dir="rtl">
                                <section className="space-y-3">
                                    <div className="text-[9px] font-black text-brand-cyan uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Calculus Engine</div>
                                    <div className="p-4 glass-card bg-black/20 border-brand-cyan/10">
                                        <div className="text-[8px] text-[var(--text-muted)] uppercase mb-2">First Derivative</div>
                                        <div className="text-xs font-bold text-brand-cyan truncate" dir="ltr">{compiled ? arabizeMath(compiled.d1) : '...'}</div>
                                    </div>
                                    <div className="p-4 glass-card bg-black/20 border-brand-magenta/10">
                                        <div className="text-[8px] text-[var(--text-muted)] uppercase mb-2">Antiderivative</div>
                                        <div className="text-xs font-bold text-brand-magenta truncate" dir="ltr">{compiled ? `${arabizeMath(nerdamer.integrate(compiled.expr, variable).text())} + C` : '...'}</div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <div className="text-[9px] font-black text-accent-amber uppercase tracking-widest mb-1 flex items-center gap-2"><Zap className="w-3 h-3" /> Core Data</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { k: 'Time (ن)', v: stats.n.toFixed(2), c: 'text-amber-500' },
                                            { k: 'Pos (س)', v: stats.s.toFixed(2), c: 'text-brand-cyan' },
                                            { k: 'Vel (ع)', v: stats.v.toFixed(2), c: 'text-emerald-500' },
                                            { k: 'Acc (جـ)', v: stats.a.toFixed(2), c: 'text-violet-500' }
                                        ].map((s, i) => (
                                            <div key={i} className="p-3 glass-card bg-black/20 text-center">
                                                <div className="text-[8px] text-[var(--text-muted)] uppercase mb-1">{s.k}</div>
                                                <div className={`text-sm font-black ${s.c}`} dir="ltr">{s.v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <div className="text-[9px] font-black text-accent-purple uppercase tracking-widest mb-1 flex items-center gap-2"><Cpu className="w-3 h-3" /> Critical Points</div>
                                    <div className="p-3 glass-card bg-black/20 space-y-2">
                                        {criticalPoints.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between text-[10px]" dir="ltr">
                                                <span className="text-brand-cyan font-black">{p.type === 'نهاية عظمى' ? 'MAX' : 'MIN'}</span>
                                                <span className="text-[var(--text-muted)]">({p.x.toFixed(1)}, {p.y.toFixed(1)})</span>
                                            </div>
                                        ))}
                                        {criticalPoints.length === 0 && <div className="text-[10px] text-gray-600 italic text-center py-2">No roots</div>}
                                    </div>
                                </section>
                            </div>
                        </LabPanel>
                    </div>
                </div>
            </main>

            {/* Examples Sheet */}
            {isExamplesOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-end justify-center animate-in fade-in duration-300" onClick={() => setIsExamplesOpen(false)}>
                    <div className="w-full max-w-3xl bg-[var(--bg-base)] border-t border-[var(--glass-border)] rounded-t-[2.5rem] shadow-2xl p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-1.5 bg-[var(--glass-border)] rounded-full mx-auto mb-10" />
                        <div className="flex items-center justify-between mb-8" dir="rtl">
                            <h2 className="text-3xl font-black text-brand-magenta tracking-tight uppercase flex items-center gap-4"><Book className="w-8 h-8" /> 📚 أمثلة جاهزة</h2>
                            <button onClick={() => setIsExamplesOpen(false)} className="p-3 glass-card hover:bg-white/5"><RotateCcw className="w-6 h-6 rotate-45" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
                            {[
                                { name: 'الموضع التربيعي-التكعيبي', fn: '6*n^2-n^3', desc: 'مثال الدرس الأساسي — توقف عند n=4' },
                                { name: 'مثال الدرس الكبير', fn: '25*n^2-n^3', desc: 'الجسم يعود للأصل عند n=25' },
                                { name: 'قذف رأسي لأعلى', fn: '8*n-n^2', desc: 'أقصى ارتفاع عند n=4' },
                                { name: 'حركة معقدة', fn: '2*n^3-9*n^2+12*n', desc: 'نقطتا توقف — تسارق وتقصير' },
                                { name: 'حركة دورية', fn: 'Math.sin(n)*10', desc: 'تذبذبية — مثال مثلثي' },
                                { name: 'سؤال الامتحان المشهور', fn: '50*n^2-n^3', desc: 'يعود للأصل عند n=50' }
                            ].map((ex, i) => (
                                <button key={i} onClick={() => { setExpr(ex.fn); setVariable(ex.fn.includes('n') ? 'n' : 'x'); setIsExamplesOpen(false); }} className="p-6 glass-card bg-[var(--input-bg)] text-right group hover:border-brand-magenta/50 transition-all border-brand-magenta/5 shadow-lg">
                                    <div className="text-lg font-black text-[var(--text-primary)] mb-1 group-hover:text-brand-magenta transition-colors">{ex.name}</div>
                                    <div className="font-mono text-xs text-brand-cyan mb-3" dir="ltr">{ex.fn}</div>
                                    <div className="text-xs text-[var(--text-muted)] italic leading-relaxed">{ex.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DynamoLab;
