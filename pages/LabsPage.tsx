import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BeakerIcon, ActivityIcon, CpuIcon, SparkleIcon, PlusIcon, TrashIcon } from '../components/Icons';
import { ArrowLeft, X, Globe, Link } from 'lucide-react';
import { AppContext } from '../App';
import { getIframeLabs, saveIframeLab, deleteIframeLab } from './IframeLabPage';

// ─── LabCard (internal nav labs) ──────────────────────────────────────────
const LabCard: React.FC<{
    title: string;
    description: string;
    icon: any;
    path: string;
    color: string;
    status?: 'active' | 'beta' | 'coming-soon';
}> = ({ title, description, icon: Icon, path, color, status = 'active' }) => {
    const navigate = useNavigate();
    const isComingSoon = status === 'coming-soon';

    return (
        <div
            onClick={() => !isComingSoon && navigate(path)}
            className={`group relative glass-card p-8 cursor-pointer transition-all duration-500 hover:scale-[1.03] ${isComingSoon ? 'opacity-60 grayscale' : ''}`}
        >
            <div className={`absolute -top-4 -right-4 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${status === 'active' ? 'bg-brand-cyan text-white border-brand-cyan/30' :
                status === 'beta' ? 'bg-brand-magenta text-white border-brand-magenta/30' :
                    'bg-gray-500 text-white border-gray-400/30'
                }`}>
                {status}
            </div>

            <div className="flex flex-col gap-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-8 h-8 text-brand-cyan" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-brand-cyan transition-colors lowercase">
                        {title}
                    </h3>
                    <p className="text-white/50 text-sm font-medium leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            {!isComingSoon && (
                <div className="mt-8 flex items-center text-xs font-black tracking-widest text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                    ENTER ENGINE <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
            )}
        </div>
    );
};

