import React, { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { HomeIcon, GlobeIcon, BeakerIcon, ClockIcon, SparkleIcon, TrendingUpIcon, SearchHistoryIcon, SettingsIcon } from './Icons';
import { useThemeEngine } from '../hooks/useThemeEngine';
import ThemeStatusBadge from './ThemeStatusBadge';

const Navigation: React.FC = () => {
    const location = useLocation();
    const { language, user, setIsAssistantOpen, setIsSearchOpen } = useContext(AppContext);
    const [themeEnabled, setThemeEnabled] = useState(() => localStorage.getItem('theme_engine') === 'on');

    const { phase: livePhase } = useThemeEngine({ enabled: themeEnabled });

    const toggleTheme = () => {
        const next = !themeEnabled;
        setThemeEnabled(next);
        localStorage.setItem('theme_engine', next ? 'on' : 'off');
    };

    if (!user) return null;

    const tabs = [
        { id: 'dashboard', label: language === 'ar' ? 'الرئيسية' : 'Home', path: '/', icon: HomeIcon },
        { id: 'curriculum', label: language === 'ar' ? 'المواد' : 'Materials', path: '/curriculum', icon: GlobeIcon },
        { id: 'labs', label: language === 'ar' ? 'المعامل' : 'Labs', path: '/labs', icon: BeakerIcon },
        { id: 'schedule', label: language === 'ar' ? 'الجدول' : 'Schedule', path: '/schedule', icon: ClockIcon },
        { id: 'timer', label: language === 'ar' ? 'المؤقت' : 'Timer', path: '/timer', icon: ClockIcon },
        { id: 'wisdom', label: language === 'ar' ? 'المكتبة' : 'Wisdom', path: '/wisdom', icon: SparkleIcon },
        { id: 'analysis', label: language === 'ar' ? 'التحليلات' : 'Analysis', path: '/daily-analysis', icon: TrendingUpIcon },
    ];

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-2xl border-b border-white/5 px-6 md:px-12 py-3.5 flex items-center justify-between shadow-2xl animate-fade-in group/nav">
            <div className="flex items-center gap-12 lg:gap-16">
                {/* Brand Logo - Premium Upgrade */}
                <NavLink to="/" className="flex items-center gap-3.5 cursor-pointer group/logo">
                    <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shadow-glow-brand transition-all duration-500 group-hover/logo:rotate-[10deg] group-hover/logo:scale-110 overflow-hidden border border-white/10">
                        <img src="/media/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black text-xl tracking-tighter leading-none font-almarai">
                            Math<span className="text-brand-cyan">Hub</span>
                        </span>
                        <span className="text-[8px] font-black text-brand-cyan uppercase tracking-[0.4em] opacity-60 group-hover/logo:opacity-100 transition-opacity">Intelligence</span>
                    </div>
                </NavLink>

                {/* Main Navigation Links */}
                <div className="hidden lg:flex items-center gap-10">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
                        return (
                            <NavLink
                                key={tab.id}
                                to={tab.path}
                                className={`relative text-xs font-black uppercase tracking-widest transition-all py-2 group/link ${isActive ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <span className="relative z-10">{tab.label}</span>
                                {isActive ? (
                                    <span className="absolute -bottom-3.5 left-0 w-full h-[2.5px] bg-brand-cyan rounded-full shadow-glow-brand animate-fade-in" />
                                ) : (
                                    <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-0 h-[2.5px] bg-white/20 rounded-full transition-all group-hover/link:w-full" />
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-8">
                <div className="hidden md:block scale-90">
                    <ThemeStatusBadge phase={livePhase} enabled={themeEnabled} onToggle={toggleTheme} />
                </div>

                {/* Command Library Trigger */}
                <button 
                  onClick={() => setIsAssistantOpen(true)}
                  className="text-gray-500 hover:text-brand-cyan transition-all transform hover:scale-110 active:scale-90"
                  title={language === 'ar' ? 'مكتبة الأوامر (Ctrl+K)' : 'Command Library (Ctrl+K)'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>

                {/* Search Trigger */}
                <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="text-gray-500 hover:text-white transition-all transform hover:scale-110 active:scale-90"
                    title={language === 'ar' ? 'بحث شامل' : 'Global Search'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>

                {/* Account Ring */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all p-[2px] cursor-pointer hover:shadow-glow-brand active:scale-95 ${isMenuOpen ? 'border-brand-cyan shadow-glow-brand ring-4 ring-brand-cyan/10' : 'border-white/10 hover:border-white/30'}`}
                    >
                        <div className="w-full h-full bg-space-900 rounded-xl overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}&backgroundColor=0A0A0A`} alt="User" className="w-full h-full object-cover" />
                        </div>
                    </button>

                    {/* Enhanced Dropdown */}
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-6 bg-[#0A0A0A]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.8)] z-[9999] flex flex-col items-center p-4 gap-4 animate-scale-in origin-top-right border-brand-cyan/20">
                                
                                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-4">{language === 'ar' ? 'لوحة التحكم' : 'Control Lab'}</div>

                                {[
                                    { to: '/profile', icon: <TrendingUpIcon className="w-5 h-5 text-brand-cyan" />, label: language === 'ar' ? 'التحليلات والرادار' : 'Analytics & Radar' },
                                    { to: '/timer', icon: <ClockIcon className="w-5 h-5 text-brand-secondary" />, label: language === 'ar' ? 'مؤقت التركيز' : 'Focus Timer' },
                                    { to: '/notes', icon: <span className="text-lg">📝</span>, label: language === 'ar' ? 'الملاحظات السريعة' : 'Quick Notes' },
                                    { to: '/explain', icon: <SparkleIcon className="w-5 h-5 text-brand-magenta" />, label: language === 'ar' ? 'البروفيسور AI' : 'Professor AI' },
                                    { to: '/daily-analysis', icon: <span className="text-lg">❖</span>, label: language === 'ar' ? 'التحليل اليومي' : 'Daily Analysis' },
                                    { to: '/search-history', icon: <SearchHistoryIcon className="w-5 h-5 text-gray-400" />, label: language === 'ar' ? 'سجل البحث' : 'Search History' },
                                    { type: 'divider' },
                                    { to: '/settings', icon: <SettingsIcon className="w-5 h-5 text-gray-400" />, label: language === 'ar' ? 'الإعدادات' : 'Settings' },
                                    { isButton: true, icon: <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, label: language === 'ar' ? 'خروج' : 'Logout' }
                                ].map((item, index) => {
                                    if (item.type === 'divider') {
                                        return <div key={index} className="w-12 h-px bg-white/5 my-2" />;
                                    }

                                    const innerContent = (
                                        <div className="relative group/item flex items-center justify-center w-14 h-14 rounded-2xl hover:bg-white/10 transition-all cursor-pointer hover:border border-white/10">
                                            {item.icon}
                                            <div className={`absolute top-1/2 -translate-y-1/2 px-4 py-2 bg-black border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/item:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[10000] ${language === 'ar' ? 'right-full mr-6' : 'right-full mr-6'}`}>
                                                {item.label}
                                            </div>
                                        </div>
                                    );

                                    if (item.isButton) {
                                        return (
                                            <button key={index} onClick={() => { localStorage.removeItem('study_user'); window.location.href = '/'; }} className="focus:outline-none">
                                                {innerContent}
                                            </button>
                                        );
                                    }

                                    return (
                                        <NavLink key={index} to={item.to!} onClick={() => setIsMenuOpen(false)} className="focus:outline-none">
                                            {innerContent}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;