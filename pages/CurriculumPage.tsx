// d:\Download\math-hub\pages\CurriculumPage.tsx
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { PlusIcon, ChevronRightIcon } from '../components/Icons';
import MaterialCard from '../components/MaterialCard';

const CurriculumPage: React.FC = () => {
    const { subjects, addSubject, language } = useContext(AppContext);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    // UI state for the new patterns
    const [activePackage, setActivePackage] = useState<'packages' | 'separate'>('packages');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(subjects[0]?.id || null);

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubjectName.trim()) {
            await addSubject(newSubjectName.trim());
            setNewSubjectName('');
            setIsAdding(false);
        }
    };

    const filteredSubjects = useMemo(() => {
        if (!selectedSubjectId) return subjects;
        return subjects.filter(s => s.id === selectedSubjectId);
    }, [subjects, selectedSubjectId]);

    return (
        <div className="p-6 md:p-12 max-w-[1600px] mx-auto min-h-screen animate-premium-fade space-y-12">
            
            {/* Image 1 Pattern: Package Toggle */}
            <div className="flex flex-col items-center space-y-8">
                <div className="bg-[#0A0D14] border border-white/5 p-1.5 rounded-2xl flex items-center gap-1">
                    <button 
                        onClick={() => setActivePackage('separate')}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activePackage === 'separate' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-white'}`}
                    >
                        {language === 'ar' ? 'محاضرات منفصلة' : 'Separate Lectures'}
                    </button>
                    <button 
                        onClick={() => setActivePackage('packages')}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activePackage === 'packages' ? 'text-white bg-brand-cyan shadow-glow-brand' : 'text-gray-500 hover:text-white'}`}
                    >
                        {language === 'ar' ? 'الباقات وكورسات الشهور' : 'Monthly Packages'}
                    </button>
                </div>
                <h2 className="text-xl font-black text-white tracking-tighter text-center">
                    {language === 'ar' ? 'أختر المادة المراد عرض الإشتراكات الخاصة بها' : 'Choose the subject to view its specific content'}
                </h2>
            </div>

            {/* Image 1 Pattern: Subject Pill Selector */}
            <div className="bg-[#0A0D14]/60 border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                <div className="flex flex-wrap items-center justify-center gap-4">
                    {subjects.map((subject) => (
                        <button
                            key={subject.id}
                            onClick={() => setSelectedSubjectId(subject.id)}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${
                                selectedSubjectId === subject.id 
                                ? 'bg-brand-cyan border-brand-cyan text-white shadow-glow-brand translate-y-[-2px]' 
                                : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                            }`}
                        >
                            {subject.name}
                        </button>
                    ))}
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-gray-500 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all shadow-xl"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Header / Stats Overlay (Optional refactor of original header) */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-8 border-b border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-brand-cyan rounded-full shadow-glow-brand" />
                        <span className="text-xs font-black tracking-[0.3em] text-brand-cyan uppercase font-outfit">
                            {language === 'ar' ? 'المناهج الدراسية' : 'Selected Curriculum'}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                        {subjects.find(s => s.id === selectedSubjectId)?.name || (language === 'ar' ? 'جميع المواد' : 'All Subjects')}
                    </h1>
                </div>
            </header>

            {/* Add Subject Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-md bg-black/40">
                    <form onSubmit={handleAddSubject} className="bg-space-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg transform animate-scale-up">
                        <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">
                            {language === 'ar' ? 'إنشاء مادة جديدة' : 'Create New Subject'}
                        </h2>
                        <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder={language === 'ar' ? 'اسم المادة (مثلاً: الكيمياء العضوية)' : 'Subject Name (e.g., Organic Chem)'}
                            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-cyan transition-all mb-6 font-bold"
                            autoFocus
                        />
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" className="flex-1 py-4 bg-brand-cyan text-white rounded-2xl font-black hover:bg-brand-cyan/80">
                                {language === 'ar' ? 'تأكيد' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Materials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredSubjects.map((subject) => {
                     const total = subject.branches.reduce((acc, b) => acc + (b.lessons?.length || 0), 0);
                     const completed = subject.branches.reduce((acc, b) => acc + (b.lessons?.filter(l => l.status === 'completed').length || 0), 0);
                     const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

                    return (
                        <MaterialCard
                            key={subject.id}
                            id={subject.id}
                            title={subject.name}
                            subtitle={`${subject.branches.length} ${language === 'ar' ? 'فصل' : 'Branches'}`}
                            link={`/subject/${subject.id}`}
                            progress={percent}
                            badgeText={percent === 100 ? (language === 'ar' ? 'مكتمل' : 'Mastered') : (language === 'ar' ? 'قيد الدراسة' : 'In Progress')}
                            instructor={language === 'ar' ? 'أكاديمية Madrasetna' : 'Madrasetna Academy'}
                        />
                    );
                })}

                {subjects.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem] animate-pulse">
                        <span className="text-4xl mb-6">📚</span>
                        <h3 className="text-2xl font-black text-white mb-2">{language === 'ar' ? 'مكتبتك فارغة' : 'Your Library is Empty'}</h3>
                        <p className="text-gray-500 font-bold mb-8">{language === 'ar' ? 'ابدأ بإضافة المواد الدراسية الخاصة بك هنا' : 'Start by adding your study materials here.'}</p>
                        <button onClick={() => setIsAdding(true)} className="text-brand-cyan font-black hover:underline tracking-widest text-xs uppercase">+ {language === 'ar' ? 'أضف أول مادة' : 'Add Your First Subject'}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurriculumPage;