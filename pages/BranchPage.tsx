import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ContentBlock, Lesson } from '../types';
import ContentModal from '../components/ContentModal';
import FlashcardViewer from '../components/FlashcardViewer';
import WorkspaceEmbed from '../components/WorkspaceEmbed';
import WhiteboardBlock from '../components/WhiteboardBlock';
import RichTextEditor from '../components/RichTextEditor';
import GeminiChatWidget from '../components/GeminiChatWidget';

import HTMLCodeViewer from '../components/HTMLCodeViewer';
import CodeRunner from '../components/CodeRunner';
import Sidebar from '../components/Sidebar';
import LessonSidebar from '../components/LessonSidebar';
import ContentTile from '../components/ContentTile';
import ReactMarkdown from 'react-markdown';
import { useLessonProgress } from '../hooks/useLessonProgress';
import remarkGfm from 'remark-gfm';
import { translations } from '../utils/translations';
import { ArrowLeftIcon, PlusIcon, CheckCircleIcon, TrashIcon, VideoIcon, MarkdownIcon, ClockIcon, TargetIcon, ChevronLeftIcon, ChevronRightIcon, BookOpenIcon } from '../components/Icons';
import { getRandomTheme } from '../utils/themeHelper';
import MermaidGraph from '../components/MermaidGraph';
import { useCosmicStore } from '../store/useCosmicStore';
import ErrorTaxonomyModal from '../components/ErrorTaxonomyModal';
import { ErrorCause } from '../types';

// --- Helper Components ---

// Compact Flashcard Preview Card
const FlashcardPreview: React.FC<{ block: ContentBlock; index: number; onOpen: (idx: number) => void }> = ({ block, index, onOpen }) => {
    const bgColor = block.customColor || '#312e81';

    return (
        <div
            className="rounded-2xl p-6 flex items-center justify-between gap-4 cursor-pointer hover:scale-[1.02] transition-all group"
            style={{ backgroundColor: bgColor, boxShadow: `0 4px 24px ${bgColor}33` }}
            onClick={() => onOpen(index)}
        >
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">🎴 Flashcard</div>
                <p className="text-white font-bold text-lg truncate">{block.front || 'No question'}</p>
            </div>
            <button className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-sm transition-all flex-shrink-0 backdrop-blur-sm">
                Open →
            </button>
        </div>
    );
};

// Image Carousel Component
const CarouselRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const images = block.images || [];

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [images.length]);

    if (images.length === 0) return null;

    return (
        <div className="glass-card border border-[var(--glass-border)]/60 rounded-3xl overflow-hidden group">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm">🎞️</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cyan">{block.title || 'Image Carousel'}</span>
                </div>
                <div className="flex gap-1">
                    {images.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-brand-cyan w-4' : 'bg-gray-600'}`}></div>
                    ))}
                </div>
            </div>
            <div className="relative aspect-video overflow-hidden bg-black">
                {images.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`Slide ${idx}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 rotate-1'}`}
                    />
                ))}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                {/* Navigation Arrows (Visible on Hover) */}
                <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 flex items-center justify-center font-bold"
                >
                    ‹
                </button>
                <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 flex items-center justify-center font-bold"
                >
                    ›
                </button>
            </div>
        </div>
    );
};

