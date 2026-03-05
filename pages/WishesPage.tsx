import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { TimelineItem } from '../types';
import { CheckCircleIcon, CircleIcon, PlusIcon, TrashIcon } from '../components/Icons';

const WishesPage: React.FC = () => {
    const [wishes, setWishes] = useState<TimelineItem[]>([]);
    const [newWish, setNewWish] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchWishes = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data } = await supabase
            .from('timeline_items')
            .select('*')
            .eq('type', 'wish')
            .order('timestamp', { ascending: false });

        if (data) setWishes(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchWishes();
    }, [fetchWishes]);

    const handleAddWish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWish.trim() || !supabase) return;

        const wish: Omit<TimelineItem, 'id' | 'timestamp'> = {
            type: 'wish',
            content: newWish,
            status: 'pending' // Note: This field might need to be stored in 'content' JSON if schema is strict, but assuming 'file_name' field reuse or loose schema for now. Let's strictly use 'content' string for simplicity or update schema if possible. We will store status in JSON string inside content for compatibility.
        };

        // Compatibility Hack: Store status in content as JSON string
        const contentPayload = JSON.stringify({ text: newWish, status: 'pending' });

        await supabase.from('timeline_items').insert([{ type: 'wish', content: contentPayload }]);
        setNewWish('');
        fetchWishes();
    };

    const toggleWish = async (id: string, currentContent: string) => {
        if (!supabase) return;
        try {
            const parsed = JSON.parse(currentContent);
            const newStatus = parsed.status === 'completed' ? 'pending' : 'completed';
            const newPayload = JSON.stringify({ ...parsed, status: newStatus });

            await supabase.from('timeline_items').update({ content: newPayload }).eq('id', id);
            setWishes(prev => prev.map(w => w.id === id ? { ...w, content: newPayload } : w));
        } catch (e) {
            console.error("Error parsing wish content", e);
        }
    };

    const deleteWish = async (id: string) => {
        if (!supabase) return;
        await supabase.from('timeline_items').delete().eq('id', id);
        setWishes(prev => prev.filter(w => w.id !== id));
    };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-white mb-2">Milestones & Wishes</h1>
                <p className="text-gray-400">"The future belongs to those who believe in the beauty of their dreams."</p>
            </header>

            <form onSubmit={handleAddWish} className="mb-10 relative">
                <input
                    type="text"
                    value={newWish}
                    onChange={(e) => setNewWish(e.target.value)}
                    placeholder="I want to achieve..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-full px-6 py-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:border-transparent shadow-lg"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-brand-magenta hover:bg-brand-magenta/80 text-white px-6 rounded-full font-bold transition-all"
                >
                    Wish
                </button>
            </form>

            <div className="space-y-4">
                {wishes.map(wish => {
                    let text = wish.content;
                    let isCompleted = false;
                    try {
                        const parsed = JSON.parse(wish.content);
                        text = parsed.text;
                        isCompleted = parsed.status === 'completed';
                    } catch (e) {
                        // legacy or plain text fallback
                    }

                    return (
                        <div key={wish.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCompleted ? 'bg-[var(--input-bg)]/30 border-[var(--glass-border)] opacity-60' : 'bg-[var(--input-bg)] border-[var(--glass-border)] hover:border-brand-magenta/50'}`}>
                            <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleWish(wish.id, wish.content)}>
                                {isCompleted ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <CircleIcon className="w-6 h-6 text-gray-600" />}
                                <span className={`text-lg ${isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>{text}</span>
                            </div>
                            <button onClick={() => deleteWish(wish.id)} className="text-gray-600 hover:text-red-500 p-2">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
                {wishes.length === 0 && !isLoading && (
                    <div className="text-center text-gray-500 py-10">No wishes yet. Make a wish!</div>
                )}
            </div>
        </div>
    );
};

export default WishesPage;
