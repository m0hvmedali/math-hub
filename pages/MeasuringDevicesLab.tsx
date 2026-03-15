import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeasuringInstrumentType, MeasuringComponentPart, MeasuringLabParameters } from '../types/measuringDevicesTypes';
import { MEASURING_INSTRUMENT_DETAILS, MEASURING_AVAILABLE_PARTS, MEASURING_LAB_DEFAULTS } from '../utils/measuringDevicesConstants';
import { MeterDisplay } from '../components/MeterDisplay';
import { ArrowLeft, CheckCircle, HelpCircle, RefreshCcw, Wrench, Zap, Calculator, Beaker, X } from 'lucide-react';
import { AppContext } from '../App';

// --- Subcomponents ---

const PartSelector = ({ label, activePart, onSelect, requiredType }: { label: string, activePart: MeasuringComponentPart | null, onSelect: (p: MeasuringComponentPart) => void, requiredType: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const validParts = MEASURING_AVAILABLE_PARTS.filter(p => p.type === requiredType);

    return (
        <div className="relative">
             <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                  w-32 h-32 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-500
                  ${activePart ? 'border-brand-cyan bg-brand-cyan/5 shadow-[0_0_20px_rgba(0,255,255,0.1)]' : 'border-white/10 hover:border-brand-cyan/50 hover:bg-white/5'}
                `}
             >
                {activePart ? (
                    <>
                        <div className="text-2xl mb-2 text-brand-cyan drop-shadow-glow"><CheckCircle className="w-8 h-8" /></div>
                        <span className="text-[10px] font-black text-center px-2 uppercase tracking-widest text-white/70">{activePart.name}</span>
                    </>
                ) : (
                    <span className="text-[10px] font-black text-white/30 text-center px-4 uppercase tracking-widest leading-relaxed">{label}</span>
                )}
             </div>

             {isOpen && (
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-up">
                     <div className="bg-white/5 p-3 text-[10px] font-black text-white/40 border-b border-white/5 uppercase tracking-[0.2em]">اختر {label}</div>
                     {validParts.map(part => (
                         <div 
                            key={part.id} 
                            onClick={() => { onSelect(part); setIsOpen(false); }}
                            className="p-4 hover:bg-brand-cyan/10 cursor-pointer text-sm border-b border-white/5 last:border-0 transition-colors group"
                         >
                            <div className="text-white font-bold group-hover:text-brand-cyan transition-colors">{part.name}</div>
                            {part.value && <div className="text-[10px] font-black text-white/30 uppercase mt-1">{part.value} units</div>}
                         </div>
                     ))}
                     {validParts.length === 0 && <div className="p-4 text-xs text-brand-magenta font-bold">لا توجد قطع مناسبة</div>}
                 </div>
             )}
        </div>
    );
};

// --- Main Page ---

const MeasuringDevicesLab: React.FC = () => {
    const { language } = useContext(AppContext) as any;
    const navigate = useNavigate();
    const [currentInstrument, setCurrentInstrument] = useState<MeasuringInstrumentType | null>(null);
    const [viewMode, setViewMode] = useState<'build' | 'equations'>('build');
    const [assembledParts, setAssembledParts] = useState<Record<string, MeasuringComponentPart | null>>({});
    const [simulationVal, setSimulationVal] = useState<number>(0);
    const [isBuilt, setIsBuilt] = useState(false);
    const [labParams, setLabParams] = useState<MeasuringLabParameters>(MEASURING_LAB_DEFAULTS);

    // Reset state when instrument changes
    useEffect(() => {
        setAssembledParts({});
        setSimulationVal(0);
        setIsBuilt(false);
        setLabParams(MEASURING_LAB_DEFAULTS);
        setViewMode('build');
    }, [currentInstrument]);

    const handleInstrumentSelect = (type: MeasuringInstrumentType) => {
        setCurrentInstrument(type);
    };

    const handleAddPart = (slotKey: string, part: MeasuringComponentPart) => {
        setAssembledParts(prev => ({ ...prev, [slotKey]: part }));
    };

    const checkBuildStatus = () => {
        if (!currentInstrument) return;
        
        let built = false;
        if (currentInstrument === MeasuringInstrumentType.Galvanometer) {
            if (assembledParts['magnet'] && assembledParts['coil'] && assembledParts['scale']) built = true;
        } else if (currentInstrument === MeasuringInstrumentType.Ammeter) {
            if (assembledParts['core'] && assembledParts['shunt']) built = true;
        } else if (currentInstrument === MeasuringInstrumentType.Voltmeter) {
            if (assembledParts['core'] && assembledParts['multiplier']) built = true;
        } else if (currentInstrument === MeasuringInstrumentType.Ohmmeter) {
            if (assembledParts['core'] && assembledParts['battery'] && assembledParts['variable']) built = true;
        }
        setIsBuilt(built);
    };
    
    useEffect(() => {
        checkBuildStatus();
    }, [assembledParts]);

    const calculateAmmeterShunt = () => {
        const { Rg, Ig, targetI } = labParams;
        if (targetI <= Ig) return 0;
        return (Ig * Rg) / (targetI - Ig);
    };

    const calculateVoltmeterMultiplier = () => {
        const { Rg, Ig, targetV } = labParams;
        const Vg = Ig * Rg;
        if (targetV <= Vg) return 0;
        return (targetV - Vg) / Ig;
    };

    const calculateOhmmeterTotalR = () => {
        const { Vb, Ig } = labParams;
        return Vb / Ig;
    };

    const calculateOhmmeterCurrent = (Rx: number) => {
        const { Vb } = labParams;
        const R_total = calculateOhmmeterTotalR();
        return Vb / (R_total + Rx);
    };

    const calculateNeedleAngle = () => {
        if (!currentInstrument) return 0;
        const percentage = simulationVal / 100;
        
        if (currentInstrument === MeasuringInstrumentType.Ohmmeter) {
            return (1 - percentage) * 180;
        }
        return percentage * 180;
    };

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto py-12">
            {Object.values(MeasuringInstrumentType).map((type) => (
                <div
                    key={type}
                    onClick={() => handleInstrumentSelect(type)}
                    className="glass-card p-10 cursor-pointer transition-all duration-500 hover:scale-[1.03] group border border-white/5 hover:border-brand-cyan/30"
                >
                    <div className="flex flex-col gap-8">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10 shadow-2xl group-hover:scale-110 group-hover:bg-brand-cyan/10 transition-all duration-500">
                            {type === MeasuringInstrumentType.Ohmmeter ? <span className="text-4xl font-black text-brand-cyan">Ω</span> : 
                             type === MeasuringInstrumentType.Voltmeter ? <span className="text-4xl font-black text-brand-cyan">V</span> : 
                             type === MeasuringInstrumentType.Ammeter ? <span className="text-4xl font-black text-brand-cyan">A</span> : 
                             <span className="text-4xl font-black text-brand-cyan">G</span>}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white mb-3 tracking-tight group-hover:text-brand-cyan transition-colors lowercase">
                                {MEASURING_INSTRUMENT_DETAILS[type].name}
                            </h3>
                            <p className="text-white/50 text-base font-medium leading-relaxed max-w-sm">
                                {MEASURING_INSTRUMENT_DETAILS[type].description}
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-black tracking-widest text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                            OPEN SYSTEM <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderWorkbench = () => {
        if (!currentInstrument) return null;
        const details = MEASURING_INSTRUMENT_DETAILS[currentInstrument];

        let equationContent;
        let visualMax = 100;
        let visualAngle = 0;
        let unit = '';

        if (currentInstrument === MeasuringInstrumentType.Galvanometer) {
            visualMax = labParams.Ig * 1000000;
            visualAngle = (labParams.Rx / 100) * 180;
            unit = 'µA';
            equationContent = (
                <div className="space-y-8">
                    <div className="p-6 bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl">
                        <h3 className="font-black text-brand-cyan text-xs uppercase tracking-widest mb-4">حساسية الجلفانوميتر</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            الحساسية = زاوية الانحراف / شدة التيار <br/>
                            <span className="font-mono text-lg text-brand-cyan mt-2 block" dir="ltr">S = θ / I</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">أقصى تيار يتحمله (Ig) أمبير</label>
                            <input type="number" step="0.0001" value={labParams.Ig} onChange={(e) => setLabParams({...labParams, Ig: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-brand-cyan/50 font-mono transition-all" />
                         </div>
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">مقاومة الملف (Rg) أوم</label>
                            <input type="number" value={labParams.Rg} onChange={(e) => setLabParams({...labParams, Rg: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-brand-cyan/50 font-mono transition-all" />
                         </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">محاكاة التيار (نسبة مئوية)</label>
                        <input type="range" min="0" max="100" value={labParams.Rx} onChange={(e) => setLabParams({...labParams, Rx: parseFloat(e.target.value)})} className="w-full accent-brand-cyan" />
                        <div className="text-center font-mono text-brand-cyan text-lg">
                             {((labParams.Rx / 100) * labParams.Ig * 1000).toFixed(2)} mA
                        </div>
                    </div>
                </div>
            );
        } else if (currentInstrument === MeasuringInstrumentType.Ammeter) {
            const calculatedRs = calculateAmmeterShunt();
            visualMax = labParams.targetI;
            visualAngle = Math.min((labParams.Rx / labParams.targetI) * 180, 180);
            unit = 'A';
            equationContent = (
                <div className="space-y-8">
                    <div className="p-6 bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl">
                        <h3 className="font-black text-brand-cyan text-xs uppercase tracking-widest mb-4">قانون مجزئ التيار</h3>
                        <p className="font-mono text-xl text-brand-cyan text-center" dir="ltr">Rs = (Ig · Rg) / (I - Ig)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">Rg (Ω)</label>
                            <input type="number" value={labParams.Rg} onChange={(e) => setLabParams({...labParams, Rg: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white" />
                         </div>
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">Ig (A)</label>
                            <input type="number" step="0.001" value={labParams.Ig} onChange={(e) => setLabParams({...labParams, Ig: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white" />
                         </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">المدى المطلوب (I)</label>
                        <input type="number" value={labParams.targetI} onChange={(e) => setLabParams({...labParams, targetI: parseFloat(e.target.value)})} className="w-full bg-brand-cyan/10 border border-brand-cyan/30 p-4 rounded-2xl text-brand-cyan font-black" />
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">قيمة المقاومة المطلوبة (Rs)</div>
                        <div className="text-3xl font-black text-brand-cyan font-mono" dir="ltr">{calculatedRs.toFixed(4)} Ω</div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">اختبار التيار (I)</label>
                        <input type="range" min="0" max={labParams.targetI} step={labParams.targetI/100} value={labParams.Rx} onChange={(e) => setLabParams({...labParams, Rx: parseFloat(e.target.value)})} className="w-full accent-brand-cyan" />
                    </div>
                </div>
            );
        } else if (currentInstrument === MeasuringInstrumentType.Voltmeter) {
            const calculatedRm = calculateVoltmeterMultiplier();
            visualMax = labParams.targetV;
            visualAngle = Math.min((labParams.Rx / labParams.targetV) * 180, 180);
            unit = 'V';
            equationContent = (
                <div className="space-y-8">
                    <div className="p-6 bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl text-center">
                        <h3 className="font-black text-brand-cyan text-xs uppercase tracking-widest mb-4">قانون مضاعف الجهد</h3>
                        <p className="font-mono text-xl text-brand-cyan" dir="ltr">Rm = (V - Vg) / Ig</p>
                    </div>
                    {/* Simplified for conciseness - similar to Ammeter */}
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">قيمة المقاومة المطلوبة (Rm)</div>
                        <div className="text-3xl font-black text-brand-cyan font-mono" dir="ltr">{calculatedRm.toFixed(2)} Ω</div>
                    </div>
                </div>
            );
        } else if (currentInstrument === MeasuringInstrumentType.Ohmmeter) {
            const R_total_needed = calculateOhmmeterTotalR();
            const currentI = calculateOhmmeterCurrent(labParams.Rx);
            visualAngle = Math.min((currentI / labParams.Ig) * 180, 180);
            unit = 'mA';
            equationContent = (
                <div className="space-y-8">
                    <div className="p-6 bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl">
                        <h3 className="font-black text-brand-cyan text-xs uppercase tracking-widest mb-4">معايرة الأوميتر</h3>
                        <p className="font-mono text-center text-brand-cyan" dir="ltr">I = Vb / (R_device + Rx)</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">مقاومة الجهاز الكلية المطلوبة</div>
                        <div className="text-3xl font-black text-brand-cyan font-mono" dir="ltr">{R_total_needed.toFixed(0)} Ω</div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">المقاومة المجهولة (Rx)</label>
                        <input type="number" value={labParams.Rx} onChange={(e) => setLabParams({...labParams, Rx: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-mono" />
                        <input type="range" min="0" max="50000" step="10" value={labParams.Rx} onChange={(e) => setLabParams({...labParams, Rx: parseFloat(e.target.value)})} className="w-full accent-brand-cyan" />
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-screen max-h-screen animate-cinematic" dir="rtl">
                <header className="px-12 py-8 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setCurrentInstrument(null)} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all hover:scale-105 active:scale-95">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] mb-1 block">Active Laboratory</span>
                            <h1 className="text-3xl font-black text-white tracking-tight">{details.name}</h1>
                        </div>
                    </div>
                    <div className="flex bg-white/5 p-1.5 rounded-[1.25rem] border border-white/5">
                        <button 
                            onClick={() => setViewMode('build')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 ${viewMode === 'build' ? 'bg-brand-cyan text-white shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <Wrench className="w-4 h-4" /> التركيب
                        </button>
                        <button 
                            onClick={() => setViewMode('equations')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 ${viewMode === 'equations' ? 'bg-brand-magenta text-white shadow-[0_0_20px_rgba(255,0,255,0.2)]' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <Beaker className="w-4 h-4" /> المعادلات
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {viewMode === 'equations' ? (
                        <div className="flex w-full">
                            <div className="w-96 bg-black/40 border-l border-white/5 p-12 overflow-y-auto custom-scrollbar">
                                <h2 className="text-xl font-black text-white mb-10 flex items-center gap-4">
                                    <Calculator className="w-6 h-6 text-brand-cyan" />
                                    <span>المسائل والمعادلات</span>
                                </h2>
                                {equationContent}
                            </div>
                            <div className="flex-1 bg-gradient-to-br from-black to-slate-900/50 flex flex-col items-center justify-center p-12">
                                <div className="transform scale-[1.7] drop-shadow-2xl">
                                    <MeterDisplay 
                                        angle={visualAngle} 
                                        label={details.name}
                                        unit={unit}
                                        isZeroCenter={currentInstrument === MeasuringInstrumentType.Galvanometer}
                                        maxVal={visualMax}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-96 bg-black/40 border-l border-white/5 p-12 overflow-y-auto custom-scrollbar">
                                <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4">
                                    <Wrench className="w-6 h-6 text-brand-cyan" />
                                    <span>المكونات المتاحة</span>
                                </h3>
                                <div className="space-y-4">
                                    {MEASURING_AVAILABLE_PARTS.map((part) => (
                                        <div key={part.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-brand-cyan/30 transition-all group active:scale-95 cursor-grab">
                                            <div className="text-sm font-black text-white group-hover:text-brand-cyan transition-colors">{part.name}</div>
                                            <div className="text-[10px] text-white/30 uppercase tracking-widest mt-2 leading-relaxed">{part.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-br from-black to-slate-900/50 relative overflow-hidden">
                                 <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                                 {!isBuilt ? (
                                     <div className="relative z-10 w-full max-w-4xl glass-card p-16 border-white/10 shadow-2xl">
                                         <div className="text-center mb-16">
                                            <h2 className="text-3xl font-black text-white mb-4">منطقة التجميع الهندسي</h2>
                                            <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-black">اختر المكونات المطلوبة من القائمة الجانبية</p>
                                         </div>
                                         <div className="flex flex-wrap justify-center gap-12">
                                            {currentInstrument === MeasuringInstrumentType.Galvanometer && (
                                                <>
                                                    <PartSelector label="المغناطيس" activePart={assembledParts['magnet']} onSelect={(p) => handleAddPart('magnet', p)} requiredType="magnet" />
                                                    <PartSelector label="الملف" activePart={assembledParts['coil']} onSelect={(p) => handleAddPart('coil', p)} requiredType="coil" />
                                                    <PartSelector label="التدريج" activePart={assembledParts['scale']} onSelect={(p) => handleAddPart('scale', p)} requiredType="scale" />
                                                </>
                                            )}
                                            {(currentInstrument === MeasuringInstrumentType.Ammeter || currentInstrument === MeasuringInstrumentType.Voltmeter || currentInstrument === MeasuringInstrumentType.Ohmmeter) && (
                                                <>
                                                    <PartSelector label="الجلفانومتر" activePart={assembledParts['core']} onSelect={(p) => handleAddPart('core', p)} requiredType="core" />
                                                    {currentInstrument === MeasuringInstrumentType.Ammeter && <PartSelector label="مجزئ Rs" activePart={assembledParts['shunt']} onSelect={(p) => handleAddPart('shunt', p)} requiredType="resistor_shunt" />}
                                                    {currentInstrument === MeasuringInstrumentType.Voltmeter && <PartSelector label="مضاعف Rm" activePart={assembledParts['multiplier']} onSelect={(p) => handleAddPart('multiplier', p)} requiredType="resistor_multiplier" />}
                                                    {currentInstrument === MeasuringInstrumentType.Ohmmeter && (
                                                        <>
                                                            <PartSelector label="البطارية" activePart={assembledParts['battery']} onSelect={(p) => handleAddPart('battery', p)} requiredType="battery" />
                                                            <PartSelector label="المقاومة المتغيرة" activePart={assembledParts['variable']} onSelect={(p) => handleAddPart('variable', p)} requiredType="resistor_variable" />
                                                        </>
                                                    )}
                                                </>
                                            )}
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="flex flex-col items-center gap-16 relative z-10 w-full max-w-2xl bg-black/40 p-16 border border-white/10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
                                         <div className="transform scale-[1.8]">
                                            <MeterDisplay 
                                                angle={calculateNeedleAngle()} 
                                                label={details.name}
                                                unit={currentInstrument === MeasuringInstrumentType.Ohmmeter ? 'Ω' : currentInstrument === MeasuringInstrumentType.Voltmeter ? 'V' : currentInstrument === MeasuringInstrumentType.Ammeter ? 'A' : 'µA'}
                                                maxVal={currentInstrument === MeasuringInstrumentType.Ammeter ? 10 : currentInstrument === MeasuringInstrumentType.Voltmeter ? 20 : 100}
                                            />
                                         </div>
                                         <div className="w-full space-y-8">
                                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                                <h3 className="font-black text-white/50 uppercase tracking-[0.2em] text-[10px]">نظام المحاكاة النشط</h3>
                                                <span className="font-mono text-brand-cyan font-black">{simulationVal}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={simulationVal} onChange={(e) => setSimulationVal(parseInt(e.target.value))} className="w-full accent-brand-cyan" />
                                            <button onClick={() => { setIsBuilt(false); setSimulationVal(0); }} className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all">
                                                <RefreshCcw className="w-4 h-4" /> إعادة تجميع النظام
                                            </button>
                                         </div>
                                     </div>
                                 )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen animate-cinematic" dir="rtl">
            {!currentInstrument ? (
                <div className="max-w-7xl mx-auto px-12 py-24">
                    <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-brand-cyan/10 rounded-2xl">
                                    <ActivityIcon className="w-8 h-8 text-brand-cyan" />
                                </div>
                                <span className="text-xs font-black tracking-[0.4em] text-brand-cyan uppercase">Advanced Engineering Lab</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
                                Measuring <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-magenta">Instruments</span>
                            </h1>
                        </div>
                        <p className="text-white/40 font-medium max-w-md text-xl leading-relaxed">
                            A high-fidelity simulation environment for building and calibrating electrical measuring devices through interactive physics.
                        </p>
                    </header>
                    {renderDashboard()}
                </div>
            ) : renderWorkbench()}
        </div>
    );
};

const ActivityIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

export default MeasuringDevicesLab;
