import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../App';
import { searchRadar, SearchResult, fetchTavilyResults, TavilyResult, saveSearchToHistory } from '../utils/searchRadar';
import { SparkleIcon, GlobeIcon } from './Icons';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
    const { user, language } = useContext(AppContext);
    const [query, setQuery] = useState('');
    const [localResults, setLocalResults] = useState<SearchResult[]>([]);
    const [globalResults, setGlobalResults] = useState<TavilyResult[]>([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        // Debounce search
        const delayBounceFn = setTimeout(async () => {
            if (query.trim().length > 2) {
                // Local Search
                const locals = searchRadar(query);
                setLocalResults(locals);

                // Global Search
                if (user) {
                    setIsSearchingGlobal(true);
                    try {
                        const globalRes = await fetchTavilyResults(query, user);
                        setGlobalResults(globalRes?.results || []);
                    } catch (error) {
                        console.error('Global search error:', error);
                    } finally {
                        setIsSearchingGlobal(false);
                    }
                }
            } else {
                setLocalResults([]);
                setGlobalResults([]);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(delayBounceFn);
    }, [query, user]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseAttempt();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, query, localResults, globalResults]);


    const handleCloseAttempt = () => {
        if (query.trim().length > 2 && (localResults.length > 0 || globalResults.length > 0)) {
            setShowSavePrompt(true);
        } else {
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        setQuery('');
        setLocalResults([]);
        setGlobalResults([]);
        setShowSavePrompt(false);
        onClose();
    };

    const handleSaveAndClose = () => {
        if (user) {
            saveSearchToHistory(user, query, localResults, globalResults);
        }
        resetAndClose();
    };

    if (!isOpen) return null;

    if (showSavePrompt) {
        return (
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in p-4 text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-2">{language === 'ar' ? 'حفظ البحث؟' : 'Save Search?'}</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        {language === 'ar' 
                            ? 'هل تريد حفظ نتائج هذا البحث للعودة إليها لاحقاً في صفحة سجل البحث؟' 
                            : 'Do you want to save these results to your Search History?'}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={resetAndClose} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all outline-none">
                            {language === 'ar' ? 'تجاهل' : 'Discard'}
                        </button>
                        <button onClick={handleSaveAndClose} className="px-4 py-2 rounded-xl bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 transition-all font-bold outline-none border border-brand-cyan/30">
                            {language === 'ar' ? 'حفظ' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex flex-col items-center pt-20 pb-4 animate-fade-in px-4" onClick={handleCloseAttempt} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
                
                {/* Header / Input */}
                <div className="p-4 border-b border-white/10 flex items-center gap-4 relative bg-white/[0.02]">
                    <svg className="w-6 h-6 text-brand-cyan shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={language === 'ar' ? 'ابحث في التطبيق أو الإنترنت معاً...' : 'Search app and internet globally...'}
                        className="flex-1 bg-transparent border-none outline-none text-xl sm:text-2xl text-white placeholder-gray-500 font-black tracking-tight"
                    />
                    <button onClick={handleCloseAttempt} className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all outline-none border border-transparent hover:border-white/10 shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    {/* Progress bar visual indicator */}
                    {(isSearchingGlobal) && (
                        <div className="absolute bottom-0 left-0 h-[2px] bg-brand-cyan animate-pulse" style={{ width: '100%' }}></div>
                    )}
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row gap-6 relative">
                    
                    {/* Local Results */}
                    <div className="flex-1 md:border-r border-white/5 md:pr-4 flex flex-col">
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2 mb-4 shrink-0">
                            <svg className="w-4 h-4 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            {language === 'ar' ? 'نتائج التطبيق' : 'Local Results'}
                        </h4>
                        
                        {localResults.length === 0 && query.trim().length > 2 && !isSearchingGlobal && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
                                <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-sm font-medium text-gray-400">{language === 'ar' ? 'لا توجد نتائج محلية مطابقة' : 'No local matches'}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {localResults.map((res, i) => (
                                <a key={i} href={`/subject/${res.item.subjectId}/branch/${res.item.branchId}/lesson/${res.item.id}`} onClick={resetAndClose} className="block p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/5 hover:border-brand-magenta/30 group">
                                    <h5 className="text-white font-bold group-hover:text-brand-magenta transition-colors">{res.item.name}</h5>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                        <span className="bg-black/80 px-2.5 py-1 rounded border border-white/10">{res.item.subjectName}</span>
                                        <span className="bg-black/80 px-2.5 py-1 rounded border border-white/10">{res.item.branchName}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Global Results (Tavily) */}
                    <div className="flex-1 md:pl-4 flex flex-col">
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2 mb-4 shrink-0">
                            <GlobeIcon className="w-4 h-4 text-brand-cyan" />
                            {language === 'ar' ? 'نتائج الإنترنت' : 'Web Results'}
                        </h4>

                        {isSearchingGlobal && (
                            <div className="flex-1 flex flex-col items-center justify-center text-brand-cyan p-6 opacity-70">
                                <SparkleIcon className="w-8 h-8 mb-3 animate-pulse" /> 
                                <span className="text-sm font-bold animate-pulse tracking-wide">{language === 'ar' ? 'جاري التنقيب في الإنترنت...' : 'Mining the web...'}</span>
                            </div>
                        )}

                        {!isSearchingGlobal && globalResults.length === 0 && query.trim().length > 2 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
                                <GlobeIcon className="w-12 h-12 mb-3 text-gray-600" />
                                <p className="text-sm font-medium text-gray-400">{language === 'ar' ? 'الإنترنت لم يجد ما تبحث عنه' : 'Nothing found globally'}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {globalResults.map((res, i) => (
                                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" onClick={resetAndClose} className="block p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/5 hover:border-brand-cyan/30 group">
                                    <h5 className="text-white font-bold group-hover:text-brand-cyan transition-colors line-clamp-1 leading-snug">{res.title}</h5>
                                    <p className="text-sm text-gray-400 line-clamp-2 mt-1.5 leading-relaxed font-medium">{res.content}</p>
                                    <div className="text-[10px] font-medium text-brand-cyan/50 mt-2.5 truncate flex items-center gap-1.5">
                                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        {res.url}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                </div>
                
                {/* Footer hints */}
                <div className="px-5 py-3 border-t border-white/5 bg-black/80 text-[10px] uppercase tracking-widest font-bold text-gray-600 flex justify-between shrink-0">
                    <span>{language === 'ar' ? 'الهروب للإغلاق' : 'ESC to close'}</span>
                    <span className="flex items-center gap-2">
                        {language === 'ar' ? 'بدعم من AI' : 'Powered by AI'} 
                        <SparkleIcon className="w-3 h-3 text-brand-cyan opacity-50" />
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SearchOverlay;
