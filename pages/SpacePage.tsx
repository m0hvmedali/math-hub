import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import CosmicGraph from '../components/CosmicGraph';
import NodeInjectorModal from '../components/NodeInjectorModal';
import { ArrowLeftIcon } from '../components/Icons';
import { useNavigate } from 'react-router-dom';

const SpacePage: React.FC = () => {
    const { subjects, customNodes, manualLinks, addManualLink, addCustomNode, language } = useContext(AppContext);
    const [isInjectorOpen, setIsInjectorOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <div className="absolute top-6 left-6 z-[60] flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all flex items-center gap-2 group"
                >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm hidden md:block">
                        {language === 'ar' ? 'العودة' : 'Back'}
                    </span>
                </button>
                <div className="hidden md:block">
                    <h1 className="text-xl font-black text-white tracking-tighter">
                        {language === 'ar' ? 'مهندس الفضاء' : 'Space Engineer'}
                    </h1>
                    <p className="text-[10px] text-brand-cyan font-bold uppercase tracking-widest leading-none">
                        Universal Construction Mode
                    </p>
                </div>
            </div>

            {/* Fullscreen Graph */}
            <div className="flex-1 relative">
                <CosmicGraph
                    subjects={subjects}
                    searchQuery=""
                    searchResults={[]}
                    customNodes={customNodes}
                    manualLinks={manualLinks}
                    onOpenInjector={() => setIsInjectorOpen(true)}
                    addManualLink={addManualLink}
                />
            </div>

            {/* Injector Modal */}
            <NodeInjectorModal
                isOpen={isInjectorOpen}
                onClose={() => setIsInjectorOpen(false)}
                subjects={subjects}
                language={language}
                onInject={(data) => {
                    addCustomNode({
                        subject_id: data.subjectId,
                        label: data.label,
                        url: data.url,
                        tags: data.tags
                    });
                }}
            />
        </div>
    );
};

export default SpacePage;
