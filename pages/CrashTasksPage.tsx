import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../App';
import { SparkleIcon, PlusIcon, TrashIcon, CalendarIcon, BookOpenIcon } from '../components/Icons';
import { supabase } from '../supabaseClient';
import { CrashTask } from '../types';
import Sidebar from '../components/Sidebar';

const CrashTasksPage: React.FC = () => {
    const { user, subjects } = useContext(AppContext);

    const [crashTasks, setCrashTasks] = useState<CrashTask[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form State
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examDate, setExamDate] = useState('');
    const [content, setContent] = useState('');

    const fetchCrashTasks = useCallback(async () => {
        if (!user || !supabase) return;
        const { data } = await supabase
            .from('crash_tasks')
            .select('*')
            .eq('user_id', user)
            .order('exam_date', { ascending: true });
        setCrashTasks(data || []);
    }, [user]);

    useEffect(() => {
        fetchCrashTasks();
    }, [fetchCrashTasks]);

    const handleCreateCrashTask = async () => {
        if (!user || !supabase || !selectedSubject || !examDate) return;
        await supabase.from('crash_tasks').insert([{
            user_id: user,
            subject_id: selectedSubject,
            exam_date: examDate,
            content: content
        }]);
        setIsSidebarOpen(false);
        setSelectedSubject('');
        setExamDate('');
        setContent('');
        fetchCrashTasks();
    };

    const handleDeleteCrashTask = async (id: string) => {
        if (!supabase) return;
        await supabase.from('crash_tasks').delete().eq('id', id);
        fetchCrashTasks();
    };

    return (
        <div className="min-h-screen bg-transparent p-8 animate-fade-in pb-32">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tighter uppercase">Crash <span className="text-brand-magenta">Mission</span></h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px]">Urgent Exam Prep & Final Reviews</p>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="bg-brand-magenta text-white px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-brand-magenta/20 hover:scale-105 transition-all flex items-center gap-2 md:gap-3"
                    >
                        <PlusIcon className="w-5 h-5 md:w-6 md:h-6" /> NEW SECTOR
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {crashTasks.map(task => {
                        const subjectName = subjects.find(s => s.id === task.subject_id)?.name || 'Unknown Subject';
                        const daysLeft = Math.ceil((new Date(task.exam_date).getTime() - Date.now()) / (1000 * 3600 * 24));

                        return (
                            <div key={task.id} className="group relative glass-card border border-[var(--glass-border)] rounded-[2rem] p-8 hover:border-brand-magenta/50 transition-all hover:shadow-2xl hover:shadow-brand-magenta/5 overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-brand-magenta"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-magenta px-3 py-1 bg-brand-magenta/10 rounded-full mb-3 inline-block">CRITICAL PATH</span>
                                        <h3 className="text-3xl font-black text-white">{subjectName}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCrashTask(task.id)}
                                        className="p-2 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-900 rounded-xl">
                                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Exam Date</p>
                                            <p className="text-white font-black">{new Date(task.exam_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Time Remaining</p>
                                            <p className={`text-xl font-black ${daysLeft < 7 ? 'text-red-500' : 'text-accent-green'}`}>{daysLeft} DAYS</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-[var(--input-bg)] rounded-2xl border border-[var(--glass-border)]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <BookOpenIcon className="w-4 h-4 text-brand-cyan" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mission Parameters</span>
                                        </div>
                                        <p className="text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">{task.content || 'No specific mission details provided.'}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {crashTasks.length === 0 && (
                        <div className="col-span-full py-40 text-center border-2 border-dashed border-[var(--glass-border)] rounded-[3rem] glass-card/50">
                            <SparkleIcon className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                            <p className="text-gray-600 font-black uppercase tracking-[0.2em]">No urgent missions active. Standard operations ongoing.</p>
                        </div>
                    )}
                </div>
            </div>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                title="Initialize Crash Mission"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Target Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl p-4 text-white focus:border-brand-magenta outline-none appearance-none"
                        >
                            <option value="">Select Subject...</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Zero Hour (Exam Date)</label>
                        <input
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl p-4 text-white focus:border-brand-magenta outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Strategy & Notes</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Detail your intensive prep plan..."
                            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl p-4 text-white focus:border-brand-magenta outline-none h-40 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleCreateCrashTask}
                        disabled={!selectedSubject || !examDate}
                        className="w-full bg-brand-magenta text-white py-5 rounded-xl font-black text-lg shadow-lg hover:bg-pink-600 transition-all disabled:opacity-50"
                    >
                        CONFIRM CRASH MISSION
                    </button>
                </div>
            </Sidebar>
        </div>
    );
};

export default CrashTasksPage;
