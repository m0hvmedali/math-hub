import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { TargetIcon, TrophyIcon, SparkleIcon } from './Icons';

interface WisdomStats {
  total: number;
  remembered: number;
  learning: number;
  new: number;
}

const WisdomProgress: React.FC<{ userId: string }> = ({ userId }) => {
  const [stats, setStats] = useState<WisdomStats>({ total: 0, remembered: 0, learning: 0, new: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('user_wisdom_progress')
        .select('status')
        .eq('user_id', userId);

      if (data) {
        const counts = data.reduce((acc: any, curr: any) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});

        // For total, we might want to know the total potential items too
        const { count } = await supabase.from('wisdom_items').select('*', { count: 'exact', head: true });

        setStats({
          total: count || 0,
          remembered: counts.remembered || 0,
          learning: counts.learning || 0,
          new: (count || 0) - (counts.remembered || 0) - (counts.learning || 0)
        });
      }
    };

    fetchStats();
  }, [userId]);

  const percent = stats.total > 0 ? Math.round(((stats.remembered + stats.learning) / stats.total) * 100) : 0;

  return (
    <div className="glass-card p-6 border-brand-purple/20 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-[10px] font-black text-brand-purple uppercase tracking-[0.2em]">Wisdom Progress</h4>
          <div className="text-2xl font-black text-white">{percent}% <span className="text-xs text-gray-500">of Universe Wisdom</span></div>
        </div>
        <div className="p-3 bg-brand-purple/10 rounded-xl">
          <TargetIcon className="w-6 h-6 text-brand-purple" />
        </div>
      </div>

      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-ott-gradient transition-all duration-1000" 
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-lg font-black text-accent-green">{stats.remembered}</div>
          <div className="text-[8px] font-black text-gray-500 uppercase">Remembered</div>
        </div>
        <div className="text-center border-x border-white/5">
          <div className="text-lg font-black text-accent-amber">{stats.learning}</div>
          <div className="text-[8px] font-black text-gray-500 uppercase">Learning</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-gray-400">{stats.new}</div>
          <div className="text-[8px] font-black text-gray-500 uppercase">Remaining</div>
        </div>
      </div>

      <SparkleIcon className="absolute -bottom-2 -left-2 w-12 h-12 opacity-5 text-brand-purple" />
    </div>
  );
};

export default WisdomProgress;
