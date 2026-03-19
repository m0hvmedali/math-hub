import React, { useEffect, useState, useContext, useRef } from 'react';
import { XIcon, GlobeIcon, LinkIcon, PlusIcon, SparkleIcon } from './Icons';
import { fetchTavilyResults, checkSearchLimit, TavilyResult } from '../utils/searchRadar';
import { generateAIContent } from '../utils/aiHelper';
import { AppContext } from '../App';
import { useCosmicStore } from '../store/useCosmicStore';
import { supabase } from '../supabaseClient';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    query?: string;
    initialQuery?: string;
    embeddedMode?: boolean;
    onResultSelect?: (result: { title: string; url: string }) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, query, initialQuery, embeddedMode, onResultSelect }) => {
    const { user, subjects } = useContext(AppContext) as any;
    const [searchTerm, setSearchTerm] = useState(query || initialQuery || '');
    const [results, setResults] = useState<TavilyResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usage, setUsage] = useState({ allowed: true, remaining: 10 });
    const [mode, setMode] = useState<'search' | 'chat'>('search');
    const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (isOpen && user) {
            setUsage(checkSearchLimit(user));
            if (query || initialQuery) {
                setSearchTerm((query || initialQuery) as string);
                performSearch();
            }
        }
    }, [isOpen, user, query, initialQuery]);

    const recordSearchHistory = async (type: 'web' | 'chat', query: string, count: number = 0) => {
        if (!user || !supabase) return;
        try {
            await supabase.from('search_history').insert({
                user_id: user.id || user,
                query,
                type,
                results_count: count
            });
        } catch (e) {
            console.warn("History recording failed", e);
        }
    };

    const performSearch = async () => {
        if (!searchTerm.trim() || !user) return;

        const limit = checkSearchLimit(user);
        if (!limit.allowed) {
            setError('LIMIT_EXCEEDED');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetchTavilyResults(searchTerm, user);
            if (response && response.results) {
                setResults(response.results);
                
                response.results.forEach(res => {
                    useCosmicStore.getState().addTempNode({
                        id: crypto.randomUUID(),
                        name: res.title,
                        type: 'temp',
                        parentId: subjects[0]?.id || 'root', 
                        url: res.url,
                        color: '#fbbf24',
                        val: 12
                    });
                });
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

    const handleChat = async () => {
        if (!searchTerm.trim() || isThinking) return;
        
        const userMsg = searchTerm.trim();
        setSearchTerm('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsThinking(true);
        setError(null);

        try {
            const context = `You are a highly intelligent AI assistant embedded in a global search modal for an educational app. Keep your answers reasonably concise but very informative and engaging. Previous context: ${chatHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`;
            
            const aiResponse = await generateAIContent(userMsg, context, false);
            recordSearchHistory('chat', userMsg);
            
            setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
        } catch (err) {
            console.error("Chat error:", err);
            setError('FAILED');
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={`relative w-full ${embeddedMode ? 'h-full' : 'max-w-5xl h-[85vh]'} bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up flex flex-col`}>
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                             <SparkleIcon className="w-5 h-5 text-accent-blue animate-pulse" />
                             <h2 className="text-2xl font-black text-white tracking-tight">
                                {localStorage.getItem('language') === 'ar' ? 'ذكاء البحث العالمي' : 'Global AI Intelligence'}
                            </h2>
                        </div>
                        
                        <div className="flex flex-col gap-4 max-w-2xl">
                            <div className="flex flex-wrap md:flex-nowrap bg-white/5 border border-white/10 rounded-xl p-1 w-full md:w-max max-w-full">
                                <button 
                                    onClick={() => setMode('search')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'search' ? 'bg-accent-blue text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <GlobeIcon className="w-4 h-4" />
                                    {localStorage.getItem('language') === 'ar' ? 'بحث شبكي' : 'Web Search'}
                                </button>
                                <button 
                                    onClick={() => setMode('chat')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'chat' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <SparkleIcon className="w-4 h-4" />
                                    {localStorage.getItem('language') === 'ar' ? 'محادثة ذكية' : 'AI Chat'}
                                </button>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (mode === 'search' ? performSearch() : handleChat())}
                                    placeholder={mode === 'search' 
                                        ? (localStorage.getItem('language') === 'ar' ? 'عن ماذا تبحث في الويب؟' : 'What are you looking for on the web?')
                                        : (localStorage.getItem('language') === 'ar' ? 'اسأل المساعد الذكي أي شيء...' : 'Ask the smart assistant anything...')}
                                    className={`flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none transition-all font-bold ${mode === 'chat' ? 'focus:border-brand-purple/50' : 'focus:border-accent-blue/50'}`}
                                />
                                <button 
                                    onClick={mode === 'search' ? performSearch : handleChat}
                                    disabled={isLoading || isThinking || !searchTerm.trim()}
                                    className={`px-8 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-3 shadow-lg ${mode === 'chat' ? 'bg-brand-purple shadow-brand-purple/20' : 'bg-accent-blue shadow-accent-blue/20'}`}
                                >
                                    {isLoading || isThinking ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : mode === 'search' ? <GlobeIcon className="w-5 h-5" /> : <SparkleIcon className="w-5 h-5" />}
                                    {localStorage.getItem('language') === 'ar' ? (mode === 'search' ? 'بحث' : 'إرسال') : (mode === 'search' ? 'Search' : 'Send')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all self-start"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div ref={contentRef} className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
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
                            {mode === 'search' ? (
                                <>
                                    {results.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center justify-between mb-2 px-2">
                                                <div className="text-white/40 font-black uppercase tracking-widest text-[10px]">Verified Sources (Auto-Injected)</div>
                                                <div className="text-emerald-400 font-bold text-[10px] uppercase animate-pulse">Graph Updated Successfully</div>
                                            </div>
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
                                    ) : !error ? (
                                        <div className="text-center py-20 flex flex-col items-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                                <GlobeIcon className="w-10 h-10 text-white/20" />
                                            </div>
                                            <div className="text-white/40 text-xl font-bold mb-4">
                                                {localStorage.getItem('language') === 'ar' ? 'بانتظار استعلامك' : 'Awaiting Query'}
                                            </div>
                                            <p className="text-sm text-white/20 max-w-md mx-auto mb-8">
                                                {localStorage.getItem('language') === 'ar' 
                                                    ? 'ادخل موضوع البحث واضغط انتر لبدء المسح العصبي للشبكة العالمية.' 
                                                    : 'Enter a topic and hit search to begin deep neural scanning.'}
                                            </p>
                                        </div>
                                    ) : null}
                                </>
                            ) : null}

                            {/* Chat Results */}
                            {mode === 'chat' && (
                                <div className="flex flex-col gap-4">
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-5 rounded-3xl ${msg.role === 'user' 
                                                ? 'bg-brand-purple text-white rounded-tr-sm shadow-xl shadow-brand-purple/20' 
                                                : 'bg-white/10 backdrop-blur-md text-gray-100 border border-white/10 rounded-tl-sm'}`}>
                                                {msg.role === 'ai' && (
                                                    <div className="flex items-center gap-2 mb-2 text-accent-cyan">
                                                        <SparkleIcon className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">AI Intelligence</span>
                                                    </div>
                                                )}
                                                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {isThinking && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex gap-2 items-center">
                                                <div className="w-2 h-2 rounded-full bg-brand-purple animate-bounce"></div>
                                                <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    )}
                                    {chatHistory.length === 0 && !isThinking && !error && (
                                        <div className="text-center py-20 flex flex-col items-center">
                                            <div className="w-20 h-20 bg-brand-purple/10 rounded-full flex items-center justify-center mb-6 border border-brand-purple/20">
                                                <SparkleIcon className="w-10 h-10 text-brand-purple/50" />
                                            </div>
                                            <div className="text-white/40 text-xl font-bold mb-4">
                                                {localStorage.getItem('language') === 'ar' ? 'أنا هنا للمساعدة' : 'I am here to help'}
                                            </div>
                                            <p className="text-sm text-white/20 max-w-md mx-auto mb-8">
                                                {localStorage.getItem('language') === 'ar' 
                                                    ? 'اسألني أي سؤال وتناقش معي حول أي موضوع.' 
                                                    : 'Ask me any question and chat with me about any topic.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

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
