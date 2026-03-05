import React, { useEffect, useState } from 'react';
import { XIcon, GlobeIcon, LinkIcon } from './Icons';
import { fetchDuckDuckGoResults } from '../utils/searchRadar';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, query }) => {
    const [results, setResults] = useState<Array<{ title: string; url: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !query) return;

        const performSearch = async () => {
            setIsLoading(true);
            const ddgResults = await fetchDuckDuckGoResults(`${query} ثانوية عامة`);
            setResults(ddgResults);
            setIsLoading(false);
        };

        performSearch();
    }, [isOpen, query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-5xl h-[85vh] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {localStorage.getItem('language') === 'ar' ? 'البحث العالمي' : 'Global Intelligence'}
                        </h2>
                        <p className="text-sm text-accent-blue font-bold">DuckDuckGo Neural Search Active</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <GlobeIcon className="w-16 h-16 text-accent-blue mb-4" />
                            <div className="text-white/40 font-bold uppercase tracking-widest text-xs">
                                Querying Global Knowledge...
                            </div>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {results.map((res, i) => (
                                <a
                                    key={i}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-accent-blue transition-all group flex items-start gap-4"
                                >
                                    <div className="p-3 bg-accent-blue/20 rounded-2xl text-accent-blue group-hover:scale-110 transition-transform">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-accent-blue transition-colors">{res.title}</h3>
                                        <p className="text-xs text-white/40 truncate">{res.url}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-white/20 text-xl font-bold">
                            No external sectors found for this query.
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-[10px] items-center flex justify-between uppercase tracking-widest font-black text-white/40">
                    <span>Target: Egyptian Curriculum</span>
                    <span>Powered by DuckDuckGo Engine</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;
