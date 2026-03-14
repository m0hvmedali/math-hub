import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { PlusIcon } from '../components/Icons';
import MaterialCard from '../components/MaterialCard';

const CurriculumPage: React.FC = () => {
    const { subjects, addSubject, language } = useContext(AppContext);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubjectName.trim()) {
            await addSubject(newSubjectName.trim());
            setNewSubjectName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="p-6 md:p-12 max-w-[1600px] mx-auto min-h-screen animate-premium-fade">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-brand-cyan rounded-full shadow-glow-brand" />
                        <span className="text-xs font-black tracking-[0.3em] text-brand-cyan uppercase font-outfit">
                            {language === 'ar' ? 'المناهج الدراسية' : 'Academic Curriculum'}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                        {language === 'ar' ? 'موادي والمناهج' : 'My Materials'}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-ott-gradient hover:shadow-glow-brand text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        <PlusIcon className="w-5 h-5" />
                        {language === 'ar' ? 'إضافة مادة' : 'Add Subject'}
                    </button>
                </div>
            </header>

            {/* Add Subject Modal/Form Overlay */}
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
                            <button 
                                type="button" 
                                onClick={() => setIsAdding(false)}
                                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10 transition-colors"
                            >
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-4 bg-brand-cyan text-white rounded-2xl font-black hover:bg-brand-cyan/80 transition-all hover:scale-[1.02]"
                            >
                                {language === 'ar' ? 'تأكيد' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Materials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {subjects.map((subject) => {
                     // Calculate stats
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
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <span className="text-4xl">📚</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">
                            {language === 'ar' ? 'مكتبتك فارغة' : 'Your Library is Empty'}
                        </h3>
                        <p className="text-gray-500 font-bold mb-8">
                            {language === 'ar' ? 'ابدأ بإضافة المواد الدراسية الخاصة بك هنا' : 'Start by adding your study materials here.'}
                        </p>
                        <button onClick={() => setIsAdding(true)} className="text-brand-cyan font-black hover:underline uppercase tracking-widest text-xs">
                            {language === 'ar' ? '+ أضف أول مادة' : '+ Add Your First Subject'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurriculumPage;