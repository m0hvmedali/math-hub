import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import {
    ArrowLeft,
    Beaker,
    Book,
    Settings,
    Activity,
    Maximize2,
    CheckCircle2,
    Dna,
    Flame,
    TestTube2,
    Scale,
    RotateCw,
    Eye
} from 'lucide-react';

interface Compound {
    name: string;
    iupacName: string;
    formula: string;
    formulaText: string;
    carbons: number;
    hydrogens: number;
    molarMass: number;
    boilingPoint: number;
    meltingPoint: number;
    state: string;
    structure: string;
    density: number;
    isomer: boolean;
    type: string;
    branched?: boolean;
}

const COMPOUNDS: Record<string, Compound> = {
    ethane: {
        name: 'الإيثان',
        iupacName: 'إيثان',
        formula: 'C₂H₆',
        formulaText: 'C2H6',
        carbons: 2,
        hydrogens: 6,
        molarMass: 30,
        boilingPoint: -89,
        meltingPoint: -183,
        state: 'غاز',
        structure: 'CH₃-CH₃',
        density: 0.00125,
        isomer: false,
        type: 'alkane'
    },
    propane: {
        name: 'البروبان',
        iupacName: 'بروبان',
        formula: 'C₃H₈',
        formulaText: 'C3H8',
        carbons: 3,
        hydrogens: 8,
        molarMass: 44,
        boilingPoint: -42,
        meltingPoint: -190,
        state: 'غاز',
        structure: 'CH₃-CH₂-CH₃',
        density: 0.002,
        isomer: false,
        type: 'alkane'
    },
    butane: {
        name: 'البيوتان',
        iupacName: 'بيوتان',
        formula: 'C₄H₁₀',
        formulaText: 'C4H10',
        carbons: 4,
        hydrogens: 10,
        molarMass: 58,
        boilingPoint: -0.5,
        meltingPoint: -138,
        state: 'غاز',
        structure: 'CH₃-CH₂-CH₂-CH₃',
        density: 0.0027,
        isomer: true,
        type: 'alkane'
    },
    isobutane: {
        name: 'الآيزوبيوتان',
        iupacName: '2-ميثيل بروبان',
        formula: 'C₄H₁₀',
        formulaText: 'C4H10',
        carbons: 4,
        hydrogens: 10,
        molarMass: 58,
        boilingPoint: -11.7,
        meltingPoint: -160,
        state: 'غاز',
        structure: 'CH₃-CH(CH₃)-CH₃',
        density: 0.0027,
        isomer: true,
        branched: true,
        type: 'alkane'
    },
    pentane: {
        name: 'البنتان',
        iupacName: 'بنتان',
        formula: 'C₅H₁₂',
        formulaText: 'C5H12',
        carbons: 5,
        hydrogens: 12,
        molarMass: 72,
        boilingPoint: 36,
        meltingPoint: -130,
        state: 'سائل',
        structure: 'CH₃-CH₂-CH₂-CH₂-CH₃',
        density: 0.626,
        isomer: true,
        type: 'alkane'
    },
    isopentane: {
        name: 'الآيزوبنتان',
        iupacName: '2-ميثيل بيوتان',
        formula: 'C₅H₁₂',
        formulaText: 'C5H12',
        carbons: 5,
        hydrogens: 12,
        molarMass: 72,
        boilingPoint: 27.8,
        meltingPoint: -160,
        state: 'سائل',
        structure: 'CH₃-CH(CH₃)-CH₂-CH₃',
        density: 0.620,
        isomer: true,
        branched: true,
        type: 'alkane'
    },
    hexane: {
        name: 'الهكسان',
        iupacName: 'هكسان',
        formula: 'C₆H₁₄',
        formulaText: 'C6H14',
        carbons: 6,
        hydrogens: 14,
        molarMass: 86,
        boilingPoint: 69,
        meltingPoint: -95,
        state: 'سائل',
        structure: 'CH₃-(CH₂)₄-CH₃',
        density: 0.655,
        isomer: true,
        type: 'alkane'
    },
    octane: {
        name: 'الأوكتان',
        iupacName: 'أوكتان',
        formula: 'C₈H₁₈',
        formulaText: 'C8H18',
        carbons: 8,
        hydrogens: 18,
        molarMass: 114,
        boilingPoint: 125,
        meltingPoint: -57,
        state: 'سائل',
        structure: 'CH₃-(CH₂)₆-CH₃',
        density: 0.703,
        isomer: true,
        type: 'alkane'
    }
};

