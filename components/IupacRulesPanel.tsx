import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface IupacRulesPanelProps {
    onClose: () => void;
    language: 'ar' | 'en';
}

const IupacRulesPanel: React.FC<IupacRulesPanelProps> = ({ onClose, language }) => {
    const rules = language === 'ar' ? [
        {
            title: '1. أطول سلسلة كربونية',
            desc: 'تحديد أطول سلسلة كربونية مستمرة (مستقيمة أو متفرعة).'
        },
        {
            title: '2. الترقيم',
            desc: 'الترقيم من الجهة الأقرب للتفرع. إذا تساوت الجهات، الترقيم من الجهة الأكثر تفرعاً. المعيار النهائي: أقل مجموع أرقام.'
        },
        {
            title: '3. كتابة الاسم',
            desc: 'كتابة [رقم الموضع]-[اسم التفرع] ثم اسم الألكان المناظر.'
        },
        {
            title: '4. التكرار',
            desc: 'استخدام بادئات (ثنائي، ثلاثي، رباعي) عند تكرار نفس التفرع.'
        },
        {
            title: '5. الترتيب الأبجدي',
            desc: 'ترتيب التفرعات المختلفة أبجدياً حسب أسمائها اللاتينية (Ethyl قبل Methyl).'
        }
    ] : [
        {
            title: '1. Longest Chain',
            desc: 'Identify the longest continuous carbon chain.'
        },
        {
            title: '2. Numbering',
            desc: 'Number from the side closest to a substituent. If tied, pick the most branched side.'
        },
        {
            title: '3. Formatting',
            desc: 'Write [Position]-[Substituent] [Parent Alkane].'
        },
        {
            title: '4. Multiplicity',
            desc: 'Use prefixes like di-, tri-, tetra- for repeating substituents.'
        },
        {
            title: '5. Alphabetical Order',
            desc: 'List different substituents alphabetically (Ethyl before Methyl).'
        }
    ];

    const prefixes = [
        { count: 1, ar: 'ميث', en: 'Meth' },
        { count: 2, ar: 'إيث', en: 'Eth' },
        { count: 3, ar: 'بروب', en: 'Prop' },
        { count: 4, ar: 'بيوت', en: 'But' },
        { count: 5, ar: 'بنت', en: 'Pent' },
        { count: 6, ar: 'هكس', en: 'Hex' },
        { count: 7, ar: 'هبت', en: 'Hept' },
        { count: 8, ar: 'أوكت', en: 'Oct' },
        { count: 9, ar: 'نون', en: 'Non' },
        { count: 10, ar: 'ديك', en: 'Dec' },
    ];

    return (
        <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-screen w-96 bg-[#020617]/95 backdrop-blur-2xl border-l border-white/10 p-8 z-[100] shadow-2xl overflow-y-auto"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white">IUPAC Rules</h2>
                    <p className="text-[10px] text-accent-blue uppercase tracking-widest font-bold">Standard Nomenclature</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-6">
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Naming Rules</h3>
                    <div className="space-y-3">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="text-sm font-bold text-accent-blue mb-1">{rule.title}</h4>
                                <p className="text-xs text-white/60 leading-relaxed font-medium">{rule.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Carbon Prefixes</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {prefixes.map((p) => (
                            <div key={p.count} className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black text-white/20">C{p.count}</span>
                                <span className="text-xs font-bold text-white">{language === 'ar' ? p.ar : p.en}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default IupacRulesPanel;
