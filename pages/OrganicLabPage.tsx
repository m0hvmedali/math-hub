import React, { useEffect, useState, useContext } from 'react';
import { useOrganicStore } from '../store/useOrganicStore';
import { useCosmicStore } from '../store/useCosmicStore';
import { AppContext } from '../App';
import OrganicGraph from '../components/OrganicGraph';
import { BeakerIcon, SearchIcon, ActivityIcon, SettingsIcon, InfoIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import IupacRulesPanel from '../components/IupacRulesPanel';

const OrganicLabPage: React.FC = () => {
    const { fetchOrganicData, compounds, findPath, isLoading } = useOrganicStore();
    const { language } = useContext(AppContext);
    const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
    const [pathStart, setPathStart] = useState<string | null>(null);
    const [pathEnd, setPathEnd] = useState<string | null>(null);
    const [foundPaths, setFoundPaths] = useState<any[]>([]);
    const [showIupac, setShowIupac] = useState(false);

    useEffect(() => {
        fetchOrganicData();
    }, []);

    const selectedCompound = compounds.find(c => c.id === selectedCompId);
    
    const handleFindPath = () => {
        if (pathStart && pathEnd) {
            const paths = findPath(pathStart, pathEnd);
            setFoundPaths(paths);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8 pt-24">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)]">
                
                {/* Left Sidebar: Controls & Search */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-accent-blue/20 rounded-lg">
                                <BeakerIcon className="w-6 h-6 text-accent-blue" />
                            </div>
                            <h1 className="text-xl font-black uppercase tracking-widest">
                                {language === 'ar' ? 'مختبر العضوية' : 'Organic Lab'}
                            </h1>
                        </div>

                        {/* Pathfinder Tool */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Pathfinder</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <select 
                                    className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm focus:border-accent-blue outline-none"
                                    onChange={(e) => setPathStart(e.target.value)}
                                    value={pathStart || ''}
                                >
                                    <option value="">{language === 'ar' ? 'البداية...' : 'Start...'}</option>
                                    {compounds.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>)}
                                </select>
                                <select 
                                    className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm focus:border-accent-blue outline-none"
                                    onChange={(e) => setPathEnd(e.target.value)}
                                    value={pathEnd || ''}
                                >
                                    <option value="">{language === 'ar' ? 'النهاية...' : 'End...'}</option>
                                    {compounds.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>)}
                                </select>
                                <button 
                                    onClick={handleFindPath}
                                    className="w-full bg-accent-blue py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                                >
                                    {language === 'ar' ? 'تتبع المسار' : 'Find Path'}
                                </button>
                                <button 
                                    onClick={() => setShowIupac(true)}
                                    className="w-full bg-white/5 border border-white/10 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                                >
                                    <InfoIcon className="w-4 h-4 text-accent-blue" />
                                    {language === 'ar' ? 'قواعد الأيوباك' : 'IUPAC Rules'}
                                </button>
                            </div>
                        </div>

                        {/* Formula Validator (Lecture Knowledge) */}
                        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                            <h3 className="text-xs font-bold text-accent-blue uppercase tracking-tighter">Exception Validator</h3>
                            <p className="text-[10px] text-gray-500 leading-tight">
                                {language === 'ar' ? 'تحقق مما إذا كان المركب عضوياً أم استثناءً (أكاسيد، كربونات، سيانيد).' : 'Check if a compound is organic or an exception (oxides, carbonates, cyanides).'}
                            </p>
                            <div className="space-y-2">
                                <input 
                                    type="text" 
                                    placeholder="CO2, Na2CO3, KCN..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm outline-none focus:border-accent-blue"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim().toUpperCase();
                                            const exceptions = ['CO', 'CO2', 'CO3', 'HCO3', 'CN', 'CNO', 'SCN'];
                                            const isException = exceptions.some(ex => val.includes(ex));
                                            const hasCarbon = val.includes('C') && !val.includes('CL') && !val.includes('CA');
                                            
                                            if (isException) {
                                                alert(language === 'ar' ? 'هذا مركب غير عضوي (استثناء)' : 'This is an inorganic compound (Exception)');
                                            } else if (hasCarbon) {
                                                alert(language === 'ar' ? 'هذا مركب عضوي' : 'This is an organic compound');
                                            } else {
                                                alert(language === 'ar' ? 'لا يحتوي على كربون (غير عضوي)' : 'No carbon found (Inorganic)');
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Results / Details Card */}
                    <AnimatePresence mode="wait">
                        {foundPaths.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-accent-blue/10 border border-accent-blue/20 p-6 rounded-[2rem] overflow-y-auto max-h-96"
                            >
                                <h3 className="text-xs font-bold text-accent-blue uppercase mb-4">Routes Found</h3>
                                <div className="space-y-4">
                                    {foundPaths.map((path, idx) => (
                                        <div key={idx} className="p-4 bg-black/40 rounded-2xl text-xs space-y-4 border border-white/5">
                                            {path.map((step: any, sIdx: number) => (
                                                <div key={sIdx} className="space-y-2 relative pl-4 border-l border-accent-blue/30">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-accent-blue font-bold text-sm">{step.reaction.name}</span>
                                                        <span className="text-white/80">→ {language === 'ar' ? compounds.find(c => c.id === step.edge.to_compound_id)?.name_ar : compounds.find(c => c.id === step.edge.to_compound_id)?.name_en}</span>
                                                    </div>
                                                    {step.reaction.reagents && (
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                            <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{step.reaction.reagents}</span>
                                                            <span>{step.reaction.conditions}</span>
                                                        </div>
                                                    )}
                                                    {step.reaction.mechanism_type && (
                                                        <div className="text-[10px] text-accent-magenta/70 italic uppercase">
                                                            {step.reaction.mechanism_type}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Graph Area */}
                <div className="lg:col-span-3 relative h-full">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-[3rem] blur-3xl" />
                    <div className="w-full h-full relative z-10">
                        <OrganicGraph onNodeSelect={setSelectedCompId} />
                    </div>

                    {/* Compound Details Hover Overlay */}
                    <AnimatePresence>
                        {selectedCompound && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute right-6 top-6 w-80 bg-black/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] z-50 shadow-2xl"
                            >
                                <button onClick={() => setSelectedCompId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-black">{language === 'ar' ? selectedCompound.name_ar : selectedCompound.name_en}</h2>
                                        <p className="text-accent-blue font-mono text-sm">{selectedCompound.formula}</p>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {selectedCompound.description || (language === 'ar' ? 'لا يوجد وصف متاح.' : 'No description available.')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCompound.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-white/5 rounded-md text-[10px] uppercase font-bold text-gray-500 border border-white/5">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <AnimatePresence>
                {showIupac && <IupacRulesPanel language={language} onClose={() => setShowIupac(false)} />}
            </AnimatePresence>
        </div>
    );
};

export default OrganicLabPage;
