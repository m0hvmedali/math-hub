import React, { useEffect, useState } from 'react';
import { XIcon, GlobeIcon, LinkIcon, PlusIcon } from './Icons';
import { fetchDuckDuckGoResults } from '../utils/searchRadar';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    query?: string;
    initialQuery?: string;
    embeddedMode?: boolean;
    onResultSelect?: (result: { title: string; url: string }) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, query, initialQuery, embeddedMode, onResultSelect }) => {
    const [results, setResults] = useState<Array<{ title: string; url: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTerms = query || initialQuery;

    useEffect(() => {
        if (!isOpen || !searchTerms) return;

        const performSearch = async () => {
            setIsLoading(true);
            const ddgResults = await fetchDuckDuckGoResults(`${searchTerms} ثانوية عامة`);
            setResults(ddgResults);
            setIsLoading(false);
        };

        performSearch();
    }, [isOpen, searchTerms]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={`relative w-full ${embeddedMode ? 'h-full' : 'max-w-5xl h-[85vh]'} bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up flex flex-col`}>
                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {localStorage.getItem('language') === 'ar' ? 'البحث العالمي' : 'Global Intelligence'}
                        </h2>
                        <p className="text-sm text-accent-blue font-bold">DuckDuckGo Neural Search Active</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <GlobeIcon className="w-16 h-16 text-accent-blue mb-4" />
                            <div className="text-white/40 font-bold uppercase tracking-widest text-xs">
                                Querying Global Knowledge...
                            </div>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
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
                                    className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-accent-blue transition-all group flex items-start gap-4 cursor-pointer"
                                >
                                    <div className="p-3 bg-accent-blue/20 rounded-2xl text-accent-blue group-hover:scale-110 transition-transform">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-accent-blue transition-colors">{res.title}</h3>
                                        <p className="text-xs text-white/40 truncate">{res.url}</p>
                                    </div>
                                    {onResultSelect && (
                                        <div className="p-3 bg-accent-blue text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                            <PlusIcon className="w-4 h-4" />
                                            {localStorage.getItem('language') === 'ar' ? 'حقن المورد' : 'Inject Sector'}
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 flex flex-col items-center animate-fade-in">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                <GlobeIcon className="w-10 h-10 text-white/20" />
                            </div>
                            <div className="text-white/40 text-xl font-bold mb-4">
                                {localStorage.getItem('language') === 'ar' ? 'لم يتم العثور على قطاعات خارجية' : 'No global results found'}
                            </div>
                            <p className="text-sm text-white/20 max-w-md mx-auto mb-8">
                                {localStorage.getItem('language') === 'ar' 
                                    ? 'تعذر العثور على نتائج فورية لهذا الاستعلام في محرك البحث المصغر. يمكنك محاولة البحث مباشرة في المتصفح.' 
                                    : 'Instant answers not available for this query. Try a more general topic or search directly on the web.'}
                            </p>
                            <a 
                                href={`https://duckduckgo.com/?q=${encodeURIComponent(searchTerms || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center gap-3 active:scale-95 shadow-xl"
                            >
                                <GlobeIcon className="w-5 h-5 text-accent-blue" />
                                {localStorage.getItem('language') === 'ar' ? 'البحث في DuckDuckGo' : 'Search on DuckDuckGo'}
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-[10px] items-center flex justify-between uppercase tracking-widest font-black text-white/40">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Target: Egyptian Curriculum
                    </span>
                    <span>Powered by DuckDuckGo Neural Engine</span>
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
