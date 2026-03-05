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
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, subtitle, link, imageUrl, badgeText, progress }) => {
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
                <div className="absolute top-4 right-4 bg-brand-magenta text-white text-[11px] font-black px-3 py-1 rounded shadow-lg uppercase tracking-wider">
                    {badgeText}
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
