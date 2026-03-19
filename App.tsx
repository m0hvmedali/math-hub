import React, { useState, useCallback, createContext, useEffect } from 'react';
import FloatingAIAssistant from './components/FloatingAIAssistant';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import WhiteboardPage from './pages/WhiteboardPage';
import { Subject, CourseBranch, Lesson, StudySession, Task, Importance, Competition, CrashTask, ErrorCause, KnowledgeError, CustomNode, ManualLink } from './types';
import { GlobeIcon, SparkleIcon } from './components/Icons';
import Navigation from './components/Navigation';
import DashboardPage from './pages/DashboardPage';
import SubjectPage from './pages/SubjectPage';
import BranchPage from './pages/BranchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WishesPage from './pages/WishesPage';
import VentingPage from './pages/VentingPage';
import SchedulePage from './pages/SchedulePage';
import LoginPage from './pages/LoginPage';
import DailyAnalysisPage from './pages/DailyAnalysisPage';
import StudyTimerPage from './pages/StudyTimerPage';
import CrashTasksPage from './pages/CrashTasksPage';
import OnboardingStories from './components/OnboardingStories';
import LabAnnouncement from './components/LabAnnouncement';
import SpacePage from './pages/SpacePage';
import GuidePage from './pages/GuidePage';
import DynamoLab from './pages/DynamoLab';
import AlkanesLab from './pages/AlkanesLab';
import LabsPage from './pages/LabsPage';
import IframeLabPage from './pages/IframeLabPage';
import NeuralNotifications from './components/NeuralNotifications';
import ExplainLessonPage from './pages/ExplainLessonPage';
import FloatingSpotifyWidget from './components/FloatingSpotifyWidget';
import FloatingQuickNote from './components/FloatingQuickNote';
import AssistantOverlay from './components/AssistantOverlay';
import SearchOverlay from './components/SearchOverlay';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import SearchHistoryPage from './pages/SearchHistoryPage';
import CurriculumPage from './pages/CurriculumPage';
import MeasuringDevicesLab from './pages/MeasuringDevicesLab';
import OrganicLabPage from './pages/OrganicLabPage';
import NotesPage from './pages/NotesPage';
import { useCosmicStore } from './store/useCosmicStore';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { TimerProvider } from './store/TimerProvider';
import { SpotifyProvider } from './store/SpotifyProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { TasksProvider } from './store/TasksProvider';
import AnalysisPage from './pages/AnalysisPage';
import { ThemeManager } from './utils/ThemeManager';
import { rebuildSearchIndex, searchRadar, SearchResult, fetchTavilyResults } from './utils/searchRadar';
import { hubCore, useHubCore } from './utils/HubCore';
import { initializeAssistantCommands } from './utils/AssistantCommands';
import WisdomLibraryPage from './pages/WisdomLibraryPage';
import FloatingWisdom from './components/FloatingWisdom';
import { WisdomItem, useWisdom } from './hooks/useWisdom';
import GmailPage from './pages/GmailPage';
import GoogleServicesFAB from './components/GoogleServicesFAB';
import DriveBrowserModal from './components/DriveBrowserModal';
import YouTubeBrowserModal from './components/YouTubeBrowserModal';
import TasksBrowserModal from './components/TasksBrowserModal';
import CalendarBrowserModal from './components/CalendarBrowserModal';
import LandingPage from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';


