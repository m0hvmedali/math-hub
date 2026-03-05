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
            <div className="flex items-center gap-5">
                <button className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
                <div className="w-10 h-10 rounded overflow-hidden border-2 border-transparent bg-gradient-to-r from-brand-cyan to-brand-purple p-[2px] cursor-pointer hover:shadow-glow-brand transition-shadow">
                    <div className="w-full h-full bg-black rounded-sm overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}&backgroundColor=121212`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;