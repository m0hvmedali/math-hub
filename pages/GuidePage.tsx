import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../store/useCosmicStore';
import { AppContext } from '../App';

const GuidePage: React.FC = () => {
    const navigate = useNavigate();
    const { language } = React.useContext(AppContext);

    const sections = [
        {
            title: language === 'ar' ? 'طبقة الذكاء الاصطناعي' : 'The Intelligence Layer',
            content: language === 'ar'
                ? 'الذكاء الاصطناعي هنا هو رفيق سقراطي. دوره ليس إعطاء إجابات مباشرة، بل طرح الأسئلة الصحيحة لاستفزاز عقلك.'
                : 'AI here is a Socratic partner. Its role is not to give direct answers, but to ask the right questions to provoke your mind.'
        },
        {
            title: language === 'ar' ? 'صفحة التفريغ' : 'The Venting Sanctuary',
            content: language === 'ar'
                ? 'تصفية الذهن قبل البدء. اكتب كل ما يقلقك ليقوم الذكاء الاصطناعي بتحليله سيكولوجياً.'
                : 'Clear your mind before starting. Write everything that worries you for psychological AI analysis.'
        },
        {
            title: language === 'ar' ? 'المحرك الكوني' : 'The Cosmic Engine',
            content: language === 'ar'
                ? 'تحويل المنهج من قوائم جامدة إلى خريطة ذهنية بصرية (كواكب وأقمار).'
                : 'Transform the curriculum from rigid lists into a visual mind map (Planets and Moons).'
        },
        {
            title: language === 'ar' ? 'النبضة الحمراء' : 'Red Pulse (Error Reflex)',
            content: language === 'ar'
                ? 'تنبيه عصبي فوري بمكان الجرح الدراسي لعلاجه فوراً عند حدوث خطأ.'
                : 'Immediate neural alert at the spot of a "study wound" to treat it instantly when an error occurs.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8 md:p-16 relative overflow-hidden font-sans">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-brand-cyan/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-500/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10 w-full">
                <header className="mb-16 text-center md:text-right">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
                        {language === 'ar' ? 'الدليل المعماري' : 'Architectural Guide'}
                    </h1>
                    <p className="text-brand-cyan font-bold tracking-[0.2em] uppercase text-sm md:text-base">
                        Enji Study Planner OS (Cosmic Edition)
                    </p>
                </header>

                <div className="grid gap-8 mb-16">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl hover:border-brand-cyan/30 transition-all group">
                            <h2 className="text-xl md:text-2xl font-black mb-4 text-brand-cyan flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-brand-cyan origin-left group-hover:scale-x-150 transition-transform"></span>
                                {section.title}
                            </h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all transform hover:scale-105 uppercase tracking-widest text-lg md:w-auto w-full"
                    >
                        {language === 'ar' ? 'العودة للتسجيل' : 'Back to Login'}
                    </button>

                    <p className="text-gray-500 text-sm font-medium italic text-center md:text-right">
                        {language === 'ar'
                            ? 'هذا النظام ليس مجرد تطبيق دراسي، بل هو نظام تشغيل للحياة.'
                            : 'This system is not just a study app, it is an OS for life.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GuidePage;
