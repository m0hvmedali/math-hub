import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeftIcon, PlusIcon, BookOpenIcon, ClockIcon, TrashIcon } from '../components/Icons';
import { supabase } from '../supabaseClient';
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

    if (!subject) return <div className="p-10 text-white font-black text-center">COURSE NOT FOUND.</div>;

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
            // Create a new lesson with a single content block based on the result
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
        <div className="w-full bg-black min-h-screen text-white pb-32 animate-fade-in relative -mt-16">

            {/* OTT Course Hero Banner */}
            <div className="relative w-full min-h-[55vh] flex items-end pb-12 px-6 md:px-12 bg-gradient-to-tr from-brand-black to-brand-purple/10">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                <BookOpenIcon className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[80vh] h-[80vh] opacity-5 object-cover pointer-events-none text-brand-purple" />

                <div className="relative z-20 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-24">
                    <div className="max-w-3xl">
                        <button onClick={() => navigate('/')} className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors text-sm font-bold group">
                            <ArrowLeftIcon className={`w-4 h-4 mr-2 ${language === 'ar' ? 'ml-2 transform rotate-180' : ''}`} />
                            {language === 'ar' ? 'العودة الرئيسية' : 'Back to Home'}
                        </button>

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">{subject.name}</h1>

                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-300 font-bold text-sm mb-8">
                            <span className="flex items-center gap-2">
                                <span className="text-brand-magenta">★</span>
                                {totalLessons} {language === 'ar' ? 'درس' : 'Lessons'}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="text-brand-cyan">■</span>
                                {subject.branches?.length || 0} {language === 'ar' ? 'فصل' : 'Chapters'}
                            </span>
                            <span className="flex border border-gray-600 rounded px-2 py-0.5 text-xs text-brand-purple">
                                HD
                            </span>
                            <span className="flex items-center gap-1 border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan rounded px-3 py-1 text-xs uppercase tracking-wider">
                                {language === 'ar' ? 'متاح الآن' : 'Available Now'}
                            </span>
                        </div>

                        {/* Primary Call to Action */}
                        <div className="flex gap-4">
                            {subject.branches?.length > 0 && subject.branches[0].lessons?.length > 0 ? (
                                <button
                                    onClick={() => navigate(`/subject/${subject.id}/branch/${subject.branches[0].id}/lesson/${subject.branches[0].lessons[0].id}`)}
                                    className="bg-white text-black font-black px-10 py-4 flex items-center gap-3 rounded hover:bg-gray-200 transition-transform hover:scale-105"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    {language === 'ar' ? 'ابدأ المشاهدة/الدراسة' : 'Start Watching'}
                                </button>
                            ) : isOwner ? (
                                <button
                                    onClick={() => { setActiveTab('content'); setIsSidebarOpen(true); }}
                                    className="bg-ott-gradient text-white font-black px-10 py-4 flex items-center gap-3 rounded hover:shadow-glow-brand transition-all"
                                >
                                    <PlusIcon className="w-6 h-6" />
                                    {language === 'ar' ? 'أضف الفصل الأول' : 'Add First Chapter'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Interface */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex border-b border-white/10 mb-8 pt-4">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`px-8 py-5 font-bold text-lg md:text-xl transition-colors relative ${activeTab === 'content' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {language === 'ar' ? 'المحتوى والحلقات' : 'Episodes & Content'}
                    {activeTab === 'content' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-purple rounded-t" />}
                </button>
                <button
                    onClick={() => setActiveTab('capsule')}
                    className={`px-8 py-5 font-bold text-lg md:text-xl transition-colors relative ${activeTab === 'capsule' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {language === 'ar' ? 'كبسولات' : 'Capsules'}
                    {activeTab === 'capsule' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-cyan rounded-t" />}
                </button>
                <button
                    onClick={() => setActiveTab('about')}
                    className={`px-8 py-5 font-bold text-lg md:text-xl transition-colors relative ${activeTab === 'about' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {language === 'ar' ? 'عن الدورة' : 'About'}
                    {activeTab === 'about' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-purple rounded-t" />}
                </button>
            </div>

            {/* Content Display */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-4">
                {(activeTab === 'content' || activeTab === 'capsule') && (
                    <div className="space-y-16">
                        {isOwner && (
                            <div className="flex justify-end mb-4">
                                <button onClick={() => setIsSidebarOpen(true)} className={`flex items-center gap-2 transition-colors font-bold text-sm ${activeTab === 'capsule' ? 'text-brand-magenta hover:text-white' : 'text-brand-cyan hover:text-white'}`}>
                                    <PlusIcon className="w-5 h-5" />
                                    {activeTab === 'capsule' ? (language === 'ar' ? 'إضافة كبسولة جديدة' : 'Add New Capsule') : (language === 'ar' ? 'إضافة فصل جديد' : 'Add New Chapter')}
                                </button>
                            </div>
                        )}

                        {displayBranches.map((branch, index) => (
                            <section key={branch.id} className="w-full">
                                <div className="flex items-center justify-between mb-6 gap-4">
                                    {editingBranch?.id === branch.id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={editingBranch.name}
                                                onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        if (editingBranch.name.trim()) {
                                                            await updateCourseBranch(subject.id, branch.id, editingBranch.name.trim());
                                                            setEditingBranch(null);
                                                        }
                                                    }
                                                }}
                                                className="bg-[#121212] border border-brand-cyan/50 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-brand-cyan transition-all w-full max-w-sm"
                                                autoFocus
                                            />
                                            <button onClick={() => setEditingBranch(null)} className="px-3 text-gray-400 hover:text-white text-sm">
                                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                            </button>
                                            <button onClick={async () => {
                                                if (editingBranch.name.trim()) {
                                                    await updateCourseBranch(subject.id, branch.id, editingBranch.name.trim());
                                                    setEditingBranch(null);
                                                }
                                            }} className="px-4 bg-brand-cyan text-white text-sm font-bold rounded-xl hover:bg-brand-cyan/80">
                                                {language === 'ar' ? 'حفظ' : 'Save'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                                                <span className="text-gray-500 text-xl font-medium">{index + 1}.</span> {branch.name}
                                            </h2>
                                            {isOwner && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 /* override for mobile/easier UX */ }}>
                                                    <button
                                                        onClick={() => setEditingBranch({ id: branch.id, name: branch.name })}
                                                        className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                                        title={activeTab === 'capsule' ? "Edit Capsule" : "Edit Branch"}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCourseBranch(subject.id, branch.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title={activeTab === 'capsule' ? "Delete Capsule" : "Delete Branch"}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isOwner && editingBranch?.id !== branch.id && (
                                        <div className="flex items-center gap-4 shrink-0">
                                            {/* Magic Add Input */}
                                            <div className="hidden md:flex items-center relative group">
                                                <input
                                                    type="url"
                                                    value={addLessonBranchId === branch.id ? '' : magicUrl}
                                                    onChange={(e) => setMagicUrl(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd(branch.id, magicUrl)}
                                                    placeholder={language === 'ar' ? 'الصق رابط سحري...' : 'Paste Magic Link...'}
                                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-purple/50 w-48 transition-all group-hover:w-64 placeholder:text-gray-600"
                                                />
                                                <div className="absolute right-2 text-[10px] text-gray-500 pointer-events-none group-hover:opacity-0 transition-opacity">✨</div>
                                            </div>

                                            {addLessonBranchId === branch.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={newLessonName}
                                                        onChange={e => setNewLessonName(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddLesson()}
                                                        placeholder={language === 'ar' ? 'الاسم...' : 'Name...'}
                                                        className="bg-black border border-brand-cyan/40 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-brand-cyan w-44"
                                                    />
                                                    <button onClick={handleAddLesson} className="text-xs font-black text-brand-cyan hover:text-white transition-colors px-2 py-1.5 bg-brand-cyan/20 rounded-lg border border-brand-cyan/30">
                                                        {language === 'ar' ? 'حفظ' : 'Save'}
                                                    </button>
                                                    <button onClick={() => { setAddLessonBranchId(null); setNewLessonName(''); }} className="text-xs text-gray-500 hover:text-white transition-colors">
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAddLessonBranchId(branch.id)}
                                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${activeTab === 'capsule' ? 'text-brand-magenta hover:text-white bg-brand-magenta/10 hover:bg-brand-magenta/20 border border-brand-magenta/20' : 'text-brand-cyan hover:text-white bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20'}`}
                                                >
                                                    <PlusIcon className="w-3.5 h-3.5" />
                                                    {activeTab === 'capsule' ? (language === 'ar' ? '+ إضافة' : '+ Item') : (language === 'ar' ? '+ درس' : '+ Lesson')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {branch.lessons && branch.lessons.length > 0 ? (
                                    <div className="flex gap-4 overflow-x-auto pb-8 snap-x scrollbar-hide">
                                        {branch.lessons.map((lesson, idx) => (
                                            <div className="snap-start" key={lesson.id}>
                                                <CourseCard
                                                    id={lesson.id}
                                                    title={lesson.name}
                                                    subtitle={activeTab === 'capsule' ? (language === 'ar' ? 'عنصر' : 'Item') : `${language === 'ar' ? 'الحلقة' : 'Episode'} ${idx + 1}`}
                                                    link={`/subject/${subject.id}/branch/${branch.id}/lesson/${lesson.id}`}
                                                    badgeText={lesson.status === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Done') : undefined}
                                                    progress={lesson.status === 'completed' ? 100 : (lesson.status === 'in_progress' ? 50 : 0)}
                                                    onDelete={isOwner ? () => deleteLesson(subject.id, branch.id, lesson.id) : undefined}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 px-6 border border-white/5 bg-white/5 rounded-xl text-center">
                                        <p className="text-gray-500 font-bold mb-4">{activeTab === 'capsule' ? (language === 'ar' ? 'لا توجد كبسولات مضافة هنا.' : 'No capsules here yet.') : (language === 'ar' ? 'لا توجد دروس في هذا الفصل حتى الآن.' : 'No content available in this chapter yet.')}</p>
                                    </div>
                                )}
                            </section>
                        ))}

                        {displayBranches.length === 0 && (
                            <div className="py-24 text-center">
                                <p className="text-gray-500 text-xl font-bold">{language === 'ar' ? 'المحتوى قريباً...' : 'Content Coming Soon...'}</p>
                            </div>
                        )}

                        {isOwner && (
                            <div className="py-8 flex justify-center">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className={`flex items-center gap-2 px-6 py-3 border border-dashed rounded-xl font-bold text-sm transition-all ${activeTab === 'capsule' ? 'border-brand-magenta/40 text-brand-magenta hover:border-brand-magenta hover:bg-brand-magenta/10' : 'border-brand-purple/40 text-brand-purple hover:border-brand-purple hover:bg-brand-purple/10'}`}
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    {activeTab === 'capsule' ? (language === 'ar' ? '+ إضافة كبسولة جديدة' : '+ Add New Capsule') : (language === 'ar' ? '+ إضافة فصل جديد' : '+ Add New Chapter')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="max-w-3xl space-y-8 animate-fade-in text-gray-300 leading-relaxed text-lg">
                        <p>
                            {language === 'ar'
                                ? `هذه الدورة تركز على إتقان مهارات ${subject.name} باستخدام المحتوى التفاعلي وأساليب التكرار المتباعد.`
                                : `This course zeroes in on mastering ${subject.name} through interactive content and spaced repetition methods.`}
                        </p>
                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                            <div>
                                <h3 className="text-white font-bold mb-2">{language === 'ar' ? 'اللغة' : 'Language'}</h3>
                                <p>{language === 'ar' ? 'العربية' : 'Arabic'}</p>
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-2">{language === 'ar' ? 'المستوى' : 'Level'}</h3>
                                <p>{language === 'ar' ? 'لجميع المستويات' : 'All Levels'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar for Add Branch */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                title={language === 'ar' ? 'إضافة فصل جديد' : 'Initialize Branch'}
            >
                <div className="space-y-6">
                    <p className="text-gray-400 font-bold text-sm leading-relaxed">
                        {language === 'ar' ? 'الفصل هو حاوية للدروس والحلقات. قم بتسميته.' : 'Define a new operational module to hold lessons.'}
                    </p>
                    <div>
                        <input
                            type="text"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder={language === 'ar' ? 'مثال: الجبر المتقدم' : 'e.g. Advanced Algebra'}
                            className="w-full bg-[#121212] border border-white/10 rounded px-6 py-4 text-white focus:outline-none focus:border-brand-purple transition-all placeholder-gray-600"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddBranch()}
                        />
                    </div>
                    <button
                        onClick={handleAddBranch}
                        disabled={!newBranchName.trim()}
                        className="w-full bg-ott-gradient py-4 rounded font-black text-white disabled:opacity-50 transition-transform hover:scale-[1.02]"
                    >
                        {language === 'ar' ? 'إضافة الفصل' : 'Add Chapter'}
                    </button>
                </div>
            </Sidebar>
        </div>
    );
};

export default SubjectPage;
