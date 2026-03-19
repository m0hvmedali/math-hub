import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCcw, 
  Zap, 
  ShieldCheck,
  Search,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { monitor, ProviderStats, AIEvent } from '../services/ai-router/monitor';

const AIMonitorPage: React.FC = () => {
    const [stats, setStats] = useState<ProviderStats[]>(monitor.getStats());
    const [history, setHistory] = useState<AIEvent[]>(monitor.getHistory());
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleUpdate = (data: any) => {
            if (data.stats) setStats(data.stats);
            setHistory(monitor.getHistory());
        };
        monitor.on('update', handleUpdate);
        return () => { monitor.off('update', handleUpdate); };
    }, []);

    const filteredHistory = useMemo(() => {
        return history.filter(h => 
            (!selectedProvider || h.provider === selectedProvider) &&
            (!searchQuery || h.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) || h.response?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [history, selectedProvider, searchQuery]);

    const chartData = useMemo(() => {
        return history.slice(0, 20).reverse().map(h => ({
            time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            latency: h.duration,
            status: h.status === 'success' ? 1 : 0
        }));
    }, [history]);

    return (
        <div className="min-h-screen bg-[#050505] p-6 md:p-12 space-y-10 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-brand-cyan/10 rounded-3xl border border-brand-cyan/20 shadow-glow-cyan">
                        <Activity className="w-8 h-8 text-brand-cyan animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">Neural Watchdog</h1>
                        <p className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" />
                            Active Model Monitoring & Defense
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => monitor.clearHistory()}
                        className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-2xl text-gray-500 hover:text-red-400 transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Wipe Data</span>
                    </button>
                    <button 
                        onClick={() => window.location.reload()}
                        className="p-4 bg-brand-cyan/20 border border-brand-cyan/30 rounded-2xl text-brand-cyan hover:bg-brand-cyan/30 transition-all flex items-center gap-2"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Live Sync</span>
                    </button>
                </div>
            </header>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {stats.map(s => (
                    <div key={s.id} className="glass-card p-6 !rounded-[2.5rem] relative overflow-hidden group border border-white/5 hover:border-brand-cyan/20 transition-all">
                        <div className="absolute top-0 right-0 p-4">
                            {s.status === 'online' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                             s.status === 'degraded' ? <Zap className="w-5 h-5 text-yellow-500 animate-pulse" /> : 
                             <AlertTriangle className="w-5 h-5 text-red-500" />}
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-white font-black text-lg leading-tight">{s.name}</h3>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{s.status.toUpperCase()}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase">Latency</p>
                                    <p className="text-xl font-black text-white">{Math.round(s.avgLatency)}<span className="text-[10px] text-gray-600 ml-1">ms</span></p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase">Uptime</p>
                                    <p className="text-xl font-black text-white">{Math.round(s.successRate)}%</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => monitor.resetProvider(s.id)}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                Reset Stats
                            </button>
                        </div>

                        {/* Background Decoration */}
                        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${s.status === 'online' ? 'from-green-500/50 to-emerald-500/50' : s.status === 'degraded' ? 'from-yellow-500/50 to-orange-500/50' : 'from-red-500/50 to-pink-500/50'}`} />
                    </div>
                ))}
            </div>

            {/* Performance Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 !rounded-[3rem] min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Neural Pulse</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Real-time latency tracking (ms)</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-cyan shadow-glow-cyan" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Latency</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ color: '#00E5FF', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="latency" stroke="#00E5FF" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-8 !rounded-[3rem] space-y-8">
                    <h2 className="text-2xl font-black text-white tracking-tight">Active Defense</h2>
                    <div className="space-y-6">
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                            <ShieldCheck className="w-10 h-10 text-green-400" />
                            <div>
                                <p className="text-white font-bold text-sm">Auto-Recovery Active</p>
                                <p className="text-xs text-gray-500">Circuit breakers engaged for all endpoints.</p>
                            </div>
                        </div>
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                            <RefreshCcw className="w-10 h-10 text-brand-cyan animate-spin-slow" />
                            <div>
                                <p className="text-white font-bold text-sm">Dynamic Fallback</p>
                                <p className="text-xs text-gray-500">Routing traffic to healthiest models.</p>
                            </div>
                        </div>
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4">
                            <Zap className="w-10 h-10 text-yellow-400" />
                            <div>
                                <p className="text-white font-bold text-sm">Heartbeat: Nominal</p>
                                <p className="text-xs text-gray-500">API nodes responding within parameters.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Logs */}
            <div className="glass-card !rounded-[3rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Interaction Logs</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Traceable AI behavior analysis</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-2 border border-white/10">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search prompts..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Provider</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Task</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Latency</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Prompt Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredHistory.map(h => (
                                <tr key={h.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-4 text-xs font-medium text-gray-400">{new Date(h.timestamp).toLocaleTimeString()}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{h.model}</span>
                                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">{h.provider}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-[10px] font-black text-brand-purple uppercase tracking-widest">{h.task}</td>
                                    <td className="px-8 py-4">
                                        <span className={`text-xs font-bold ${h.duration > 3000 ? 'text-yellow-400' : 'text-gray-400'}`}>{h.duration}ms</span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${h.status === 'success' ? 'bg-green-500 shadow-glow-green' : 'bg-red-500 shadow-glow-red bubble-alert'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${h.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>{h.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <p className="text-[11px] text-gray-500 italic line-clamp-1 max-w-sm">"{h.prompt || 'N/A'}"</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AIMonitorPage;
