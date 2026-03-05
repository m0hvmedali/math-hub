
import React from 'react';
import { ContentBlock } from '../types';
import {
    VideoIcon, MarkdownIcon, ImageIcon, AudioIcon, PdfIcon, LinkIcon,
    WhiteboardIcon, NotebookLMIcon, CheckCircleIcon, FlashcardIcon,
    CodeIcon, CalendarIcon, BrainIcon
} from './Icons';

interface ContentTileProps {
    block: ContentBlock;
    index: number;
    onClick: () => void;
    isCompleted?: boolean;
}

const ContentTile: React.FC<ContentTileProps> = ({ block, index, onClick, isCompleted }) => {

    // Helper to get Icon and Color
    const getMeta = (type: string) => {
        switch (type) {
            case 'video': return { icon: VideoIcon, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'Video' };
            case 'audio': return { icon: AudioIcon, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', label: 'Audio' };
            case 'image': return { icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Image' };
            case 'pdf': return { icon: PdfIcon, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'PDF' };
            case 'markdown': return { icon: MarkdownIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Note' };
            case 'flashcard': return { icon: FlashcardIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', label: 'Flashcard' };
            case 'quiz': return { icon: CheckCircleIcon, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Quiz' };
            case 'whiteboard': return { icon: WhiteboardIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Whiteboard' };
            case 'link': return { icon: LinkIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Link' };
            case 'html-code': return { icon: CodeIcon, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Code' };
            case 'timetable': return { icon: CalendarIcon, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Timetable' };
            case 'carousel': return { icon: ImageIcon, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'Gallery' };
            case 'notebooklm': return { icon: NotebookLMIcon, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'NotebookLM' };
            default: return { icon: MarkdownIcon, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Content' };
        }
    };

    const meta = getMeta(block.type);
    const Icon = meta.icon;

    // Helper to get Display Title
    const getTitle = () => {
        if (block.fileName) return block.fileName;
        if (block.title) return block.title;
        if (block.question) return "Quiz Question";
        if (block.front) return block.front;
        if (block.type === 'markdown') {
            const firstLine = block.content?.split('\n')[0]?.replace(/[#*]/g, '').trim();
            return firstLine || 'Note';
        }
        return `Item #${index + 1}`;
    };

    return (
        <button
            onClick={onClick}
            className={`
                group relative flex flex-col items-start p-5 rounded-2xl transition-all duration-300
                hover:-translate-y-1 hover:shadow-xl w-full text-left h-full
                bg-cinematic-card border border-cinematic-border hover:border-white/20
            `}
        >
            {/* Top Row: Icon & Type */}
            <div className="flex items-center justify-between w-full mb-4">
                <div className={`p-3 rounded-xl ${meta.bg} ${meta.color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {isCompleted && <CheckCircleIcon className="w-5 h-5 text-accent-green" />}
            </div>

            {/* Content */}
            <div className="flex-1 w-full">
                <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${meta.color}`}>
                    {meta.label}
                </span>
                <h4 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-accent-blue transition-colors">
                    {getTitle()}
                </h4>
            </div>

            {/* Hover Effect: Arrow */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                <span className="text-white/50 text-xl font-bold">→</span>
            </div>
        </button>
    );
};

export default ContentTile;
