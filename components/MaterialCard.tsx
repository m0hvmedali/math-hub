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
}

const MaterialCard: React.FC<MaterialCardProps> = ({ 
    id, 
    title, 
    subtitle, 
    link, 
    imageUrl, 
    badgeText, 
    progress,
    instructor
}) => {
    return (
        <NavLink
            to={link}
            className="group relative flex flex-col bg-cinematic-card border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-brand-cyan/40 hover:shadow-glow-brand"
        >
            {/* Header Image Area */}
            <div className="relative h-48 w-full overflow-hidden bg-space-900">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-purple/20 to-brand-cyan/5 flex items-center justify-center">
                        <span className="text-4xl font-black text-white/10">{title.charAt(0)}</span>
                    </div>
                )}
                
                {/* Status Badge (Top Right) */}
                {badgeText && (
                    <div className="absolute top-4 right-4 bg-brand-cyan text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider z-10 animate-fade-in">
                        {badgeText}
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-black text-white group-hover:text-brand-cyan transition-colors line-clamp-1 font-almarai">
                        {title}
                    </h3>
                </div>
                
                <p className="text-sm text-gray-500 font-bold mb-4 line-clamp-1">{subtitle}</p>
                
                {instructor && (
                    <div className="flex items-center gap-2 mb-6 text-xs text-gray-400 font-medium">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-[10px]">👤</span>
                        </div>
                        {instructor}
                    </div>
                )}

                <div className="mt-auto">
                    {/* Progress Stats */}
                    {progress !== undefined && (
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-gray-400 mb-1.5">
                                <span>Completion</span>
                                <span className="text-brand-cyan">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-1000 ease-out" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer Action */}
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            View Materials
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-cyan group-hover:text-black transition-all">
                            <ChevronRightIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Inner Glow */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </NavLink>
    );
};

export default MaterialCard;