const ContentRenderer: React.FC<{
    block: ContentBlock;
    onDelete: () => void;
    readOnly: boolean;
    flashcardIndex?: number;
    onOpenFlashcard?: (idx: number) => void;
    lessonId?: string;
    onQuizFail?: (lessonId: string) => void;
    savedState?: { selectedOption?: number; isCorrect?: boolean };
    onSaveProgress?: (state: any) => void;
    isFocused?: boolean;
    subjectId?: string;
}> = ({ block, onDelete, readOnly, flashcardIndex = 0, onOpenFlashcard, lessonId, onQuizFail, savedState, onSaveProgress, isFocused, subjectId }) => {
    const triggerRedPulse = useCosmicStore(state => state.triggerRedPulse);
    const [selectedOption, setSelectedOption] = useState<number | null>(savedState?.selectedOption ?? null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(savedState?.isCorrect ?? null);

    // Sync with savedState if it changes (e.g. on load)
    useEffect(() => {
        if (savedState) {
            setSelectedOption(savedState.selectedOption ?? null);
            setIsCorrect(savedState.isCorrect ?? null);
        }
    }, [savedState]);

    const handleQuizSubmit = (optionIdx: number) => {
        setSelectedOption(optionIdx);
        if (block.type === 'quiz' && block.correctAnswer !== undefined) {
            const correct = optionIdx === block.correctAnswer;
            setIsCorrect(correct);

            if (onSaveProgress) {
                onSaveProgress({ selectedOption: optionIdx, isCorrect: correct });
            }

            if (!correct && lessonId && subjectId) {
                // Trigger the Red Pulse on this lesson node in the cosmic graph
                triggerRedPulse(subjectId, lessonId);
                if (onQuizFail) onQuizFail(lessonId);
            }
        }
    };

    // Card styling
    const customBg = block.customColor;
    const cardStyle = customBg ? { backgroundColor: customBg } : {};

    const isCodeBlock = block.type === 'html-code' || block.type === 'raw-html';
    const containerClasses = isFocused && isCodeBlock
        ? "relative w-full h-full flex flex-col overflow-hidden"
        : `relative group rounded-2xl overflow-hidden transition-all hover:shadow-xl ${isFocused ? 'flex flex-col h-full w-full' : ''} ${customBg ? '' : 'glass-card border border-[var(--glass-border)]/60 hover:border-white/10'}`;

    // Type-specific icons and labels
    const typeLabels: Record<string, { icon: string; label: string; color: string }> = {
        'markdown': { icon: '📝', label: 'Note', color: '#60a5fa' },
        'video': { icon: '🎬', label: 'Video', color: '#f472b6' },
        'image': { icon: '🖼️', label: 'Image', color: '#34d399' },
        'audio': { icon: '🎧', label: 'Audio', color: '#a78bfa' },
        'pdf': { icon: '📄', label: 'PDF', color: '#fb923c' },
        'google-drive': { icon: '☁️', label: 'Drive', color: '#22d3ee' },
        'google-docs': { icon: '📝', label: 'Google Docs', color: '#4285F4' },
        'google-slides': { icon: '📊', label: 'Google Slides', color: '#F4B400' },
        'google-sites': { icon: '🌐', label: 'Google Sites', color: '#0F9D58' },
        'whiteboard': { icon: '✏️', label: 'Whiteboard', color: '#fbbf24' },
        'notebooklm': { icon: '🧠', label: 'NotebookLM', color: '#c084fc' },
        'quiz': { icon: '❓', label: 'Quiz', color: '#fb7185' },
        'flashcard': { icon: '🎴', label: 'Flashcard', color: '#818cf8' },
        'link': { icon: '🔗', label: 'Link', color: '#38bdf8' },
        'podcast': { icon: '🎙️', label: 'Podcast', color: '#e879f9' },
        'html-code': { icon: '💻', label: 'Code', color: '#4ade80' },
        'timetable': { icon: '📅', label: 'Timetable', color: '#f97316' },
        'carousel': { icon: '🎞️', label: 'Carousel', color: '#f472b6' },
    };

    const info = typeLabels[block.type] || { icon: '📦', label: block.type, color: '#94a3b8' };

    // Flashcard renders its own special card
    if (block.type === 'flashcard') {
        return (
            <div className="relative group">
                {!readOnly && (
                    <button
                        onClick={onDelete}
                        className="absolute -top-2 -right-2 z-20 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
                <FlashcardPreview block={block} index={flashcardIndex} onOpen={onOpenFlashcard || (() => { })} />
            </div>
        );
    }

    // Carousel renders its own special card
    if (block.type === 'carousel') {
        return (
            <div className="relative group">
                {!readOnly && (
                    <button
                        onClick={onDelete}
                        className="absolute -top-2 -right-2 z-20 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
                <CarouselRenderer block={block} />
            </div>
        );
    }

    return (
        <div
            className={containerClasses}
            style={cardStyle}
        >
            {/* Delete Button */}
            {!readOnly && (
                <button
                    onClick={onDelete}
                    className="absolute top-4 right-4 z-20 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}

            {/* Type Badge */}
            <div className="px-6 py-3 flex items-center gap-2 border-b border-white/5">
                <span className="text-sm">{info.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: info.color }}>{info.label}</span>
                {block.fileName && <span className="text-[10px] text-gray-500 font-medium truncate max-w-[200px] ml-auto">{block.fileName}</span>}
            </div>

            <div className={isFocused && isCodeBlock ? "flex-1 overflow-hidden" : "p-6"}>
                {block.type === 'markdown' && (
                    <article className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-headings:text-white prose-headings:font-bold prose-strong:text-white prose-a:text-brand-cyan">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
                    </article>
                )}

                {block.type === 'video' && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe src={block.content} className="w-full h-full" allowFullScreen={true} loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        ></iframe>
                    </div>
                )}

                {block.type === 'google-drive' && (
                    <div className="w-full h-[600px] md:h-[800px] rounded-xl overflow-hidden bg-gray-900">
                        <iframe src={block.content} className="w-full h-full border-0" loading="lazy" allowFullScreen={true} allow="fullscreen"></iframe>
                    </div>
                )}

                {block.type === 'image' && (
                    <div className="flex justify-center rounded-xl overflow-hidden">
                        <img src={block.content} alt={block.fileName} loading="lazy" className="max-h-[600px] rounded-xl" />
                    </div>
                )}

                {block.type === 'pdf' && (
                    <div className="w-full h-[700px] md:h-[1000px] rounded-xl overflow-hidden">
                        <iframe src={block.content} className="w-full h-full" loading="lazy" allowFullScreen={true} allow="fullscreen"></iframe>
                    </div>
                )}

                {block.type === 'whiteboard' && (
                    <div className="p-6 bg-white rounded-xl text-black font-mono text-base whitespace-pre-wrap leading-relaxed">
                        {block.content}
                    </div>
                )}

                {block.type === 'quiz' && (
                    <div className="flex flex-col gap-5">
                        {block.content && (
                            <img src={block.content} alt="Quiz" loading="lazy" className="rounded-xl max-h-[400px] object-contain self-center" />
                        )}
                        <h3 className="text-xl font-bold text-white">{block.question}</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {block.options?.map((opt, idx) => {
                                let btnClass = "bg-white/5 border border-white/10 text-left p-4 rounded-xl hover:bg-white/10 transition-all text-gray-300 font-medium flex items-center gap-3";
                                if (selectedOption !== null) {
                                    if (idx === block.correctAnswer) btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 flex items-center gap-3 p-4 rounded-xl font-medium";
                                    else if (idx === selectedOption && idx !== block.correctAnswer) btnClass = "bg-red-500/20 border-red-500/50 text-red-300 flex items-center gap-3 p-4 rounded-xl font-medium";
                                    else btnClass = "bg-white/5 border-white/5 opacity-40 flex items-center gap-3 p-4 rounded-xl font-medium";
                                }
                                return (
                                    <button key={idx} onClick={() => handleQuizSubmit(idx)} disabled={selectedOption !== null} className={btnClass}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-sm ${selectedOption === idx ? 'border-white text-white' : 'border-gray-600 text-gray-500'}`}>
                                            {['A', 'B', 'C', 'D'][idx]}
                                        </div>
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                        {selectedOption !== null && (
                            <div className={`p-4 rounded-xl text-center font-bold text-lg ${isCorrect ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'text-red-400 bg-red-500/10 border border-red-500/30'}`}>
                                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                            </div>
                        )}
                    </div>
                )}

                {(block.type === 'google-docs' || block.type === 'google-slides' || block.type === 'google-sites' || block.type === 'google-drive' || block.type === 'link' || block.type === 'pdf') && (
                    <WorkspaceEmbed
                        url={block.url || block.content}
                        title={block.title || block.fileName}
                        type={
                            block.type === 'pdf' ? 'link' :
                                block.type === 'google-drive' ? 'google-drive' :
                                    block.type as any
                        }
                    />
                )}

                {block.type === 'whiteboard' && (
                    <div className="-m-6">
                        <WhiteboardBlock
                            savedData={block.whiteboardData}
                            readOnly={readOnly}
                            title={block.title || block.fileName || 'Whiteboard'}
                            onSave={readOnly ? undefined : async (data) => {
                                // Caller handles save via onDelete prop pattern; we use a custom event
                                (block as any).__pendingWhiteboardSave = data;
                            }}
                        />
                    </div>
                )}

                {block.type === 'html-code' && (
                    <HTMLCodeViewer
                        html={block.htmlContent || block.content}
                        css={block.cssContent || ''}
                        js={block.jsContent || ''}
                        title="Interactive Code"
                        isFullScreen={isFocused}
                    />
                )}

                {block.type === 'raw-html' && (
                    <CodeRunner
                        code={block.content}
                        title={block.fileName || 'Genius Runner'}
                        isFullScreen={isFocused}
                    />
                )}

                {block.type === 'rich-text' && (
                    <RichTextEditor
                        initialValue={block.richTextData}
                        readOnly={readOnly}
                        onSave={readOnly ? undefined : (html) => {
                            (block as any).__pendingRichTextSave = html;
                        }}
                    />
                )}
            </div>
        </div>
    );
};

const BranchPage: React.FC = () => {
    const { subjectId, branchId, lessonId } = useParams<{ subjectId: string; branchId: string; lessonId: string }>();
    const { getSubject, getCourseBranch, updateLesson, user, language, applySubjectTheme, resetTheme, logKnowledgeError } = useContext(AppContext);
    const navigate = useNavigate();
    const t = translations[language];

    // State
    const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(undefined);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isGeminiOpen, setIsGeminiOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Focus Mode State (Always Active in OTT)
    const [focusedBlockIndex, setFocusedBlockIndex] = useState<number>(0);

    // Flashcard Gallery State
    const [isFlashcardViewerOpen, setIsFlashcardViewerOpen] = useState(false);
    const [flashcardStartIndex, setFlashcardStartIndex] = useState(0);

    // Error Taxonomy State
    const [isTaxonomyModalOpen, setIsTaxonomyModalOpen] = useState(false);
    const [currentErrorLessonId, setCurrentErrorLessonId] = useState<string | null>(null);

    // Progress Tracking
    const { progress, fetchProgress, saveProgress, resetProgress } = useLessonProgress(user?.id);

    useEffect(() => {
        // Find subject and branch
        const subject = getSubject(subjectId!);
        const branch = getCourseBranch(subjectId!, branchId!);

        if (branch && lessonId) {
            const l = branch.lessons.find((l: any) => l.id === lessonId);
            setActiveLesson(l);
        } else {
            setActiveLesson(undefined);
        }
    }, [subjectId, branchId, lessonId, getSubject, getCourseBranch]);

    useEffect(() => {
        if (activeLesson?.id) {
            fetchProgress(activeLesson.id);
        }
    }, [activeLesson?.id, fetchProgress]);

    const subject = getSubject(subjectId!);
    const branch = getCourseBranch(subjectId!, branchId!);

    // Check Permissions
    const isOwner = user === subject?.user_id;
    const readOnly = !isOwner;

    // Apply Random Theme for variety
    const randomTheme = useMemo(() => getRandomTheme(), [subject]);

    useEffect(() => {
        if (subject) {
            if (subject.themeColor) applySubjectTheme(subject);
            else applySubjectTheme(randomTheme);
        }
        return () => resetTheme();
    }, [subject, randomTheme, applySubjectTheme, resetTheme]);

    // Flashcards computation
    const flashcards = useMemo(() => {
        if (!activeLesson?.content) return [];
        return activeLesson.content.filter(block => block.type === 'flashcard');
    }, [activeLesson?.content]);

    // Actions
    const handleToggleComplete = async (lesson: Lesson) => {
        if (!isOwner || !subject || !branch) return;

        const newStatus = lesson.status === 'completed' ? 'in_progress' : 'completed';
        let updates: Partial<Lesson> = { status: newStatus as any };

        if (newStatus === 'completed') {
            const stages = [1, 3, 7, 30];
            const nextStage = lesson.review_stage < stages.length ? lesson.review_stage + 1 : stages.length;
            const daysToAdd = stages[lesson.review_stage] || 30;

            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + daysToAdd);

            updates.review_stage = nextStage;
            updates.next_review_date = nextDate.toISOString();
        }

        await updateLesson(subject.id, branch.id, { ...lesson, ...updates });
    };

    const handleUpdateMetadata = async (updates: Partial<Lesson>) => {
        if (!isOwner || !subject || !branch || !activeLesson) return;
        await updateLesson(subject.id, branch.id, { ...activeLesson, ...updates });
    };

    const handleQuizFail = (lessonId: string) => {
        setCurrentErrorLessonId(lessonId);
        setIsTaxonomyModalOpen(true);
    };

    const handleSelectErrorCause = async (cause: ErrorCause) => {
        if (currentErrorLessonId) {
            await logKnowledgeError(currentErrorLessonId, cause);
        }
        setIsTaxonomyModalOpen(false);
        setCurrentErrorLessonId(null);
    };

    // Replace the default ContentRenderer delete action logic just to update Lesson
    const handleDeleteContent = async (blockId: string) => {
        if (!isOwner || !subject || !branch || !activeLesson) return;
        if (!window.confirm("Delete this asset?")) return;
        const updatedLesson = { ...activeLesson, content: activeLesson.content.filter(b => b.id !== blockId) };
        await updateLesson(subject.id, branch.id, updatedLesson);
        setFocusedBlockIndex(0); // reset index
    };

    const handleRenameAsset = async (blockId: string, currentName: string) => {
        if (!isOwner || !subject || !branch || !activeLesson) return;
        const newName = window.prompt(language === 'ar' ? 'أدخل الاسم الجديد للمورد:' : 'Enter new name for the asset:', currentName);
        if (newName === null || newName.trim() === '' || newName === currentName) return;

        const updatedContent = activeLesson.content.map(b =>
            b.id === blockId ? { ...b, fileName: newName.trim(), title: newName.trim() } : b
        );
        const updatedLesson = { ...activeLesson, content: updatedContent };
        setActiveLesson(updatedLesson);
        await updateLesson(subject.id, branch.id, updatedLesson);
    };

    const handleSaveLessonEdits = async () => {
        if (!isOwner || !subject || !branch || !activeLesson) return;
        setIsSaving(true);
        try {
            // Collect all pending edits from content blocks
            const updatedContent = activeLesson.content.map(block => {
                let newBlock = { ...block };
                let modified = false;

                if ((block as any).__pendingWhiteboardSave) {
                    newBlock.whiteboardData = (block as any).__pendingWhiteboardSave;
                    modified = true;
                }

                if ((block as any).__pendingRichTextSave) {
                    newBlock.richTextData = (block as any).__pendingRichTextSave;
                    modified = true;
                }

                return modified ? newBlock : block;
            });

            const updatedLesson = { ...activeLesson, content: updatedContent };
            setActiveLesson(updatedLesson);
            await updateLesson(subject.id, branch.id, updatedLesson);

            // Show a success state briefly if needed, but for now just clear saving
            setTimeout(() => setIsSaving(false), 1000);
        } catch (error) {
            console.error("Save failed:", error);
            setIsSaving(false);
        }
    };

    // --- RENDER ---
    if (!subject || !branch) return <div className="p-10 text-center text-gray-400 text-xl flex h-screen items-center justify-center">Loading Data...</div>;

    if (!activeLesson) return <div className="p-10 text-center text-gray-400 text-xl flex h-screen items-center justify-center">Lesson Not Found.</div>;

    const focusedBlock = activeLesson.content?.[focusedBlockIndex];

    return (
        <div className="flex flex-col min-h-screen bg-black relative -mt-16 z-10 w-full overflow-x-hidden">
            {/* Cinematic Top Navigation Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black via-black/80 to-transparent">
                <button
                    onClick={() => navigate(`/subject/${subject.id}`)}
                    className="flex items-center gap-2 text-white hover:text-brand-cyan transition-colors"
                >
                    <ArrowLeftIcon className={`w-6 h-6 ${language === 'ar' ? 'transform rotate-180' : ''}`} />
                    <span className="font-bold uppercase tracking-widest text-sm">{language === 'ar' ? 'العودة' : 'Back to Episodes'}</span>
                </button>

                <div className="flex items-center gap-4">
                    {/* Gemini AI Chat Button — always visible */}
                    <button
                        onClick={() => setIsGeminiOpen(prev => !prev)}
                        className="bg-gradient-to-r from-brand-purple/30 to-brand-cyan/20 hover:from-brand-purple/50 hover:to-brand-cyan/40 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-brand-purple/30 flex items-center gap-2"
                    >
                        🤖 {language === 'ar' ? 'اسأل المساعد' : 'Ask AI'}
                    </button>
                    {isOwner && (
                        <>
                            <button
                                onClick={handleSaveLessonEdits}
                                disabled={isSaving}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${isSaving
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-brand-purple/20 hover:bg-brand-purple/40 text-brand-purple border-brand-purple/30 shadow-glow-brand'
                                    }`}
                            >
                                {isSaving ? '⏳ ' + (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : '💾 ' + (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="bg-brand-cyan/20 hover:bg-brand-cyan/40 text-brand-cyan px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-glow-brand flex items-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                {language === 'ar' ? 'إضافة مورد' : 'Add Asset'}
                            </button>
                            <button
                                onClick={() => setIsConfigOpen(true)}
                                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors"
                            >
                                <TargetIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* OTT Layout Container */}
            <div className="flex flex-col lg:flex-row w-full min-h-screen pt-20">

                {/* Main Player Area (Left) - scrollable */}
                <div className="flex-1 lg:w-3/4 overflow-y-auto p-4 lg:p-8 pb-24">
                    {activeLesson.content && activeLesson.content.length > 0 && focusedBlock ? (
                        <div className="w-full rounded-2xl bg-[#050505] flex flex-col border border-white/5 relative">
                            <ContentRenderer
                                key={focusedBlock.id}
                                block={focusedBlock}
                                onDelete={() => handleDeleteContent(focusedBlock.id)}
                                readOnly={readOnly}
                                flashcardIndex={flashcards.findIndex(f => f.id === focusedBlock.id)}
                                onOpenFlashcard={(idx) => {
                                    setFlashcardStartIndex(idx);
                                    setIsFlashcardViewerOpen(true);
                                }}
                                lessonId={activeLesson.id}
                                onQuizFail={handleQuizFail}
                                savedState={progress?.data?.[focusedBlock.id]}
                                onSaveProgress={(state) => saveProgress(activeLesson.id, focusedBlock.id, state)}
                                isFocused={true}
                                subjectId={subjectId}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-500">
                            <BookOpenIcon className="w-24 h-24 mb-6 opacity-20" />
                            <h2 className="text-2xl font-bold uppercase tracking-widest">{language === 'ar' ? 'لا يوجد محتوى' : 'No Content Available'}</h2>
                            <p className="mt-2 text-sm max-w-sm text-center">
                                {isOwner ? 'Use the architect tools to deploy assets to this lesson.' : 'Wait for the instructor to upload content.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Playlist / Assets Area (Right Side Toolbar) */}
                <div className="w-full lg:w-1/4 bg-[#111] border-l border-white/10 flex flex-col lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] overflow-hidden">
                    {/* Context Header */}
                    <div className="p-6 border-b border-white/10 shrink-0 bg-gradient-to-b from-brand-dark to-[#111]">
                        <h2 className="text-2xl font-black text-white leading-tight mb-2">{activeLesson.name}</h2>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{branch.name}</p>

                        {/* Progress Metabar */}
                        {isOwner && (
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                                <button
                                    onClick={() => handleToggleComplete(activeLesson)}
                                    className={`px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all ${activeLesson.status === 'completed'
                                        ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/50 shadow-[0_0_15px_rgba(17,211,238,0.3)]'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {activeLesson.status === 'completed' ? (language === 'ar' ? 'مكتمل ✅' : 'Completed ✅') : (language === 'ar' ? 'التحديد كمكتمل' : 'Mark Done')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Playlist */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 custom-scrollbar pb-32">
                        <h3 className="text-white text-xs font-black uppercase tracking-widest px-2 mb-4">{language === 'ar' ? 'أصول الدرس' : 'Lesson Assets'}</h3>

                        {activeLesson.content?.map((block, idx) => {
                            if (block.type === 'flashcard') return null; // Handled separately
                            return (
                                <div key={block.id} className="relative group/item">
                                    <button
                                        onClick={() => setFocusedBlockIndex(idx)}
                                        className={`w-full text-left flex items-start gap-4 p-4 rounded-xl transition-all border ${focusedBlockIndex === idx
                                            ? 'bg-brand-purple/20 border-brand-purple/50 shadow-glow-brand'
                                            : 'bg-[#1a1a1a] border-white/5 hover:border-white/20 text-gray-400 hover:text-white hover:bg-[#222]'
                                            }`}
                                    >
                                        <span className="font-bold opacity-50 text-sm mt-0.5">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${focusedBlockIndex === idx ? 'text-white' : ''}`}>
                                                {block.title || block.fileName || block.type.toUpperCase()}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1 flex items-center justify-between mt-2">
                                                <span>{block.type}</span>
                                                {progress?.data?.[block.id]?.isCorrect && <CheckCircleIcon className="w-3.5 h-3.5 text-brand-cyan" />}
                                            </div>
                                        </div>
                                    </button>
                                    {isOwner && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRenameAsset(block.id, block.title || block.fileName || block.type);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            title={language === 'ar' ? 'تعديل الاسم' : 'Rename'}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}


                        {flashcards.length > 0 && (
                            <button
                                onClick={() => {
                                    setFlashcardStartIndex(0);
                                    setIsFlashcardViewerOpen(true);
                                }}
                                className="w-full text-left flex items-start gap-4 p-4 rounded-xl transition-all border bg-brand-cyan/10 border-brand-cyan/30 hover:border-brand-cyan/60 text-brand-cyan shadow-glow-brand mt-4"
                            >
                                <span className="font-bold opacity-70 text-sm mt-0.5">🎴</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate">
                                        {language === 'ar' ? 'مجموعة البطاقات الذكية' : 'Flashcards Deck'}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1 flex items-center justify-between mt-2">
                                        <span>{flashcards.length} {language === 'ar' ? 'بطاقة' : 'Cards'}</span>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Config Sidebar (Architect) */}
            <Sidebar
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                title={t.intel}
            >
                <div className="space-y-10">
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">{t.mastery}</label>
                        <div className="flex flex-col gap-2">
                            {(['weak', 'average', 'strong'] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handleUpdateMetadata({ understanding_level: level })}
                                    className={`w-full p-4 rounded text-xs font-black tracking-widest transition-all flex items-center justify-between ${activeLesson.understanding_level === level
                                        ? level === 'weak' ? 'bg-red-500 text-white' : level === 'average' ? 'bg-yellow-500 text-black' : 'bg-brand-cyan text-black'
                                        : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {level.toUpperCase()}
                                    {activeLesson.understanding_level === level && <CheckCircleIcon className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">{t.complexity}</label>
                        <div className="flex flex-col gap-2">
                            {(['easy', 'medium', 'hard'] as const).map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => handleUpdateMetadata({ difficulty: diff })}
                                    className={`w-full p-4 rounded text-xs font-black tracking-widest transition-all flex items-center justify-between ${activeLesson.difficulty === diff
                                        ? 'bg-brand-purple text-white shadow-glow-brand'
                                        : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {diff.toUpperCase()}
                                    {activeLesson.difficulty === diff && <CheckCircleIcon className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Sidebar>

            {/* Modals */}
            {isFlashcardViewerOpen && (
                <FlashcardViewer
                    flashcards={flashcards}
                    initialIndex={flashcardStartIndex}
                    onClose={() => setIsFlashcardViewerOpen(false)}
                    onSaveStats={async (blockId, stats) => {
                        if (!activeLesson || !isOwner) return;
                        const updatedContent = activeLesson.content.map(b => (b.id === blockId ? { ...b, flashcardStats: stats } : b));
                        const updatedLesson = { ...activeLesson, content: updatedContent };
                        setActiveLesson(updatedLesson);
                        await updateLesson(subject.id, branch.id, updatedLesson);
                    }}
                />
            )}

            <ErrorTaxonomyModal isOpen={isTaxonomyModalOpen} onClose={() => setIsTaxonomyModalOpen(false)} onSelect={handleSelectErrorCause} language={language} />

            {isSidebarOpen && (
                <ContentModal
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onSave={async (newContent) => {
                        if (isOwner && subject && branch && activeLesson) {
                            const newBlocks: ContentBlock[] = Array.isArray(newContent)
                                ? newContent.map(c => ({ ...c as any, id: crypto.randomUUID() }))
                                : [{ ...newContent as any, id: crypto.randomUUID() }];

                            const updated = { ...activeLesson, content: [...(activeLesson.content || []), ...newBlocks] };
                            await updateLesson(subject.id, branch.id, updated);
                            setIsSidebarOpen(false);
                            setFocusedBlockIndex(updated.content.length - 1);
                        }
                    }}
                />
            )}

            {/* Gemini AI Chat Widget */}
            {isGeminiOpen && (
                <GeminiChatWidget
                    onClose={() => setIsGeminiOpen(false)}
                    subjectName={subject?.name}
                    branchName={branch?.name}
                    lessonName={activeLesson?.name}
                />
            )}
        </div>
    );
};

export default BranchPage;
