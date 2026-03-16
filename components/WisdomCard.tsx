import React, { useState } from 'react';
import { WisdomItem, WisdomProgress, WisdomType } from '../hooks/useWisdom';
import { SparkleIcon, BookOpenIcon, CheckCircleIcon, RefreshIcon, TrophyIcon } from './Icons';

interface WisdomCardProps {
  item: WisdomItem;
  progress?: WisdomProgress;
  onUpdate: (action: 'understand' | 'repeat' | 'favorite') => Promise<void>;
  variant?: 'compact' | 'hero' | 'overlay' | 'poetry';
}

const WisdomCard: React.FC<WisdomCardProps> = ({ item, progress, onUpdate, variant = 'compact' }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAction = async (action: 'understand' | 'repeat' | 'favorite') => {
    setIsUpdating(true);
    await onUpdate(action);
    setIsUpdating(false);
  };

  const getStatusColor = () => {
    switch (progress?.status) {
      case 'remembered': return 'text-accent-green';
      case 'learning': return 'text-accent-amber';
      default: return 'text-brand-cyan';
    }
  };

  const isPoetry = item.type === 'poetry' || variant === 'poetry';

  const typeConfig: Record<WisdomType, { color: string, bg: string, border: string, iconColor: string }> = {
    quran: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', iconColor: 'text-emerald-500' },
    hadith: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', iconColor: 'text-green-500' },
    scholar_quote: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconColor: 'text-blue-500' },
    poetry: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconColor: 'text-purple-500' },
    general_wisdom: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconColor: 'text-orange-500' },
  };

  const config = typeConfig[item.type] || typeConfig.general_wisdom;

  if (variant === 'overlay') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-5xl mx-auto transition-all duration-700">
        <div className={`mb-10 p-5 ${config.bg} rounded-full animate-smooth-float border ${config.border} shadow-2xl backdrop-blur-xl`}>
          <SparkleIcon className={`w-14 h-14 ${config.iconColor}`} />
        </div>
        
        <div className="space-y-10 mb-14">
          <h3 className={`text-4xl md:text-6xl font-black text-white leading-tight dir-rtl animate-fade-in-up ${isPoetry ? 'italic font-serif' : ''}`}>
            "{item.text}"
          </h3>
          {item.metadata?.text_en && (
            <p className="text-xl md:text-3xl text-gray-400/80 italic font-medium max-w-4xl mx-auto animate-fade-in-up [animation-delay:400ms]">
              {item.metadata.text_en}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-6 mb-16 animate-fade-in-up [animation-delay:800ms]">
          <div className={`flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] ${config.color} px-8 py-3.5 ${config.bg} rounded-full border ${config.border} backdrop-blur-md`}>
            <BookOpenIcon className="w-6 h-6" />
            <span>{item.source} {item.metadata?.chapter_name_en ? `• ${item.metadata.chapter_name_en}` : ''}</span>
          </div>
          <div className="text-lg text-gray-500 font-black uppercase tracking-[0.4em] mt-2 opacity-60">
            {item.author ? `— ${item.author}` : '— Unknown'}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 animate-fade-in-up [animation-delay:1200ms]">
          <button
            onClick={() => handleAction('understand')}
            disabled={isUpdating}
            className={`px-12 py-6 ${item.type === 'poetry' ? 'bg-purple-600' : 'bg-emerald-600'} rounded-[2rem] text-white font-black text-2xl hover:scale-105 transition-all shadow-2xl flex items-center gap-4 disabled:opacity-50`}
          >
            <CheckCircleIcon className="w-8 h-8" />
            {item.type === 'poetry' ? 'تذوق المعنى' : 'فهمت المعنى'}
          </button>
          <button
            onClick={() => handleAction('repeat')}
            disabled={isUpdating}
            className="px-12 py-6 bg-white/5 border-2 border-white/10 rounded-[2rem] text-white font-black text-2xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-4 disabled:opacity-50 backdrop-blur-xl"
          >
            <RefreshIcon className="w-8 h-8" />
            لاحقاً (Later)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-10 !rounded-[2.5rem] relative overflow-hidden group transition-all duration-500 border-2 ${config.border} ${item.is_golden ? 'shadow-[0_0_50px_rgba(251,191,36,0.1)]' : ''}`}>
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-20 group-hover:opacity-40 transition-opacity`} />
      
      {/* Progress Badge */}
      <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
         {item.is_golden && <span className="text-[10px] font-black text-accent-amber uppercase tracking-widest bg-accent-amber/20 px-3 py-1 rounded-full border border-accent-amber/30 shadow-lg">GOLDEN ⭐</span>}
         <span className={`text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/5 border border-white/10 ${getStatusColor()}`}>
           {progress?.status || 'new'}
         </span>
      </div>

      <div className="relative z-10 mb-8">
        <div className={`text-xs font-black ${config.color} uppercase tracking-[0.3em] mb-6 flex items-center gap-3`}>
          <div className={`w-8 h-[2px] ${config.iconColor} opacity-50`}></div>
          {item.type.toUpperCase().replace('_', ' ')} • {item.category}
        </div>
        <p className={`text-2xl md:text-4xl font-black text-white dir-rtl leading-[1.6] mb-8 group-hover:text-brand-cyan transition-colors transform group-hover:translate-x-2 duration-700 ${isPoetry ? 'italic font-serif' : ''}`}>
          "{item.text}"
        </p>
        {item.metadata?.text_en && (
            <p className="text-lg text-gray-400/80 italic font-medium max-w-2xl animate-fade-in [animation-delay:200ms]">
                {item.metadata.text_en}
            </p>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/10">
        <div className="text-[11px] text-gray-500 font-black uppercase tracking-[0.2em] opacity-60">
          {item.source} {item.author ? `• ${item.author}` : ''}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleAction('favorite')}
            className={`p-3 rounded-2xl transition-all ${progress?.is_favorite ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
          >
            <svg className="w-6 h-6" fill={progress?.is_favorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => handleAction('understand')}
            disabled={isUpdating}
            className={`px-8 py-4 ${config.bg} ${config.color} text-sm font-black uppercase rounded-2xl hover:brightness-125 transition-all disabled:opacity-50 border ${config.border}`}
          >
            {item.type === 'poetry' ? 'Tasted' : 'Gained'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WisdomCard;