export const AppContext = createContext<{
    subjects: Subject[];
    isLoading: boolean;
    user: string | null;
    login: (name: string) => void;
    addSubject: (name: string) => Promise<void>;
    addBranchToSubject: (subjectId: string, branchName: string, isCapsule?: boolean) => Promise<void>;
    addLessonToBranch: (subjectId: string, branchId: string, lessonName: string, initialContent?: any[], tags?: string[]) => Promise<void>;
    updateLesson: (subjectId: string, branchId: string, updatedLesson: Lesson) => Promise<void>;
    getSubject: (subjectId: string) => Subject | undefined;
    getCourseBranch: (subjectId: string, branchId: string) => CourseBranch | undefined;
    getLesson: (subjectId: string, branchId: string, lessonId: string) => Lesson | undefined;
    updateSubject: (subjectId: string, newName: string) => Promise<void>;
    updateCourseBranch: (subjectId: string, branchId: string, newName: string) => Promise<void>;
    deleteSubject: (subjectId: string) => Promise<void>;
    deleteCourseBranch: (subjectId: string, branchId: string) => Promise<void>;
    deleteLesson: (subjectId: string, branchId: string, lessonId: string) => Promise<void>;
    studySessions: StudySession[];
    tasks: Task[];
    language: 'ar' | 'en';
    setLanguage: (lang: 'ar' | 'en') => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    setIsAssistantOpen: (open: boolean) => void;
    setIsSearchOpen: (open: boolean) => void;
    addStudySession: (duration: number, focusScore: number) => Promise<void>;
    addTask: (title: string, dueDate: string, priority: Importance) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    logKnowledgeError: (lessonId: string, cause: ErrorCause) => Promise<void>;
    knowledgeErrors: KnowledgeError[];
    applySubjectTheme: (subject: Subject) => void;
    resetTheme: () => void;
    customNodes: CustomNode[];
    addCustomNode: (data: { subject_id: string, label: string, url: string, x?: number, y?: number, tags?: string[] }) => Promise<void>;
    manualLinks: ManualLink[];
    addManualLink: (sourceId: string, targetId: string) => Promise<void>;
    currentWisdom: any | null;
    wisdomProgress: any | null;
    fetchNextWisdom: (options?: any) => Promise<void>;
    updateWisdomProgress: (action: 'understand' | 'repeat' | 'favorite') => Promise<void>;
    triggerFloatingWisdom: () => void;
}>({
    subjects: [],
    isLoading: true,
    user: null,
    studySessions: [],
    tasks: [],
    login: () => { },
    addSubject: async () => { },
    addBranchToSubject: async () => { },
    addLessonToBranch: async () => { },
    updateLesson: async () => { },
    getSubject: () => undefined,
    getCourseBranch: () => undefined,
    getLesson: () => undefined,
    updateSubject: async () => { },
    updateCourseBranch: async () => { },
    deleteSubject: async () => { },
    deleteCourseBranch: async () => { },
    deleteLesson: async () => { },
    language: 'ar',
    setLanguage: () => { },
    theme: 'dark',
    toggleTheme: () => { },
    setIsAssistantOpen: () => { },
    setIsSearchOpen: () => { },
    addStudySession: async () => { },
    addTask: async () => { },
    updateTask: async () => { },
    logKnowledgeError: async () => { },
    knowledgeErrors: [],
    applySubjectTheme: () => { },
    resetTheme: () => { },
    customNodes: [],
    addCustomNode: async () => { },
    manualLinks: [],
    addManualLink: async () => { },
    currentWisdom: null,
    wisdomProgress: null,
    fetchNextWisdom: async () => { },
    updateWisdomProgress: async () => { },
    triggerFloatingWisdom: () => { },
});

// Initialize Global Commands once
initializeAssistantCommands();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = localStorage.getItem('study_user');
    // --- HUB CORE MONITORING ---
    useEffect(() => {
      console.log("%c🧠 HUB CORE ACTIVATED", "color: #8B5CF6; font-weight: bold; font-size: 14px;");
      const unsubscribe = hubCore.subscribe((id, action, args) => {
        console.log(`%c[HubCore Action] %c${id} -> ${action}`, "color: #3B82F6", "color: #fff", args);
      });
      return () => { unsubscribe(); };
    }, []);

    // Register App Shell with HubCore
    useHubCore({
      id: 'AppShell',
      state: { user },
      actions: {
        logout: () => { localStorage.clear(); window.location.reload(); }
      }
    });

    if (!user) return <Navigate to="/login" />;
    return <>{children}</>;
};

