import React, { useState, useEffect, useCallback } from 'react';
import { XIcon, SparkleIcon, GlobeIcon, TargetIcon, ZapIcon, ShipIcon, AnchorIcon, RocketIcon } from './Icons';

interface Story {
    id: number;
    title: string;
    description: string;
    description_en: string;
    title_en: string;
    color: string;
    glowColor: string;
}

const STORIES: Story[] = [
    {
        id: 1,
        title: "مرحباً بك في المحرك الكوني 🌌",
        title_en: "Welcome to the Cosmic Engine",
        description: "لقد تحول منهجك إلى خريطة ذهنية بصرية. المواد الآن كواكب والدروس أقمار ساطعة في فضائك الخاص.",
        description_en: "Your curriculum is now a visual mind map. Subjects are planets and lessons are glowing moons in your personal space.",
        color: "from-blue-950 via-slate-950 to-black",
        glowColor: "rgba(0, 100, 255, 0.4)"
    },
    {
        id: 2,
        title: "رادار البحث  📡",
        title_en: "Navigation Search Radar",
        description: "ابحث عن أي معلومة بسرعة الصاروخ. الرادار سيقوم بعمل Zoom-in آلي ليحدد لك موقع المعلومة في ذاكرتك المكانية.",
        description_en: "Search for any info at rocket speed. The radar will auto-zoom to locate the info in your spatial memory.",
        color: "from-blue-900 to-black",
        glowColor: "rgba(0, 243, 255, 0.3)"
    },
    {
        id: 3,
        title: "(Error Reflex) 🔴",
        title_en: "The Red Pulse",
        description: "النظام أصبح حياً! عند الخطأ، ستطلق المادة نبضات ضوئية حمراء لتنبيهك بمكان 'الجرح' الدراسي لتعالجه فوراً.",
        description_en: "The system is alive! When you fail, the subject will emit red pulses to alert you where the 'study wound' is.",
        color: "from-blue-950 via-red-950/20 to-black",
        glowColor: "rgba(239, 68, 68, 0.2)"
    },
    {
        id: 4,
        title: "رحلة الجزيرة (The Odyssey) ⛵",
        title_en: "The Island Odyssey",
        description: "سفينتك تبحر الآن نحو حلمك. كل دقيقة مذاكرة تحركك خطوة نحو 'جزيرة الاستقلال' الخاصة بك.",
        description_en: "Your ship is sailing towards your dream. Every study minute moves you closer to your 'Independence Island'.",
        color: "from-blue-900 via-emerald-950/40 to-black",
        glowColor: "rgba(16, 185, 129, 0.2)"
    },
    {
        id: 5,
        title: "المحلل  🧠",
        title_en: "The Socratic Analyzer",
        description: "نحن لا نعطيك الحل، بل نعلمك كيف تفكر. سنقوم بتحليل أنماط أخطائك الغبية لمنع تكرارها وتحويلها لوعي ذاتي.",
        description_en: "We don't give the solution, we teach you how to think. We analyze your silly mistake patterns to build self-awareness.",
        color: "from-indigo-950 via-blue-950 to-black",
        glowColor: "rgba(139, 92, 246, 0.3)"
    },
    {
        id: 6,
        title: "كشاف الويب (Search Radar) 🌐",
        title_en: "Web Spotlight",
        description: "سد الفجوات بكلمة واحدة. جلب موارد خارجية من الويب وحقنها كنجوم مؤقتة في خريطتك بضغطة واحدة.",
        description_en: "Fill gaps with one word. Fetch external web resources and inject them as temporary stars in your map with one click.",
        color: "from-blue-950 via-amber-950/20 to-black",
        glowColor: "rgba(251, 191, 36, 0.2)"
    },
    {
        id: 7,
        title: "  (Direct Injector) 🛠️",
        title_en: "Direct Injector",
        description: "أنت الآن المهندس المعماري لعقلك. أضف أي روابط أو فيديوهات خارجية وقم ببناء مساحتك المعرفية بيدك.",
        description_en: "You are the architect of your mind. Add any external links or videos and build your knowledge space manually.",
        color: "from-blue-900 via-slate-900 to-black",
        glowColor: "rgba(255, 255, 255, 0.1)"
    },
    {
        id: 8,
        title: "استعد للسيادة 🚀",
        title_en: "Prepare for Sovereignty",
        description: "أنت تمتلك الآن نظام تشغيل للعقل. انطلق وابنِ مستقبلك، المعماري بانتظارك.",
        description_en: "You now own an operating system for the mind. Go build your future, the Architect awaits.",
        color: "from-blue-950 via-blue-900 to-black",
        glowColor: "rgba(0, 100, 255, 0.5)"
    }
];

