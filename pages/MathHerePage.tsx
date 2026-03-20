import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  LineChart, 
  GraduationCap, 
  Box, 
  Sparkles,
  ChevronRight,
  BrainCircuit,
  LayoutDashboard,
  Menu,
  X,
  BookOpen,
  Zap
} from 'lucide-react';
import { AppContext } from '../App';
import MathSolverModule from '../components/math-system/MathSolverModule';
import MathGrapherModule from '../components/math-system/MathGrapherModule';
import CurriculumBrowser from '../components/math-system/CurriculumBrowser';
import GeoGebraLab from '../components/math-system/GeoGebraLab';
import CurriculumSimulations from '../components/math-system/CurriculumSimulations';
import { mathTranslations } from '../components/math-system/mathTranslations';
import MathAIOrchestrator from '../components/math-system/MathAIOrchestrator';

type MathTab = 'dashboard' | 'solver' | 'grapher' | 'curriculum' | 'simulations' | 'geogebra' | 'ai';

const MathHerePage: React.FC = () => {
    const { language } = useContext(AppContext);
    const t = (mathTranslations as any)[language || 'en'];
    const [activeTab, setActiveTab] = useState<MathTab>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const tabs = [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, color: 'text-white' },
        { id: 'simulations', label: t.simulations, icon: Zap, color: 'text-brand-magenta' },
        { id: 'solver', label: t.solver, icon: Calculator, color: 'text-brand-purple' },
        { id: 'grapher', label: t.grapher, icon: LineChart, color: 'text-brand-cyan' },
        { id: 'geogebra', label: t.geogebra, icon: Box, color: 'text-brand-magenta' },
        { id: 'curriculum', label: t.curriculum, icon: GraduationCap, color: 'text-accent-green' },
        { id: 'ai', label: t.ai, icon: BrainCircuit, color: 'text-accent-amber' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'solver': return <MathSolverModule />;
            case 'grapher': return <MathGrapherModule />;
            case 'curriculum': return <CurriculumBrowser />;
            case 'simulations': return <CurriculumSimulations />;
            case 'geogebra': return <GeoGebraLab />;
            case 'ai': return <MathAIOrchestrator />;
            case 'dashboard':
            default: return <MathDashboardOverview onNavigate={(tab) => setActiveTab(tab)} />;
        }
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <motion.aside 
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="hidden md:flex flex-col border-r border-white/5 bg-[#080808] relative z-20"
            >
                <div className="p-6 flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-ott-gradient p-[1px] shrink-0">
                        <div className="w-full h-full bg-black rounded-[9px] flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    {isSidebarOpen && (
                        <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-black tracking-tighter text-xl bg-clip-text text-transparent bg-ott-gradient"
                        >
                            {t.mathSystem}
                        </motion.span>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as MathTab)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-white/5 border border-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <tab.icon className={`w-5 h-5 shrink-0 ${activeTab === tab.id ? tab.color : 'group-hover:text-white'}`} />
                            {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center hover:bg-white/5 transition-all"
                    >
                        <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden p-4 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                         <Sparkles className="w-5 h-5 text-brand-cyan" />
                         <span className="font-black uppercase tracking-tighter">Math System</span>
                    </div>
                    <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-white/5 rounded-lg">
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

/* --- SUB-COMPONENTS --- */

const MathDashboardOverview: React.FC<{ onNavigate: (tab: MathTab) => void }> = ({ onNavigate }) => {
    const { language } = useContext(AppContext);
    const t = (mathTranslations as any)[language || 'en'];

    return (
        <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto">
            <header className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.systemOverview}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                    {t.comprehensiveWorkspace.split(' ').slice(0, -1).join(' ')} <span className="text-transparent bg-clip-text bg-ott-gradient">{t.comprehensiveWorkspace.split(' ').slice(-1)}</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl">
                    {t.integratedTools}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { id: 'simulations', title: t.simulations, desc: 'Interactive high-school curriculum models for Thanaweya Amma.', icon: Zap, color: 'from-brand-magenta/20 to-transparent', bColor: 'border-brand-magenta/30' },
                    { id: 'solver', title: t.solver + ' Lab', desc: 'Symbolic calculus, algebra, and step-by-step simplification.', icon: Calculator, color: 'from-brand-purple/20 to-transparent', bColor: 'border-brand-purple/30' },
                    { id: 'grapher', title: t.grapher + ' Engine', desc: 'Real-time 2D function visualization with SVG optimization.', icon: LineChart, color: 'from-brand-cyan/20 to-transparent', bColor: 'border-brand-cyan/30' },
                ].map((card) => (
                    <button
                        key={card.id}
                        onClick={() => onNavigate(card.id as MathTab)}
                        className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${card.color} border ${card.bColor} text-left hover:scale-[1.02] transition-all group relative overflow-hidden`}
                    >
                        <card.icon className="w-10 h-10 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-black mb-3">{card.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">{card.desc}</p>
                        <ArrowRight className="w-6 h-6 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    </button>
                ))}
            </div>

            <section className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 mt-12">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
                            <GraduationCap className="w-6 h-6 text-accent-green" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">{language === 'ar' ? 'منهج OSSU العالمي' : 'OSSU Global Curriculum'}</h2>
                        <p className="text-gray-400 leading-relaxed">
                            {language === 'ar' ? 'مسار منظم لتعليم ذاتي مجاني في الرياضيات، منسق من أفضل الجامعات في العالم.' : 'Structured path to a free self-taught education in mathematics, curated from the world\'s best universities.'}
                        </p>
                        <button 
                            onClick={() => onNavigate('curriculum')}
                            className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            {t.exploreCurriculum}
                        </button>
                    </div>
                    <div className="w-full md:w-80 h-64 bg-black/40 rounded-[2rem] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-ott-gradient opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
                        <BookOpen className="w-20 h-20 text-white/10 group-hover:text-white/20 transition-colors" />
                    </div>
                </div>
            </section>
        </div>
    );
};

const AISolversOverview: React.FC = () => {
    const { language } = useContext(AppContext);
    
    return (
        <div className="p-8 md:p-12 space-y-8 max-w-6xl mx-auto">
             <header className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-amber/10 flex items-center justify-center border border-accent-amber/20">
                    <BrainCircuit className="w-6 h-6 text-accent-amber" />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{language === 'ar' ? 'مختبر الذكاء' : 'AI Neural Gateways'}</h2>
                    <p className="text-xs text-gray-500 font-medium">{language === 'ar' ? 'خدمات حل متقدمة وأدوات المسح للحل' : 'Advanced solving services & Scan-to-Solve tools'}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { name: 'Math AI Solver', url: 'https://math-ai.com', tags: ['Graphing', 'Calculator'], desc: 'Specialized in algebraic structures and visualization.' },
                    { name: 'Sider AI Math', url: 'https://sider.ai', tags: ['OCR Scan', 'Step-by-step'], desc: 'Scan any problem from your mobile for instant solutions.' },
                    { name: 'MathGPT Pro', url: 'https://mathgptpro.com', tags: ['Generative', 'Reasoning'], desc: 'Uses large language models for deep conceptual reasoning.' },
                    { name: 'Mathos AI', url: 'https://mathos.ai', tags: ['Web Native', 'Fast'], desc: 'Lightweight and ultra-fast solver for daily problems.' }
                ].map((s, i) => (
                    <a 
                        key={i} 
                        href={s.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-accent-amber/40 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black group-hover:text-accent-amber transition-colors">{s.name}</h3>
                            <div className="flex gap-2">
                                {s.tags.map(t => <span key={t} className="text-[8px] font-black uppercase tracking-widest text-gray-600 px-2 py-1 bg-black rounded-lg">{t}</span>)}
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">{s.desc}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-accent-amber uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Connect Gateway <ArrowRight className="w-3 h-3" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
);

export default MathHerePage;
