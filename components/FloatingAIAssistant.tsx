import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import GeminiChatWidget from './GeminiChatWidget';
import { SparkleIcon } from './Icons';

const FloatingAIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Always show everywhere per user request
    const isAcademicPage = true;

    return (
        <>
            {/* The Floating Bubble */}
            <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3 group">
                {/* Tooltip on Hover */}
                <div className="px-4 py-2 bg-black/80 backdrop-blur-md border border-brand-purple/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-white opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none shadow-glow-purple">
                    Academic Assistant
                </div>
                
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-2xl flex items-center justify-center shadow-glow-purple hover:scale-110 transition-all active:scale-95 border border-white/20 relative overflow-hidden group/btn"
                >
                    {/* Animated Glow Core */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] animate-pulse" />
                    <SparkleIcon className="w-7 h-7 text-white relative z-10 group-hover/btn:rotate-12 transition-transform" />
                    
                    {/* Scanning Border Animation */}
                    <div className="absolute inset-0 border-2 border-white/30 rounded-2xl animate-ping opacity-20" />
                </button>
            </div>

            {/* The Gemini Chat Widget */}
            {isOpen && (
                <GeminiChatWidget 
                    onClose={() => setIsOpen(false)} 
                    // Optional: extract context from URL or state to pass to Gemini
                />
            )}
        </>
    );
};

export default FloatingAIAssistant;
