import React, { useState, useEffect } from 'react';
import { XIcon, SearchIcon, PlusIcon, SparkleIcon, GlobeIcon, LinkIcon } from './Icons';
import { searchRadar, SearchResult } from '../utils/searchRadar';
import { Subject } from '../types';

interface NodeInjectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: Subject[];
    onInject: (data: { type: 'internal' | 'external', label: string, url: string, subjectId: string, tags?: string[] }) => void;
    language: 'ar' | 'en';
}

const NodeInjectorModal: React.FC<NodeInjectorModalProps> = ({ isOpen, onClose, subjects, onInject, language }) => {
    const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [externalData, setExternalData] = useState({ label: '', url: '', subjectId: subjects[0]?.id || '', tagsInput: '' });

    useEffect(() => {
        if (searchQuery.trim()) {
            setResults(searchRadar(searchQuery));
        } else {
            setResults([]);
        }
    }, [searchQuery]);

    if (!isOpen) return null;

    const handleInternalInject = (res: SearchResult) => {
        onInject({
            type: 'internal',
            label: res.item.name,
            url: `/subject/${res.item.subjectId}/branch/${res.item.branchId}/lesson/${res.item.id}`,
            subjectId: res.item.subjectId
        });
        onClose();
        setSearchQuery('');
    };

    const handleExternalInject = (e: React.FormEvent) => {
        e.preventDefault();
        onInject({
            type: 'external',
            label: externalData.label,
            url: externalData.url,
            subjectId: externalData.subjectId,
            tags: externalData.tagsInput.split('_').map(t => t.trim()).filter(Boolean)
        });
        onClose();
        setExternalData({ label: '', url: '', subjectId: subjects[0]?.id || '', tagsInput: '' });
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-cinematic-card border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white">{language === 'ar' ? 'مهندس الفضاء' : 'Space Engineer'}</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{language === 'ar' ? 'حقن الموارد الذكية' : 'Inject Smart Resources'}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-black/20 gap-2">
                    <button
                        onClick={() => setActiveTab('internal')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'internal' ? 'bg-accent-blue text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        {language === 'ar' ? 'مورد داخلي' : 'Internal Resource'}
                    </button>
                    <button
                        onClick={() => setActiveTab('external')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'external' ? 'bg-accent-blue text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        {language === 'ar' ? 'مورد خارجي' : 'External Resource'}
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {activeTab === 'internal' ? (
                        <div className="space-y-6">
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder={language === 'ar' ? 'ابحث في القائمة...' : 'Search list...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-white focus:border-accent-blue outline-none"
                                />
                            </div>
                            <div className="space-y-4">
                                {subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.branches.some(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))).map(subject => (
                                    <div key={subject.id} className="space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                                            <div className="font-black text-white">{subject.name}</div>
                                            <button
                                                onClick={() => onInject({ type: 'internal', label: subject.name, url: `/subject/${subject.id}`, subjectId: subject.id })}
                                                className="px-3 py-1.5 bg-accent-blue/20 text-accent-blue rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {language === 'ar' ? 'حقن كوكب' : 'Inject Planet'}
                                            </button>
                                        </div>
                                        <div className="ml-6 space-y-2 border-l border-white/10 pl-4 py-2">
                                            {subject.branches.map(branch => (
                                                <div key={branch.id} className="space-y-1">
                                                    <div className="flex items-center justify-between group">
                                                        <div className="text-sm font-bold text-gray-300">{branch.name}</div>
                                                        <button
                                                            onClick={() => onInject({ type: 'internal', label: branch.name, url: `/subject/${subject.id}/branch/${branch.id}`, subjectId: subject.id })}
                                                            className="px-2 py-1 bg-white/5 text-gray-400 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            {language === 'ar' ? 'حقن مدار' : 'Inject Orbit'}
                                                        </button>
                                                    </div>
                                                    <div className="ml-4 space-y-1">
                                                        {branch.lessons.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).map(lesson => (
                                                            <div key={lesson.id} className="flex items-center justify-between group py-1">
                                                                <div className="text-xs text-gray-500">{lesson.name}</div>
                                                                <button
                                                                    onClick={() => onInject({ type: 'internal', label: lesson.name, url: `/subject/${subject.id}/branch/${branch.id}/lesson/${lesson.id}`, subjectId: subject.id })}
                                                                    className="text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <PlusIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleExternalInject} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">{language === 'ar' ? 'العنوان' : 'Label'}</label>
                                <input
                                    required
                                    type="text"
                                    value={externalData.label}
                                    onChange={e => setExternalData(prev => ({ ...prev, label: e.target.value }))}
                                    placeholder="e.g. شرح يوتيوب"
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white focus:border-accent-blue outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">URL</label>
                                <input
                                    required
                                    type="url"
                                    value={externalData.url}
                                    onChange={e => setExternalData(prev => ({ ...prev, url: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white focus:border-accent-blue outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">{language === 'ar' ? 'المادة' : 'Subject'}</label>
                                <select
                                    value={externalData.subjectId}
                                    onChange={e => setExternalData(prev => ({ ...prev, subjectId: e.target.value }))}
                                    className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl text-white focus:border-accent-blue outline-none appearance-none cursor-pointer"
                                >
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">{language === 'ar' ? 'الكلمات المفتاحية (افصل بـ _)' : 'Keywords/Tags (Use _ to separate)'}</label>
                                <input
                                    type="text"
                                    value={externalData.tagsInput}
                                    onChange={e => setExternalData(prev => ({ ...prev, tagsInput: e.target.value }))}
                                    placeholder="e.g. math_algebra_calculus"
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white focus:border-accent-blue outline-none font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-accent-blue py-4 rounded-2xl text-white font-black text-lg hover:scale-[1.02] transition-transform shadow-xl shadow-blue-900/20"
                            >
                                {language === 'ar' ? 'حقن المورد' : 'Inject Resource'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NodeInjectorModal;
