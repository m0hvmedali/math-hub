import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { HomeIcon, GlobeIcon, BeakerIcon, ClockIcon, SparkleIcon, TrendingUpIcon } from './Icons';

const Navigation: React.FC = () => {
    const location = useLocation();
    const { language, user } = useContext(AppContext);

    if (!user) return null;

    const tabs = [
        { id: 'dashboard', label: language === 'ar' ? 'الرئيسية' : 'Home', path: '/', icon: HomeIcon },
        { id: 'space', label: language === 'ar' ? 'الفضاء' : 'Space', path: '/space', icon: GlobeIcon },
        { id: 'labs', label: language === 'ar' ? 'المعامل' : 'Labs', path: '/labs', icon: BeakerIcon },
        { id: 'schedule', label: language === 'ar' ? 'الجدول' : 'Schedule', path: '/schedule', icon: ClockIcon },
        { id: 'crash', label: language === 'ar' ? 'المهام' : 'Urgent', path: '/crash', icon: SparkleIcon },
    ];

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Close menu when clicking outside (simple implementation with a backdrop)
    return (
        <nav className="sticky top-0 z-50 w-full bg-[#000000]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between shadow-2xl transition-all">
            <div className="flex items-center gap-8 md:gap-12">
                {/* Brand Logo */}
                <NavLink to="/" className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-8 h-8 rounded bg-ott-gradient flex items-center justify-center shadow-glow-brand transform group-hover:scale-105 transition-all">
                        <span className="text-white font-black text-xl leading-none">M</span>
                    </div>
                    <span className="text-white font-black text-xl tracking-wide hidden sm:block">
                        Madrasetna <span className="text-transparent bg-clip-text text-gradient-ott">Plus</span>
                    </span>
                </NavLink>

                {/* Main Links */}
                <div className="hidden md:flex items-center gap-8">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
                        return (
                            <NavLink
                                key={tab.id}
                                to={tab.path}
                                className={`relative text-base font-bold transition-colors py-1 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {tab.label}
                                {isActive && (
                                    <span className="absolute -bottom-5 left-0 w-full h-[3px] bg-ott-gradient rounded-t-full shadow-glow-brand"></span>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-6 relative">
                {/* Notifications / Secondary action */}
                <button className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 rounded overflow-hidden border-2 border-transparent bg-gradient-to-r from-brand-cyan to-brand-purple p-[2px] cursor-pointer hover:shadow-glow-brand transition-shadow focus:outline-none"
                    >
                        <div className="w-full h-full bg-black rounded-sm overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}&backgroundColor=121212`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </button>

                    {/* Dropdown Menu / Floating Icon Bar */}
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-6 bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-[9999] flex flex-col items-center p-3 gap-4 animate-fade-in origin-top-right">
                                
                                {/* Item Component */}
                                {[
                                    { to: '/profile', icon: <TrendingUpIcon className="w-5 h-5 text-brand-cyan" />, label: language === 'ar' ? 'التحليلات والرادار' : 'Analytics & Radar' },
                                    { to: '/timer', icon: <ClockIcon className="w-5 h-5 text-brand-magenta" />, label: language === 'ar' ? 'مؤقت التركيز والألعاب' : 'Focus Timer & Games' },
                                    { to: '/explain', icon: <SparkleIcon className="w-5 h-5 text-yellow-500" />, label: language === 'ar' ? 'البروفيسور AI' : 'Professor AI' },
                                    { to: '/wishes', icon: <span className="w-5 h-5 text-pink-500 font-black text-center leading-none text-lg">★</span>, label: language === 'ar' ? 'الأمنيات والأحلام' : 'Wishes & Dreams' },
                                    { to: '/daily-analysis', icon: <span className="w-5 h-5 text-emerald-500 font-black text-center leading-none text-lg">❖</span>, label: language === 'ar' ? 'التحليل اليومي' : 'Daily Analysis' },
                                    { to: '/venting', icon: <span className="w-5 h-5 text-orange-400 font-black text-center leading-none text-lg">♨</span>, label: language === 'ar' ? 'غرفة التفريغ النفسي' : 'Venting Room' },
                                    { type: 'divider' },
                                    { to: '/settings', icon: <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: language === 'ar' ? 'الإعدادات' : 'Settings' },
                                    { isButton: true, icon: <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, label: language === 'ar' ? 'تسجيل الخروج' : 'Logout' }
                                ].map((item, index) => {
                                    if (item.type === 'divider') {
                                        return <div key={index} className="w-8 h-px bg-white/10 my-1 rounded-full"></div>;
                                    }

                                    const innerContent = (
                                        <div className="relative group flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-all cursor-pointer">
                                            {item.icon}
                                            {/* Tooltip */}
                                            <div className={`absolute top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-cyan/20 backdrop-blur border border-brand-cyan/30 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[10000] ${language === 'ar' ? 'right-full mr-4' : 'right-full mr-4'}`}>
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