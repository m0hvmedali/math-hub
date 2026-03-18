import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { supabase } from '../supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrophyIcon, ClockIcon, SparkleIcon, TrendingUpIcon } from '../components/Icons';
import { calculateLevel } from '../utils/statsManager';

const AnalysisPage: React.FC = () => {
  const { language, user } = useContext(AppContext);
  const [stats, setStats] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalProposed: 0,
    completedSessions: 0,
    streak: 5, // Mocked for now
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !supabase) return;
      const { data } = await supabase
        .from('study_stats')
        .select('*')
        .eq('user_id', user)
        .order('date', { ascending: true });
      
      if (data) {
        setStats(data);
        const total = data.reduce((acc, curr) => acc + curr.total_study_minutes, 0);
        const completed = data.reduce((acc, curr) => acc + curr.sessions_completed, 0);
        setSummary(prev => ({ ...prev, totalProposed: total, completedSessions: completed }));
      }
    };
    fetchStats();
  }, [user]);

  const studyLevel = calculateLevel(summary.totalProposed);

  return (
    <div className="p-6 md:p-16 max-w-[1400px] mx-auto min-h-screen animate-cinematic">
      <header className="mb-12">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
          {language === 'ar' ? 'تحليل النبض الدراسي' : 'Neural Analytics Central'}<span className="text-[var(--primary-color)]">.</span>
        </h1>
        <p className="text-gray-500 font-bold mt-4 uppercase tracking-widest text-xs">
          Real-time cognitive performance monitoring
        </p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-8 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
            <TrendingUpIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-white">{summary.streak}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Day Streak</div>
        </div>
        <div className="glass-card p-8 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)]/10 flex items-center justify-center mb-4">
            <ClockIcon className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div className="text-3xl font-black text-white">{Math.floor(summary.totalProposed / 60)}h {summary.totalProposed % 60}m</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Study Time</div>
        </div>
        <div className="glass-card p-8 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--secondary-color)]/10 flex items-center justify-center mb-4">
            <TrophyIcon className="w-5 h-5 text-[var(--secondary-color)]" />
          </div>
          <div className="text-3xl font-black text-white">{summary.completedSessions}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Cycles Completed</div>
        </div>
        <div className="glass-card p-8 space-y-2 border-2 border-[var(--primary-color)]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary-color)] opacity-5 blur-3xl rounded-full" />
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
            <SparkleIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-end gap-2">
            <div className="text-4xl font-black text-white">LVL {studyLevel.level}</div>
            <div className="text-xs font-bold text-gray-500 mb-1">({studyLevel.currentXP}/{studyLevel.nextLevelXP} XP)</div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Cognitive Rank</div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] rounded-full transition-all duration-1000 shadow-[0_0_10px_var(--primary-color)]" 
              style={{ width: `${studyLevel.progress}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-8 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Weekly Performance</h3>
            <div className="flex gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--primary-color)]" />
                    <span className="text-[10px] font-bold text-gray-500">Study</span>
                </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats}>
                <defs>
                  <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_study_minutes" 
                  stroke="var(--primary-color)" 
                  fillOpacity={1} 
                  fill="url(#colorStudy)" 
                  strokeWidth={4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)] opacity-10 blur-[60px] rounded-full" />
            <div className="flex items-center gap-3 mb-6">
              <SparkleIcon className="w-5 h-5 text-[var(--accent-color)]" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">AI Neural Insight</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed font-bold italic">
              "Your concentration peaks between 10 AM and 12 PM. We suggest scheduling your hardest topics during this window. You've increased your total study time by 12% this week compared to the last."
            </p>
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-600 uppercase">Analysis Confidence</span>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black">98% Match</span>
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Cycle Breakdown</h3>
            <div className="space-y-6">
              {[
                { label: 'Deep Focus', value: 85, color: '#3B82F6' },
                { label: 'Creative State', value: 12, color: '#f59e0b' },
                { label: 'Light Review', value: 3, color: '#10b981' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</span>
                    <span className="text-[10px] font-black text-white">{item.value}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${item.value}%`, backgroundColor: item.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
