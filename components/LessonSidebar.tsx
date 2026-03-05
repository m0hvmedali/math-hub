
import React from 'react';
import { ContentBlock } from '../types';
import {
    VideoIcon, MarkdownIcon, ImageIcon, AudioIcon, PdfIcon, LinkIcon,
    WhiteboardIcon, NotebookLMIcon, CheckCircleIcon, FlashcardIcon,
    CodeIcon, CalendarIcon
} from './Icons';

interface LessonSidebarProps {
    content: ContentBlock[];
    onSelect: (index: number) => void;
    currentIndex: number | null;
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({ content, onSelect, currentIndex }) => {

    const getIcon = (type: string) => {
        switch (type) {
            case 'video': return VideoIcon;
            case 'quiz': return CheckCircleIcon;
            case 'flashcard': return FlashcardIcon;
            case 'markdown': return MarkdownIcon;
            default: return MarkdownIcon;
        }
    };

    const getTitle = (block: ContentBlock, index: number) => {
        if (block.fileName) return block.fileName;
        if (block.title) return block.title;
        if (block.type === 'quiz') return `Quiz Q${index + 1}`;
        if (block.type === 'flashcard') return `Flashcard ${index + 1}`;
        if (block.type === 'markdown') return block.content.slice(0, 15) + '...';
        return `Item ${index + 1}`;
    };

    return (
        <div className="w-64 flex-shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 px-4">
                Mission Index
            </h3>

            <div className="space-y-1">
                {content.map((block, idx) => {
                    const Icon = getIcon(block.type);
                    const isActive = currentIndex === idx;

                    return (
                        <button
                            key={block.id || idx}
                            onClick={() => onSelect(idx)}
                            className={`
                                w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all group
                                ${isActive
                                    ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/20'
                                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`} />
                            <span className="text-xs font-bold truncate">
                                {getTitle(block, idx)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LessonSidebar;
