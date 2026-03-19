import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { getSearchHistory, clearSearchHistory, HistoryItem } from '../utils/searchRadar';
import { GlobeIcon } from '../components/Icons';

const SearchHistoryPage: React.FC = () => {
    const { user, language } = useContext(AppContext);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        if (user) {
            setHistory(getSearchHistory(user));
        }
    }, [user]);

    const handleClear = () => {
        if (user && window.confirm(language === 'ar' ? 'هل أنت متأكد من مسح جميع سجل البحث؟' : 'Are you sure you want to clear search history?')) {
            clearSearchHistory(user);
            setHistory([]);
        }
    };

    return (
        <div className="p-6 md:p-12 max-w-5xl mx-auto w-full animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20">
                            <svg className="w-6 h-6 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        {language === 'ar' ? 'سجل البحث الشامل' : 'Omni-Search History'}
                    </h1>
                    <p className="text-gray-400 font-medium mt-3 text-sm">{language === 'ar' ? 'استعرض أبحاثك السابقة للعودة إليها بكل سهولة.' : 'Review your past local and global searches with ease.'}</p>
                </div>
                {history.length > 0 && (
                    <button onClick={handleClear} className="bg-red-500/10 text-red-500 px-5 py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {language === 'ar' ? 'مسح السجل' : 'Clear History'}
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="text-center p-16 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <p className="text-gray-500 font-bold text-lg">{language === 'ar' ? 'لا يوجد سجل بحث حتى الآن.' : 'No search history yet.'}</p>
                    <p className="text-gray-600 text-sm mt-2 max-w-sm">{language === 'ar' ? 'وعندما تقوم بالبحث من خلال النافذة الشاملة وحفظها، ستظهر نتائجك هنا.' : 'When you search using the Omni-Search modal and save it, results will appear here.'}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {history.map(item => (
                        <div key={item.id} className="bg-[#0A0A0A] border border-white/10 p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-5 hover:border-white/20 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    "{item.query}"
                                </h2>
                                <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest shrink-0">
                                    {new Date(item.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                                {/* Local Results box */}
                                {item.localResults?.length > 0 && (
                                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl relative shadow-inner overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-brand-magenta/20 text-brand-magenta text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl border-b border-l border-brand-magenta/20">Local</div>
                                        <h3 className="text-xs font-black tracking-widest text-gray-500 mb-4 flex items-center gap-2 uppercase">
                                            <svg className="w-4 h-4 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                            {language === 'ar' ? 'نتائج التطبيق' : 'Inside App'}
                                        </h3>
                                        <div className="space-y-2.5">
                                            {item.localResults.slice(0, 5).map((res, i) => (
                                                <a key={i} href={`/subject/${res.item.subjectId}/branch/${res.item.branchId}/lesson/${res.item.id}`} className="block text-sm text-gray-300 hover:text-brand-magenta bg-black/50 p-3 rounded-xl border border-white/5 hover:border-brand-magenta/30 transition-all group">
                                                    <span className="font-bold">{res.item.name}</span>
                                                    <div className="flex items-center gap-2 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">{res.item.subjectName}</span>
                                                        <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">{res.item.branchName}</span>
                                                    </div>
                                                </a>
                                            ))}
                                            {item.localResults.length > 5 && (
                                                <div className="text-xs text-brand-magenta/70 font-bold px-2 py-1">+ {item.localResults.length - 5} {language === 'ar' ? 'نتائج أخرى' : 'more results'}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                 {/* Global Results box */}
                                {item.globalResults?.length > 0 && (
                                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl relative shadow-inner overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-brand-cyan/20 text-brand-cyan text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl border-b border-l border-brand-cyan/20">Web</div>
                                        <h3 className="text-xs font-black tracking-widest text-gray-500 mb-4 flex items-center gap-2 uppercase">
                                            <GlobeIcon className="w-4 h-4 text-brand-cyan" />
                                            {language === 'ar' ? 'نتائج الإنترنت' : 'From Web'}
                                        </h3>
                                        <div className="space-y-2.5">
                                            {item.globalResults.slice(0, 5).map((res, i) => (
                                                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-black/50 hover:bg-white/5 transition-all border border-white/5 hover:border-brand-cyan/30 group">
                                                    <h5 className="text-white text-sm font-bold group-hover:text-brand-cyan transition-colors line-clamp-1">{res.title}</h5>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed group-hover:text-gray-400 transition-colors">{res.content}</p>
                                                    <div className="text-[9px] text-brand-cyan/40 mt-2 truncate font-medium">{res.url}</div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Drive Results box */}
                                {item.driveResults?.length > 0 && (
                                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl relative shadow-inner overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-brand-secondary/20 text-brand-secondary text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl border-b border-l border-brand-secondary/20">Drive</div>
                                        <h3 className="text-xs font-black tracking-widest text-gray-500 mb-4 flex items-center gap-2 uppercase">
                                            <svg className="w-4 h-4 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                                            {language === 'ar' ? 'ملفات درايف' : 'Drive Files'}
                                        </h3>
                                        <div className="space-y-2.5">
                                            {item.driveResults.slice(0, 5).map((f, i) => (
                                                <a key={i} href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-black/50 hover:bg-white/5 transition-all border border-white/5 hover:border-brand-secondary/30 group flex items-center gap-3">
                                                    {f.iconLink && <img src={f.iconLink} className="w-4 h-4 shrink-0" alt="" />}
                                                    <h5 className="text-white text-sm font-bold group-hover:text-brand-secondary transition-colors line-clamp-1">{f.name}</h5>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* YouTube Results box */}
                                {item.youtubeResults?.length > 0 && (
                                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl relative shadow-inner overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-red-500/20 text-red-500 text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl border-b border-l border-red-500/20">YouTube</div>
                                        <h3 className="text-xs font-black tracking-widest text-gray-500 mb-4 flex items-center gap-2 uppercase">
                                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="currentColor"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/></svg>
                                            {language === 'ar' ? 'فيديوهات يوتيوب' : 'YouTube Videos'}
                                        </h3>
                                        <div className="space-y-2.5">
                                            {item.youtubeResults.slice(0, 5).map((v, i) => (
                                                <a key={i} href={`https://www.youtube.com/watch?v=${v.id?.videoId}`} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-black/50 hover:bg-white/5 transition-all border border-white/5 hover:border-red-500/30 group flex items-center gap-3">
                                                    <img src={v.snippet?.thumbnails?.default?.url} className="w-10 h-7 object-cover rounded shrink-0 bg-white/10" alt="" />
                                                    <h5 className="text-white text-sm font-bold group-hover:text-red-400 transition-colors line-clamp-1">{v.snippet?.title}</h5>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchHistoryPage;
