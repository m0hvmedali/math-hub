import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import WhiteboardBlock from '../components/WhiteboardBlock';
import { ArrowLeftIcon } from '../components/Icons';
import { useCosmicStore } from '../store/useCosmicStore';

const WhiteboardPage: React.FC = () => {
    const { type, id, subjectId, branchId } = useParams<{ type: string; id: string; subjectId?: string; branchId?: string }>();
    const { getLesson, updateLesson, language } = useContext(AppContext);
    const navigate = useNavigate();

    const [whiteboardData, setWhiteboardData] = useState<string | undefined>(undefined);
    const [title, setTitle] = useState<string>('Whiteboard');

    const { tempWhiteboardData, tempWhiteboardTitle, setTempWhiteboard } = useCosmicStore();

    useEffect(() => {
        if (type === 'lesson' && subjectId && branchId && id) {
            const lesson = getLesson(subjectId, branchId, id);
            if (lesson) {
                const block = lesson.content.find(b => b.id === id);
                if (block) {
                    setWhiteboardData(block.whiteboardData);
                    setTitle(block.title || block.fileName || 'Whiteboard');
                }
            }
        } else if (type === 'temp') {
            // Priority: Zustand (Memory) -> LocalStorage (Persistence fallback)
            if (tempWhiteboardData) {
                setWhiteboardData(tempWhiteboardData);
                if (tempWhiteboardTitle) setTitle(tempWhiteboardTitle);
            } else {
                const saved = localStorage.getItem('temp_whiteboard_data');
                if (saved) setWhiteboardData(saved);
                const savedTitle = localStorage.getItem('temp_whiteboard_title');
                if (savedTitle) setTitle(savedTitle);
            }
        }
    }, [type, id, subjectId, branchId, getLesson, tempWhiteboardData, tempWhiteboardTitle]);

    const handleSave = async (data: string) => {
        if (type === 'lesson' && subjectId && branchId && id) {
            const lesson = getLesson(subjectId, branchId, id);
            if (lesson) {
                const updatedContent = lesson.content.map(b =>
                    b.id === id ? { ...b, whiteboardData: data } : b
                );
                await updateLesson(subjectId, branchId, { ...lesson, content: updatedContent });
            }
        } else if (type === 'temp') {
            // 1. Save to Zustand (Memory - No limit, no immediate crash)
            setTempWhiteboard(data, title);

            // 2. Try saving to localStorage (Persistence - 5MB limit)
            try {
                localStorage.setItem('temp_whiteboard_data', data);
                localStorage.setItem('temp_whiteboard_title', title || '');
            } catch (e) {
                // If quota exceeded, we still have it in Zustand memory for the return flow!
                console.warn("LocalStorage quota exceeded, data will only persist in memory.", e);
            }
        }
    };

    const handleClose = () => {
        if (type === 'lesson' && subjectId && branchId) {
            navigate(`/subject/${subjectId}/branch/${branchId}/lesson/${id}`);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-[1100] bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <button
                    onClick={handleClose}
                    className="pointer-events-auto flex items-center gap-2 text-white/50 hover:text-white transition-colors bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"
                >
                    <ArrowLeftIcon className={`w-5 h-5 ${language === 'ar' ? 'transform rotate-180' : ''}`} />
                    <span className="font-bold uppercase tracking-widest text-xs">{language === 'ar' ? 'العودة' : 'Back'}</span>
                </button>
                <div className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] pointer-events-none">
                    {title} — Fullscreen Mode
                </div>
            </div>

            <div className="flex-1 w-full h-full">
                <WhiteboardBlock
                    savedData={whiteboardData}
                    onSave={handleSave}
                    onClose={handleClose}
                    title={title}
                />
            </div>
        </div>
    );
};

export default WhiteboardPage;
