import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { ClockIcon } from '../components/Icons';

const SchedulePage: React.FC = () => {
    const [schedule, setSchedule] = useState<Record<string, string>>({
        'Saturday': '', 'Sunday': '', 'Monday': '', 'Tuesday': '', 'Wednesday': '', 'Thursday': '', 'Friday': ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [dbId, setDbId] = useState<string | null>(null);

    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const fetchSchedule = useCallback(async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('timeline_items')
            .select('*')
            .eq('type', 'weekly_schedule')
            .limit(1);

        if (data && data.length > 0) {
            try {
                const loadedSchedule = JSON.parse(data[0].content);
                setSchedule(loadedSchedule);
                setDbId(data[0].id);
            } catch (e) {
                console.error("Error parsing schedule", e);
            }
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const handleSave = async () => {
        if (!supabase) return;
        setIsSaving(true);
        const contentString = JSON.stringify(schedule);

        if (dbId) {
            await supabase.from('timeline_items').update({ content: contentString }).eq('id', dbId);
        } else {
            const { data } = await supabase.from('timeline_items').insert([{
                type: 'weekly_schedule',
                content: contentString
            }]).select();
            if (data) setDbId(data[0].id);
        }
        setIsSaving(false);
    };

    const handleChange = (day: string, value: string) => {
        setSchedule(prev => ({ ...prev, [day]: value }));
    };

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto pb-32">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <ClockIcon className="w-10 h-10 text-brand-cyan" />
                        Weekly Schedule
                    </h1>
                    <p className="text-gray-400 text-lg">Plan your academic week.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-cyan text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 text-lg shadow-lg"
                >
                    {isSaving ? 'Saving...' : 'Save Schedule'}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {days.map(day => (
                    <div key={day} className="glass-card border border-[var(--glass-border)] rounded-2xl p-6 hover:border-gray-600 transition-colors group shadow-sm">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                            {day}
                            <span className="w-3 h-3 rounded-full bg-gray-700 group-hover:bg-brand-cyan transition-colors"></span>
                        </h3>
                        <textarea
                            value={schedule[day]}
                            onChange={(e) => handleChange(day, e.target.value)}
                            placeholder={`Plan for ${day}...`}
                            className="w-full h-48 bg-gray-800/50 border border-[var(--glass-border)] rounded-xl p-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:bg-gray-800 resize-none leading-relaxed"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SchedulePage;