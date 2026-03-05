import React from 'react';
import { ErrorCause } from '../types';
import { translations } from '../utils/translations';

interface ErrorTaxonomyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (cause: ErrorCause) => void;
    language: 'ar' | 'en';
}

const ErrorTaxonomyModal: React.FC<ErrorTaxonomyModalProps> = ({ isOpen, onClose, onSelect, language }) => {
    if (!isOpen) return null;

    const causes: { id: ErrorCause; label_ar: string; label_en: string; icon: string }[] = [
        { id: 'arithmetic_haste', label_ar: 'تسرع حسابي', label_en: 'Arithmetic Haste', icon: '⚡' },
        { id: 'rule_misunderstanding', label_ar: 'عدم فهم قانون', label_en: 'Rule Misunderstanding', icon: '📖' },
        { id: 'unit_forgetting', label_ar: 'نسيان تحويل وحدات', label_en: 'Unit Forgetting', icon: '📏' },
        { id: 'mental_distraction', label_ar: 'تشتت ذهني', label_en: 'Mental Distraction', icon: '☁️' },
    ];

    const title = language === 'ar' ? 'ماذا حدث يا باشمهندس؟' : 'What happened, Engineer?';
    const subtitle = language === 'ar' ? 'تحليل الخطأ هو أول خطوة للإتقان.' : 'Analyzing the error is the first step to mastery.';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-cinematic-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                {/* Glow Background */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-blue/10 rounded-full blur-3xl"></div>

                <div className="relative text-center mb-8">
                    <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">
                        {title}
                    </h2>
                    <p className="text-gray-400 font-medium">
                        {subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {causes.map((cause) => (
                        <button
                            key={cause.id}
                            onClick={() => onSelect(cause.id)}
                            className="group flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-red-500/50 transition-all text-right"
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{cause.icon}</span>
                            <span className="flex-1 text-lg font-bold text-gray-200 group-hover:text-white">
                                {language === 'ar' ? cause.label_ar : cause.label_en}
                            </span>
                            <span className="text-white/20 group-hover:text-red-500/50">→</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="mt-8 w-full py-4 text-gray-500 font-bold hover:text-white transition-colors"
                >
                    {language === 'ar' ? 'تخطي الآن' : 'Skip for now'}
                </button>
            </div>
        </div>
    );
};

export default ErrorTaxonomyModal;
