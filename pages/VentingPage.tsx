import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { TimelineItem } from '../types';
import { TrashIcon, SparkleIcon } from '../components/Icons';

const VentingPage: React.FC = () => {
    const [entries, setEntries] = useState<TimelineItem[]>([]);
    const [thought, setThought] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchEntries = useCallback(async () => {
        if (!supabase) return;
        const { data } = await supabase.from('timeline_items').select('*').eq('type', 'venting').order('timestamp', { ascending: false });
        if (data) setEntries(data);
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const handleSave = async () => {
        if (!thought.trim() || !supabase) return;
        setIsSaving(true);
        await supabase.from('timeline_items').insert([{ type: 'venting', content: thought }]);
        setThought('');
        setIsSaving(false);
        fetchEntries();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Burn this thought?")) {
            await supabase!.from('timeline_items').delete().eq('id', id);
            setEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    return (
        <div className="p-6 md:p-12 max-w-2xl mx-auto min-h-screen flex flex-col pb-32">
            <header className="mb-8 text-center">
                <div className="inline-block p-3 rounded-full bg-brand-magenta/10 mb-4">
                    <SparkleIcon className="w-8 h-8 text-brand-magenta" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">The Void</h1>
                <p className="text-accent-beige/60">Frustrated? Bored? Type it out. Release it.</p>
            </header>

            <div className="mb-8 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-magenta to-brand-cyan rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative glass-card rounded-xl p-1">
                    <textarea
                        value={thought}
                        onChange={(e) => setThought(e.target.value)}
                        placeholder="I'm tired of studying..."
                        className="w-full bg-[var(--input-bg)] text-white p-4 rounded-lg focus:outline-none min-h-[150px] resize-none placeholder-gray-700"
                    />
                    <div className="flex justify-end p-2 bg-[var(--input-bg)] rounded-b-lg">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !thought.trim()}
                            className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:bg-brand-magenta hover:text-white transition-all disabled:opacity-50 uppercase tracking-widest"
                        >
                            {isSaving ? 'Releasing...' : 'Release'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {entries.map(entry => (
                    <div key={entry.id} className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] hover:border-brand-magenta/30 transition-colors relative group">
                        <button onClick={() => handleDelete(entry.id)} className="absolute top-4 right-4 text-gray-600 hover:text-brand-magenta opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                        <p className="text-accent-beige whitespace-pre-wrap leading-relaxed font-light">"{entry.content}"</p>
                        <div className="mt-4 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                            {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VentingPage;