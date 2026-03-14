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
            
            {/* Image 1 Pattern: Package Toggle specialized card */}
            <div className="max-w-2xl mx-auto w-full">
                <div className="bg-[#0A0D14] border border-white/5 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center space-y-6">
                    <h2 className="text-sm font-black text-gray-300 tracking-[0.2em] uppercase text-center">
                        {language === 'ar' ? 'باقة الشهور و الثلث الشهور ولا المحاضرات ؟' : 'Monthly Packages or Separate Lectures?'}
                    </h2>
                    <div className="bg-black/40 border border-white/5 p-1.5 rounded-2xl flex items-center gap-1 w-full max-w-md">
                        <button 
                            onClick={() => setActivePackage('separate')}
                            className={`flex-1 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activePackage === 'separate' ? 'text-white bg-white/10 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {language === 'ar' ? 'المحاضرات منفصلة' : 'Separate Lectures'}
                        </button>
                        <button 
                            onClick={() => setActivePackage('packages')}
                            className={`flex-1 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activePackage === 'packages' ? 'text-white bg-brand-cyan shadow-glow-brand' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {language === 'ar' ? 'الباقات وكورسات الشهور' : 'Monthly Packages'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Image 4 Pattern: Precise Subject Selector Card */}
            <div className="flex-center-both gap-2 pt-2 flex-col bg-primSky-950/50 hover:bg-yellow-100 dark:hover:bg-cyan-800 dark:bg-slate-800/50 smooth shadow-md px-4 py-8 rounded-[2rem]">
                <span className="clr-text-primary smooth text-lg text-center font-semibold mb-6">
                    {language === 'ar' ? 'أختر المادة المراد عرض الإشتراكات الخاصة بها' : 'Choose the subject to view its specific subscriptions'}
                </span>
                <div className="react-select__outer-container relative w-full">
                    <div className="w-full flex-center-both flex-col space-y-3 sci-fi">
                        <div className="selector w-full flex flex-wrap justify-center gap-3">
                            {subjects.map((subject) => (
                                <span 
                                    key={subject.id}
                                    onClick={() => setSelectedSubjectId(subject.id)}
                                    data-id={subject.id}
                                    className={`selection smooth py-2 px-3 clr-text-primary text-center flex-col space-y-3 ${selectedSubjectId === subject.id ? 'selected' : ''}`}
                                >
                                    <div className="font-w-bold">{subject.name}</div>
                                </span>
                            ))}
                            {/* Inline Add Button Styled to match */}
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="selection smooth py-2 px-3 clr-text-primary text-center hover:bg-white/10"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
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