const DURATION_PER_STORY = 6000;

interface OnboardingStoriesProps {
    onComplete: () => void;
}

const OnboardingStories: React.FC<OnboardingStoriesProps> = ({ onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (paused) return;
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / DURATION_PER_STORY) * 100;
            if (newProgress >= 100) {
                if (currentIndex < STORIES.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setProgress(0);
                } else {
                    onComplete();
                }
                clearInterval(interval);
            } else {
                setProgress(newProgress);
            }
        }, 30);
        return () => clearInterval(interval);
    }, [currentIndex, paused, onComplete]);

    const handleNext = useCallback(() => {
        if (currentIndex < STORIES.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    }, [currentIndex, onComplete]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const currentStory = STORIES[currentIndex];

    return (
        <div className="fixed inset-0 z-[300] bg-black text-white flex flex-col font-sans select-none overflow-hidden">
            {/* Cinematic Background Glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] transition-all duration-1000 opacity-60"
                    style={{ backgroundColor: currentStory.glowColor }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] transition-all duration-1000 opacity-40"
                    style={{ backgroundColor: currentStory.glowColor, filter: 'hue-rotate(30deg)' }}
                />
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

            {/* Progress Bars */}
            <div className="flex gap-1.5 p-4 pt-6 absolute top-0 left-0 right-0 z-50">
                {STORIES.map((story, index) => (
                    <div key={story.id} className="h-[3px] flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                        <div
                            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-300 ease-linear"
                            style={{
                                width: index < currentIndex ? '100%' :
                                    index === currentIndex ? `${progress}%` : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Close Button */}
            <button
                onClick={onComplete}
                className="absolute top-10 right-6 z-[60] p-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-white transition-all hover:scale-110 active:scale-95"
            >
                <XIcon className="w-6 h-6" />
            </button>

            {/* Main Content Area */}
            <div
                className={`flex-1 relative flex flex-col justify-center items-center p-8 bg-gradient-to-b ${currentStory.color} transition-all duration-1000`}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
            >
                {/* Navigation Controls */}
                <div className="absolute inset-y-0 left-0 w-1/4 z-40 cursor-w-resize" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
                <div className="absolute inset-y-0 right-0 w-1/4 z-40 cursor-e-resize" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

                {/* Cinematic Story Content */}
                <div className="relative z-30 text-center flex flex-col items-center max-w-2xl px-4">
                    {/* Floating Index */}
                    <div className="text-[12rem] font-black text-white/[0.03] absolute -top-40 left-1/2 -translate-x-1/2 transition-all duration-500 scale-150">
                        0{currentIndex + 1}
                    </div>

                    {/* Blue Glowing HUD Ring */}
                    <div className="relative mb-12 animate-pulse">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-ping" />
                        <div className="w-32 h-32 rounded-full border-2 border-blue-500/30 flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]">
                            <RocketIcon className="w-16 h-16 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                            {/* Orbital Accents */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] animate-spin origin-[66px_66px]" />
                        </div>
                    </div>

                    <div className="space-y-4 animate-scale-up">
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-none">
                            {currentStory.title}
                        </h2>
                        <h3 className="text-xl md:text-2xl font-bold text-blue-400/80 uppercase tracking-[0.3em] font-mono">
                            {currentStory.title_en}
                        </h3>
                    </div>

                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent my-10 shadow-[0_0_15px_#3b82f6]" />

                    <div className="space-y-6 animate-slide-up opacity-0 translate-y-10" style={{ animation: 'slide-up 0.8s forwards 0.3s' }}>
                        <p className="text-2xl md:text-4xl font-bold leading-tight text-white/90 drop-shadow-lg font-arabic antialiased text-balance">
                            {currentStory.description}
                        </p>
                        <p className="text-lg md:text-xl font-medium text-white/50 italic tracking-wide max-w-lg mx-auto leading-relaxed">
                            {currentStory.description_en}
                        </p>
                    </div>
                </div>

                {/* Footer HUD */}
                <div className="absolute bottom-12 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full">
                        <div className={`w-2 h-2 rounded-full ${paused ? 'bg-amber-500 animate-pulse' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                            {paused ? 'Navigation Paused' : 'Navigating Space Hub Memory'}
                        </span>
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                        {currentIndex + 1} / {STORIES.length} • MEMORY SYNC ACTIVE
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingStories;
