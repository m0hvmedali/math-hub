import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, GraduationCap, Trophy } from 'lucide-react';
import { OSSU_MATH_CURRICULUM } from './OSSUData';
import { AppContext } from '../../App';

const CurriculumBrowser: React.FC = () => {
    const { language } = useContext(AppContext);

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
                        <GraduationCap className="w-6 h-6 text-brand-cyan" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">
                            {language === 'ar' ? 'منهج OSSU للرياضيات' : 'OSSU Math Curriculum'}
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">
                            {language === 'ar' ? 'تعليم ذاتي مجاني في الرياضيات' : 'Free self-taught education in mathematics'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                    <Trophy className="w-4 h-4 text-brand-magenta" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {language === 'ar' ? 'طريق التميز' : 'Path to Excellence'}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Core Mathematics Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-brand-cyan uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-cyan shadow-glow-brand" />
                        {language === 'ar' ? 'الرياضيات الأساسية' : 'Core Mathematics'}
                    </h3>
                    {OSSU_MATH_CURRICULUM.filter(c => c.status === 'core').map((course, idx) => (
                        <motion.a
                            key={idx}
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-cyan/40 hover:bg-white/[0.08] transition-all group"
                        >
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 group-hover:text-brand-cyan transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold mb-0.5">{course.title}</h4>
                                <p className="text-[10px] text-gray-500">{course.category} • {course.description}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-brand-cyan transition-colors" />
                        </motion.a>
                    ))}
                </div>

                {/* Advanced Topics Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-brand-magenta uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-magenta shadow-glow-magenta" />
                        {language === 'ar' ? 'المواضيع المتقدمة' : 'Advanced Topics'}
                    </h3>
                    {OSSU_MATH_CURRICULUM.filter(c => c.status === 'advanced').map((course, idx) => (
                        <motion.a
                            key={idx}
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-magenta/40 hover:bg-white/[0.08] transition-all group"
                        >
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 group-hover:text-brand-magenta transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold mb-0.5">{course.title}</h4>
                                <p className="text-[10px] text-gray-500">{course.category} • {course.description}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-brand-magenta transition-colors" />
                        </motion.a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CurriculumBrowser;
