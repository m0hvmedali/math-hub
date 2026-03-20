import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    ChevronRight, 
    Play, 
    X, 
    Box, 
    LineChart, 
    Activity, 
    Zap,
    Maximize2,
    BookOpen
} from 'lucide-react';
import { AppContext } from '../../App';
import { mathTranslations } from './mathTranslations';
import { MATH_CURRICULUM, MathCategory, MathUnit, MathLesson } from './MathSimulationsData';

const CurriculumSimulations: React.FC = () => {
    const { language } = useContext(AppContext);
    const t = (mathTranslations as any)[language || 'en'];

    const [selectedCategory, setSelectedCategory] = useState<MathCategory | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<MathUnit | null>(null);
    const [activeLesson, setActiveLesson] = useState<MathLesson | null>(null);

    const handleBack = () => {
        if (activeLesson) {
            setActiveLesson(null);
        } else if (selectedUnit) {
            setSelectedUnit(null);
        } else if (selectedCategory) {
            setSelectedCategory(null);
        }
    };

    if (activeLesson) {
        return (
            <div className="h-full flex flex-col bg-black overflow-hidden animate-fade-in">
                <header className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setActiveLesson(null)} 
                            className="p-2 hover:bg-white/5 rounded-xl transition-all group"
                        >
                            <ChevronLeft className={`w-5 h-5 text-gray-400 group-hover:text-white ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </button>
                        <div>
                            <h2 className="text-lg font-black tracking-tight uppercase">
                                {t[activeLesson.titleKey] || activeLesson.titleKey}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                {t.simulations} • {activeLesson.type}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 relative">
                    {activeLesson.type === 'geogebra' ? (
                        <iframe 
                            src={`https://www.geogebra.org/calculator/${activeLesson.source}?embed`}
                            className="w-full h-full border-none bg-white"
                            title={activeLesson.titleKey}
                            allowFullScreen
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-black">
                            CUSTOM LAB COMING SOON
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 space-y-12 max-w-7xl mx-auto h-full overflow-y-auto no-scrollbar">
            <header className="space-y-4">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleBack} 
                        className={`p-2 hover:bg-white/5 rounded-xl transition-all group ${!selectedCategory ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronLeft className={`w-5 h-5 text-gray-400 group-hover:text-white ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-brand-magenta/10 border border-brand-magenta/20 text-brand-magenta">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.simulations}</span>
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                    {selectedUnit ? t[selectedUnit.titleKey] : selectedCategory ? t[selectedCategory.titleKey] : t.comprehensiveWorkspace}
                </h1>
            </header>

            <AnimatePresence mode="wait">
                {!selectedCategory ? (
                    <motion.div 
                        key="categories"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {MATH_CURRICULUM.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className="group p-10 rounded-[3rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 text-left hover:border-brand-magenta/30 hover:bg-white/[0.05] transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:opacity-10 transition-opacity">
                                    {cat.id === 'pure-math' ? <LineChart className="w-32 h-32" /> : <Activity className="w-32 h-32" />}
                                </div>
                                <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">{t[cat.titleKey]}</h3>
                                <p className="text-gray-500 text-sm font-medium mb-8 max-w-xs">{cat.units.length} Units • Comprehensive interactive models</p>
                                <div className="inline-flex items-center gap-2 text-[10px] font-black text-brand-magenta uppercase tracking-[0.2em]">
                                    Browse Curriculum <ChevronRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                        ))}
                    </motion.div>
                ) : !selectedUnit ? (
                    <motion.div 
                        key="units"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {selectedCategory.units.map(unit => (
                            <button
                                key={unit.id}
                                onClick={() => setSelectedUnit(unit)}
                                className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 text-left hover:border-brand-cyan/40 hover:bg-white/[0.05] transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 mb-6 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5 text-brand-cyan" />
                                </div>
                                <h4 className="text-lg font-black mb-2 leading-tight">{t[unit.titleKey] || unit.titleKey}</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{unit.lessons.length} Modules</p>
                            </button>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="lessons"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        {selectedUnit.lessons.map(lesson => (
                            <button
                                key={lesson.id}
                                onClick={() => setActiveLesson(lesson)}
                                className="w-full p-6 rounded-2xl bg-[#0A0D14] border border-white/5 flex items-center justify-between hover:border-brand-magenta/30 hover:bg-[#0F141F] transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-brand-magenta group-hover:scale-110 transition-transform">
                                        <Play className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="text-xl font-black text-white">{t[lesson.titleKey] || lesson.titleKey}</h5>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{lesson.type}</p>
                                    </div>
                                </div>
                                <Maximize2 className="w-5 h-5 text-gray-600 group-hover:text-brand-magenta transition-colors" />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CurriculumSimulations;
