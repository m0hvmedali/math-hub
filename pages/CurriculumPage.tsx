import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { NavLink } from 'react-router-dom';
import { ChevronRightIcon, PlusIcon, TrashIcon } from '../components/Icons';

const CurriculumPage: React.FC = () => {
    // Fixed: Use subjects, addSubject, deleteSubject from AppContext
    const { subjects, addSubject, deleteSubject } = useContext(AppContext);
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
        <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen">
             <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Curriculum Roadmap</h1>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-neon-violet hover:bg-neon-violet/80 text-white p-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddSubject} className="mb-8 animate-fade-in bg-space-800 p-4 rounded-xl border border-space-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder="Subject Name (e.g., Calculus II)"
                            className="flex-1 bg-space-900 border border-space-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-neon-violet"
                            autoFocus
                        />
                        <button type="submit" className="bg-white text-black font-bold px-6 py-2 rounded-lg hover:bg-gray-200">
                            Create
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 gap-4">
                {subjects.map((subject) => {
                     // Calculate stats across all branches in the subject
                     const total = subject.branches.reduce((acc, b) => acc + (b.lessons?.length || 0), 0);
                     const completed = subject.branches.reduce((acc, b) => acc + (b.lessons?.filter(l => l.status === 'completed').length || 0), 0);
                     const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

                    return (
                        <div key={subject.id} className="group bg-space-900 border border-space-800 hover:border-neon-cyan/50 rounded-xl p-6 transition-all duration-300 relative overflow-hidden">
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-neon-cyan to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             
                             <div className="flex items-start justify-between relative z-10">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-cyan transition-colors">{subject.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                        <span>{subject.branches.length} Branches</span>
                                        <span>•</span>
                                        <span>{percent}% Complete</span>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full bg-space-800 h-1.5 rounded-full overflow-hidden max-w-md">
                                        <div 
                                            className="bg-neon-cyan h-full rounded-full" 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <NavLink 
                                        to={`/subject/${subject.id}`}
                                        className="p-2 bg-space-800 rounded-full hover:bg-neon-cyan hover:text-black transition-colors"
                                    >
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </NavLink>
                                    
                                    <button 
                                        onClick={() => deleteSubject(subject.id)}
                                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>

                             {subject.branches.length === 0 && (
                                <div className="mt-4 pt-4 border-t border-space-800 flex justify-end">
                                    <span className="text-xs text-gray-500">No branches yet.</span>
                                </div>
                             )}
                        </div>
                    );
                })}

                {subjects.length === 0 && (
                    <div className="text-center py-20 bg-space-900/50 rounded-xl border border-dashed border-space-700">
                        <p className="text-gray-400 mb-4">Your curriculum is empty.</p>
                        <button onClick={() => setIsAdding(true)} className="text-neon-cyan hover:underline">Start by adding a Subject</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurriculumPage;