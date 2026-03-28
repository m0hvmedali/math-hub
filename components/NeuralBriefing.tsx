import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../App';
import { generateText } from '../services/ai-router';
import { Shimmer } from './ai-elements/shimmer';
import { SparkleIcon, ClockIcon, TargetIcon } from './Icons';
import { calendar } from '../services/platform-sdk';

const NeuralBriefing: React.FC = () => {
    const { language, tasks, studySessions } = useContext(AppContext) as any;
    const [briefing, setBriefing] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                // 1. Get Calendar Events for today
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setHours(23, 59, 59, 999);
                
                let eventsSummary = "No calendar events today.";
                try {
                    const data = await calendar.getEventsByRange(start.toISOString(), end.toISOString());
                    const items = data.items || [];
                    if (items.length > 0) {
                        eventsSummary = items.map((e: any) => `- ${e.summary} (${new Date(e.start.dateTime || e.start.date).toLocaleTimeString()})`).join('\n');
                    }
                } catch (e) {
                    console.warn("Calendar fetch failed for briefing:", e);
                }

                // 2. Prepare Context
                const context = `
Current Tasks: ${tasks.map((t: any) => t.title).join(', ') || 'None'}
Study Progress: Total ${studySessions.length} sessions completed.
Calendar Events:
${eventsSummary}
                `;

                // 3. Generate Briefing using Central Brain
                const result = await generateText(
                    `Based on my day below, give me a very short (2 sentences max), highly motivating "Neural Briefing" in ${language === 'ar' ? 'Arabic' : 'English'}. Be cinematic and encouraging.\n\nContext:\n${context}`,
                    { 
                        task: 'brain',
                        system: "You are the Math Hub Central Brain. Your tone is futuristic, elite, and deeply motivating."
                    }
                );

                setBriefing(result);
            } catch (error) {
                console.error("Briefing Generation Error:", error);
                setBriefing(language === 'ar' ? 'مستعد ليوم جديد من التفوق؟' : 'Ready for another day of excellence?');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBriefing();
    }, [tasks, studySessions, language]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                <div className="w-12 h-12 bg-brand-cyan/20 rounded-2xl flex items-center justify-center">
                    <SparkleIcon className="w-6 h-6 text-brand-cyan animate-pulse" />
                </div>
                <div className="flex-1 space-y-3">
                    <Shimmer className="h-4 text-brand-cyan/40 font-black uppercase text-[10px] tracking-[0.3em]">
                        Syncing Neural Nodes...
                    </Shimmer>
                    <Shimmer className="h-6 w-3/4 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative group overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/10 via-brand-purple/5 to-transparent blur-3xl" />
            
            <div className="relative z-10 p-8 glass-card !rounded-[2.5rem] border-brand-cyan/20 group-hover:border-brand-cyan/40 transition-all duration-700">
                <div className="flex items-start gap-5">
                    <div className="relative">
                        <div className="p-4 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner group-hover:bg-brand-cyan/20 transition-colors">
                            <SparkleIcon className="w-8 h-8 text-brand-cyan animate-pulse" />
                        </div>
                        {/* Status Dot */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-green rounded-full border-2 border-black animate-ping" />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em]">
                            <TargetIcon className="w-3 h-3" />
                            <span>Neural Intelligence Briefing</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-white leading-relaxed tracking-tight mb-2 drop-shadow-sm">
                            {briefing}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-4">
                            <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                <span>Real-time Sync Active</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-700 rounded-full" />
                            <span>Powered by GPT-OSS-120B</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeuralBriefing;
