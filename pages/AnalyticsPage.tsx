import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { TimelineIcon, ActivityIcon, CommandIcon } from '../components/Icons';
import { useHubCore } from '../utils/HubCore';
import { analyticsService, AnalyticsEvent } from '../utils/AnalyticsService';

const AnalyticsPage: React.FC = () => {
    const { user } = useContext(AppContext);
    const [history, setHistory] = useState<AnalyticsEvent[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});

    const isAdmin = user === '8128' || user === 'Mohamed';

    useEffect(() => {
        const updateData = () => {
            setHistory(analyticsService.getHistory().reverse());
            setStats(analyticsService.getActivityStats());
        };
        updateData();
        const interval = setInterval(updateData, 5000); // Pulse update
        return () => clearInterval(interval);
    }, []);

    useHubCore({
      id: 'AnalyticsPage',
      state: { user, isAdmin, eventCount: history.length },
      actions: {
        refresh: () => {
            setHistory(analyticsService.getHistory().reverse());
            setStats(analyticsService.getActivityStats());
        }
      }
    });

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header Profile */}
            <div className="glass-card border border-[var(--glass-border)] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-accent-green to-brand-cyan rounded-full flex items-center justify-center text-4xl shadow-lg border-2 border-white/20">
                        {user === 'Mohamed' ? '👨‍💻' : '👩‍🎓'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white">{user}</h1>
                        <p className="text-accent-green font-bold uppercase tracking-widest text-sm">{isAdmin ? 'System Administrator' : 'Elite Student'}</p>
                        <p className="text-accent-beige/60 mt-2">"Discipline exceeds motivation."</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex items-center gap-3 mb-4">
                        <ActivityIcon className="w-5 h-5 text-accent-green" />
                        <h3 className="text-accent-beige/80 font-bold">Total Operations</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{history.length}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)]">
                    <div className="flex items-center gap-3 mb-4">
                        <CommandIcon className="w-5 h-5 text-brand-cyan" />
                        <h3 className="text-accent-beige/80 font-bold">Top Command</h3>
                    </div>
                    <p className="text-xl font-bold text-white truncate">
                        {Object.entries(stats).sort((a,b) => b[1] - a[1])[0]?.[0] || 'No data yet'}
                    </p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)]">
                    <div className="flex items-center gap-3 mb-4">
                        <TimelineIcon className="w-5 h-5 text-brand-magenta" />
                        <h3 className="text-accent-beige/80 font-bold">Session Health</h3>
                    </div>
                    <p className="text-xl font-bold text-accent-green">Optimal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Live Activity Log */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ActivityIcon className="w-6 h-6 text-accent-green" />
                        Live Hub Events
                    </h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.map((event, i) => (
                            <div key={i} className="glass-card p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-brand-cyan uppercase bg-brand-cyan/10 px-2 py-0.5 rounded">
                                            {event.id}
                                        </span>
                                        <h4 className="text-white font-bold">{event.action}</h4>
                                    </div>
                                    <p className="text-xs text-accent-beige/40 mt-1">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                                <span className="text-white/20 group-hover:text-white/40 font-mono text-xs">
                                    #{history.length - i}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Insights */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TimelineIcon className="w-6 h-6 text-brand-magenta" />
                        System Analysis
                    </h2>
                    <div className="glass-card p-8 rounded-3xl border border-[var(--glass-border)] h-[500px] flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 border-4 border-dashed border-brand-magenta/30 rounded-full animate-spin mb-4"></div>
                        <h3 className="text-white font-bold text-xl">Pattern Recognition</h3>
                        <p className="text-accent-beige/50 max-w-xs mt-2">
                            Gathering more HubCore events to generate deep focus behavioral insights and cycle optimizations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;