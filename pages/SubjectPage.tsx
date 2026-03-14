import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeftIcon, PlusIcon, BookOpenIcon, TrashIcon, ChevronRightIcon } from '../components/Icons';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';
import { detectMagicLink } from '../utils/detectMagicLink';

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
    const [editingBranch, setEditingBranch] = useState<{ id: string, name: string } | null>(null);

    const subject = getSubject(subjectId!);

    if (!subject) return <div className="p-10 text-white font-black text-center min-h-screen flex items-center justify-center">COURSE NOT FOUND.</div>;

    const isOwner = user === subject.user_id;

    // Calculate metadata
    let totalLessons = 0;
    subject.branches?.forEach(b => {
        totalLessons += b.lessons?.length || 0;
    });

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
        if (addLessonToBranch) {
            await addLessonToBranch(subject.id, addLessonBranchId, newLessonName.trim());
        }
        setNewLessonName('');
        setAddLessonBranchId(null);
    };

    const handleMagicAdd = async (branchId: string, url: string) => {
        if (!url.trim() || !isOwner) return;
        const result = detectMagicLink(url.trim());
        if (result && addLessonToBranch) {
            const newContentBlock = {
                id: crypto.randomUUID(),
                type: result.type,
                content: result.content,
                url: result.content,
                fileName: result.title,
                color: result.color
            };
            await addLessonToBranch(subject.id, branchId, result.title, [newContentBlock]);
            setMagicUrl('');
        }
    };

    const displayBranches = subject.branches?.filter(b => activeTab === 'capsule' ? b.is_capsule : !b.is_capsule) || [];

    return (
        <div className="w-full bg-black min-h-screen text-white pb-32 animate-premium-fade relative">
            
            {/* Extended Cinematic Hero Banner */}
            <div className="relative w-full min-h-[65vh] flex items-end pb-20 px-6 md:px-16 bg-[#050505]">
                {/* Background Graphics */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                    <BookOpenIcon className="absolute -top-20 -right-20 w-[100vh] h-[100vh] text-brand-cyan blur-3xl opacity-20" />
                </div>

                <div className="relative z-20 w-full max-w-[1600px] mx-auto animate-premium-fade">
                    <button onClick={() => navigate('/curriculum')} className="mb-8 flex items-center text-gray-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest group">
                        <ArrowLeftIcon className={`w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1 ${language === 'ar' ? 'ml-2 transform rotate-180 group-hover:translate-x-1 font-almarai' : ''}`} />
                        {language === 'ar' ? 'العودة للمواد' : 'Back to Materials'}
                    </button>

                    <div className="max-w-4xl space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="bg-brand-cyan/20 text-brand-cyan px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-cyan/30">
                                {language === 'ar' ? 'مادة دراسية' : 'Academic Course'}
                            </span>
                            <span className="text-gray-500 font-bold text-xs">•</span>
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-tighter">
                                {totalLessons} {language === 'ar' ? 'حصة تعليمية' : 'Lessons'}
                            </span>
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tighter font-almarai">
                            {subject.name}
                        </h1>

                        <p className="text-gray-400 text-lg font-medium max-w-2xl leading-relaxed">
                            {language === 'ar' 
                                ? 'استكشف المنهج الكامل بطريقة تفاعلية حديثة مع دعم الذكاء الاصطناعي والتحليل اليومي لمستواك.' 
                                : 'Explore the full curriculum in a modern interactive way with AI support and daily analysis of your level.'}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-6">
                            {subject.branches?.length > 0 && subject.branches[0].lessons?.length > 0 ? (
                                <button
                                    onClick={() => navigate(`/subject/${subject.id}/branch/${subject.branches[0].id}/lesson/${subject.branches[0].lessons[0].id}`)}
                                    className="bg-white text-black font-black px-12 py-5 flex items-center gap-3 rounded-2xl hover:scale-105 transition-all shadow-glow-white active:scale-95"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    {language === 'ar' ? 'بدء التعلم الآن' : 'Start Learning Now'}
                                </button>
                            ) : isOwner ? (
                                <button
                                    onClick={() => { setActiveTab('content'); setIsSidebarOpen(true); }}
                                    className="bg-brand-cyan text-white font-black px-12 py-5 flex items-center gap-3 rounded-2xl hover:shadow-glow-brand transition-all active:scale-95"
                                >
                                    <PlusIcon className="w-6 h-6" />
                                    {language === 'ar' ? 'أضف الفصل الأول' : 'Add First Chapter'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Tabs Menu */}
            <div className="sticky top-16 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 md:px-16 flex gap-4">
                    {[
                        { id: 'content', label: language === 'ar' ? 'المحتوى والحلقات' : 'Episodes & Content' },
                        { id: 'capsule', label: language === 'ar' ? 'كبسولات سريعة' : 'Flash Capsules' },
                        { id: 'about', label: language === 'ar' ? 'عن المادة' : 'About Course' }
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
            <main className="max-w-[1600px] mx-auto px-6 md:px-16 py-12">
                {(activeTab === 'content' || activeTab === 'capsule') && (
                    <div className="space-y-24">
                        {isOwner && (
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setIsSidebarOpen(true)} 
                                    className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl border border-white/10 transition-all font-black text-[10px] tracking-widest text-gray-400 hover:text-white"
                                >
                                    <PlusIcon className="w-5 h-5 text-brand-cyan" />
                                    {activeTab === 'capsule' ? (language === 'ar' ? 'إضافة كبسولة' : 'ADD CAPSULE') : (language === 'ar' ? 'إضافة فصل' : 'ADD CHAPTER')}
                                </button>
                            </div>
                        )}

                        {displayBranches.map((branch, index) => (
                            <section key={branch.id} className="animate-premium-fade">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-2xl text-brand-cyan shadow-inner">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight font-almarai group flex items-center gap-4">
                                            {branch.name}
                                            {isOwner && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingBranch({ id: branch.id, name: branch.name })} className="p-2 text-gray-600 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                    <button onClick={() => deleteCourseBranch(subject.id, branch.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </h2>
                                    </div>

                                    {isOwner && (
                                        <div className="flex items-center gap-4">
                                             <div className="relative group/magic">
                                                <input
                                                    type="url"
                                                    value={addLessonBranchId === branch.id ? '' : magicUrl}
                                                    onChange={(e) => setMagicUrl(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd(branch.id, magicUrl)}
                                                    placeholder={language === 'ar' ? 'رابط سحري...' : 'Magic Link...'}
                                                    className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-xs text-white focus:outline-none focus:border-brand-cyan/50 w-40 hover:w-60 focus:w-60 transition-all placeholder:text-gray-700 font-bold"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-40 group-hover/magic:opacity-100 transition-opacity">✨</div>
                                            </div>

                                            <button
                                                onClick={() => setAddLessonBranchId(branch.id)}
                                                className="bg-brand-cyan text-black px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow-brand"
                                            >
                                                {language === 'ar' ? '+ إضافة درس' : '+ ADD LESSON'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {branch.lessons && branch.lessons.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {branch.lessons.map((lesson, idx) => (
                                            <CourseCard
                                                key={lesson.id}
                                                id={lesson.id}
                                                title={lesson.name}
                                                subtitle={activeTab === 'capsule' ? (language === 'ar' ? 'كبسولة مهارات' : 'Skill Capsule') : `${language === 'ar' ? 'الحلقة' : 'Episode'} ${idx + 1}`}
                                                link={`/subject/${subject.id}/branch/${branch.id}/lesson/${lesson.id}`}
                                                badgeText={lesson.status === 'completed' ? (language === 'ar' ? 'مهمة منجزة' : 'Done') : undefined}
                                                progress={lesson.status === 'completed' ? 100 : (lesson.status === 'in_progress' ? 50 : 0)}
                                                onDelete={isOwner ? () => deleteLesson(subject.id, branch.id, lesson.id) : undefined}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                                        <p className="text-gray-600 font-black text-xs uppercase tracking-[0.3em]">No Transmission Detected</p>
                                    </div>
                                )}
                            </section>
                        ))}

                        {displayBranches.length === 0 && (
                            <div className="py-40 text-center animate-pulse">
                                <h3 className="text-4xl font-black text-white/20 uppercase tracking-[0.5em]">{language === 'ar' ? 'المحتوى قريباً' : 'TRANS-COMING SOON'}</h3>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="max-w-4xl space-y-12 animate-premium-fade">
                        <div className="bg-white/5 border border-white/10 p-12 rounded-[3rem]">
                            <h3 className="text-2xl font-black text-white mb-6 font-almarai">{language === 'ar' ? 'وصف المادة' : 'Course Overview'}</h3>
                            <p className="text-xl text-gray-400 leading-relaxed font-medium">
                                {language === 'ar'
                                    ? `هذه الدورة تركز على إتقان مهارات ${subject.name} باستخدام المحتوى التفاعلي وأساليب التكرار المتباعد.`
                                    : `This course zeroes in on mastering ${subject.name} through interactive content and spaced repetition methods.`}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: language === 'ar' ? 'اللغة' : 'Language', value: language === 'ar' ? 'العربية' : 'Arabic' },
                                { label: language === 'ar' ? 'المستوى' : 'Level', value: language === 'ar' ? 'لجميع المستويات' : 'All Levels' },
                                { label: language === 'ar' ? 'التحديثات' : 'Updates', value: language === 'ar' ? 'يومية' : 'Daily' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-3xl text-center">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">{stat.label}</div>
                                    <div className="text-xl font-black text-brand-cyan">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Sidebar for Add/Edit */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                title={language === 'ar' ? 'تهيئة فصل جديد' : 'Initialize Chapter'}
            >
                <div className="space-y-8 p-4">
                    <p className="text-gray-500 font-bold text-sm leading-relaxed">
                        {language === 'ar' ? 'الفصل هو حاوية منطقية للدروس والكبسولات التعليمية.' : 'Define a new logical container for lessons and capsules.'}
                    </p>
                    <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder={language === 'ar' ? 'اسم الفصل...' : 'Chapter Name...'}
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-brand-cyan transition-all font-bold"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBranch()}
                    />
                    <button
                        onClick={handleAddBranch}
                        disabled={!newBranchName.trim()}
                        className="w-full bg-ott-gradient py-5 rounded-2xl font-black text-white hover:shadow-glow-brand transition-all active:scale-95 disabled:opacity-50"
                    >
                        {language === 'ar' ? 'تأكيد الإضافة' : 'Confirm Initialization'}
                    </button>
                </div>
            </Sidebar>

            {/* In-page Add Lesson Modal */}
            {addLessonBranchId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-space-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg transform animate-scale-up">
                        <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">{language === 'ar' ? 'إضافة درس جديد' : 'Create New Lesson'}</h2>
                        <input
                            autoFocus
                            type="text"
                            value={newLessonName}
                            onChange={e => setNewLessonName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddLesson()}
                            placeholder={language === 'ar' ? 'عنوان الدرس...' : 'Lesson Title...'}
                            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-brand-cyan transition-all mb-8 font-bold"
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setAddLessonBranchId(null)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button onClick={handleAddLesson} className="flex-1 py-4 bg-brand-cyan text-white rounded-2xl font-black hover:bg-brand-cyan/80 shadow-glow-brand">
                                {language === 'ar' ? 'حفظ الدرس' : 'Save Lesson'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectPage;
