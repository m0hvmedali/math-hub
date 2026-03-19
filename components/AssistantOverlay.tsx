import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../App';
import { assistant } from '../utils/HubCore';
import { CommandIcon, SearchIcon, ActivityIcon, SparkleIcon } from './Icons';
import { generateText } from '../services/ai-router';

interface AssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const AssistantOverlay: React.FC<AssistantOverlayProps> = ({ isOpen, onClose }) => {
  const { language } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const allCommands = assistant.getAvailableCommands();
  const filteredCommands = allCommands.filter(cmd => 
    cmd.id.toLowerCase().includes(query.toLowerCase()) || 
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        assistant.runCommand(selected.id);
        onClose();
      } else if (query.trim()) {
        handleAiBrain();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleAiBrain = async () => {
    if (!query.trim() || isAiThinking) return;
    setIsAiThinking(true);
    try {
        await assistant.performBrainAction(query, generateText);
        onClose();
    } catch (err) {
        console.error("AI Brain error", err);
    } finally {
        setIsAiThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300"
        onKeyDown={handleKeyDown}
      >
        {/* Header/Input */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <SearchIcon className="w-6 h-6 text-brand-cyan" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or macro (e.g., 'study', 'stop')..."
            className="flex-1 bg-transparent border-none outline-none text-xl text-white placeholder-white/20"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
          />
          <div className="bg-white/5 px-2 py-1 rounded border border-white/10 text-[10px] font-mono text-white/40">ESC TO CLOSE</div>
        </div>

        {/* Results */}
        <div className="px-6 py-2 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                {query ? 'Search Results' : 'Command Library'}
            </span>
            <span className="text-[10px] text-white/20">{filteredCommands.length} Commands Available</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, i) => (
              // ... existing mapping ...
              <div
                key={cmd.id}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                  i === selectedIndex ? 'bg-brand-cyan/20 border-brand-cyan/30 scale-[1.02]' : 'hover:bg-white/5 border-transparent'
                } border`}
                onClick={() => {
                  assistant.runCommand(cmd.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className={`p-3 rounded-xl ${i === selectedIndex ? 'bg-brand-cyan text-black' : 'bg-white/5 text-white/40'}`}>
                  {cmd.id.startsWith('macro') ? <ActivityIcon className="w-5 h-5" /> : <CommandIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold">{cmd.id}</h4>
                  <p className="text-sm text-accent-beige/40">{cmd.description}</p>
                </div>
                {i === selectedIndex && (
                  <div className="text-[10px] font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded">ENTER TO RUN</div>
                )}
              </div>
            ))
          ) : query.trim() ? (
            <div 
                className="p-8 group/ai cursor-pointer hover:bg-brand-cyan/5 transition-all rounded-3xl border border-dashed border-white/10 hover:border-brand-cyan/30 mx-4 my-2"
                onClick={handleAiBrain}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-xl shadow-glow-brand ${isAiThinking ? 'animate-pulse' : 'group-hover/ai:rotate-12 transition-transform'}`}>
                    {isAiThinking ? '🧠' : <SparkleIcon className="w-6 h-6 text-white" />}
                </div>
                <div className="text-left">
                    <h4 className="text-white font-black text-lg">{isAiThinking ? (language === 'ar' ? 'جاري التفكير...' : 'Brain is active...') : (language === 'ar' ? 'اسأل الذكاء الاصطناعي' : 'Ask AI Brain')}</h4>
                    <p className="text-sm text-gray-500 mt-1">"{query}"</p>
                </div>
                <div className="ml-auto bg-brand-cyan/10 text-brand-cyan px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-cyan/20">
                    Press Enter to interpret
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-accent-beige/40">
              <p>No commands matched your query</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 flex justify-between items-center px-6">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">↑↓</span>
                <span className="text-[10px] text-white/40">Navigate</span>
             </div>
             <div className="flex items-center gap-1">
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">↵</span>
                <span className="text-[10px] text-white/40">Execute</span>
             </div>
          </div>
          <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest">Math Hub Assistant v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default AssistantOverlay;
