import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { KnowledgeError, ErrorCause, Subject } from '../types';

interface PatternDashboardProps {
    errors: KnowledgeError[];
    subjects: Subject[];
    language: 'ar' | 'en';
    onErrorClick: (error: KnowledgeError) => void;
}

const PatternDashboard: React.FC<PatternDashboardProps> = ({ errors, subjects, language, onErrorClick }) => {
    const errorMapping: Record<ErrorCause, { label: string; color: string }> = {
        arithmetic_haste: { label: language === 'ar' ? 'تسرع حسابي' : 'Arithmetic Haste', color: '#fb7185' },
        rule_misunderstanding: { label: language === 'ar' ? 'عدم فهم قانون' : 'Rule Misunderstanding', color: '#c084fc' },
        unit_forgetting: { label: language === 'ar' ? 'نسيان تحويل وحدات' : 'Unit Forgetting', color: '#38bdf8' },
        mental_distraction: { label: language === 'ar' ? 'تشتت ذهني' : 'Mental Distraction', color: '#fbbf24' },
    };

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        errors.forEach(err => {
            counts[err.cause] = (counts[err.cause] || 0) + 1;
        });

        return Object.entries(errorMapping).map(([key, { label, color }]) => ({
            name: label,
            value: counts[key as ErrorCause] || 0,
            color
        })).filter(d => d.value > 0);
    }, [errors, language]);

    const smartInsight = useMemo(() => {
        if (errors.length === 0) return null;

        // Find most frequent cause
        const causeCounts: Record<string, number> = {};
        errors.forEach(err => {
            causeCounts[err.cause] = (causeCounts[err.cause] || 0) + 1;
        });

        const topCause = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0];
        const percentage = Math.round((topCause[1] / errors.length) * 100);
        const causeLabel = errorMapping[topCause[0] as ErrorCause].label;

        // Most problematic subject for that cause
        const subjectCounts: Record<string, number> = {};
        errors.filter(e => e.cause === topCause[0]).forEach(err => {
            const lessonId = err.lesson_id;
            // Find subject for this lesson id
            let subName = 'Unknown';
            subjects.forEach(s => {
                s.branches.forEach(b => {
                    if (b.lessons.some(l => l.id === lessonId)) subName = s.name;
                });
            });
            subjectCounts[subName] = (subjectCounts[subName] || 0) + 1;
        });

        const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '...';

        if (language === 'ar') {
            return `باشمهندس، ${percentage}% من أخطائك في ${topSubject} سببها ${causeLabel} وليس نقص معرفة.`;
        } else {
            return `Engineer, ${percentage}% of your errors in ${topSubject} are due to ${causeLabel} rather than lack of knowledge.`;
        }
    }, [errors, subjects, language]);

    if (errors.length === 0) {
        return (
            <div className="flex items-center justify-center p-12 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                    {language === 'ar' ? 'لا توجد بيانات كافية للتحليل بعد' : 'Not enough data for analysis yet'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Smart Insight Banner */}
            <div className="bg-accent-blue/10 border border-accent-blue/30 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex gap-4">
                    <span className="text-2xl">🧠</span>
                    <p className="text-white font-bold text-lg leading-relaxed">
                        {smartInsight}
                    </p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Errors List */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                    {language === 'ar' ? 'المهمات الأخيرة' : 'Recent Missions'}
                </h3>
                <div className="space-y-2">
                    {errors.slice(0, 5).map((err) => {
                        // Find lesson name
                        let lessonName = 'Unknown Lesson';
                        subjects.forEach(s => s.branches.forEach(b => {
                            const l = b.lessons.find(l => l.id === err.lesson_id);
                            if (l) lessonName = l.name;
                        }));

                        return (
                            <button
                                key={err.id}
                                onClick={() => onErrorClick(err)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-accent-blue/50 transition-all group"
                                dir={language === 'ar' ? 'rtl' : 'ltr'}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: errorMapping[err.cause as ErrorCause].color }}></div>
                                    <div className="text-left">
                                        <div className="text-white font-bold text-sm tracking-tight">{lessonName}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">{errorMapping[err.cause as ErrorCause].label}</div>
                                    </div>
                                </div>
                                <span className="text-accent-blue text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {language === 'ar' ? 'مراجعة ←' : 'Review →'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PatternDashboard;