const App: React.FC = () => {
    if (!isSupabaseConfigured) {
        return <div className="text-white p-10 font-bold text-center">Supabase Configuration Required</div>;
    }

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [studySessions, setStudySessions] = useState<StudySession[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [knowledgeErrors, setKnowledgeErrors] = useState<KnowledgeError[]>([]);
    const [customNodes, setCustomNodes] = useState<CustomNode[]>([]);
    const [manualLinks, setManualLinks] = useState<ManualLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNeuralRecharge, setShowNeuralRecharge] = useState(false);
    const [user, setUser] = useState<string | null>(localStorage.getItem('study_user'));
    const [language, setLanguageState] = useState<'ar' | 'en'>((localStorage.getItem('study_lang') as 'ar' | 'en') || 'ar');
    const [theme, setThemeState] = useState<'dark' | 'light'>((localStorage.getItem('study_theme') as 'dark' | 'light') || 'dark');
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isDriveOpen, setIsDriveOpen] = useState(false);
    const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const { currentWisdom, progress: wisdomProgress, fetchNextWisdom, updateProgress: updateWisdomProgress } = useWisdom(user);

    const [isFloatingVisible, setIsFloatingVisible] = useState(false);
    
    const triggerFloatingWisdom = useCallback(() => {
        if (!user) return;
        fetchNextWisdom({ state: 'night' }); // Mixed content
        setIsFloatingVisible(true);
    }, [user, fetchNextWisdom]);

    // Periodic Floating Wisdom (every 30 mins)
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            triggerFloatingWisdom();
        }, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user, triggerFloatingWisdom]);

    // Global Command Palette Shortcut (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsAssistantOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('study_theme', next);
            if (next === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return next;
        });
    }, []);

    const fetchData = useCallback(async () => {
        if (!user || !supabase) return;
        setIsLoading(true);
        try {
            const results = await Promise.all([
                supabase.from('subjects').select('*, branches(*, lessons(*))').filter('user_id', 'in', `(${user},8128)`).order('created_at'),
                supabase.from('study_sessions').select('*').eq('user_id', user).order('created_at', { ascending: false }),
                supabase.from('tasks').select('*').eq('user_id', user).order('due_date'),
                supabase.from('knowledge_errors').select('*').eq('user_id', user).order('created_at', { ascending: false }),
                supabase.from('custom_nodes').select('*').eq('user_id', user),
                supabase.from('manual_links').select('*').eq('user_id', user)
            ]);

            const [subjectsRes, sessionsRes, tasksRes, knowledgeErrorsRes, customNodesRes, manualLinksRes] = results;
            if (subjectsRes.error) throw subjectsRes.error;
            const fetchedSubjects = subjectsRes.data || [];
            setSubjects(fetchedSubjects);
            setStudySessions(sessionsRes.data || []);
            setTasks(tasksRes.data || []);
            setKnowledgeErrors(knowledgeErrorsRes?.data || []);
            setCustomNodes(customNodesRes?.data || []);
            setManualLinks(manualLinksRes?.data || []);

            // Update Ship Progress
            let totalLessons = 0;
            let completedLessons = 0;
            let totalConnections = 0;

            fetchedSubjects.forEach(s => {
                totalConnections += s.branches?.length || 0; // Connections from Subject to Branches
                s.branches?.forEach(b => {
                    totalLessons += b.lessons?.length || 0;
                    completedLessons += b.lessons?.filter(l => l.status === 'completed').length || 0;
                    totalConnections += b.lessons?.length || 0; // Connections from Branches to Lessons
                });
            });

            // Using the user's specific formula logic via store
            useCosmicStore.getState().updateShipProgress(completedLessons, totalLessons, totalConnections);

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Default color mappings for subjects
    const subjectDefaultColors: Record<string, { primary: string; gradientStart: string; gradientEnd: string; glow: string }> = {
        'رياضيات': { primary: '#ff6b6b', gradientStart: '#ff6b6b', gradientEnd: '#ff8e53', glow: 'rgba(255, 107, 107, 0.5)' },
        'Math': { primary: '#ff6b6b', gradientStart: '#ff6b6b', gradientEnd: '#ff8e53', glow: 'rgba(255, 107, 107, 0.5)' },
        'علوم': { primary: '#4ecdc4', gradientStart: '#4ecdc4', gradientEnd: '#44a08d', glow: 'rgba(78, 205, 196, 0.5)' },
        'Science': { primary: '#4ecdc4', gradientStart: '#4ecdc4', gradientEnd: '#44a08d', glow: 'rgba(78, 205, 196, 0.5)' },
        'إنجليزي': { primary: '#a8e063', gradientStart: '#a8e063', gradientEnd: '#56ab2f', glow: 'rgba(168, 224, 99, 0.5)' },
        'English': { primary: '#a8e063', gradientStart: '#a8e063', gradientEnd: '#56ab2f', glow: 'rgba(168, 224, 99, 0.5)' },
        'تاريخ': { primary: '#ffa07a', gradientStart: '#ffa07a', gradientEnd: '#ff7f50', glow: 'rgba(255, 160, 122, 0.5)' },
        'History': { primary: '#ffa07a', gradientStart: '#ffa07a', gradientEnd: '#ff7f50', glow: 'rgba(255, 160, 122, 0.5)' },
        'فيزياء': { primary: '#9d50bb', gradientStart: '#9d50bb', gradientEnd: '#6e48aa', glow: 'rgba(157, 80, 187, 0.5)' },
        'Physics': { primary: '#9d50bb', gradientStart: '#9d50bb', gradientEnd: '#6e48aa', glow: 'rgba(157, 80, 187, 0.5)' },
        'كيمياء': { primary: '#f093fb', gradientStart: '#f093fb', gradientEnd: '#f5576c', glow: 'rgba(240, 147, 251, 0.5)' },
        'Chemistry': { primary: '#f093fb', gradientStart: '#f093fb', gradientEnd: '#f5576c', glow: 'rgba(240, 147, 251, 0.5)' },
        'أحياء': { primary: '#11998e', gradientStart: '#11998e', gradientEnd: '#38ef7d', glow: 'rgba(17, 153, 142, 0.5)' },
        'Biology': { primary: '#11998e', gradientStart: '#11998e', gradientEnd: '#38ef7d', glow: 'rgba(17, 153, 142, 0.5)' },
    };

    // Apply subject-specific theme to the document root
    const applySubjectTheme = useCallback((themeSource: any) => {
        const root = document.documentElement;

        // If it's a full Subject object, try to extract theme, otherwise treat as theme object
        let themeColor, gradientStart, gradientEnd, glowColor, bgColor;

        if (themeSource.name && subjectDefaultColors[themeSource.name]) {
            // It's a subject with a default mapping
            const defaults = subjectDefaultColors[themeSource.name];
            themeColor = themeSource.themeColor || defaults.primary;
            gradientStart = themeSource.gradientStart || defaults.gradientStart;
            gradientEnd = themeSource.gradientEnd || defaults.gradientEnd;
            glowColor = defaults.glow;
            bgColor = 'var(--bg-base)';
        } else {
            // Treat as a CinematicTheme or generic object
            themeColor = themeSource.primary || themeSource.themeColor || '#3B82F6';
            gradientStart = themeSource.gradientStart || '#3B82F6';
            gradientEnd = themeSource.gradientEnd || '#60A5FA';
            glowColor = themeSource.glow || 'var(--accent-glow)';
            bgColor = themeSource.background || 'var(--bg-base)';
        }

        // Apply CSS variables
        root.style.setProperty('--subject-color', themeColor);
        root.style.setProperty('--subject-gradient-start', gradientStart);
        root.style.setProperty('--subject-gradient-end', gradientEnd);
        root.style.setProperty('--subject-glow', glowColor);
        root.style.setProperty('--subject-bg', bgColor);
    }, []);

    // Reset theme to default colors
    const resetTheme = useCallback(() => {
        const root = document.documentElement;
        root.style.setProperty('--subject-color', 'var(--accent-primary)');
        root.style.setProperty('--subject-gradient-start', 'var(--accent-primary)');
        root.style.setProperty('--subject-gradient-end', '#60A5FA');
        root.style.setProperty('--subject-glow', 'var(--accent-glow)');
        root.style.setProperty('--subject-bg', 'var(--bg-base)');
    }, []);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    useEffect(() => {
        if (!isLoading) {
            rebuildSearchIndex(subjects, customNodes);
        }
    }, [subjects, customNodes, isLoading]);

    // ═══ Dynamic Theme Auto-Rotation Engine ═══
    useEffect(() => {
        if (!user) return;
        // Start rotating full color palette every 60 seconds
        ThemeManager.startAutoRotation(60_000);

        return () => {
            ThemeManager.stopAutoRotation();
        };
    }, [user]);

    // Neural Recharge Logic (3 consecutive mental distractions)
    useEffect(() => {
        if (knowledgeErrors.length >= 3) {
            const lastThree = knowledgeErrors.slice(0, 3);
            const allDistraction = lastThree.every(err => err.cause === 'mental_distraction');
            if (allDistraction) {
                setShowNeuralRecharge(true);
            }
        }
    }, [knowledgeErrors]);

    // Red Pulse (Error Reflex) Listener
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'QUIZ_FAIL') {
                const { topic, keyword } = event.data;
                const subject = subjects.find(s => s.name === topic);
                if (subject) {
                    useCosmicStore.getState().triggerRedPulse(subject.id, keyword || topic);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [subjects]);

    const login = (name: string) => {
        const cleanName = name.trim();
        setUser(cleanName);
        localStorage.setItem('study_user', cleanName);
    };

    const setLanguage = (lang: 'ar' | 'en') => {
        setLanguageState(lang);
        localStorage.setItem('study_lang', lang);
    };

    const addSubject = async (name: string) => {
        if (!user || !supabase) return;

        // Optimistic Update
        const tempId = crypto.randomUUID();
        const newSub: Subject = {
            id: tempId,
            name,
            user_id: user,
            created_at: new Date().toISOString(),
            branches: []
        };
        setSubjects(prev => [...prev, newSub]);

        const { data, error } = await supabase.from('subjects').insert([{ name, user_id: user }]).select();
        if (error) {
            console.error(error);
            // Revert on error
            setSubjects(prev => prev.filter(s => s.id !== tempId));
        } else if (data && data[0]) {
            // Replace tempId with real id
            setSubjects(prev => prev.map(s => s.id === tempId ? { ...s, id: data[0].id } : s));
        }
    };

    const addBranchToSubject = async (subjectId: string, branchName: string, isCapsule: boolean = false) => {
        if (!supabase) return;

        // Optimistic Update
        const tempId = crypto.randomUUID();
        setSubjects(prev => prev.map(s => s.id === subjectId ? {
            ...s,
            branches: [...(s.branches || []), {
                id: tempId,
                subject_id: subjectId,
                name: branchName,
                is_capsule: isCapsule,
                lessons: []
            } as any]
        } : s));

        const { data, error } = await supabase.from('branches').insert([{ subject_id: subjectId, name: branchName, is_capsule: isCapsule }]).select();
        if (error) {
            console.error(error);
            fetchData(); // Fallback to full fetch on error
        } else if (data && data[0]) {
            setSubjects(prev => prev.map(s => s.id === subjectId ? {
                ...s,
                branches: s.branches.map(b => b.id === tempId ? { ...b, id: data[0].id } : b)
            } : s));
        }
    };

    const addLessonToBranch = async (subjectId: string, branchId: string, lessonName: string, initialContent?: any[], tags?: string[]) => {
        if (!supabase) return;
        const tempId = crypto.randomUUID();
        const newLesson: Lesson = {
            id: tempId,
            branch_id: branchId,
            name: lessonName,
            content: initialContent || [],
            status: 'not_started',
            difficulty: 'medium',
            importance: 'medium',
            understanding_level: 'average',
            review_stage: 0,
            tags: tags || []
        };

        setSubjects(prev => prev.map(s => s.id === subjectId ? {
            ...s,
            branches: s.branches.map(b => b.id === branchId ? {
                ...b,
                lessons: [...(b.lessons || []), newLesson]
            } : b)
        } : s));

        const { data, error } = await supabase.from('lessons').insert([{
            branch_id: branchId,
            name: lessonName,
            content: initialContent || [],
            status: 'not_started',
            difficulty: 'medium',
            importance: 'medium',
            understanding_level: 'average',
            review_stage: 0,
            tags: tags || []
        }]).select();

        if (error) {
            console.error(error);
            fetchData();
        } else if (data && data[0]) {
            setSubjects(prev => prev.map(s => s.id === subjectId ? {
                ...s,
                branches: s.branches.map(b => b.id === branchId ? {
                    ...b,
                    lessons: b.lessons.map(l => l.id === tempId ? { ...l, id: data[0].id } : l)
                } : b)
            } : s));

        }
    };

    const updateLesson = async (subjectId: string, branchId: string, updatedLesson: Lesson) => {
        if (!supabase) return;

        // Optimistic Update
        setSubjects(prev => prev.map(s => s.id === subjectId ? {
            ...s,
            branches: s.branches.map(b => b.id === branchId ? {
                ...b,
                lessons: b.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l)
            } : b)
        } : s));

        const { id, ...updateData } = updatedLesson;
        const { error } = await supabase.from('lessons').update(updateData).eq('id', id);
        if (error) {
            console.error(error);
            fetchData(); // Revert on failure
        }
    };

    const updateSubject = async (subjectId: string, newName: string) => {
        if (!supabase) return;

        setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, name: newName } : s));

        const { error } = await supabase.from('subjects').update({ name: newName }).eq('id', subjectId);
        if (error) {
            console.error(error);
            fetchData();
        }
    };

    const updateCourseBranch = async (subjectId: string, branchId: string, newName: string) => {
        if (!supabase) return;

        setSubjects(prev => prev.map(s => s.id === subjectId ? {
            ...s,
            branches: s.branches.map(b => b.id === branchId ? { ...b, name: newName } : b)
        } : s));

        const { error } = await supabase.from('branches').update({ name: newName }).eq('id', branchId);
        if (error) {
            console.error(error);
            fetchData();
        }
    };

    const deleteSubject = async (subjectId: string) => {
        if (!supabase || !window.confirm("Delete entire subject?")) return;

        // Optimistic
        setSubjects(prev => prev.filter(s => s.id !== subjectId));

        const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
        if (error) {
            console.error(error);
            fetchData();
        }
    };

    const deleteCourseBranch = async (subjectId: string, branchId: string) => {
        if (!supabase || !window.confirm("Delete this branch?")) return;

        setSubjects(prev => prev.map(s => s.id === subjectId ? {
            ...s,
            branches: s.branches.filter(b => b.id !== branchId)
        } : s));

        const { error } = await supabase.from('branches').delete().eq('id', branchId);
        if (error) {
            console.error(error);
            fetchData();
        }
    };

    const deleteLesson = async (subjectId: string, branchId: string, lessonId: string) => {
        if (!supabase || !window.confirm("Delete this lesson?")) return;

        setSubjects(prev => prev.map(s => s.id === subjectId ? {
            ...s,
            branches: s.branches.map(b => b.id === branchId ? {
                ...b,
                lessons: b.lessons.filter(l => l.id !== lessonId)
            } : b)
        } : s));

        const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
        if (error) {
            console.error(error);
            fetchData();
        }
    };

    const addStudySession = async (duration: number, focusScore: number) => {
        if (!user || !supabase) return;

        const tempId = crypto.randomUUID();
        const newSession: StudySession = {
            id: tempId,
            user_id: user,
            duration_minutes: duration,
            focus_score: focusScore,
            session_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
        };
        setStudySessions(prev => [newSession, ...prev]);

        const { data, error } = await supabase.from('study_sessions').insert([{
            user_id: user,
            duration_minutes: duration,
            focus_score: focusScore
        }]).select();

        if (error) {
            console.error(error);
            fetchData();
        } else if (data && data[0]) {
            setStudySessions(prev => prev.map(s => s.id === tempId ? { ...s, id: data[0].id } : s));
        }
    };

    const addTask = async (title: string, dueDate: string, priority: Importance) => {
        if (!user || !supabase) return;
        await supabase.from('tasks').insert([{
            user_id: user,
            title,
            due_date: dueDate,
            priority
        }]);
        fetchData();
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        if (!supabase) return;
        await supabase.from('tasks').update(updates).eq('id', taskId);
        fetchData();
    };

    const logKnowledgeError = async (lessonId: string, cause: ErrorCause) => {
        if (!user || !supabase) return;
        const { error } = await supabase.from('knowledge_errors').insert([{
            user_id: user,
            lesson_id: lessonId,
            cause: cause
        }]);
        if (!error) {
            fetchData();
        }
    };

    const addCustomNode = async (data: { subject_id: string, label: string, url: string, x?: number, y?: number, tags?: string[] }) => {
        if (!user || !supabase) return;
        await supabase.from('custom_nodes').insert([{
            user_id: user,
            ...data
        }]);
        fetchData();
    };

    const getSubject = (id: string) => subjects.find(s => s.id === id);
    const getCourseBranch = (subjectId: string, branchId: string) => {
        return subjects.find(s => s.id === subjectId)?.branches?.find(b => b.id === branchId);
    }

    const addManualLink = async (sourceId: string, targetId: string) => {
        if (!user || !supabase) return;
        const { data, error } = await supabase
            .from('manual_links')
            .insert({ user_id: user, source_id: sourceId, target_id: targetId })
            .select()
            .single();

        if (error) {
            console.error("Error adding manual link:", error);
            return;
        }
        if (data) setManualLinks(prev => [...prev, data]);
    };
    const getLesson = (subjectId: string, branchId: string, lessonId: string) => {
        return subjects.find(s => s.id === subjectId)?.branches?.find(b => b.id === branchId)?.lessons?.find(l => l.id === lessonId);
    }

    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const hasOnboarded = localStorage.getItem('onboarding_seen_v2');
        if (!hasOnboarded && user) {
            setShowOnboarding(true);
        }
    }, [user]);

    const handleOnboardingComplete = () => {
        localStorage.setItem('onboarding_seen_v2', 'true');
        setShowOnboarding(false);
    };

    // --- DEEP ACTIVITY TRACKING (HubCore Integration) ---
    useEffect(() => {
        if (!user) return;

        const handleGlobalClick = () => hubCore.execute('System', 'system_click');
        const handleGlobalKey = () => hubCore.execute('System', 'system_keypress');

        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('keydown', handleGlobalKey);

        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('keydown', handleGlobalKey);
        };
    }, [user]);

    // Tracking Page Views
    const GlobalNavigationTracker = () => {
        const location = useLocation();
        useEffect(() => {
            if (user) {
                hubCore.execute('System', 'page_view', location.pathname);
            }
        }, [location, user]);
        return null;
    };

    return (
        <>
            <GlobalNavigationTracker />
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '437211221154-mmtmoo9m4l4o3m5kilejpiaj05nobkhk.apps.googleusercontent.com'}>
            <TasksProvider>
            <SpotifyProvider>
        <TimerProvider>
            <AppContext.Provider value={{
            subjects, isLoading, user, login,
            language, setLanguage,
            theme, toggleTheme,
            addSubject, addBranchToSubject, addLessonToBranch,
            updateLesson, updateSubject, updateCourseBranch, deleteSubject, deleteCourseBranch, deleteLesson,
            getSubject, getCourseBranch, getLesson,
            studySessions, tasks, knowledgeErrors, addStudySession, addTask, updateTask,
            logKnowledgeError,
            applySubjectTheme, resetTheme,
            customNodes, addCustomNode,
            manualLinks, addManualLink,
            setIsAssistantOpen, setIsSearchOpen,
            currentWisdom, wisdomProgress, fetchNextWisdom, updateWisdomProgress,
            triggerFloatingWisdom
        }}>
            <div
                className={`flex flex-col min-h-screen font-sans bg-black transition-colors duration-500 ${language === 'ar' ? 'font-arabic' : ''}`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                style={{ color: 'var(--text-primary)' }}
            >
                {user && <Navigation />}
                {user && <FloatingSpotifyWidget />}
                {user && <FloatingQuickNote />}
                {user && <AssistantOverlay isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />}
                {user && <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
                {user && <DriveBrowserModal isOpen={isDriveOpen} onClose={() => setIsDriveOpen(false)} />}
                {user && <YouTubeBrowserModal isOpen={isYouTubeOpen} onClose={() => setIsYouTubeOpen(false)} />}
                {user && <TasksBrowserModal isOpen={isTasksOpen} onClose={() => setIsTasksOpen(false)} />}
                {user && <CalendarBrowserModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />}
                {user && <FloatingAIAssistant />}
                {user && (
                    <GoogleServicesFAB
                        onOpenGmail={() => { window.location.href = '/gmail'; }}
                        onOpenCalendar={() => setIsCalendarOpen(true)}
                        onOpenTasks={() => setIsTasksOpen(true)}
                        onOpenDrive={() => setIsDriveOpen(true)}
                        onOpenYouTube={() => setIsYouTubeOpen(true)}
                    />
                )}
                {user && (
                    <div className="px-6 py-4 max-w-7xl mx-auto w-full">
                        <NeuralNotifications />
                    </div>
                )}
                {user && <LabAnnouncement />}
                {showOnboarding && <OnboardingStories onComplete={handleOnboardingComplete} />}
                <main className="flex-1 w-full flex flex-col">
                    <Routes>
                        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={login} />} />
                        <Route path="/guide" element={<GuidePage />} />
                        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/curriculum" element={<ProtectedRoute><CurriculumPage /></ProtectedRoute>} />
                        <Route path="/subject/:subjectId" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
                        <Route path="/subject/:subjectId/branch/:branchId/lesson/:lessonId" element={<ProtectedRoute><BranchPage /></ProtectedRoute>} />
                        <Route path="/whiteboard/:type/:id" element={<ProtectedRoute><WhiteboardPage /></ProtectedRoute>} />
                        <Route path="/whiteboard/:type/:id/:subjectId/:branchId/:lessonId" element={<ProtectedRoute><WhiteboardPage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                        <Route path="/wishes" element={<ProtectedRoute><WishesPage /></ProtectedRoute>} />
                        <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
                        <Route path="/daily-analysis" element={<ProtectedRoute><DailyAnalysisPage /></ProtectedRoute>} />
                        <Route path="/timer" element={<ProtectedRoute><StudyTimerPage /></ProtectedRoute>} />
                        <Route path="/space" element={<ProtectedRoute><SpacePage /></ProtectedRoute>} />
                        <Route path="/crash" element={<ProtectedRoute><CrashTasksPage /></ProtectedRoute>} />
                        <Route path="/venting" element={<ProtectedRoute><VentingPage /></ProtectedRoute>} />
                        <Route path="/labs" element={<ProtectedRoute><LabsPage /></ProtectedRoute>} />
                        <Route path="/labs/iframe/:labId" element={<ProtectedRoute><IframeLabPage /></ProtectedRoute>} />
                        <Route path="/labs/smartboard" element={<ProtectedRoute><IframeLabPage manualUrl="https://claude.site/public/artifacts/2c741e5f-a623-4486-a872-18e70fc51a8f/embed" manualTitle="Your Smart board" /></ProtectedRoute>} />
                        <Route path="/labs/function" element={<ProtectedRoute><DynamoLab /></ProtectedRoute>} />
                        <Route path="/labs/alkanes" element={<ProtectedRoute><AlkanesLab /></ProtectedRoute>} />
                        <Route path="/labs/measuring-devices" element={<MeasuringDevicesLab />} />
                        <Route path="/labs/organic" element={<OrganicLabPage />} />
                        <Route path="/explain/:subjectId/:branchId/:lessonId" element={<ExplainLessonPage />} />
                        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                        <Route path="/search-history" element={<ProtectedRoute><SearchHistoryPage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                        <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
                        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                        <Route path="/wisdom" element={<ProtectedRoute><WisdomLibraryPage /></ProtectedRoute>} />
                        <Route path="/gmail" element={<ProtectedRoute><GmailPage /></ProtectedRoute>} />
                    </Routes>
                </main>
            </div>
            {showNeuralRecharge && (
                <div className="fixed inset-0 z-[200] bg-[var(--overlay-bg)] backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="absolute inset-0 bg-gradient-to-t from-accent-blue/20 to-transparent"></div>
                    <div className="relative text-center max-w-lg">
                        <div className="w-24 h-24 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-blue/30 animate-pulse">
                            <span className="text-5xl">⚡</span>
                        </div>
                        <h2 className="text-4xl font-black text-[var(--text-primary)] mb-6 uppercase tracking-tight">
                            {language === 'ar' ? 'شحن النظام العصبي' : 'Neural Recharge Required'}
                        </h2>
                        <p className="text-xl text-[var(--text-secondary)] font-medium mb-12 leading-relaxed">
                            {language === 'ar'
                                ? 'لقد تم رصد نمط تشتت ذهني متكرر. من فضلك، خذ استراحة لمدة 5 دقائق أو قم للصلاة لتجديد طاقتك.'
                                : 'Frequent mental distraction detected. Please take a 5-minute break or stand for prayer to recharge your focus.'
                            }
                        </p>
                        <button
                            onClick={() => setShowNeuralRecharge(false)}
                            className="btn-power px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all"
                        >
                            {language === 'ar' ? 'تم الشحن، دعنا نكمل' : 'Recharged, let\'s continue'}
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Menu */}
            {user && (
                <div className="lg:hidden fixed bottom-0 w-full glass-nav border-t border-[var(--glass-border)] z-[100] px-6 py-4 flex justify-between items-center bg-black/90 backdrop-blur-xl pb-safe">
                    <a href="#/" className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-brand-cyan transition-colors z-[100]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
                    </a>
                    <a href="#/curriculum" className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-brand-cyan transition-colors z-[100]">
                        <GlobeIcon className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'المواد' : 'Materials'}</span>
                    </a>
                    <a href="#/wisdom" className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-brand-cyan transition-colors z-[100]">
                        <SparkleIcon className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'المكتبة' : 'Wisdom'}</span>
                    </a>
                    <a href="#/schedule" className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-brand-cyan transition-colors z-[100]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'الجدول' : 'Schedule'}</span>
                    </a>
                    <a href="#/labs" className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-brand-cyan transition-colors z-[100]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'المعامل' : 'Labs'}</span>
                    </a>
                </div>

            )}
        </AppContext.Provider>
        </TimerProvider>
        </SpotifyProvider>
        </TasksProvider>
        </GoogleOAuthProvider>
        </>
    );
};

export default App;