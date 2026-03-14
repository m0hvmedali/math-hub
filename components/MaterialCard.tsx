import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRightIcon } from './Icons';

interface MaterialCardProps {
    id: string;
    title: string;
    subtitle: string;
    link: string;
    imageUrl?: string;
    badgeText?: string;
    progress?: number;
    instructor?: string;
    subItems?: { id: string, name: string }[];
}

const MaterialCard: React.FC<MaterialCardProps> = ({ 
    id, 
    title, 
    subtitle, 
    link, 
    imageUrl, 
    badgeText, 
    progress,
    instructor,
    subItems
}) => {
    return (
        <NavLink
            to={link}
            className="group relative flex flex-col md:flex-row items-center gap-8 bg-[#0A0D14] border-2 border-white/5 p-8 rounded-[2.5rem] transition-all duration-500 hover:border-brand-cyan/30 hover:bg-[#0F141F] hover:shadow-glow-brand"
        >
            {/* Left/Top: Image or Icon Area */}
            <div className="relative w-full md:w-60 h-44 rounded-[1.5rem] overflow-hidden bg-space-900 flex-shrink-0">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-purple/20 to-brand-cyan/5 flex items-center justify-center">
                        <span className="text-6xl font-black text-white/10">{title.charAt(0)}</span>
                    </div>
                )}
                
                {badgeText && (
                    <div className="absolute top-4 right-4 bg-brand-cyan text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                        {badgeText}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Middle: Content Info */}
            <div className="flex-1 space-y-4">
                <h3 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tighter group-hover:text-brand-cyan transition-colors font-almarai">
                    {title}
                </h3>
                
                <div className="flex flex-col gap-1 text-gray-500 text-sm font-bold">
                    <p className="line-clamp-1">{subtitle}</p>
                    {subItems && subItems.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {subItems.slice(0, 3).map(item => (
                                <div key={item.id} className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-gray-800" />
                                    <span className="text-xs">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {instructor && (
                        <div className="flex items-center gap-2 mt-1 py-1 px-3 bg-white/5 rounded-lg w-fit">
                            <span className="text-[10px]">👤</span>
                            <span className="text-[10px] uppercase tracking-widest">{instructor}</span>
                        </div>
                    )}
                </div>

                {progress !== undefined && (
                    <div className="pt-4 max-w-xs">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-cyan/60 mb-2">
                            <span>Mission Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-1000 ease-out shadow-glow-brand" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side: Premium Icon Overlay */}
            <div className="hidden md:flex w-20 h-20 bg-white/5 rounded-3xl items-center justify-center text-brand-magenta/40 group-hover:scale-110 group-hover:text-brand-magenta transition-all">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            </div>
        </NavLink>
    );
};

export default MaterialCard;
