import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpenIcon, SparkleIcon, ChevronRightIcon, PlusIcon, TrashIcon, ClockIcon, TargetIcon, CalendarIcon, TrendingUpIcon, GlobeIcon, XIcon, SearchIcon } from '../components/Icons';
import { quotes } from '../utils/quotes';
import { translations } from '../utils/translations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lesson, Importance } from '../types';
import CosmicGraph from '../components/CosmicGraph';
import RadialMenu from '../components/RadialMenu';
import { useCosmicStore } from '../store/useCosmicStore';
import { rebuildSearchIndex, searchRadar, SearchResult, fetchDuckDuckGoResults } from '../utils/searchRadar';
import OnboardingStories from '../components/OnboardingStories';
import GlobalSearchModal from '../components/GlobalSearchModal';
import PatternDashboard from '../components/PatternDashboard';
import SocraticBot from '../components/SocraticBot';
import NodeInjectorModal from '../components/NodeInjectorModal';
import CourseCard from '../components/CourseCard';

const DashboardPage: React.FC = () => {
    const { subjects, addSubject, updateSubject, deleteSubject, addStudySession, studySessions, language, setLanguage, user, customNodes, addCustomNode, manualLinks, addManualLink, tasks, knowledgeErrors, addLessonToBranch } = useContext(AppContext) as any;
    const {
        activeView,
        setActiveView,
        isPanelOpen,
        setPanelOpen,
        reflexSubjectId,
        reflexKeyword,
        clearRedPulse,
        addTempNode
    } = useCosmicStore();

    const isArchitect = user === '8128';
    const navigate = useNavigate();

    // Architect Permissions
    const isOwner = true;

    const t = translations[language];
    const [greeting, setGreeting] = useState('');
    const [quote, setQuote] = useState('');
    const [isInjectorOpen, setIsInjectorOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [editingSubject, setEditingSubject] = useState<{ id: string, name: string } | null>(null);

    const [isAddingLesson, setIsAddingLesson] = useState(false);
    const [newLessonData, setNewLessonData] = useState({
        name: '',
        subjectId: '',
        branchId: '',
        tags: ''
    });

    const handleAddLessonArchitect = async (e: React.FormEvent) => {
        e.preventDefault();
        const tagsArray = newLessonData.tags.split('،').map(t => t.trim()).filter(t => t.length > 0);

        if (tagsArray.length < 3) {
            alert(language === 'ar' ? 'يجب إدخال 3 كلمات مفتاحية على الأقل' : 'At least 3 keywords are required');
            return;
        }

        if (!newLessonData.subjectId || !newLessonData.branchId || !newLessonData.name) {
            alert(language === 'ar' ? 'برجاء ملء جميع الحقول' : 'Please fill all fields');
            return;
        }

        // Use the context function to add lesson with tags
        await addLessonToBranch(newLessonData.subjectId, newLessonData.branchId, newLessonData.name, [], tagsArray);

        setIsAddingLesson(false);
        setNewLessonData({ name: '', subjectId: '', branchId: '', tags: '' });
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showManual, setShowManual] = useState(false);

    // Index content for Search Radar
    useEffect(() => {
        if (subjects.length > 0) {
            rebuildSearchIndex(subjects);
        }
    }, [subjects]);

    const [showGlobalSearch, setShowGlobalSearch] = useState(false);

    // Panel Tabs & Socratic state
    const [activePanelTab, setActivePanelTab] = useState<'radar' | 'analytics' | 'socratic'>('radar');
    const [selectedSocraticError, setSelectedSocraticError] = useState<KnowledgeError | null>(null);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        const results = searchRadar(q);
        setSearchResults(results);
    };

    // Session Tracking
    const [isStudying, setIsStudying] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Debounced DuckDuckGo Integration
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 3) return;

        const timer = setTimeout(async () => {
            const results = await fetchDuckDuckGoResults(`${searchQuery} ثانوية عامة`);
            results.slice(0, 3).forEach(res => {
                useCosmicStore.getState().addTempNode({
                    id: crypto.randomUUID(),
                    name: res.title,
                    type: 'temp',
                    parentId: subjects[0]?.id, // Default to first planet if no context
                    url: res.url,
                    color: '#fbbf24',
                    val: 12
                });
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [searchQuery, subjects]);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        const index = Math.floor(Math.random() * quotes.length);
        setQuote(quotes[index]);
    }, []);

    // Spaced Repetition: Lessons to review today
    const reviewLessons = useMemo(() => {
        const now = new Date();
        const items: { subjectId: string; branchId: string; lesson: Lesson }[] = [];
        subjects.forEach(s => {
            s.branches.forEach(b => {
                b.lessons.forEach(l => {
                    if (l.next_review_date && new Date(l.next_review_date) <= now) {
                        items.push({ subjectId: s.id, branchId: b.id, lesson: l });
                    }
                });
            });
        });
        return items;
    }, [subjects]);

    // Priority Logic: Find the most important lesson to study
    const priorityLesson = useMemo(() => {
        let bestLesson: { subjectId: string; branchId: string; lesson: Lesson; score: number } | null = null;

        subjects.forEach(s => {
            s.branches.forEach(b => {
                b.lessons.forEach(l => {
                    if (l.status === 'completed') return;

                    let score = 0;
                    if (l.status === 'not_started') score += 10;
                    if (l.status === 'in_progress') score += 5;

                    if (l.difficulty === 'hard') score += 10;
                    else if (l.difficulty === 'medium') score += 5;

                    if (l.understanding_level === 'weak') score += 15;
                    else if (l.understanding_level === 'average') score += 7;

                    if (!bestLesson || score > bestLesson.score) {
                        bestLesson = { subjectId: s.id, branchId: b.id, lesson: l, score };
                    }
                });
            });
        });
        return bestLesson;
    }, [subjects]);

    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return subjects;
        return subjects.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.branches.some(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [subjects, searchQuery]);

    const dailyTime = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return studySessions
            .filter(s => s.session_date === today)
            .reduce((acc, curr) => acc + curr.duration_minutes, 0);
    }, [studySessions]);

    const focusData = useMemo(() => {
        return [...studySessions].reverse().slice(-7).map(s => ({
            date: s.session_date.split('-').slice(1).join('/'),
            focus: s.focus_score
        }));
    }, [studySessions]);

    const handleStartSession = () => {
        setIsStudying(true);
        setStartTime(Date.now());
    };

    const handleStopSession = async () => {
        if (startTime) {
            const durationArr = Math.floor((Date.now() - startTime) / 60000);
            const duration = durationArr > 0 ? durationArr : 1;
            const focus = prompt("Rate your focus (0-100):", "80");
            await addStudySession(duration, parseInt(focus || "80"));
        }
        setIsStudying(false);
        setStartTime(null);
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubjectName.trim()) {
            await addSubject(newSubjectName.trim());
            setNewSubjectName('');
            setIsAdding(false);
        }
    };

    const handleEditSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSubject && editingSubject.name.trim()) {
            // Assume we have updateSubject in context now.
            const { updateSubject } = require('../App').AppContext._currentValue; // Using contextual data from above, actually wait, better to rely on context directly if possible.
            // Oh, wait, AppContext is available as `const { updateSubject, deleteSubject } = useContext(AppContext)`

            // Let's modify the context usage at the top of the component to include updateSubject and deleteSubject
            // But since I only have fragments, I'll use the already destructured `context` or just `useContext`
        }
    };

    return (
        <div className="w-full bg-black min-h-screen text-white overflow-x-hidden pb-32 animate-fade-in relative">
            {showManual && <OnboardingStories onComplete={() => setShowManual(false)} />}
            <GlobalSearchModal
                isOpen={showGlobalSearch}
                onClose={() => setShowGlobalSearch(false)}
                query={searchQuery}
            />

            {/* OTT Hero Banner */}
            <div className="relative w-full h-[60vh] md:h-[75vh] flex items-end pb-16 px-6 md:px-12 pb-24 top-0 left-0 bg-gradient-to-tr from-brand-dark to-brand-purple/20">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                <BookOpenIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] opacity-5 object-cover pointer-events-none" />

                <div className="relative z-20 w-full max-w-5xl">
                    <div className="mb-4">
                        <span className="text-brand-magenta font-black tracking-[0.2em] uppercase text-xs border border-brand-magenta/30 bg-brand-magenta/10 px-3 py-1 rounded">
                            {language === 'ar' ? 'مميز' : 'Featured'}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight truncate">
                        {priorityLesson ? priorityLesson.lesson.name : (language === 'ar' ? 'ابدأ رحلتك المعرفية' : 'Start Your Journey')}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8 font-medium">
                        {priorityLesson
                            ? (language === 'ar'
                                ? `أكمل مسارك في ${subjects.find(s => s.id === priorityLesson.subjectId)?.name}. هناك مهام تنتظرك!`
                                : `Continue your path in ${subjects.find(s => s.id === priorityLesson.subjectId)?.name}. New challenges await!`)
                            : (language === 'ar'
                                ? 'استكشف المواد الدراسية وواصل تقدمك.'
                                : 'Explore subjects and continue your progress.')
                        }
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        {priorityLesson ? (
                            <button
                                onClick={() => navigate(`/subject/${priorityLesson?.subjectId}/branch/${priorityLesson?.branchId}/lesson/${priorityLesson?.lesson.id}`)}
                                className="bg-white text-black font-black px-6 md:px-8 py-3 md:py-4 flex items-center gap-3 rounded hover:bg-white/90 transition-transform hover:scale-105"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                {language === 'ar' ? 'تشغيل المورد' : 'Play Resource'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="bg-white text-black font-black px-6 md:px-8 py-3 md:py-4 flex items-center gap-3 rounded hover:bg-white/90 transition-transform hover:scale-105"
                            >
                                <PlusIcon className="w-6 h-6" />
                                {language === 'ar' ? 'إضافة مادة' : 'Add Subject'}
                            </button>
                        )}

                        <button
                            onClick={isStudying ? handleStopSession : handleStartSession}
                            className={`px-6 md:px-8 py-3 md:py-4 flex items-center gap-3 rounded font-bold border-2 transition-transform hover:scale-105 ${isStudying ? 'bg-red-600/20 border-red-500 text-red-500 animate-pulse' : 'bg-white/10 border-white text-white backdrop-blur-sm hover:bg-white/20'}`}
                        >
                            <ClockIcon className="w-6 h-6" />
                            {isStudying ? (language === 'ar' ? `إيقاف المؤقت (${Math.floor((Date.now() - (startTime || 0)) / 60000)}m)` : `Stop Timer (${Math.floor((Date.now() - (startTime || 0)) / 60000)}m)`) : (language === 'ar' ? 'بدء مؤقت التركيز' : 'Start Focus Timer')}
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-full max-w-2xl mx-auto animate-fade-in relative z-[60] mb-12 px-4 md:px-0">
                <div className="relative group">
                    <div className="absolute inset-0 bg-brand-cyan/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                    <input
                        type="text"
                        placeholder={language === 'ar' ? 'البحث الراداري (محلي + عالمي)...' : 'Radar Search (Local + Global)...'}
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-[var(--glass-bg)] backdrop-blur-2xl border border-[var(--glass-border)] p-4 md:p-5 pl-14 rounded-[2rem] text-[var(--text-primary)] focus:border-brand-cyan/50 outline-none transition-all shadow-glass placeholder-[var(--text-muted)] relative z-[60]"
                    />
                    <SparkleIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-cyan animate-pulse z-[61]" />

                    {searchResults.length > 0 && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-4 bg-[var(--glass-bg)] backdrop-blur-3xl border border-[var(--glass-border)] rounded-3xl p-4 shadow-2xl max-h-[300px] overflow-y-auto animate-scale-up z-[70]">
                            <div className="text-[10px] font-black text-accent-cyan uppercase tracking-widest mb-3 px-2 flex justify-between">
                                <span>Radar Intercepts</span>
                                <span className="text-[var(--text-muted)]">{searchResults.length} units</span>
                            </div>
                            <div className="space-y-2">
                                {searchResults.map(res => (
                                    <div
                                        key={res.ref}
                                        onClick={() => {
                                            if (activeView === 'space') {
                                                setSearchQuery(res.item.name);
                                            } else {
                                                navigate(`/subject/${res.item.subjectId}/branch/${res.item.branchId}/lesson/${res.item.id}`);
                                            }
                                        }}
                                        className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl hover:bg-brand-cyan/20 hover:border-brand-cyan/40 cursor-pointer transition-all flex items-center justify-between group"
                                    >
                                        <div className="truncate">
                                            <div className="text-[var(--text-primary)] font-bold text-sm truncate group-hover:text-brand-cyan transition-colors">{res.item.name}</div>
                                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-black">{res.item.subjectName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 !rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">{language === 'ar' ? 'وقت المذاكرة اليومي' : 'Daily Study Time'}</span>
                        <ClockIcon className="w-6 h-6 text-brand-cyan" />
                    </div>
                    <div className="text-5xl font-black text-[var(--text-primary)]">{dailyTime} <span className="text-xl text-[var(--text-muted)]">min</span></div>
                    <div className="mt-4 h-1.5 w-full bg-[var(--progress-track)] rounded-full overflow-hidden">
                        <div className="h-full bg-brand-cyan" style={{ width: `${Math.min((dailyTime / 180) * 100, 100)}%` }}></div>
                    </div>
                </div>

                <div className="glass-card p-8 !rounded-3xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Concentration Index</span>
                        <TargetIcon className="w-6 h-6 text-accent-green" />
                    </div>
                    <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={focusData}>
                                <Line type="monotone" dataKey="focus" stroke="#10b981" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center font-bold text-accent-green mt-2">
                        Avg: {studySessions.length > 0 ? Math.round(studySessions.reduce((a, b) => a + b.focus_score, 0) / studySessions.length) : 0}%
                    </div>
                </div>

                <div className="bg-brand-cyan p-8 rounded-3xl text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="font-bold uppercase tracking-widest text-xs opacity-70">Study This Now</span>
                        <h3 className="text-3xl font-black mt-2 leading-tight">
                            {priorityLesson ? priorityLesson.lesson.name : "Plan your day!"}
                        </h3>
                        {priorityLesson && (
                            <button
                                onClick={() => navigate(`/subject/${priorityLesson?.subjectId}/branch/${priorityLesson?.branchId}/lesson/${priorityLesson?.lesson.id}`)}
                                className="mt-6 bg-white text-brand-cyan font-bold px-6 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Start Mission
                            </button>
                        )}
                    </div>
                    <BookOpenIcon className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-30 -mt-16 px-6 md:px-12 w-full max-w-[1600px] mx-auto space-y-16 pb-32">
                {activeView === 'space' ? (
                    <div className="h-[70vh] w-full flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-md rounded-[2rem] p-12 text-center border border-white/10 animate-fade-in shadow-2xl">
                        <div className="p-6 bg-brand-purple/20 rounded-full mb-8 animate-pulse text-brand-purple">
                            <SparkleIcon className="w-16 h-16" />
                        </div>
                        <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">
                            {language === 'ar' ? 'الفضاء العميق' : 'Deep Space'}
                        </h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
                            {language === 'ar' ? 'انتقل إلى شاشة الفضاء لتصفح الكون المعرفي الكامل.' : 'Enter the Space view to explore the full knowledge universe.'}
                        </p>
                        <button
                            onClick={() => navigate('/space')}
                            className="bg-ott-gradient font-black text-white px-10 py-5 rounded text-xl hover:scale-105 transition-transform shadow-glow-brand"
                        >
                            {language === 'ar' ? 'دخول الفضاء الكامل' : 'Enter Fullscreen Space'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Spaced Repetition Carousel */}
                        {reviewLessons.length > 0 && (
                            <section>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-2">{language === 'ar' ? 'مراجعات مستعجلة' : 'Urgent Reviews'}</h2>
                                <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-2 snap-x scrollbar-hide">
                                    {reviewLessons.map(({ subjectId, branchId, lesson }) => (
                                        <div className="snap-start" key={lesson.id}>
                                            <CourseCard
                                                id={lesson.id}
                                                title={lesson.name}
                                                subtitle={language === 'ar' ? 'المراجعة المطلوبة' : 'Review Required'}
                                                link={`/subject/${subjectId}/branch/${branchId}/lesson/${lesson.id}`}
                                                badgeText={language === 'ar' ? 'مراجعة' : 'Review'}
                                                progress={0}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Subjects Carousel */}
                        <section>
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h2 className="text-2xl md:text-3xl font-bold text-white">{t.subjects}</h2>
                                <button onClick={() => setIsAdding(!isAdding)} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="text-sm font-bold uppercase tracking-wider">{language === 'ar' ? 'إضافة' : 'Add'}</span>
                                </button>
                            </div>

                            {isAdding && (
                                <form onSubmit={handleAddSubject} className="mb-6 mx-2 max-w-md animate-fade-in">
                                    <input
                                        type="text"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        placeholder="Mathematics, Physics..."
                                        className="w-full bg-[#121212] border border-white/20 rounded px-6 py-4 text-white focus:outline-none focus:border-brand-purple transition-all placeholder-gray-500"
                                        autoFocus
                                    />
                                </form>
                            )}

                            {editingSubject && (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (editingSubject.name.trim()) {
                                        await updateSubject(editingSubject.id, editingSubject.name.trim());
                                        setEditingSubject(null);
                                    }
                                }} className="mb-6 mx-2 max-w-md animate-fade-in">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editingSubject.name}
                                            onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                                            className="w-full bg-[#121212] border border-brand-cyan/50 rounded px-6 py-4 text-white focus:outline-none focus:border-brand-cyan transition-all"
                                            autoFocus
                                        />
                                        <button type="button" onClick={() => setEditingSubject(null)} className="px-4 text-gray-400 hover:text-white">
                                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button type="submit" className="px-6 bg-brand-cyan text-white font-bold rounded hover:bg-brand-cyan/80">
                                            {language === 'ar' ? 'حفظ' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-2 snap-x scrollbar-hide">
                                {filteredSubjects.map((subject) => {
                                    let total = 0, done = 0;
                                    subject.branches?.forEach(b => {
                                        total += b.lessons.length;
                                        done += b.lessons.filter(l => l.status === 'completed').length;
                                    });
                                    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                                    return (
                                        <div className="snap-start" key={subject.id}>
                                            <CourseCard
                                                id={subject.id}
                                                title={subject.name}
                                                subtitle={`${total} ${language === 'ar' ? 'دروس' : 'Lessons'}`}
                                                link={`/subject/${subject.id}`}
                                                badgeText={language === 'ar' ? 'مادة' : 'Course'}
                                                progress={percent}
                                                onEdit={isOwner ? () => setEditingSubject({ id: subject.id, name: subject.name }) : undefined}
                                                onDelete={isOwner ? () => deleteSubject(subject.id) : undefined}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Removed fixed floating search */}

            {/* Architect Interface (Supervisor Only) */}
            {isArchitect && (
                <section className="mt-12 mglass-card p-1 !rounded-[3rem] bg-gradient-to-br from-brand-cyan/5 to-accent-cyan/5 overflow-hidden group">
                    <div className="p-8 relative">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-brand-cyan/10 rounded-2xl border border-[var(--glass-border)] shadow-inner">
                                <SparkleIcon className="w-8 h-8 text-accent-cyan animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{language === 'ar' ? 'واجهة المعماري (المشرف)' : 'The Architect Interface'}</h2>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">{language === 'ar' ? 'نظام التحكم المركزي وتوسيع الكون المعرفي' : 'Central Control & Knowledge Expansion'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsAddingLesson(!isAddingLesson)}
                            className="w-full py-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl text-[var(--text-primary)] font-bold hover:border-brand-cyan transition-all flex items-center justify-center gap-3 mb-8 group/btn"
                        >
                            <div className="p-1 bg-brand-cyan/20 rounded-lg group-hover/btn:bg-brand-cyan/40 transition-colors">
                                <PlusIcon className="w-5 h-5 text-accent-cyan" />
                            </div>
                            {language === 'ar' ? 'حقن مورد معرفي جديد (نجم/قمر)' : 'Provision New Knowledge Unit (Star/Moon)'}
                        </button>

                        {isAddingLesson && (
                            <form onSubmit={handleAddLessonArchitect} className="space-y-5 animate-scale-up bg-[var(--glass-bg)] p-6 rounded-3xl border border-[var(--glass-border)] shadow-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-accent-cyan uppercase ml-2">Objective Context</label>
                                        <select
                                            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] focus:border-brand-cyan outline-none transition-all"
                                            value={newLessonData.subjectId}
                                            onChange={(e) => setNewLessonData({ ...newLessonData, subjectId: e.target.value })}
                                        >
                                            <option value="">{language === 'ar' ? 'اختر المادة...' : 'Select Subject...'}</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-accent-cyan uppercase ml-2">Niche Sub-Sector</label>
                                        <select
                                            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] focus:border-brand-cyan outline-none transition-all disabled:opacity-30"
                                            value={newLessonData.branchId}
                                            onChange={(e) => setNewLessonData({ ...newLessonData, branchId: e.target.value })}
                                            disabled={!newLessonData.subjectId}
                                        >
                                            <option value="">{language === 'ar' ? 'اختر الفرع...' : 'Select Branch...'}</option>
                                            {subjects.find(s => s.id === newLessonData.subjectId)?.branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-accent-cyan uppercase ml-2">Knowledge Identifier</label>
                                    <input
                                        type="text"
                                        placeholder={language === 'ar' ? 'اسم المورد المعرفي' : 'Knowledge Resource Name'}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] focus:border-brand-cyan outline-none transition-all"
                                        value={newLessonData.name}
                                        onChange={(e) => setNewLessonData({ ...newLessonData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-2">
                                        <label className="text-[10px] font-black text-accent-cyan uppercase">Knowledge Tags (Strict)</label>
                                        <span className="text-[9px] text-gray-500 font-black">MIN 3 REQUIRED</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={language === 'ar' ? 'كلمة1، كلمة2، كلمة3...' : 'Tag1, Tag2, Tag3...'}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] focus:border-brand-cyan outline-none transition-all"
                                        value={newLessonData.tags}
                                        onChange={(e) => setNewLessonData({ ...newLessonData, tags: e.target.value })}
                                    />
                                </div>
                                <button className="w-full py-5 bg-gradient-to-r from-brand-cyan to-accent-cyan text-white rounded-2xl font-black hover:shadow-[0_0_30px_rgba(0,210,255,0.4)] transition-all transform hover:scale-[1.01] active:scale-[0.99]">
                                    {language === 'ar' ? 'تزامن الفضاء المعرفي' : 'Synchronize Universe Knowledge'}
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            )}


            {/* The Black Panel (Drawer for Error Reflex) */}
            {isPanelOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-end p-6 pointer-events-none">
                    <div className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-md pointer-events-auto" onClick={() => setPanelOpen(false)}></div>
                    <div className="w-full max-w-xl h-full bg-[var(--glass-bg)] backdrop-blur-3xl border border-[var(--glass-border)] rounded-[3rem] shadow-2xl pointer-events-auto animate-slide-left relative overflow-hidden flex flex-col">
                        {/* Close Button & Tabs */}
                        <div className="p-8 pb-4 flex items-center justify-between">
                            {activePanelTab !== 'socratic' ? (
                                <div className="flex bg-[var(--glass-bg)] p-1.5 rounded-2xl border border-[var(--glass-border)]">
                                    <button
                                        onClick={() => setActivePanelTab('radar')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activePanelTab === 'radar' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        Radar
                                    </button>
                                    <button
                                        onClick={() => setActivePanelTab('analytics')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activePanelTab === 'analytics' ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        Analytics
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActivePanelTab('analytics')}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        ← Back to Analytics
                                    </button>
                                </div>
                            )}
                            <button onClick={() => setPanelOpen(false)} className="p-3 bg-[var(--glass-bg)] rounded-2xl hover:bg-[var(--glass-hover-border)] text-[var(--text-primary)] transition-colors">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4">
                            {activePanelTab === 'radar' && (
                                <div className="h-full flex flex-col">
                                    <div className="mb-8">
                                        <div className="text-[10px] font-black text-accent-cyan uppercase tracking-[0.2em] mb-2">Reflex Intervention</div>
                                        <h2 className="text-4xl font-black text-[var(--text-primary)] leading-tight">
                                            {language === 'ar' ? 'تحليل الفجوة المعرفية' : 'Knowledge Gap Analysis'}
                                        </h2>
                                        <p className="text-[var(--text-secondary)] mt-4 text-sm leading-relaxed">
                                            {language === 'ar'
                                                ? `تم رصد صعوبة في موضوع [${reflexKeyword}]. إليك موارد إنقاذ فورية من محرك البحث العالمي.`
                                                : `Difficulty detected in [${reflexKeyword}]. Here are emergency recovery resources from the Global Radar.`
                                            }
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <GoogleSearchModal
                                            isOpen={true}
                                            onClose={() => setPanelOpen(false)}
                                            initialQuery={`${reflexKeyword} ثانوية عامة مصر`}
                                            embeddedMode={true}
                                            onResultSelect={(result) => {
                                                addTempNode({
                                                    id: crypto.randomUUID(),
                                                    name: result.title,
                                                    type: 'temp',
                                                    parentId: reflexSubjectId,
                                                    url: result.url,
                                                    color: '#fbbf24',
                                                    val: 6
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activePanelTab === 'analytics' && (
                                <div className="space-y-8">
                                    <div>
                                        <div className="text-[10px] font-black text-accent-cyan uppercase tracking-[0.2em] mb-2">Neural Patterns</div>
                                        <h2 className="text-4xl font-black text-[var(--text-primary)] leading-tight">
                                            {language === 'ar' ? 'رادار الأخطاء' : 'Error Radar'}
                                        </h2>
                                    </div>
                                    <PatternDashboard
                                        errors={knowledgeErrors}
                                        subjects={subjects}
                                        language={language}
                                        onErrorClick={(err) => {
                                            setSelectedSocraticError(err);
                                            setActivePanelTab('socratic');
                                        }}
                                    />
                                </div>
                            )}

                            {activePanelTab === 'socratic' && selectedSocraticError && (
                                <div className="h-full">
                                    <SocraticBot
                                        lessonId={selectedSocraticError.lesson_id}
                                        lessonName={subjects.flatMap(s => s.branches.flatMap(b => b.lessons)).find(l => l.id === selectedSocraticError.lesson_id)?.name || 'Unknown'}
                                        language={language}
                                        onClose={() => setActivePanelTab('analytics')}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cosmic Knowledge Graph Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                            {language === 'ar' ? 'الفضاء العصبوني' : 'Cosmic Universe'}
                        </h2>
                        <p className="text-[var(--text-muted)] font-medium">
                            {searchQuery ? (language === 'ar' ? `نتائج البحث لـ "${searchQuery}"` : `Search results for "${searchQuery}"`) : (language === 'ar' ? 'خريطة المعرفة التفاعلية' : 'Interactive Knowledge Mind-Map')}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {searchQuery && (
                            <button
                                onClick={() => setShowGlobalSearch(true)}
                                className="px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-cyan/20 transition-all flex items-center gap-2"
                            >
                                <SparkleIcon className="w-4 h-4" />
                                {language === 'ar' ? 'بحث عالمي' : 'Global Search'}
                            </button>
                        )}
                        <button
                            onClick={() => setActiveView(activeView === 'list' ? 'space' : 'list')}
                            className="bg-accent-blue/10 border border-accent-blue/30 text-accent-blue px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-blue/20 transition-all"
                        >
                            {activeView === 'list' ? (language === 'ar' ? 'عرض الفضاء' : 'Space View') : (language === 'ar' ? 'عرض القائمة' : 'List View')}
                        </button>
                    </div>
                </div>

                <div className="h-[500px] md:h-[600px]">
                    <CosmicGraph
                        subjects={subjects}
                        searchQuery={searchQuery}
                        searchResults={searchResults}
                    />
                </div>
            </section>

            {/* Tasks & Deadlines */}
            <section>
                <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight mb-8">{language === 'ar' ? 'المهمات القادمة' : 'Next Missions'}</h2>
                <div className="glass-card !rounded-3xl divide-y divide-[var(--divider)] !transform-none">
                    {tasks.length > 0 ? tasks.map(task => (
                        <div key={task.id} className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-accent-red' : 'bg-accent-blue'}`} />
                                <div>
                                    <div className="text-[var(--text-primary)] font-bold">{task.title}</div>
                                    <div className="text-[var(--text-muted)] text-sm">{new Date(task.due_date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <CalendarIcon className="w-5 h-5 text-[var(--text-muted)]" />
                        </div>
                    )) : (
                        <div className="p-12 text-center text-[var(--text-muted)] font-medium">No upcoming deadlines detected.</div>
                    )}
                </div>
            </section>
            {/* Radial Menu for Space View */}
            {activeView === 'space' && isOwner && (
                <RadialMenu
                    onAddSubject={() => setIsAdding(true)}
                    onAddBranch={() => { /* Implementation would require subject context */ }}
                    onAddLesson={() => { /* Implementation would require branch context */ }}
                />
            )}
        </div>
    );
};

export default DashboardPage;
