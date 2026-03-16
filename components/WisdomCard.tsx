import React, { useState } from 'react';
import { WisdomItem, WisdomProgress } from '../hooks/useWisdom';
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

  if (variant === 'overlay') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-5xl mx-auto animate-cinematic transition-all duration-700">
        <div className="mb-8 p-4 bg-brand-purple/10 rounded-full animate-smooth-float border border-brand-purple/20">
          <SparkleIcon className="w-12 h-12 text-brand-purple" />
        </div>
        
        <div className="space-y-8 mb-12">
          <h3 className={`text-3xl md:text-5xl font-black text-white leading-tight dir-rtl ${isPoetry ? 'italic' : ''}`}>
            "{item.text}"
          </h3>
          {item.metadata?.text_en && (
            <p className="text-xl md:text-2xl text-gray-400 italic font-medium max-w-3xl mx-auto">
              {item.metadata.text_en}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-cyan px-5 py-2.5 bg-brand-cyan/10 rounded-full border border-brand-cyan/20">
            <BookOpenIcon className="w-5 h-5" />
            <span>{item.source} {item.metadata?.chapter_name_en ? `• ${item.metadata.chapter_name_en}` : ''}</span>
          </div>
          <div className="text-sm text-gray-500 font-black uppercase tracking-widest">{item.author}</div>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={() => handleAction('understand')}
            disabled={isUpdating}
            className="px-10 py-5 bg-ott-gradient rounded-2xl text-white font-black text-xl hover:scale-105 transition-all shadow-glow-brand flex items-center gap-3 disabled:opacity-50"
          >
            <CheckCircleIcon className="w-6 h-6" />
            أفهمه (Understand)
          </button>
          <button
            onClick={() => handleAction('repeat')}
            disabled={isUpdating}
            className="px-10 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-black text-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <RefreshIcon className="w-6 h-6" />
            كرر لاحقاً (Repeat)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-6 relative overflow-hidden group ${variant === 'hero' ? 'border-brand-cyan/30' : ''} ${item.is_golden ? 'border-accent-amber/40 shadow-glow-amber' : ''}`}>
      {/* Progress Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
         {item.is_golden && <span className="text-[9px] font-black text-accent-amber uppercase tracking-widest bg-accent-amber/10 px-2 py-0.5 rounded border border-accent-amber/20">Golden ⭐</span>}
         {progress?.status === 'remembered' && <TrophyIcon className="w-5 h-5 text-accent-green" />}
         <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor()}`}>
           {progress?.status || 'new'}
         </span>
      </div>

      <div className="mb-6">
        <div className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <span className="w-6 h-[1px] bg-brand-cyan/30"></span>
          {item.type.toUpperCase().replace('_', ' ')} • {item.category}
        </div>
        <p className={`text-xl md:text-2xl font-black text-white dir-rtl leading-relaxed mb-4 group-hover:text-brand-cyan transition-colors ${isPoetry ? 'italic' : ''}`}>
          {item.text}
        </p>
        {item.metadata?.text_en && (
            <p className="text-sm text-gray-400 line-clamp-3 font-medium">
                {item.metadata.text_en}
            </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="text-[9px] text-gray-500 font-black uppercase tracking-wider line-clamp-1 max-w-[60%]">
          {item.source} {item.author ? `• ${item.author}` : ''}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleAction('favorite')}
            className={`p-2 rounded-lg transition-all ${progress?.is_favorite ? 'bg-accent-red/10 text-accent-red' : 'bg-white/5 text-gray-500 hover:text-white'}`}
          >
            <svg className="w-5 h-5" fill={progress?.is_favorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => handleAction('understand')}
            disabled={isUpdating}
            className="px-4 py-2 bg-brand-cyan text-white text-xs font-black uppercase rounded-lg hover:shadow-glow-cyan transition-all disabled:opacity-50"
          >
            {item.type === 'poetry' ? 'I Appreciate' : 'I Understand'}
          </button>
        </div>
      </div>
      
      {variant === 'hero' && (
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-cyan opacity-5 blur-[80px] rounded-full pointer-events-none group-hover:opacity-10 transition-opacity"></div>
      )}
    </div>
  );
};

export default WisdomCard;
