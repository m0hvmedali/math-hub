import React from 'react';
import { NavLink } from 'react-router-dom';

interface CourseCardProps {
    id: string;
    title: string;
    subtitle: string;
    link: string;
    imageUrl?: string;
    badgeText?: string;
    progress?: number;
    onEdit?: () => void;
    onDelete?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, subtitle, link, imageUrl, badgeText, progress, onEdit, onDelete }) => {
    // Fallback gradient logic
    const bgStyle = imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
    const defaultBgClass = imageUrl ? '' : 'bg-gradient-to-br from-brand-purple/20 to-black';

    return (
        <NavLink
            to={link}
            className={`block relative flex-none w-[280px] md:w-[400px] h-[200px] md:h-[240px] min-h-[200px] rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-brand-purple transition-all duration-300 shadow-glass hover:shadow-glow-brand ${defaultBgClass}`}
            style={bgStyle}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Badge */}
            {badgeText && (
                <div className="absolute top-4 right-4 bg-brand-magenta text-white text-[11px] font-black px-3 py-1 rounded shadow-lg uppercase tracking-wider z-30">
                    {badgeText}
                </div>
            )}

            {/* Action Buttons */}
            {(onEdit || onDelete) && (
                <div className="absolute top-4 left-4 flex gap-2 z-30">
                    {onEdit && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
                            className="bg-black/50 hover:bg-black/80 text-white p-2 text-xs rounded-full backdrop-blur border border-white/10 transition-all"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                            className="bg-black/50 hover:bg-red-500/80 text-gray-300 hover:text-white p-2 text-xs rounded-full backdrop-blur border border-white/10 transition-all"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            )}

            {/* Play Button Ring */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center bg-black/40 backdrop-blur-md transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
            </div>

            {/* Content Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-20">
                <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-ott-gradient transition-all line-clamp-2">{title}</h3>
                <p className="text-sm text-gray-400 font-bold mb-4">{subtitle}</p>

                {/* Progress Bar */}
                {progress !== undefined && (
                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-cyan" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
            </div>
        </NavLink>
    );
};

export default CourseCard;
