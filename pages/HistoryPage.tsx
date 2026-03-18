import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { getSearchHistory, clearSearchHistory, HistoryItem } from '../utils/searchRadar';
import { ClockIcon, TrashIcon, GlobeIcon, LinkIcon, ChevronRightIcon } from '../components/Icons';

const HistoryPage: React.FC = () => {
    const { user, language } = useContext(AppContext) as any;
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        if (user) {
            setHistory(getSearchHistory(user));
        }
    }, [user]);

    const handleClear = () => {
        if (user && window.confirm(language === 'ar' ? 'هل أنت متأكد من مسح السجل؟' : 'Are you sure you want to clear history?')) {
            clearSearchHistory(user);
            setHistory([]);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-4">
                        <ClockIcon className="w-10 h-10 text-accent-blue" />
                        {language === 'ar' ? 'سجل الاستكشاف' : 'Exploration History'}
                    </h1>
                    <p className="text-white/40 mt-2 font-medium uppercase tracking-widest text-xs">
                        {language === 'ar' ? 'تتبع رحلاتك المعرفية السابقة' : 'Tracking your past knowledge journeys'}
                    </p>
                </div>
                {history.length > 0 && (
                    <button 
                        onClick={handleClear}
                        className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all border border-red-500/20 flex items-center gap-3 font-bold group"
                    >
                        <TrashIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        {language === 'ar' ? 'مسح السجل' : 'Clear History'}
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 glass-card rounded-[3rem] border border-white/10">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
                        <GlobeIcon className="w-12 h-12 text-white/20" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {language === 'ar' ? 'السجل فارغ' : 'History is empty'}
                    </h3>
                    <p className="text-white/40 max-w-md text-center">
                        {language === 'ar' 
                            ? 'لم تقم بأي عمليات بحث عالمية بعد. ابدأ استكشاف الكون الآن!' 
                            : 'You haven\'t performed any global searches yet. Start exploring the cosmos now!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {history.map((item) => (
                        <div key={item.id} className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden hover:border-accent-blue/30 transition-all group">
                            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent-blue/20 rounded-2xl flex items-center justify-center text-accent-blue">
                                        <GlobeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">{item.query}</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-tighter">
                                    {(item.globalResults || []).length} SECTORS DISCOVERED
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20">
                                {(item.globalResults || []).map((res, idx) => (
                                    <a 
                                        key={idx}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-accent-blue transition-all flex items-start gap-4 group/res"
                                    >
                                        <div className="p-3 bg-accent-blue/10 rounded-2xl text-accent-blue group-hover/res:bg-accent-blue group-hover/res:text-white transition-all">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-white mb-1 truncate group-hover/res:text-accent-blue transition-colors">{res.title}</h4>
                                            <p className="text-[10px] text-white/20 truncate">{res.url}</p>
                                        </div>
                                        <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover/res:text-accent-blue" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