// ─── IframeLabCard (custom user-added labs) ───────────────────────────────
const IframeLabCard: React.FC<{
    id: string;
    title: string;
    description: string;
    url: string;
    onDelete: (id: string) => void;
}> = ({ id, title, description, url, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/labs/iframe/${id}`)}
            className="group relative glass-card p-8 cursor-pointer transition-all duration-500 hover:scale-[1.03] border border-white/10 hover:border-accent-blue/40"
        >
            {/* Badge */}
            <div className="absolute -top-4 -right-4 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border bg-accent-blue text-white border-accent-blue/30">
                iframe
            </div>

            {/* Delete button — visible to all on hover */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                className="absolute top-4 left-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                title="حذف المختبر"
            >
                <TrashIcon className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent-blue/10 border border-accent-blue/20 shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <Globe className="w-8 h-8 text-accent-blue" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-accent-blue transition-colors lowercase">
                        {title}
                    </h3>
                    <p className="text-white/50 text-sm font-medium leading-relaxed mb-3">
                        {description}
                    </p>
                    <p className="text-[10px] text-white/20 truncate font-mono">{url}</p>
                </div>
            </div>

            <div className="mt-8 flex items-center text-xs font-black tracking-widest text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                OPEN LAB <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </div>
        </div>
    );
};

// ─── Add Lab Modal ────────────────────────────────────────────────────────
const AddLabModal: React.FC<{ onClose: () => void; onSave: () => void; language: string; }> = ({ onClose, onSave, language }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!title.trim() || !url.trim()) {
            setError(language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
            return;
        }
        // Basic URL validation
        try { new URL(url.includes('://') ? url : `https://${url}`); } catch {
            setError(language === 'ar' ? 'رابط غير صحيح' : 'Invalid URL');
            return;
        }
        const finalUrl = url.includes('://') ? url : `https://${url}`;
        saveIframeLab({ title, description, url: finalUrl, color: 'accent-blue' });
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative z-10 w-full max-w-xl bg-black/90 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white">
                            {language === 'ar' ? '➕ إضافة مختبر خارجي' : 'Add External Lab'}
                        </h2>
                        <p className="text-xs text-white/40 uppercase tracking-widest font-black mt-1">iframe embed</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                            {language === 'ar' ? 'اسم المختبر *' : 'Lab Title *'}
                        </label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={language === 'ar' ? 'مثلاً: محاكي الفيزياء' : 'e.g. Physics Simulator'}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-accent-blue/50 transition-all font-bold"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                            {language === 'ar' ? 'رابط الـ iframe *' : 'iFrame URL *'}
                        </label>
                        <div className="relative">
                            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://phet.colorado.edu/..."
                                className="w-full pl-11 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-accent-blue/50 transition-all font-bold font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                            {language === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                            placeholder={language === 'ar' ? 'وصف مختصر للمختبر...' : 'Brief description...'}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-accent-blue/50 transition-all font-bold resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm font-bold">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button onClick={onClose} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black transition-all">
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-2xl font-black transition-all hover:scale-105 shadow-lg">
                            {language === 'ar' ? 'حفظ المختبر' : 'Save Lab'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────
const LabsPage: React.FC = () => {
    const { user, language } = useContext(AppContext) as any;
    const [iframeLabs, setIframeLabs] = useState(getIframeLabs());
    const [showAddModal, setShowAddModal] = useState(false);

    const refresh = () => setIframeLabs(getIframeLabs());

    const handleDelete = (id: string) => {
        if (window.confirm(language === 'ar' ? 'هل تريد حذف هذا المختبر؟' : 'Delete this lab?')) {
            deleteIframeLab(id);
            refresh();
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 animate-cinematic max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-brand-cyan/10 rounded-lg">
                            <BeakerIcon className="w-6 h-6 text-brand-cyan" />
                        </div>
                        <span className="text-xs font-black tracking-[0.2em] text-brand-cyan uppercase">Research & Development</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
                        Experimental <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-magenta">Labs</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-white/50 font-medium max-w-md text-lg hidden md:block">
                        A collection of high-performance mathematical engines and simulation environments.
                    </p>
                    {/* Add Lab Button — visible to everyone */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-3 px-6 py-4 bg-accent-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent-blue/20 whitespace-nowrap"
                    >
                            <PlusIcon className="w-5 h-5" />
                            {language === 'ar' ? 'إضافة مختبر' : 'Add Lab'}
                    </button>
                </div>
            </header>

            {/* Built-in Labs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <LabCard
                    title="Function Lab"
                    description="Advanced symbolic math engine with support for limits, derivatives, integrals, and real-time physical simulation."
                    icon={ActivityIcon}
                    path="/labs/function"
                    color="brand-cyan"
                    status="active"
                />
                <LabCard
                    title="تحضير الالكانات"
                    description="Interactive organic chemistry lab for synthesizing, naming (IUPAC), and visualizing 3D structures of alkanes."
                    icon={BeakerIcon}
                    path="/labs/alkanes"
                    color="accent-green"
                    status="active"
                />
                <LabCard
                    title="أجهزة القياس"
                    description="High-fidelity simulator for building and calibrating electrical measuring instruments like Ammeters and Voltmeters."
                    icon={ActivityIcon}
                    path="/labs/measuring-devices"
                    color="brand-cyan"
                    status="active"
                />
                <LabCard
                    title="Your Smart board"
                    description="Professional interactive whiteboard system with multi-tool support, advanced geometry drawing, and real-time collaboration space."
                    icon={SparkleIcon}
                    path="/labs/smartboard"
                    color="brand-purple"
                    status="active"
                />
                <LabCard
                    title="Study English with me"
                    description="Interactive English language learning environment with Claude-powered artifacts for grammar, vocabulary, and conversation practice."
                    icon={SparkleIcon}
                    path="/labs/iframe/study-english"
                    color="brand-cyan"
                    status="active"
                />
                <LabCard
                    title="Matrix Engine"
                    description="Linear algebra playground for vector spaces, transformation matrices, and eigen-decomposition visualization."
                    icon={CpuIcon}
                    path="/labs/matrix"
                    color="brand-magenta"
                    status="coming-soon"
                />
                <LabCard
                    title="Geometry Core"
                    description="Non-Euclidean geometry exploration and 3D topological surfaces with raytracing support."
                    icon={SparkleIcon}
                    path="/labs/geometry"
                    color="accent-green"
                    status="coming-soon"
                />

                {/* Dynamic iFrame Labs */}
                {iframeLabs.map(lab => (
                    <IframeLabCard
                        key={lab.id}
                        id={lab.id}
                        title={lab.title}
                        description={lab.description}
                        url={lab.url}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Footer CTA */}
            <div className="mt-20 p-8 glass-card border-brand-cyan/20 bg-brand-cyan/5 overflow-hidden relative group">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <h2 className="text-3xl font-black text-white mb-4">
                        {language === 'ar' ? 'لديك فكرة لمختبر جديد؟' : 'Have an idea for a new lab?'}
                    </h2>
                    <p className="text-white/50 mb-8 max-w-xl">
                        {language === 'ar'
                            ? 'يمكنك إضافة أي محاكي خارجي عن طريق رابط iframe والوصول إليه مباشرة من هنا.'
                            : 'You can embed any external simulator via an iframe link and access it directly from here.'}
                    </p>
                    <button onClick={() => setShowAddModal(true)} className="btn-power px-8 py-3 rounded-xl font-bold flex items-center gap-3">
                        <PlusIcon className="w-5 h-5" />
                        {language === 'ar' ? 'إضافة مختبر خارجي' : 'Add External Lab'}
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showAddModal && (
                <AddLabModal
                    language={language}
                    onClose={() => setShowAddModal(false)}
                    onSave={refresh}
                />
            )}
        </div>
    );
};

export default LabsPage;
