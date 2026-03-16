import React from 'react';
import { AnalysisResponse } from '../types';
import { Quote, Activity, BookOpen, Clock, Zap, ShieldCheck, CheckCircle2, Globe, ExternalLink, Search, Sparkles } from 'lucide-react';
import { useHubCore } from '../utils/HubCore';

interface AnalysisDisplayProps {
    data: AnalysisResponse;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
    // Register UI with HubCore
    useHubCore({
        id: 'AnalysisDisplayAtom',
        state: { summary: data.summary.stressLevel, effort: data.summary.effortType },
        actions: {
            scrollToQuran: () => {
                const el = document.querySelector('[dir="rtl"] .bg-gradient-to-l');
                el?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    return (
        <div className="animate-fade-in pb-12">
            {/* Header */}
            <header className="text-center py-6 mb-8 animate-float">
                <div className="inline-block relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-transparent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <h1 className="relative text-3xl md:text-5xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600">
                        إرشادات الملاح الواعي
                    </h1>
                </div>
                <p className="text-gray-500 text-sm md:text-base mt-2 font-light tracking-widest uppercase opacity-80">
                    Mindful Navigator Guidance
                </p>
            </header>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Main Content Area: Generated Guidance */}
                <main className="lg:col-span-8 order-2 lg:order-1 space-y-8">
                    <article className="glass-panel rounded-[30px] p-1 overflow-hidden transition-all duration-500 hover:border-yellow-500/30 animate-glow">
                        {/* Inner Content */}
                        <div className="rounded-[28px] bg-gradient-to-br from-white/5 to-transparent p-6 md:p-10 h-full relative">

                            {/* Decorative Icon */}
                            <div className="absolute top-8 left-8 text-yellow-500/5 rotate-12 pointer-events-none">
                                <Quote size={120} />
                            </div>

                            <h2 className="text-xl font-semibold text-yellow-400 mb-8 flex items-center gap-3 border-b border-white/5 pb-4 relative z-10">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                الرؤية والتوجيه
                            </h2>

                            {/* Analysis Content (Amiri Font) */}
                            <div className="font-serif text-xl md:text-2xl leading-[2.2] text-gray-200/90 relative z-10 text-justify" dir="rtl">
                                {data.summary.analysisText.split('\n').map((paragraph, idx) => (
                                    paragraph.trim() && <p key={idx} className="mb-6 last:mb-0">{paragraph}</p>
                                ))}
                            </div>

                            {/* Quranic Verse Highlight - Enhanced */}
                            <div className="my-10 relative z-10" dir="rtl">
                                <div className="bg-gradient-to-l from-yellow-900/20 to-transparent border-r-4 border-yellow-500 p-8 rounded-l-2xl shadow-lg shadow-black/20">
                                    <div className="flex items-center gap-2 mb-4 text-yellow-500/80 text-xs font-bold uppercase tracking-wider">
                                        <Sparkles className="w-4 h-4" /> قبس من النور
                                    </div>
                                    <p className="font-serif text-3xl text-yellow-100 mb-4 leading-relaxed drop-shadow-md">
                                        "{data.quranicLink.verse}"
                                    </p>
                                    <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm text-yellow-500/70">
                                        <span className="font-bold border border-yellow-500/30 px-3 py-1 rounded-full">{data.quranicLink.surah}</span>
                                        <span className="hidden md:inline w-1 h-1 rounded-full bg-yellow-500/50"></span>
                                        <span className="italic opacity-80">{data.quranicLink.behavioralExplanation}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Psych Support */}
                            <div className="bg-indigo-900/10 border border-indigo-500/10 p-6 rounded-2xl relative z-10 flex items-start gap-4" dir="rtl">
                                <ShieldCheck className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-indigo-300 font-bold mb-1 text-sm uppercase tracking-wide">همسة نفسية ({data.psychologicalSupport.technique})</h4>
                                    <p className="text-gray-300 italic font-serif text-lg">"{data.psychologicalSupport.message}"</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-slate-600">
                                <span>تم التوليد بواسطة رفيق الذكاء الاصطناعي</span>
                                <div className="flex gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Web Search Findings Section (Enhanced Grounding UI) */}
                    {data.webAnalysis && (
                        <div className="glass-panel rounded-[30px] p-8 border border-blue-500/20 relative overflow-hidden" dir="rtl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50"></div>

                            <h3 className="text-lg font-bold text-blue-400 mb-6 flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                رؤى الويب (Google Search Grounding)
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-blue-900/10 p-5 rounded-2xl border border-blue-500/10">
                                    <h4 className="text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
                                        <Search className="w-4 h-4" /> السبب الجذري (بحث)
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{data.webAnalysis.rootCause}</p>
                                </div>
                                <div className="bg-emerald-900/10 p-5 rounded-2xl border border-emerald-500/10">
                                    <h4 className="text-emerald-300 font-bold text-sm mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> علاج مقترح
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{data.webAnalysis.suggestedRemedy}</p>
                                </div>
                            </div>

                            {data.webAnalysis.sources && data.webAnalysis.sources.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 border-b border-white/5 pb-2">نتائج البحث ذات الصلة</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {data.webAnalysis.sources.map((source, idx) => (
                                            <a
                                                key={idx}
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-blue-500/10 rounded-full text-blue-400">
                                                        <Globe className="w-3 h-3" />
                                                    </div>
                                                    <span className="font-bold text-gray-200 text-xs truncate max-w-[200px]" dir="ltr">{new URL(source.url).hostname.replace('www.', '')}</span>
                                                </div>
                                                <span className="font-bold text-blue-400 text-sm group-hover:underline mb-1 line-clamp-1">{source.title}</span>
                                                {source.snippet && <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{source.snippet}</p>}
                                                <ExternalLink className="absolute top-3 left-3 w-3 h-3 text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tomorrow's Plan (Flowing below guidance) */}
                    <div className="glass-panel rounded-3xl p-8 border border-emerald-500/10" dir="rtl">
                        <h3 className="text-lg font-bold text-emerald-400 mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            مسار الغد المقترح
                        </h3>
                        <div className="space-y-4 relative pr-4 border-r border-white/5">
                            {data.tomorrowPlan.map((plan, idx) => (
                                <div key={idx} className="relative pr-8 group">
                                    <div className={`absolute -right-[21px] top-4 w-4 h-4 rounded-full border-2 ${plan.type === 'study' ? 'bg-black border-emerald-500 group-hover:bg-emerald-500' : 'bg-black border-slate-600'} transition-colors shadow-lg shadow-black/50`}></div>
                                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${plan.type === 'study' ? 'bg-white/5 border-white/5 hover:border-emerald-500/30 hover:bg-white/10' : 'bg-transparent border-transparent opacity-60'}`}>
                                        <div className="flex flex-wrap justify-between items-baseline mb-1 gap-2">
                                            <span className="font-bold text-gray-200 text-lg">{plan.task}</span>
                                            <span className="text-xs font-mono text-emerald-500 bg-emerald-900/20 px-2 py-1 rounded">{plan.time}</span>
                                        </div>
                                        {plan.method && (
                                            <div className="text-sm text-gray-400 flex items-center gap-2 mt-2">
                                                <Zap className="w-3 h-3 text-yellow-500" />
                                                {plan.method}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Sidebar Context Panel */}
                <aside className="lg:col-span-4 order-1 lg:order-2 space-y-6">
                    <div className="glass-panel rounded-3xl overflow-hidden" dir="rtl">
                        <div className="p-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-200">
                                <Activity className="w-5 h-5 text-yellow-400" />
                                <span className="font-bold">سياق الحالة</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1 text-center">
                                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">الضغط</label>
                                    <div className={`glass-input py-2 rounded-xl font-bold border ${data.summary.stressLevel === 'high' ? 'text-red-400 border-red-900/30' : 'text-emerald-400 border-emerald-900/30'}`}>
                                        {data.summary.stressLevel === 'low' ? 'منخفض' : data.summary.stressLevel === 'medium' ? 'متوسط' : 'مرتفع'}
                                    </div>
                                </div>
                                <div className="space-y-1 text-center">
                                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">الجهد</label>
                                    <div className="glass-input py-2 rounded-xl text-blue-400 font-bold border border-blue-900/30">
                                        {data.summary.effortType}
                                    </div>
                                </div>
                            </div>

                            {/* Research Evidence */}
                            <div className="space-y-3 pt-2">
                                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-2">الدلائل العلمية</label>
                                {data.researchConnections.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="bg-black/30 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-300 leading-relaxed mb-2">{item.point}</p>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-purple-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {item.source}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{item.evidenceStrength}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Methods Quick List */}
                            <div className="pt-2">
                                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-3">طرق المذاكرة المقترحة</label>
                                <div className="space-y-2">
                                    {data.recommendedMethods.map((m, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                            <CheckCircle2 className="w-3 h-3 text-yellow-500" />
                                            <span>{m.subject}: <span className="text-gray-300">{m.methodName}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default AnalysisDisplay;
