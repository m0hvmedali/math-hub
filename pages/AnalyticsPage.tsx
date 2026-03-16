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

            {/* Deep Activity Insights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-black/40">
                    <div className="text-[10px] font-black text-brand-cyan uppercase tracking-widest mb-2">Total Clicks</div>
                    <p className="text-3xl font-black text-white">{analyticsService.getInteractions().clicks}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-black/40">
                    <div className="text-[10px] font-black text-brand-magenta uppercase tracking-widest mb-2">Keypresses</div>
                    <p className="text-3xl font-black text-white">{analyticsService.getInteractions().keypresses}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-black/40">
                    <div className="text-[10px] font-black text-accent-green uppercase tracking-widest mb-2">Active Minutes</div>
                    <p className="text-3xl font-black text-white">
                        {history.filter(h => h.action === 'session_heartbeat').length}
                    </p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-black/40">
                    <div className="text-[10px] font-black text-accent-beige uppercase tracking-widest mb-2">Unique Pages</div>
                    <p className="text-3xl font-black text-white">
                        {new Set(history.filter(h => h.action === 'page_view').map(h => h.args[0])).size}
                    </p>
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
                        {history.map((event, i) => {
                            const isSystem = event.id === 'System';
                            const isHeatbeat = event.action === 'session_heartbeat';
                            if (isHeatbeat && !isAdmin) return null; // Hide heartbeats from non-admins in log

                            return (
                                <div key={i} className={`glass-card p-4 rounded-xl border flex justify-between items-center group hover:bg-white/5 transition-all ${isSystem ? 'border-white/5 opacity-60' : 'border-brand-cyan/20'}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${isSystem ? 'bg-white/10 text-white/40' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
                                                {event.id}
                                            </span>
                                            <h4 className="text-white font-bold text-sm">{event.action}</h4>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[10px] text-accent-beige/40">
                                                {new Date(event.timestamp).toLocaleTimeString()}
                                            </p>
                                            {event.args.length > 0 && typeof event.args[0] === 'string' && (
                                                <p className="text-[10px] text-brand-cyan font-mono truncate max-w-[150px]">{event.args[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-white/10 group-hover:text-white/40 font-mono text-[10px]">
                                        #{history.length - i}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Interaction Breakdown */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TimelineIcon className="w-6 h-6 text-brand-magenta" />
                        User Flow Analysis
                    </h2>
                    <div className="glass-card p-8 rounded-3xl border border-[var(--glass-border)] h-[500px] overflow-y-auto custom-scrollbar">
                        <h3 className="text-white font-bold mb-6 flex justify-between">
                            <span>Movement Density</span>
                            <span className="text-brand-magenta">Live Radar</span>
                        </h3>
                        <div className="space-y-6">
                            {Object.entries(stats).sort((a,b) => b[1] - a[1]).slice(0, 8).map(([action, count]) => (
                                <div key={action} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-accent-beige/60">{action}</span>
                                        <span className="text-white">{count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-brand-cyan shadow-glow-brand transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (count / history.length) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {history.length < 10 && (
                            <p className="text-center text-accent-beige/20 text-xs mt-12 italic">More data required for deep pattern recognition...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;