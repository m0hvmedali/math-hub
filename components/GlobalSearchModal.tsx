import React, { useEffect, useState, useContext } from 'react';
import { XIcon, GlobeIcon, LinkIcon, PlusIcon, SparkleIcon } from './Icons';
import { fetchTavilyResults, checkSearchLimit, TavilyResult } from '../utils/searchRadar';
import { AppContext } from '../App';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    query?: string;
    initialQuery?: string;
    embeddedMode?: boolean;
    onResultSelect?: (result: { title: string; url: string }) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, query, initialQuery, embeddedMode, onResultSelect }) => {
    const { user } = useContext(AppContext) as any;
    const [results, setResults] = useState<TavilyResult[]>([]);
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usage, setUsage] = useState({ allowed: true, remaining: 10 });
    
    const searchTerms = query || initialQuery;

    useEffect(() => {
        if (isOpen && user) {
            setUsage(checkSearchLimit(user));
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (!isOpen || !searchTerms || !user) return;

        const performSearch = async () => {
            const limit = checkSearchLimit(user);
            if (!limit.allowed) {
                setError('LIMIT_EXCEEDED');
                return;
            }

            setIsLoading(true);
            setError(null);
            setAiAnswer(null);
            
            try {
                const response = await fetchTavilyResults(searchTerms, user);
                if (response) {
                    setResults(response.results);
                    setAiAnswer(response.answer || null);
                }
                setUsage(checkSearchLimit(user));
            } catch (err: any) {
                if (err.message === 'LIMIT_EXCEEDED') {
                    setError('LIMIT_EXCEEDED');
                } else {
                    setError('FAILED');
                }
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [isOpen, searchTerms, user]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={`relative w-full ${embeddedMode ? 'h-full' : 'max-w-5xl h-[85vh]'} bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up flex flex-col`}>
                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                             <SparkleIcon className="w-5 h-5 text-accent-blue animate-pulse" />
                             <h2 className="text-2xl font-black text-white tracking-tight">
                                {localStorage.getItem('language') === 'ar' ? 'ذكاء البحث العالمي' : 'Global AI Intelligence'}
                            </h2>
                        </div>
                        <p className="text-xs text-accent-blue/60 font-medium uppercase tracking-widest">Tavily Neural Network Active</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
                    {/* Error States */}
                    {error === 'LIMIT_EXCEEDED' && (
                        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                            <div className="text-3xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-red-400 mb-2">
                                {localStorage.getItem('language') === 'ar' ? 'تم الوصول للحد اليومي' : 'Daily Limit Reached'}
                            </h3>
                            <p className="text-white/40">
                                {localStorage.getItem('language') === 'ar' 
                                    ? 'لقد استهلكت الـ 10 عمليات بحث المتاحة لك اليوم. عد غداً للمزيد من الذكاء!' 
                                    : 'You have used your 10 AI searches for today. Come back tomorrow for more!'}
                            </p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative w-20 h-20 mb-6">
                                <div className="absolute inset-0 border-4 border-accent-blue/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                                <GlobeIcon className="absolute inset-4 w-12 h-12 text-accent-blue opacity-50" />
                            </div>
                            <div className="text-white font-bold uppercase tracking-widest text-xs animate-pulse">
                                Deep Scanning Web Patterns...
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* AI Answer Box */}
                            {aiAnswer && (
                                <div className="p-8 bg-accent-blue/5 border border-accent-blue/20 rounded-[2rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <SparkleIcon className="w-20 h-20 text-accent-blue" />
                                    </div>
                                    <h4 className="text-accent-blue font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
                                        <SparkleIcon className="w-3 h-3" />
                                        AI Summary
                                    </h4>
                                    <p className="text-lg text-white/90 leading-relaxed font-medium">
                                        {aiAnswer}
                                    </p>
                                </div>
                            )}

                            {/* Search Results */}
                            {results.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="text-white/40 font-black uppercase tracking-widest text-[10px] mb-2 px-2">Verified Sources</div>
                                    {results.map((res, i) => (
                                        <a
                                            key={i}
                                            href={onResultSelect ? undefined : res.url}
                                            onClick={(e) => {
                                                if (onResultSelect) {
                                                    e.preventDefault();
                                                    onResultSelect(res);
                                                }
                                            }}
                                            target={onResultSelect ? undefined : "_blank"}
                                            rel={onResultSelect ? undefined : "noopener noreferrer"}
                                            className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-accent-blue transition-all group flex flex-col gap-3 cursor-pointer"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-accent-blue/10 rounded-2xl text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-all">
                                                    <LinkIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-accent-blue transition-colors">{res.title}</h3>
                                                    <p className="text-xs text-white/20 truncate">{res.url}</p>
                                                </div>
                                                {onResultSelect && (
                                                    <div className="px-4 py-2 bg-accent-blue text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-bold flex items-center gap-2">
                                                        <PlusIcon className="w-3 h-3" />
                                                        {localStorage.getItem('language') === 'ar' ? 'حقن المورد' : 'Inject Sector'}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-white/60 line-clamp-2 leading-relaxed pl-14">
                                                {res.content}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            ) : !isLoading && !error && (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                        <GlobeIcon className="w-10 h-10 text-white/20" />
                                    </div>
                                    <div className="text-white/40 text-xl font-bold mb-4">
                                        {localStorage.getItem('language') === 'ar' ? 'لم يتم العثور على بيانات' : 'No data discovered'}
                                    </div>
                                    <p className="text-sm text-white/20 max-w-md mx-auto mb-8">
                                        {localStorage.getItem('language') === 'ar' 
                                            ? 'حاول تبسيط الكلمات المفتاحية للحصول على نتائج أدق من الشبكة العالمية.' 
                                            : 'Try simplifying your query for deeper neural scanning results.'}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-[10px] items-center flex justify-between uppercase tracking-widest font-black text-white/40">
                    <span className="flex items-center gap-4">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            AI Neural Search
                        </span>
                        <span className={`px-2 py-0.5 rounded-md ${usage.remaining < 3 ? 'bg-red-500/20 text-red-400' : 'bg-accent-blue/20 text-accent-blue'}`}>
                            {usage.remaining === Infinity ? 'Unlimited' : `${usage.remaining} Searches Left Today`}
                        </span>
                    </span>
                    <span>© 2026 MathHub Intelligence Layer</span>
                </div>
            </div>
    );

    if (embeddedMode) return modalContent;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            ></div>
            {modalContent}
        </div>
    );
};

export default GlobalSearchModal;
