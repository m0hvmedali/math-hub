import React, { useState, useEffect, useCallback } from 'react';
import { calendar } from '../services/platform-sdk/calendar';
import { auth } from '../services/platform-sdk/auth';
import { generateText } from '../services/ai-router';
import { ClockIcon, SparkleIcon, GoogleIcon, PlusIcon, RefreshIcon, CheckCircleIcon, XIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    colorId?: string;
}

const SchedulePage: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState<string | null>(null);
    const [proposedActions, setProposedActions] = useState<any[]>([]);
    const [isApplying, setIsApplying] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    // Add Event State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ summary: '', start: '', end: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);
            endOfWeek.setHours(23, 59, 59, 999);

            const data = await calendar.getEventsByRange(startOfWeek.toISOString(), endOfWeek.toISOString());
            if (data.items) {
                setEvents(data.items);
                setIsConnected(true);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleOptimize = async () => {
        if (events.length === 0) return;
        setIsOptimizing(true);
        setOptimizationResult(null);
        setProposedActions([]);

        // Filter events for today and tomorrow only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);

        const targetEvents = events.filter(e => {
            const date = new Date(e.start.dateTime || e.start.date || '');
            return date >= today && date < dayAfterTomorrow;
        });

        const eventData = targetEvents.map(e => ({
            id: e.id,
            title: e.summary,
            start: e.start.dateTime || e.start.date,
            end: e.end.dateTime || e.end.date,
            desc: e.description
        }));

        const prompt = `
            أنا طالب وهذه هي مواعيدي في تقويم جوجل لليوم وغداً فقط:
            ${JSON.stringify(eventData)}

            قم بتحليل هذا الجدول وتقديم اقتراحات لتحسينه (إضافة فترات دراسة, تعديل أوقات, حذف فراغات غير مفيدة).
            استجب **فقط** بصيغة JSON متوافقة تماماً مع هذا الهيكل:
            {
               "message": "نص التوجيه والتحفيز هنا بكل المودة كرفيق وملاح...",
               "actions": [
                   { "type": "add", "summary": "دراسة عميقة", "start": "2026-03-20T10:00:00Z", "end": "2026-03-20T11:00:00Z", "description": "وصف مقترح" },
                   { "type": "update", "eventId": "id_here", "updates": { "summary": "اسم جديد", "start": { "dateTime": "..." }, "end": { "dateTime": "..." } } },
                   { "type": "delete", "eventId": "id_here" }
               ]
            }
        `;

        try {
            const suggestion = await generateText(prompt, { 
                system: "أنت ملاح أكاديمي خبير. تخرج فقط JSON صحيح 100%. لا تضف أي نص خارج الأقواس المتعرجة {}.",
                task: 'medium_task',
                json: true
            });
            
            // Extract JSON from potential commentary
            const firstBrace = suggestion.indexOf('{');
            const lastBrace = suggestion.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("No JSON object found in response");
            }
            
            let jsonPart = suggestion.substring(firstBrace, lastBrace + 1);
            
            // Fix bad control characters (like literal newlines inside strings)
            jsonPart = jsonPart.replace(/[\u0000-\u001F]+/g, (match) => {
                if (match === '\n') return '\\n';
                if (match === '\r') return '\\r';
                if (match === '\t') return '\\t';
                return '';
            });

            const result = JSON.parse(jsonPart);

            setOptimizationResult(result.message || "اكتمل التحليل بنجاح.");
            setProposedActions(result.actions || []);
        } catch (error: any) {
            console.error("Optimization failed:", error);
            setOptimizationResult(`عذراً، فشل التحليل الفني. (Error: ${error.message})`);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحدث؟')) return;
        try {
            await calendar.deleteEvent(eventId);
            await fetchEvents();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("فشل حذف الحدث.");
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.summary || !newEvent.start || !newEvent.end) return;
        
        setIsSubmitting(true);
        try {
            await calendar.createEvent(
                newEvent.summary,
                new Date(newEvent.start).toISOString(),
                new Date(newEvent.end).toISOString(),
                newEvent.description
            );
            setIsAddModalOpen(false);
            setNewEvent({ summary: '', start: '', end: '', description: '' });
            await fetchEvents();
        } catch (error) {
            console.error("Add failed:", error);
            alert("فشل إضافة الحدث.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApplyActions = async () => {
        setIsApplying(true);
        try {
            for (const action of proposedActions) {
                if (action.type === 'add' && action.summary && action.start && action.end) {
                    await calendar.createEvent(action.summary, action.start, action.end, action.description);
                } else if (action.type === 'update' && action.eventId && action.updates) {
                    await calendar.updateEvent(action.eventId, action.updates);
                } else if (action.type === 'delete' && action.eventId) {
                    await calendar.deleteEvent(action.eventId);
                }
            }
            setProposedActions([]);
            await fetchEvents();
        } catch (error) {
            console.error("Failed to apply actions:", error);
            alert("حدث خطأ أثناء تطبيق التعديلات.");
        } finally {
            setIsApplying(false);
        }
    };

    const handleConnect = async () => {
        try {
            await auth.login();
            fetchEvents();
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getDayName = (isoString?: string) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleDateString('ar-EG', { weekday: 'long' });
    };

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto pb-32 min-h-screen bg-black text-white">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 gap-6">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 flex items-center gap-4 tracking-tighter">
                        <div className="p-3 bg-brand-cyan/20 rounded-2xl border border-brand-cyan/30">
                            <ClockIcon className="w-10 h-10 text-brand-cyan animate-pulse-slow" />
                        </div>
                        Smart Schedule
                    </h1>
                    <p className="text-gray-400 text-xl font-medium max-w-lg">
                        Real-time synchronization with Google Calendar & AI optimization.
                    </p>
                </motion.div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5 text-brand-cyan" />
                        New Event
                    </button>
                    <button
                        onClick={handleOptimize}
                        disabled={isOptimizing || events.length === 0}
                        className="group relative flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-purple to-indigo-600 rounded-2xl font-bold text-lg shadow-glow-purple transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <SparkleIcon className={`w-6 h-6 ${isOptimizing ? 'animate-spin' : ''}`} />
                        {isOptimizing ? 'AI Analyzing...' : 'AI Optimize'}
                    </button>
                    
                    <button
                        onClick={fetchEvents}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                    >
                        <RefreshIcon className={`w-6 h-6 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {!isConnected && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 glass-card rounded-3xl border border-white/5 bg-white/[0.02]">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <GoogleIcon className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Google Calendar Not Linked</h2>
                    <p className="text-gray-400 text-center max-w-md mb-8">
                        Link your Google account to sync your academic calendar and unlock AI scheduling features.
                    </p>
                    <button 
                        onClick={handleConnect}
                        className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform"
                    >
                        Connect Now
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Events Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            Current Week
                            <span className="text-sm font-medium px-3 py-1 bg-brand-cyan/10 text-brand-cyan rounded-full border border-brand-cyan/20">
                                {events.length} Events
                            </span>
                        </h2>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event, idx) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group relative flex items-center gap-6 p-6 glass-card border border-white/5 rounded-2xl hover:border-brand-cyan/30 transition-all hover:bg-white/[0.04]"
                                    >
                                        <div className="flex flex-col items-center min-w-[80px]">
                                            <span className="text-xs font-black uppercase tracking-tighter text-brand-cyan opacity-60">
                                                {formatDate(event.start.dateTime)}
                                            </span>
                                            <div className="w-px h-8 bg-gradient-to-b from-brand-cyan/40 to-transparent my-2" />
                                            <span className="text-[10px] font-medium text-gray-500">
                                                {getDayName(event.start.dateTime || event.start.date)}
                                            </span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-xl font-bold group-hover:text-brand-cyan transition-colors truncate">
                                                    {event.summary}
                                                </h3>
                                                <button 
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete Event"
                                                >
                                                    <XIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-gray-500 line-clamp-1">{event.description}</p>
                                            )}
                                        </div>

                                        <div className="w-2 h-12 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="w-full bg-brand-cyan"
                                                initial={{ height: 0 }}
                                                animate={{ height: '60%' }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}

                                {events.length === 0 && (
                                    <div className="py-20 text-center opacity-40">
                                        <PlusIcon className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-xl font-medium">No events found for this week.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* AI Insights Sidebar */}
                    <div className="space-y-8">
                        <div className="glass-card p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent sticky top-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-brand-purple/20 rounded-lg">
                                    <SparkleIcon className="w-6 h-6 text-brand-purple" />
                                </div>
                                <h2 className="text-2xl font-black">AI Insights</h2>
                            </div>

                            <AnimatePresence mode="wait">
                                {optimizationResult ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed"
                                    >
                                        <div className="text-sm space-y-4 whitespace-pre-wrap font-medium">
                                            {optimizationResult}
                                        </div>
                                        {proposedActions.length > 0 && (
                                            <div className="mt-6 space-y-3">
                                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                                    <SparkleIcon className="w-4 h-4 text-brand-cyan" />
                                                    Proposed Changes
                                                </h4>
                                                {proposedActions.map((action, idx) => (
                                                    <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                                                action.type === 'add' ? 'bg-green-500/20 text-green-400' :
                                                                action.type === 'delete' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                            }`}>
                                                                {action.type}
                                                            </span>
                                                            <span className="text-gray-200 font-medium truncate max-w-[150px] md:max-w-xs text-right dir-rtl">
                                                                {action.summary || (action.updates && action.updates.summary) || 'Event Modification'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                <button
                                                    onClick={handleApplyActions}
                                                    disabled={isApplying}
                                                    className="w-full mt-4 py-3 bg-brand-cyan text-black font-black rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {isApplying ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                                                    {isApplying ? 'Applying Changes...' : 'Approve & Apply Auto Sync'}
                                                </button>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => { setOptimizationResult(null); setProposedActions([]); }}
                                            className="mt-8 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <RefreshIcon className="w-4 h-4" /> Reset Analysis
                                        </button>
                                    </motion.div>
                                ) : isOptimizing ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-12 flex flex-col items-center gap-4 text-center"
                                    >
                                        <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
                                        <p className="text-gray-400 animate-pulse font-medium">
                                            Maneuvering your academic path...
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-12 text-center"
                                    >
                                        <p className="text-gray-500 mb-6 font-medium">
                                            No recent optimization. Click the button above to analyze your schedule.
                                        </p>
                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-brand-purple mb-2">Pro Tip</h4>
                                            <p className="text-[13px] text-gray-400">
                                                Add your lectures and study sessions to Google Calendar first for a more accurate result.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Event Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                            onClick={() => setIsAddModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                        >
                            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Create New Event</h2>
                            <form onSubmit={handleAddEvent} className="space-y-4">
                                <input 
                                    type="text" 
                                    placeholder="Event Title"
                                    value={newEvent.summary}
                                    onChange={e => setNewEvent({...newEvent, summary: e.target.value})}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-brand-cyan/50 transition-all font-bold"
                                    required
                                />
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Start Time</label>
                                        <input 
                                            type="datetime-local" 
                                            value={newEvent.start}
                                            onChange={e => setNewEvent({...newEvent, start: e.target.value})}
                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-brand-cyan/50 transition-all font-bold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">End Time</label>
                                        <input 
                                            type="datetime-local" 
                                            value={newEvent.end}
                                            onChange={e => setNewEvent({...newEvent, end: e.target.value})}
                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-brand-cyan/50 transition-all font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                                <textarea 
                                    placeholder="Description (Optional)"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-brand-cyan/50 transition-all font-bold min-h-[100px]"
                                />
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-brand-cyan text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <PlusIcon className="w-5 h-5" />}
                                    {isSubmitting ? 'Creating...' : 'Create Event'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SchedulePage;