const DYNAMO = {
    CYAN: '#00f2ff',
    ORANGE: '#ff8c00',
    GREEN: '#00ff88',
    PINK: '#ff007a',
    FUCHSIA: '#bc13fe',
    VIOLET: '#8b00ff',
    BG: '#050505',
    GLASS: 'rgba(255, 255, 255, 0.03)',
    BORDER: 'rgba(255, 255, 255, 0.1)',
};

const AlkanesLab: React.FC = () => {
    const navigate = useNavigate();
    const [stage, setStage] = useState(1);
    const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null);
    const [customFormula, setCustomFormula] = useState('');
    const [namingInput, setNamingInput] = useState('');
    const [namingFeedback, setNamingFeedback] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    const labCanvasRef = useRef<HTMLDivElement>(null);
    const moleculeCanvasRef = useRef<HTMLDivElement>(null);
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        group?: THREE.Group
    } | null>(null);

    // --- Three.js Logic ---

    const initThree = useCallback((container: HTMLDivElement, isMolecule = false) => {
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);

        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));

        threeRef.current = { scene, camera, renderer };

        if (!isMolecule) {
            // Simple Lab Decoration (Flask)
            const flaskGeometry = new THREE.SphereGeometry(0.8, 32, 32);
            const flaskMaterial = new THREE.MeshStandardMaterial({
                color: DYNAMO.CYAN,
                transparent: true,
                opacity: 0.3,
                roughness: 0,
                metalness: 0.5
            });
            const flask = new THREE.Mesh(flaskGeometry, flaskMaterial);
            flask.scale.y = 1.2;
            scene.add(flask);
        }

        const animate = () => {
            if (!threeRef.current) return;
            const { scene, camera, renderer, group } = threeRef.current;
            if (group) {
                group.rotation.y += 0.005;
                group.rotation.x += 0.002;
            }
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        return () => {
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    const drawMolecule = useCallback((compound: Compound) => {
        if (!threeRef.current) return;
        const { scene } = threeRef.current;

        const group = new THREE.Group();

        // Carbon Atoms
        const carbonGeom = new THREE.SphereGeometry(0.4, 32, 32);
        const carbonMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });

        // Hydrogen Atoms
        const hydrogenGeom = new THREE.SphereGeometry(0.2, 32, 32);
        const hydrogenMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2 });

        // Bond Material
        const bondMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

        const spacing = 1.2;
        const carbonPositions: THREE.Vector3[] = [];

        for (let i = 0; i < compound.carbons; i++) {
            const x = (i - (compound.carbons - 1) / 2) * spacing;
            const y = Math.sin(i * 0.5) * 0.3; // Slight zigzag
            const pos = new THREE.Vector3(x, y, 0);

            const carbon = new THREE.Mesh(carbonGeom, carbonMat);
            carbon.position.copy(pos);
            group.add(carbon);
            carbonPositions.push(pos);

            // Bonds between carbons
            if (i > 0) {
                const prevPos = carbonPositions[i - 1];
                const distance = pos.distanceTo(prevPos);
                const bondGeom = new THREE.CylinderGeometry(0.1, 0.1, distance, 16);
                const bond = new THREE.Mesh(bondGeom, bondMat);

                bond.position.copy(pos).add(prevPos).multiplyScalar(0.5);
                bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().sub(prevPos).normalize());
                group.add(bond);
            }

            // Hydrogens
            // This is a simplified tetrahedral-ish layout
            const hDirections = [
                new THREE.Vector3(0, 0.8, 0.4),
                new THREE.Vector3(0, -0.8, -0.4),
                new THREE.Vector3(0, 0.4, -0.8),
                new THREE.Vector3(0, -0.4, 0.8)
            ];

            // Filter h-directions for middle carbons vs end carbons
            let hCount = 2;
            if (i === 0 || i === compound.carbons - 1) hCount = 3;
            if (compound.carbons === 1) hCount = 4;

            for (let j = 0; j < hCount; j++) {
                const hPos = pos.clone().add(hDirections[j].clone().multiplyScalar(0.8));
                const hydrogen = new THREE.Mesh(hydrogenGeom, hydrogenMat);
                hydrogen.position.copy(hPos);
                group.add(hydrogen);

                // C-H Bond
                const bondGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
                const bond = new THREE.Mesh(bondGeom, bondMat);
                bond.position.copy(pos).add(hPos).multiplyScalar(0.5);
                bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hPos.clone().sub(pos).normalize());
                group.add(bond);
            }
        }

        threeRef.current.group = group;
        scene.add(group);
    }, []);

    // --- Handlers ---

    useEffect(() => {
        if (stage === 2 && labCanvasRef.current) {
            return initThree(labCanvasRef.current);
        }
        if (stage === 4 && moleculeCanvasRef.current && selectedCompound) {
            const cleanup = initThree(moleculeCanvasRef.current, true);
            drawMolecule(selectedCompound);
            return cleanup;
        }
    }, [stage, selectedCompound, initThree, drawMolecule]);

    const handleSelectCompound = (key: string) => {
        setSelectedCompound(COMPOUNDS[key]);
        setStage(2);
    };

    const handleCustomFormula = () => {
        const formula = customFormula.trim().toUpperCase();
        const match = formula.match(/^C(\d+)H(\d+)$/);
        if (match) {
            const carbons = parseInt(match[1]);
            const hydrogens = parseInt(match[2]);
            if (hydrogens === 2 * carbons + 2) {
                setSelectedCompound({
                    name: 'مركب مخصص',
                    iupacName: 'مركب مخصص',
                    formula: formula,
                    formulaText: formula,
                    carbons,
                    hydrogens,
                    molarMass: carbons * 12 + hydrogens * 1,
                    boilingPoint: 20 + carbons * 15,
                    meltingPoint: -100 + carbons * 5,
                    state: carbons <= 4 ? 'غاز' : 'سائل',
                    structure: 'مركب خطي',
                    density: 0.5 + carbons * 0.05,
                    isomer: carbons >= 4,
                    type: 'alkane'
                });
                setStage(2);
            } else {
                alert('هذه ليست صيغة ألكان صحيحة (يجب أن تتبع CₙH₂ₙ₊₂)');
            }
        } else {
            alert('الرجاء إدخال صيغة صحيحة مثل C7H16');
        }
    };

    const handleNamingCheck = () => {
        if (!selectedCompound) return;
        const input = namingInput.trim();
        const isCorrect = input === selectedCompound.iupacName || input.includes(selectedCompound.iupacName);

        if (isCorrect) {
            setNamingFeedback({ text: `صحيح! اسم IUPAC هو ${selectedCompound.iupacName}`, type: 'success' });
            setTimeout(() => setStage(4), 1500);
        } else {
            setNamingFeedback({ text: `خطأ. جرب مرة أخرى أو تذكر القواعد.`, type: 'error' });
        }
    };

    const runTest = (type: string) => {
        if (!selectedCompound) return;
        let result = "";
        switch (type) {
            case 'combustion':
                result = `${selectedCompound.formula} + O₂ → ${selectedCompound.carbons}CO₂ + ${selectedCompound.hydrogens / 2}H₂O (احتراق كامل)`;
                break;
            case 'bromine':
                result = "لا يوجد تفاعل: لون البروم الأحمر يبقى كما هو (ألكان مشبع).";
                break;
            case 'density':
                result = `الكثافة المقاسة: ${selectedCompound.density.toFixed(3)} جم/سم³.`;
                break;
        }
        setTestResult(result);
    };

    // --- UI Components ---

    const LabPanel = ({ title, icon: Icon, colorClass, children }: any) => (
        <div className="glass-card border-[var(--glass-border)] overflow-hidden flex flex-col h-full">
            <div className="bg-black/20 p-3 border-b border-[var(--glass-border)] flex items-center gap-3">
                <div className={`p-1.5 rounded-lg bg-black/40 border border-${colorClass}/30`}>
                    <Icon className={`w-4 h-4 text-${colorClass}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest text-${colorClass}`}>{title}</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
                {children}
            </div>
        </div>
    );

    return (
        <div className="h-[100dvh] flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] font-sans relative overflow-hidden dynamo-theme select-none overflow-y-auto">
            {/* Dynamo Overlays */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] z-50 bg-[length:100%_4px]" />

            <header className="h-16 border-b border-[var(--glass-border)] flex items-center justify-between px-6 glass-nav z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/labs')} className="p-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg hover:border-brand-cyan/50 transition-all group">
                        <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-brand-cyan" />
                    </button>
                    <div className="flex items-center gap-3">
                        <Beaker className="w-5 h-5 text-accent-green" />
                        <h1 className="text-lg font-black tracking-tight uppercase">ALKANES <span className="text-accent-green">LAB</span></h1>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3 text-[9px] font-black text-accent-green/80 uppercase tracking-widest">
                    <Activity className="w-3.5 h-3.5" /> Simulation Core: Active
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto">
                <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 pb-20">

                    {/* Stage 1: Selection */}
                    {stage === 1 && (
                        <div className="animate-fade-in flex flex-col gap-8">
                            <div className="text-center">
                                <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Select Compound</h2>
                                <p className="text-[var(--text-muted)] font-medium">Choose an alkane to begin synthesis or enter a custom formula.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.keys(COMPOUNDS).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => handleSelectCompound(key)}
                                        className="h-32 glass-card hover:border-accent-green/50 flex flex-col items-center justify-center gap-2 group transition-all"
                                    >
                                        <span className="text-xl font-black group-hover:text-accent-green transition-colors">{COMPOUNDS[key].name}</span>
                                        <span className="text-[10px] font-mono text-accent-green/60 px-2 py-0.5 border border-accent-green/20 rounded bg-accent-green/5">{COMPOUNDS[key].formula}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 border-accent-green/20 bg-accent-green/5">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black mb-1">Custom Formula</h3>
                                    <p className="text-xs text-[var(--text-muted)]">Enter alkane formula (e.g., C7H16)</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        value={customFormula}
                                        onChange={(e) => setCustomFormula(e.target.value)}
                                        placeholder="C_H_"
                                        className="bg-black/40 border border-[var(--glass-border)] rounded-xl px-4 py-2 text-center font-black tracking-widest outline-none focus:border-accent-green/50 w-32"
                                    />
                                    <button onClick={handleCustomFormula} className="bg-accent-green text-black px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">PROCESS</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 2: Synthesis */}
                    {stage === 2 && (
                        <div className="animate-fade-in flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-center font-black text-accent-green text-xl">1</div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Synthesis Step</h2>
                                    <p className="text-[var(--text-muted)] text-sm">{selectedCompound?.name} - Base Preparation</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
                                <div className="lg:col-span-8">
                                    <LabPanel title="Laboratory Chamber" icon={Beaker} colorClass="accent-green">
                                        <div ref={labCanvasRef} className="w-full h-full min-h-[300px]" />
                                    </LabPanel>
                                </div>
                                <div className="lg:col-span-4 flex flex-col gap-4">
                                    <div className="glass-card p-6 border-accent-green/30 bg-accent-green/5 border-l-4">
                                        <h3 className="text-xs font-black text-accent-green uppercase mb-4">Instructions</h3>
                                        <p className="text-[var(--text-muted)] text-xs leading-relaxed" dir="rtl">
                                            يتم تحضير الألكانات مختبرياً عن طريق التقطير الجاف لأملاح الصوديوم للأحماض الكربوكسيلية مع الصودا الكاوية.
                                        </p>
                                    </div>
                                    <button onClick={() => setStage(3)} className="mt-auto h-16 bg-accent-green text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                        STABILIZE MOLECULE <Maximize2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 3: Naming */}
                    {stage === 3 && (
                        <div className="animate-fade-in max-w-2xl mx-auto w-full flex flex-col gap-8">
                            <div className="text-center">
                                <div className="inline-block p-4 bg-brand-magenta/10 border border-brand-magenta/30 rounded-2xl mb-4">
                                    <Book className="w-8 h-8 text-brand-magenta" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">IUPAC Nomenclature</h2>
                                <p className="text-[var(--text-muted)]">Identify and name the synthesized structure.</p>
                            </div>

                            <div className="glass-card p-12 text-center border-brand-magenta/20 bg-brand-magenta/5">
                                <span className="text-[60px] font-black tracking-tighter text-brand-magenta">{selectedCompound?.formula}</span>
                            </div>

                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    value={namingInput}
                                    onChange={(e) => setNamingInput(e.target.value)}
                                    placeholder="Enter IUPAC Name..."
                                    className="h-16 bg-black/60 border border-[var(--glass-border)] rounded-2xl px-6 text-xl font-black text-center outline-none focus:border-brand-magenta/50"
                                    dir="rtl"
                                />
                                <button onClick={handleNamingCheck} className="h-14 bg-brand-magenta text-white rounded-2xl font-black tracking-[0.2em] uppercase text-xs hover:scale-105 transition-all">VERIFY SYSTEMATIC NAME</button>
                                {namingFeedback && (
                                    <div className={`p-4 rounded-xl border text-center font-black text-xs uppercase tracking-widest ${namingFeedback.type === 'success' ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                        {namingFeedback.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stage 4: 3D Visualization */}
                    {stage === 4 && (
                        <div className="animate-fade-in flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center font-black text-brand-cyan text-xl">3D</div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Molecular Core</h2>
                                        <p className="text-[var(--text-muted)] text-sm">{selectedCompound?.iupacName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setStage(5)} className="bg-brand-cyan text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">ANALYSIS ROOM →</button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8 h-[500px]">
                                    <LabPanel title="Atomic Structure" icon={Dna} colorClass="brand-cyan">
                                        <div ref={moleculeCanvasRef} className="w-full h-full min-h-[400px]" />
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button className="p-2 glass-card bg-black/40"><RotateCw className="w-4 h-4" /></button>
                                            <button className="p-2 glass-card bg-black/40"><Eye className="w-4 h-4" /></button>
                                        </div>
                                    </LabPanel>
                                </div>
                                <div className="lg:col-span-4 flex flex-col gap-4">
                                    <div className="flex-1 glass-card p-6 border-brand-cyan/20 flex flex-col gap-4">
                                        <h3 className="text-xs font-black text-brand-cyan uppercase border-b border-[var(--glass-border)] pb-2 italic">Structural Data</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">Formula</span>
                                                <span className="text-sm font-black text-brand-cyan">{selectedCompound?.formula}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">Atomic Mass</span>
                                                <span className="text-sm font-black">{selectedCompound?.molarMass} u</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">Boiling Point</span>
                                                <span className="text-sm font-black text-accent-orange">{selectedCompound?.boilingPoint}°C</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase">State</span>
                                                <span className="text-sm font-black italic">{selectedCompound?.state}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-4 bg-black/40 border border-[var(--glass-border)] rounded-xl">
                                            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase block mb-2">Skeleton</span>
                                            <span className="text-xs font-mono tracking-tighter text-accent-blue">{selectedCompound?.structure}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stage 5: Analysis */}
                    {stage === 5 && (
                        <div className="animate-fade-in flex flex-col gap-10">
                            <div className="text-center">
                                <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Diagnostic Center</h2>
                                <p className="text-[var(--text-muted)] font-medium">Testing physical properties and organic reactivity.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <button onClick={() => runTest('combustion')} className="glass-card p-6 border-accent-orange/30 hover:border-accent-orange/60 flex flex-col items-center gap-4 transition-all">
                                    <Flame className="w-8 h-8 text-accent-orange" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Combustion Test</span>
                                </button>
                                <button onClick={() => runTest('bromine')} className="glass-card p-6 border-accent-fuchsia/30 hover:border-accent-fuchsia/60 flex flex-col items-center gap-4 transition-all">
                                    <TestTube2 className="w-8 h-8 text-accent-fuchsia" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Bromine Water</span>
                                </button>
                                <button onClick={() => runTest('density')} className="glass-card p-6 border-accent-cyan/30 hover:border-accent-cyan/60 flex flex-col items-center gap-4 transition-all">
                                    <Scale className="w-8 h-8 text-accent-cyan" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Density Check</span>
                                </button>
                                <button onClick={() => setShowComparison(true)} className="glass-card p-6 border-accent-green/30 hover:border-accent-green/60 flex flex-col items-center gap-4 transition-all">
                                    <Activity className="w-8 h-8 text-accent-green" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Global Compare</span>
                                </button>
                            </div>

                            {testResult && (
                                <div className="glass-card p-8 border-l-4 border-accent-blue bg-accent-blue/5 animate-slide-up">
                                    <h3 className="text-xs font-black text-accent-blue uppercase mb-3 italic">Telemetry Result</h3>
                                    <p className="text-lg font-black tracking-tight" dir="rtl">{testResult}</p>
                                </div>
                            )}

                            {showComparison && (
                                <div className="animate-fade-in glass-card border-[var(--glass-border)] overflow-hidden">
                                    <table className="w-full text-[10px] uppercase font-black text-center">
                                        <thead className="bg-black/40 border-b border-[var(--glass-border)]">
                                            <tr>
                                                <th className="p-4 text-accent-blue">Compound</th>
                                                <th className="p-4">Formula</th>
                                                <th className="p-4">Mass</th>
                                                <th className="p-4 text-accent-orange">B.P (°C)</th>
                                                <th className="p-4">Density</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--glass-border)]">
                                            {Object.values(COMPOUNDS).slice(0, 5).map(c => (
                                                <tr key={c.formulaText} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4">{c.name}</td>
                                                    <td className="p-4 text-accent-blue">{c.formula}</td>
                                                    <td className="p-4">{c.molarMass}</td>
                                                    <td className="p-4 text-accent-orange">{c.boilingPoint}</td>
                                                    <td className="p-4">{c.density.toFixed(4)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="flex justify-center gap-4">
                                <button onClick={() => setStage(1)} className="px-10 py-4 bg-white/5 border border-[var(--glass-border)] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all">New Experiment</button>
                                <button onClick={() => navigate('/labs')} className="px-10 py-4 bg-accent-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all">Exit Lab</button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default AlkanesLab;
