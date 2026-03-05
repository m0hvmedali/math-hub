import React, { useContext } from 'react';
import { AppContext } from '../App';
import { TimelineIcon } from '../components/Icons';

const AnalyticsPage: React.FC = () => {
    // Fixed: Removed isAdmin from context destructuring as it doesn't exist
    const { user } = useContext(AppContext);

    // Derived isAdmin logic
    const isAdmin = user === '8128' || user === 'Mohamed';

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="glass-card border border-[var(--glass-border)] rounded-3xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-accent-green to-brand-cyan rounded-full flex items-center justify-center text-4xl shadow-lg">
                        {user === 'Mohamed' ? '👨‍💻' : '👩‍🎓'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white">{user}</h1>
                        <p className="text-accent-green font-bold uppercase tracking-widest text-sm">{isAdmin ? 'System Administrator' : 'Elite Student'}</p>
                        <p className="text-accent-beige/60 mt-2">"Discipline exceeds motivation."</p>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <TimelineIcon className="w-6 h-6 text-brand-magenta" />
                Your Timeline
            </h2>

            <div className="space-y-6 border-l-2 border-[var(--glass-border)] ml-4 pl-8 relative">
                <div className="absolute top-0 left-[-5px] w-2 h-2 bg-brand-magenta rounded-full"></div>

                {/* Static Timeline for Visuals based on user request context */}
                <div className="relative">
                    <span className="absolute -left-[41px] bg-transparent text-accent-beige/50 text-xs font-mono py-1">NOW</span>
                    <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)]">
                        <h3 className="text-white font-bold text-lg">Current Sprint</h3>
                        <p className="text-accent-beige/70 mt-1">Focusing heavily on Physics Chapter 3 and Arabic Grammar Units 2 & 4.</p>
                    </div>
                </div>

                <div className="relative opacity-50">
                    <span className="absolute -left-[41px] bg-transparent text-accent-beige/50 text-xs font-mono py-1">PAST</span>
                    <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)]">
                        <h3 className="text-white font-bold text-lg">Study Hub initialized</h3>
                        <p className="text-accent-beige/70 mt-1">System setup complete. Master plan loaded.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;