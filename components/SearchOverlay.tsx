import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../App';
import { searchRadar, SearchResult, fetchTavilyResults, TavilyResult, saveSearchToHistory } from '../utils/searchRadar';
import { SparkleIcon, GlobeIcon, LinkIcon, VideoIcon, TargetIcon } from './Icons';
import { generateText } from '../services/ai-router';
import { useGoogleOmni } from '../services/platform-sdk';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
    const { user, language } = useContext(AppContext) as any;
    const [query, setQuery] = useState('');
    const [localResults, setLocalResults] = useState<SearchResult[]>([]);
    const [globalResults, setGlobalResults] = useState<TavilyResult[]>([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    
    const [driveResults, setDriveResults] = useState<any[]>([]);
    const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
    const [isSearchingCloud, setIsSearchingCloud] = useState(false);
    const [summaries, setSummaries] = useState<Record<string, string>>({});
    const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
    const { drive, youtube } = useGoogleOmni();

    // Search scope controls
    type Scope = 'local' | 'drive' | 'youtube' | 'web';
    const ALL_SCOPES: Scope[] = ['local', 'drive', 'youtube', 'web'];
    const SCOPE_LABELS: Record<Scope, string> = {
        local: '📂 التطبيق',
        drive: '☁️ Drive',
        youtube: '▶️ YouTube',
        web: '🌐 الويب'
    };
    const [activeScopes, setActiveScopes] = useState<Scope[]>(['local', 'web']);

    const toggleScope = (s: Scope) => {
        setActiveScopes(prev =>
            prev.includes(s)
                ? prev.filter(x => x !== s)
                : [...prev, s]
        );
    };

    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const delayBounceFn = setTimeout(async () => {
            if (query.trim().length > 2) {
                if (activeScopes.includes('local')) {
                    setLocalResults(searchRadar(query));
                } else {
                    setLocalResults([]);
                }

                if (user) {
                    if (activeScopes.includes('web')) {
                        setIsSearchingGlobal(true);
                        fetchTavilyResults(query, user)
                            .then(res => setGlobalResults(res?.results || []))
                            .catch(err => console.error('Global search error:', err))
                            .finally(() => setIsSearchingGlobal(false));
                    } else {
                        setGlobalResults([]);
                    }

                    const needCloud = activeScopes.includes('drive') || activeScopes.includes('youtube');
                    if (needCloud) {
                        setIsSearchingCloud(true);
                        Promise.all([
                            activeScopes.includes('drive') ? drive.search(query).catch(() => ({ files: [] })) : Promise.resolve({ files: [] }),
                            activeScopes.includes('youtube') ? youtube.searchGlobal(query).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })
                        ]).then(([driveRes, ytRes]) => {
                            setDriveResults((driveRes as any).files || []);
                            setYoutubeResults((ytRes as any).items || []);
                        }).finally(() => setIsSearchingCloud(false));
                    } else {
                        setDriveResults([]);
                        setYoutubeResults([]);
                    }
                }
            } else {
                setLocalResults([]);
                setGlobalResults([]);
                setDriveResults([]);
                setYoutubeResults([]);
            }
        }, 800);

        return () => clearTimeout(delayBounceFn);
    }, [query, user, activeScopes]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCloseAttempt();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, query, localResults, globalResults]);

    const handleCloseAttempt = () => {
        const hasResults = localResults.length > 0 || globalResults.length > 0 || youtubeResults.length > 0 || driveResults.length > 0;
        if (query.trim().length > 2 && hasResults) {
            setShowSavePrompt(true);
        } else {
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        setQuery('');
        setLocalResults([]);
        setGlobalResults([]);
        setDriveResults([]);
        setYoutubeResults([]);
        setSummaries({});
        setIsSummarizing(null);
        onClose();
    };

    const handleSummarize = async (id: string, title: string, content: string, type: string) => {
        if (summaries[id]) return;
        setIsSummarizing(id);
        try {
            const result = await generateText(
                `Explain why this ${type} result titled "${title}" is relevant to my search for "${query}". Context: ${content.substring(0, 300)}`,
                { task: 'brain', system: "Briefly explain relevance in " + (language === 'ar' ? "Arabic" : "English") + ". Max 2 sentences." }
            );
            setSummaries(prev => ({ ...prev, [id]: result }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsSummarizing(null);
        }
    };

    const handleSaveAndClose = () => {
        if (user) saveSearchToHistory(user, query, localResults, globalResults, youtubeResults, driveResults);
        resetAndClose();
    };

    if (!isOpen) return null;

    if (showSavePrompt) {
        return (
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-2">{language === 'ar' ? 'حفظ البحث؟' : 'Save Search?'}</h3>
                    <p className="text-gray-400 text-sm mb-6">{language === 'ar' ? 'هل تريد حفظ نتائج هذا البحث للعودة إليها لاحقاً؟' : 'Do you want to save these results?'}</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={resetAndClose} className="px-4 py-2 rounded-xl text-gray-400"> {language === 'ar' ? 'تجاهل' : 'Discard'}</button>
                        <button onClick={handleSaveAndClose} className="px-4 py-2 rounded-xl bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30"> {language === 'ar' ? 'حفظ' : 'Save'}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex flex-col items-center pt-20 pb-4 px-4" onClick={handleCloseAttempt} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex flex-col gap-3 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <svg className="w-6 h-6 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                            ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} 
                            placeholder={language === 'ar' ? 'ابحث...' : 'Search...'}
                            className="flex-1 bg-transparent border-none outline-none text-xl sm:text-2xl text-white font-black"
                        />
                        <button onClick={handleCloseAttempt} className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/10">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap" dir="ltr">
                        {ALL_SCOPES.map(scope => (
                            <button key={scope} onClick={() => toggleScope(scope)} className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${activeScopes.includes(scope) ? 'bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                {SCOPE_LABELS[scope]}
                            </button>
                        ))}
                    </div>
                    {(isSearchingGlobal || isSearchingCloud) && <div className="absolute bottom-0 left-0 h-[2px] bg-brand-cyan animate-pulse w-full"></div>}
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                    {/* Local Results */}
                    <div className="flex-1 md:border-r border-white/5 md:pr-4 flex flex-col">
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2 mb-4 shrink-0">
                            <TargetIcon className="w-4 h-4 text-brand-magenta" /> {language === 'ar' ? 'نتائج التطبيق' : 'Local Results'}
                        </h4>
                        <div className="space-y-3">
                            {localResults.map((res, i) => (
                                <a key={i} href={`/subject/${res.item.subjectId}/branch/${res.item.branchId}/lesson/${res.item.id}`} onClick={resetAndClose} className="block p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-magenta/30 group">
                                    <h5 className="text-white font-bold group-hover:text-brand-magenta">{res.item.name}</h5>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Personal Cloud */}
                    <div className="flex-1 lg:border-r border-white/5 lg:pr-4 flex flex-col">
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2 mb-4 shrink-0">
                            <LinkIcon className="w-4 h-4 text-brand-secondary" /> {language === 'ar' ? 'السحابة الشخصية' : 'Personal Cloud'}
                        </h4>
                        <div className="space-y-3">
                            {driveResults.map((f, i) => (
                                <a key={`drive-${i}`} href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-secondary/30 group">
                                    <div className="flex items-center gap-3">
                                        <LinkIcon className="w-4 h-4 text-brand-secondary" />
                                        <h5 className="text-white text-sm font-bold line-clamp-1">{f.name}</h5>
                                    </div>
                                </a>
                            ))}
                            {youtubeResults.map((v, i) => v.id?.videoId && (
                                <a key={`yt-${i}`} href={`https://www.youtube.com/watch?v=${v.id.videoId}`} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 group flex gap-3 items-center">
                                    <VideoIcon className="w-4 h-4 text-red-500" />
                                    <h5 className="text-white text-sm font-bold line-clamp-2">{v.snippet.title}</h5>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Web Results */}
                    <div className="flex-1 md:pl-4 flex flex-col">
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2 mb-4 shrink-0">
                            <GlobeIcon className="w-4 h-4 text-brand-cyan" /> {language === 'ar' ? 'نتائج الإنترنت' : 'Web Results'}
                        </h4>
                        <div className="space-y-4">
                            {globalResults.map((res, i) => (
                                <div key={i} className="group/item relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-cyan/30">
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" onClick={resetAndClose}>
                                        <h5 className="text-white font-bold group-hover:text-brand-cyan line-clamp-1">{res.title}</h5>
                                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">{res.content}</p>
                                    </a>
                                    {summaries[res.url] && (
                                        <div className="mt-3 p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl animate-fade-in">
                                            <div className="flex items-center gap-2 text-[8px] font-black text-brand-cyan uppercase mb-1">
                                                <SparkleIcon className="w-3 h-3" /> <span>Neural Summary</span>
                                            </div>
                                            <p className="text-[10px] text-brand-cyan/90 italic">"{summaries[res.url]}"</p>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[9px] text-brand-cyan/50 truncate max-w-[120px]">{res.url}</span>
                                        {!summaries[res.url] && (
                                            <button onClick={() => handleSummarize(res.url, res.title, res.content, 'Web')} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-brand-cyan transition-all">
                                                {isSummarizing === res.url ? <div className="w-3 h-3 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" /> : <SparkleIcon className="w-3 h-3" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-white/5 bg-black/80 text-[10px] uppercase font-bold text-gray-600 flex justify-between">
                    <span>{language === 'ar' ? 'الهروب للإغلاق' : 'ESC to close'}</span>
                    <span className="flex items-center gap-2">{language === 'ar' ? 'بدعم من AI' : 'Powered by AI'} <SparkleIcon className="w-3 h-3 text-brand-cyan opacity-50" /></span>
                </div>
            </div>
        </div>
    );
};

export default SearchOverlay;
