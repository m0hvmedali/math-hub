// d:\Download\math-hub\pages\SubjectPage.tsx
import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeftIcon, PlusIcon, BookOpenIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon } from '../components/Icons';
import Sidebar from '../components/Sidebar';
import { detectMagicLink } from '../utils/detectMagicLink';
import { supabase } from '../supabaseClient';
import { QuickNote } from '../components/FloatingQuickNote';
import { NavLink } from 'react-router-dom';

const SubjectPage: React.FC = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const { getSubject, addBranchToSubject, updateCourseBranch, deleteCourseBranch, addLessonToBranch, deleteLesson, language, user } = useContext(AppContext) as any;
    const navigate = useNavigate();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [activeTab, setActiveTab] = useState<'content' | 'capsule' | 'about'>('content');
    const [addLessonBranchId, setAddLessonBranchId] = useState<string | null>(null);
    const [newLessonName, setNewLessonName] = useState('');
    const [magicUrl, setMagicUrl] = useState('');
    const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
    const [subjectNotes, setSubjectNotes] = useState<QuickNote[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    const subject = getSubject(subjectId!);
    
    // Safety Guard: Explicitly ensure sidebar is closed on mount or when subject changes
    React.useEffect(() => {
        setIsSidebarOpen(false);
        
        // Fetch notes for this subject
        const fetchSubjectNotes = async () => {
          if (!subjectId || !supabase) return;
          setLoadingNotes(true);
          const { data } = await supabase
            .from('quick_notes')
            .select('*')
            .eq('subject_id', subjectId)
            .order('created_at', { ascending: false });
          if (data) setSubjectNotes(data);
          setLoadingNotes(false);
        };
        fetchSubjectNotes();
    }, [subjectId]);

    if (!subject) return <div className="p-10 text-white font-black text-center min-h-screen flex items-center justify-center">COURSE NOT FOUND.</div>;

    const isOwner = user === subject.user_id;

    const toggleBranch = (id: string) => {
        setExpandedBranches(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddBranch = async () => {
        if (newBranchName.trim() && isOwner) {
            const isCapsule = activeTab === 'capsule';
            await addBranchToSubject(subject.id, newBranchName.trim(), isCapsule);
            setNewBranchName('');
            setIsSidebarOpen(false);
        }
    };

    const handleAddLesson = async () => {
        if (!newLessonName.trim() || !addLessonBranchId || !isOwner) return;
        await addLessonToBranch(subject.id, addLessonBranchId, newLessonName.trim());
        setNewLessonName('');
        setAddLessonBranchId(null);
    };

    const displayBranches = subject.branches?.filter(b => activeTab === 'capsule' ? b.is_capsule : !b.is_capsule) || [];

    return (
        <div className="w-full bg-black min-h-screen text-white pb-32 animate-cinematic relative font-almarai">
            
            {/* Extended Cinematic Hero Banner */}
            <div className="relative w-full min-h-[50vh] flex items-end pb-20 px-6 md:px-16 bg-[#050505]">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                <div className="relative z-20 w-full max-w-[1400px] mx-auto">
                    <button onClick={() => navigate('/curriculum')} className="mb-8 flex items-center text-gray-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest group">
                        <ArrowLeftIcon className={`w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1 ${language === 'ar' ? 'ml-2 transform rotate-180 group-hover:translate-x-1' : ''}`} />
                        {language === 'ar' ? 'العودة للمواد' : 'Back to Materials'}
                    </button>
                    <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter mb-4">
                        {subject.name}
                    </h1>
                </div>
            </div>

            {/* Premium Tabs Menu */}
            <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 mb-12">
                <div className="max-w-[1400px] mx-auto px-6 md:px-16 flex gap-4">
                    {[
                        { id: 'content', label: language === 'ar' ? 'المحتوى والحلقات' : 'Episodes & Content' },
                        { id: 'capsule', label: language === 'ar' ? 'كبسولات سريعة' : 'Flash Capsules' },
                        { id: 'notes', label: language === 'ar' ? 'الملاحظات' : 'Subject Notes' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-6 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-brand-cyan' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-cyan shadow-glow-brand" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Display Grid */}
            <main className="max-w-[1200px] mx-auto px-6 py-12 space-y-8">
                {isOwner && (
                    <div className="flex justify-end mb-8">
                        <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl border border-white/10 transition-all font-black text-[10px] tracking-widest text-gray-400">
                            <PlusIcon className="w-5 h-5 text-brand-cyan" />
                            {language === 'ar' ? 'إضافة فصل جديد' : 'ADD NEW CHAPTER'}
                        </button>
                    </div>
                )}

                <div className="grid gap-8">
                    {displayBranches.map((branch, index) => {
                        const isExpanded = expandedBranches[branch.id];
                        return (
                            <div key={branch.id} className="space-y-4">
                                {/* Image 2 Pattern: Lecture Card */}
                                <div 
                                    className={`bg-[#0A0D14] border-2 ${isExpanded ? 'border-brand-cyan/30 bg-[#0F141F]' : 'border-white/5'} p-8 rounded-[2.5rem] transition-all cursor-pointer group`}
                                    onClick={() => toggleBranch(branch.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-6">
                                            {/* Left: Expansion Chevron */}
                                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-cyan' : 'text-gray-500'}`}>
                                                <ChevronDownIcon className="w-8 h-8" />
                                            </div>
                                            
                                            {/* Middle: Content */}
                                            <div className="space-y-4">
                                                <h2 className="text-4xl md:text-5xl font-black text-white leading-none">
                                                    {branch.name}
                                                </h2>
                                                <div className="flex flex-col gap-1 text-gray-500 text-sm font-bold">
                                                    {branch.lessons?.slice(0, 3).map((l: any) => (
                                                        <div key={l.id} className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                                                            {l.name}
                                                        </div>
                                                    ))}
                                                    {(branch.lessons?.length || 0) > 3 && (
                                                        <div className="text-brand-cyan text-xs mt-1">
                                                            +{branch.lessons.length - 3} {language === 'ar' ? 'دروس إضافية' : 'More Lessons'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Grid Icon */}
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-brand-magenta/80 shadow-inner group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {isOwner && (
                                        <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                                            <button onClick={(e) => { e.stopPropagation(); setAddLessonBranchId(branch.id); }} className="text-[10px] font-black tracking-widest text-brand-cyan uppercase hover:underline">
                                                {language === 'ar' ? '+ إضافة درس' : '+ Add Lesson'}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteCourseBranch(subject.id, branch.id); }} className="text-[10px] font-black tracking-widest text-red-500 uppercase hover:underline">
                                                {language === 'ar' ? 'حذف الفصل' : 'Delete Chapter'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Image 3 Pattern: Lesson Accordion Bars */}
                                {isExpanded && (
                                    <div className="space-y-3 px-8 animate-slide-down">
                                        {branch.lessons?.map((lesson: any) => (
                                            <div 
                                                key={lesson.id}
                                                className="bg-[#2D1A1A] hover:bg-[#3D2525] border border-white/5 py-4 px-8 rounded-2xl flex items-center justify-between transition-all group/lesson shadow-xl"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <span className="text-white text-xl font-black">
                                                        {lesson.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <button 
                                                        onClick={() => navigate(`/subject/${subject.id}/branch/${branch.id}/lesson/${lesson.id}`)}
                                                        className="px-6 py-2 bg-white text-black rounded-xl font-black text-sm transition-transform hover:scale-105 active:scale-95"
                                                    >
                                                        {language === 'ar' ? 'عرض' : 'View'}
                                                    </button>
                                                    {isOwner && (
                                                        <button 
                                                            onClick={() => deleteLesson(subject.id, branch.id, lesson.id)} 
                                                            className="p-2 text-white/30 hover:text-red-500 transition-colors"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Subject Notes Tab Content */}
                {activeTab === 'notes' as any && (
                  <div className="space-y-6 animate-fade-in">
                    {subjectNotes.length === 0 ? (
                      <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <span className="text-5xl mb-4 block">📝</span>
                        <p className="text-gray-500 font-bold">{language === 'ar' ? 'لا توجد ملاحظات لهذه المادة بعد' : 'No notes for this subject yet'}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subjectNotes.map(note => (
                          <div 
                            key={note.id} 
                            className="p-6 rounded-[2rem] border-2 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                            style={{ 
                              borderColor: note.color === 'Yellow' ? '#F59E0B30' : note.color === 'Pink' ? '#EC489930' : note.color === 'Green' ? '#10B98130' : note.color === 'Blue' ? '#3B82F630' : note.color === 'Purple' ? '#8B5CF630' : '#F9731630',
                              borderLeftWidth: '8px',
                              borderLeftColor: note.color === 'Yellow' ? '#F59E0B' : note.color === 'Pink' ? '#EC4899' : note.color === 'Green' ? '#10B981' : note.color === 'Blue' ? '#3B82F6' : note.color === 'Purple' ? '#8B5CF6' : '#F97316'
                            }}
                            onClick={() => navigate(note.page_path)}
                          >
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 flex justify-between">
                              <span>{note.branch_name} {note.lesson_name && ` → ${note.lesson_name}`}</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-lg font-medium text-white mb-4 line-clamp-4" style={{ fontFamily: "'Caveat', cursive, sans-serif" }}>
                              {note.content}
                            </p>
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Go to lesson →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </main>

            {/* Sidebar for Add/Edit */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} title={language === 'ar' ? 'تهيئة فصل جديد' : 'Chapter Management'}>
                {isSidebarOpen && (
                    <div className="space-y-8 p-4">
                        <input
                            type="text"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder={language === 'ar' ? 'اسم الفصل...' : 'Chapter Name...'}
                            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-brand-cyan transition-all font-bold"
                            autoFocus
                        />
                        <button onClick={handleAddBranch} className="w-full bg-brand-cyan py-5 rounded-2xl font-black text-white hover:shadow-glow-brand transition-all">
                            {language === 'ar' ? 'تأكيد الإضافة' : 'Confirm Initialization'}
                        </button>
                    </div>
                )}
            </Sidebar>

            {/* Add Lesson Modal */}
            {addLessonBranchId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-space-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg transform animate-scale-up">
                        <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">{language === 'ar' ? 'إضافة درس جديد' : 'New Lesson'}</h2>
                        <input
                            autoFocus
                            type="text"
                            value={newLessonName}
                            onChange={e => setNewLessonName(e.target.value)}
                            placeholder={language === 'ar' ? 'عنوان الدرس...' : 'Lesson Title...'}
                            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-brand-cyan transition-all mb-8 font-bold"
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setAddLessonBranchId(null)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10">CANCEL</button>
                            <button onClick={handleAddLesson} className="flex-1 py-4 bg-brand-cyan text-white rounded-2xl font-black hover:bg-brand-cyan/80 shadow-glow-brand">SAVE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectPage;
