import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { AICompanionDashboard } from '../components/AICompanionDashboard';

const AIStudyCompanionPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-white px-4 md:px-8 py-8 pb-32">
            {/* Ambient Gradient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-cyan/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-purple/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-cyan/10 rounded-xl border border-brand-cyan/20 animate-pulse">
                            <Sparkles className="w-5 h-5 text-brand-cyan" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-brand-cyan">AI Study Companion</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Neural Tutoring Engine</p>
                        </div>
                    </div>

                    <div className="w-20" /> {/* spacer */}
                </div>

                {/* Main Feature */}
                <AICompanionDashboard />
            </div>
        </div>
    );
};

export default AIStudyCompanionPage;
