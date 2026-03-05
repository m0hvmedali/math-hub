import React, { useState, useEffect } from 'react';
import { ContentBlock } from '../types';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { calculateNextReview, getStatusColor } from '../utils/spacedRepetition';

interface FlashcardViewerProps {
    flashcards: ContentBlock[];
    initialIndex?: number;
    onClose: () => void;
    onSaveStats?: (blockId: string, stats: NonNullable<ContentBlock['flashcardStats']>) => void;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, initialIndex = 0, onClose, onSaveStats }) => {
    // Mode: 'study' (due cards) or 'cram' (all cards)
    const [mode, setMode] = useState<'study' | 'cram'>('cram');

    // Filter cards for study mode
    const studyQueue = React.useMemo(() => {
        if (mode === 'cram') return flashcards;
        const now = new Date();
        return flashcards.filter(f => !f.flashcardStats || new Date(f.flashcardStats.nextReviewDate) <= now);
    }, [flashcards, mode]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showUnderstanding, setShowUnderstanding] = useState(false);

    // Sync initial index if found in queue
    useEffect(() => {
        if (mode === 'cram') setCurrentIndex(initialIndex);
        else setCurrentIndex(0);
    }, [mode, initialIndex]);

    const currentCard = studyQueue[currentIndex];

    // If no cards due
    if (!currentCard && mode === 'study') {
        return (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center animate-fade-in">
                <div className="text-center p-12 bg-gray-900 rounded-3xl border border-gray-800 max-w-lg">
                    <h3 className="text-3xl font-black text-white mb-6">ALL CAUGHT UP!</h3>
                    <p className="text-gray-400 mb-8">You have reviewed all due flashcards for now. Great job!</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={onClose} className="px-8 py-4 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700">Close</button>
                        <button onClick={() => setMode('cram')} className="px-8 py-4 bg-accent-blue text-white rounded-xl font-bold hover:bg-blue-600">Review All (Cram Mode)</button>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentCard) return null; // Should not happen

    const progress = `${currentIndex + 1}/${studyQueue.length}`;

    // Stats
    const stats = currentCard.flashcardStats;
    const nextReview = stats ? new Date(stats.nextReviewDate).toLocaleDateString() : 'Now';
    const masteryColor = getStatusColor(stats?.masteryLevel);

    const handleNext = () => {
        if (currentIndex < studyQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setShowUnderstanding(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
            setShowUnderstanding(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleAssessment = (grade: number) => { // 0=Forgot, 3=Hard, 5=Easy
        if (!onSaveStats) return;

        const currentStats = currentCard.flashcardStats || {
            reps: 0,
            interval: 0,
            easeFactor: 2.5,
            nextReviewDate: new Date().toISOString(),
            masteryLevel: 'new' as const
        };

        const newStats = calculateNextReview(currentStats, grade);

        // Save
        onSaveStats(currentCard.id, newStats);

        // Auto advance
        if (currentIndex < studyQueue.length - 1) {
            setTimeout(() => handleNext(), 300); // Small delay for visual feedback
        } else {
            // End of queue
            // Optionally show summary
            onClose();
        }
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFlipped) {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleFlip();
                }
            } else {
                if (e.key === '1') handleAssessment(0); // Forgot
                if (e.key === '2') handleAssessment(3); // Hard
                if (e.key === '3') handleAssessment(5); // Easy
                if (e.key === ' ') handleNext(); // Skip
            }

            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, isFlipped, onClose]);

    // UI Colors
    // Front: Dark Gray (gray-900/slate-800)
    // Back: Dark Blue (blue-950/indigo-950)
    const frontClass = 'bg-gray-900 border-gray-700';
    const backClass = 'bg-[#0f172a] border-blue-900'; // Dark Blue

    return (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center animate-fade-in font-sans">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 px-6 py-2 rounded-full backdrop-blur-md border border-white/5">
                        <span className="text-white font-black text-sm tracking-[0.2em]">{progress}</span>
                    </div>
                    {mode === 'cram' && <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">CRAM MODE</div>}
                </div>

                <button
                    onClick={onClose}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Navigation Arrows (Desktop) */}
            <button onClick={handlePrev} disabled={currentIndex === 0} className="hidden md:block absolute left-8 top-1/2 -translate-y-1/2 p-4 text-white/20 hover:text-white transition-all disabled:opacity-0">
                <ChevronLeftIcon className="w-12 h-12" />
            </button>
            <button onClick={handleNext} disabled={currentIndex === studyQueue.length - 1} className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 p-4 text-white/20 hover:text-white transition-all disabled:opacity-0">
                <ChevronRightIcon className="w-12 h-12" />
            </button>

            {/* Main Card Container */}
            <div className="w-full max-w-3xl px-6 relative perspective-1000 h-[600px] flex flex-col justify-center">

                {/* Stats Header (Only visible on Back or if mastered) */}
                <div className={`absolute -top-12 left-0 right-0 flex justify-center gap-6 transition-opacity duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <div className={`w-2 h-2 rounded-full ${masteryColor}`}></div>
                        <span>Level: {stats?.masteryLevel || 'New'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Due: {nextReview}</span>
                    </div>
                </div>

                <div className="relative w-full h-full cursor-pointer transition-all duration-500" style={{ transformStyle: 'preserve-3d' }}>

                    {/* FRONT */}
                    <div
                        onClick={!isFlipped ? handleFlip : undefined}
                        className={`
                            absolute inset-0 rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center justify-center text-center
                            shadow-2xl border transition-all duration-700 backface-hidden
                            ${isFlipped ? 'opacity-0 rotate-y-180 pointer-events-none' : 'opacity-100 rotate-y-0'}
                            ${frontClass}
                        `}
                    >
                        <div className="absolute top-8 left-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <span className="text-xl">🤔</span>
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Question</span>
                        </div>

                        <div className="prose prose-invert prose-xl md:prose-2xl max-w-none leading-relaxed select-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.front || ''}</ReactMarkdown>
                        </div>

                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <span className="text-xs font-bold text-white/20 uppercase tracking-[0.2em] animate-pulse">Tap to Reveal</span>
                        </div>
                    </div>

                    {/* BACK */}
                    <div
                        className={`
                            absolute inset-0 rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center justify-center text-center
                            shadow-2xl border transition-all duration-700 backface-hidden
                            ${isFlipped ? 'opacity-100 rotate-y-0' : 'opacity-0 -rotate-y-180 pointer-events-none'}
                            ${backClass}
                        `}
                    >
                        <div className="absolute top-8 left-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                                <span className="text-xl">💡</span>
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-accent-blue/50">Answer</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-center w-full">
                            <div className="prose prose-invert prose-xl md:prose-2xl max-w-none leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.back || ''}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Controls Container */}
                        <div className="w-full mt-8 grid grid-cols-1 gap-4">

                            {/* Understanding Tools */}
                            <div className="flex justify-center gap-3 mb-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/search?q=${encodeURIComponent(currentCard.front || '')}+شرح+ثانوية+عامة`, '_blank') }}
                                    className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-xs font-black text-blue-300 uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/10"
                                >
                                    🔎 ابحث في جوجل (ثانوية عامة)
                                </button>
                            </div>

                            {/* Assessment Buttons */}
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAssessment(0); }}
                                    className="py-5 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-600 hover:text-white hover:border-red-500 text-red-400 font-black uppercase tracking-widest transition-all text-sm group"
                                >
                                    <span className="block text-xs opacity-50 mb-1 group-hover:text-white">Hard / Forgot</span>
                                    RETRY
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAssessment(3); }}
                                    className="py-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-600 hover:text-white hover:border-yellow-500 text-yellow-400 font-black uppercase tracking-widest transition-all text-sm group"
                                >
                                    <span className="block text-xs opacity-50 mb-1 group-hover:text-white">Okay</span>
                                    GOOD
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAssessment(5); }}
                                    className="py-5 rounded-2xl bg-green-500/10 border border-green-500/30 hover:bg-green-600 hover:text-white hover:border-green-500 text-green-400 font-black uppercase tracking-widest transition-all text-sm group"
                                >
                                    <span className="block text-xs opacity-50 mb-1 group-hover:text-white">Easy</span>
                                    PERFECT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashcardViewer;
