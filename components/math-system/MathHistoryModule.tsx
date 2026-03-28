import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ExternalLink, RefreshCw, Calculator, LineChart, BrainCircuit, Box } from 'lucide-react';
import { fetchMathActivities, deleteMathActivity, MathActivity, MathCategory } from '../../utils/mathPersistence';
import { AppContext } from '../../App';
import { OpenIn, OpenInContent, OpenInChatGPT, OpenInTrigger } from '../ai-elements/open-in-chat';
import { Button } from '../ui/button';

interface MathHistoryModuleProps {
    onRestore?: (activity: MathActivity) => void;
}

const MathHistoryModule: React.FC<MathHistoryModuleProps> = ({ onRestore }) => {
    const { language } = useContext(AppContext);
    const [activities, setActivities] = useState<MathActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<MathCategory | 'all'>('all');

    const loadHistory = async () => {
        setIsLoading(true);
        const data = await fetchMathActivities(filter === 'all' ? undefined : filter);
        setActivities(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadHistory();
    }, [filter]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const success = await deleteMathActivity(id);
        if (success) {
            setActivities(prev => prev.filter(a => a.id !== id));
        }
    };

    const getIcon = (category: MathCategory) => {
        switch (category) {
            case 'ai_lab': return <BrainCircuit className="w-5 h-5 text-accent-amber" />;
            case 'solver': return <Calculator className="w-5 h-5 text-brand-purple" />;
            case 'grapher': return <LineChart className="w-5 h-5 text-brand-cyan" />;
            case 'curriculum': return <Box className="w-5 h-5 text-accent-green" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    return (
        <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        {language === 'ar' ? 'سجل الأنشطة السحابي' : 'Cloud Activity History'}
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {language === 'ar' ? 'جميع محاولاتك محفوظة هنا دائماً' : 'Your research and calculations, saved forever.'}
                    </p>
                </div>
                <button 
                    onClick={loadHistory}
                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {/* Filters */}
            <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                {['all', 'ai_lab', 'solver', 'grapher', 'curriculum'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-brand-cyan text-black' : 'bg-white/5 text-gray-400 border border-white/5'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {activities.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer relative"
                            onClick={() => onRestore?.(item)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                    {getIcon(item.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                            {item.category.replace('_', ' ')}
                                        </span>
                                        <span className="text-[9px] text-gray-600">•</span>
                                        <span className="text-[9px] text-gray-600">
                                            {item.timestamp ? new Date(item.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : ''}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-200 truncate pr-12">
                                        {item.query}
                                    </h3>
                                    {item.category === 'ai_lab' && item.type && (
                                        <div className="mt-2 flex items-center justify-between gap-1.5">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20">
                                                <div className="w-1 h-1 rounded-full bg-brand-cyan" />
                                                <span className="text-[9px] font-black text-brand-cyan uppercase">Engine: {item.type}</span>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <OpenIn query={`History Item (${item.category}): ${item.query}\n\nPlease analyze this historical query using the Deep Extraction Analysis protocol.`}>
                                                    <OpenInTrigger>
                                                        <Button variant="ghost" size="sm" className="h-6 text-[9px] bg-white/5 border border-white/5 hover:border-brand-purple/30 text-gray-500 hover:text-brand-purple">
                                                            Recall with ChatGPT
                                                        </Button>
                                                    </OpenInTrigger>
                                                    <OpenInContent>
                                                        <OpenInChatGPT />
                                                    </OpenInContent>
                                                </OpenIn>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={(e) => handleDelete(e, item.id!)}
                                className="absolute top-5 right-5 p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!isLoading && activities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Clock className="w-12 h-12 text-gray-800 mb-4" />
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">
                            {language === 'ar' ? 'لا يوجد تاريخ مسجل بعد' : 'No history found for this category'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MathHistoryModule;
