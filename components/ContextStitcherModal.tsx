import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { SparkleIcon, XIcon, ClockIcon } from './Icons';

interface StitchData {
    url: string;
    note: string;
    timestamp: number;
}

const ContextStitcherModal: React.FC = () => {
    const { language, user } = useContext(AppContext);
    const location = useLocation();
    const navigate = useNavigate();
    
    const [prevPath, setPrevPath] = useState(location.pathname);
    const [isStitching, setIsStitching] = useState(false);
    const [stitchNote, setStitchNote] = useState('');
    const [stitchUrl, setStitchUrl] = useState('');
    
    const [welcomeBackStitch, setWelcomeBackStitch] = useState<StitchData | null>(null);

    // Watch for route leaving /subject
    useEffect(() => {
        if (prevPath.startsWith('/subject') && 
            !location.pathname.startsWith('/subject') && 
            !location.pathname.startsWith('/whiteboard') && 
            !location.pathname.startsWith('/explain')) {
            // We left a study session. Ask to stitch.
            setStitchUrl(prevPath);
            setIsStitching(true);
        }
        setPrevPath(location.pathname);
    }, [location.pathname, prevPath]);

    // Check for existing stitch on Dashboard load
    useEffect(() => {
        if (location.pathname === '/dashboard') {
            const hasSeen = sessionStorage.getItem('seen_stitch_session');
            if (!hasSeen) {
                const raw = localStorage.getItem(`context_stitch_${user}`);
                if (raw) {
                    try {
                        const data: StitchData = JSON.parse(raw);
                        // If it's less than 48h old
                        if (Date.now() - data.timestamp < 48 * 60 * 60 * 1000) {
                            setWelcomeBackStitch(data);
                        }
                    } catch (e) {}
                }
                sessionStorage.setItem('seen_stitch_session', 'true');
            }
        }
    }, [location.pathname, user]);

    const handleSaveStitch = () => {
        if (stitchNote.trim()) {
            const data: StitchData = {
                url: stitchUrl,
                note: stitchNote,
                timestamp: Date.now()
            };
            localStorage.setItem(`context_stitch_${user}`, JSON.stringify(data));
            sessionStorage.removeItem('seen_stitch_session');
        }
        setIsStitching(false);
        setStitchNote('');
    };

    const handleResume = () => {
        if (welcomeBackStitch) {
             navigate(welcomeBackStitch.url);
             setWelcomeBackStitch(null);
        }
    };

    const handleClear = () => {
        localStorage.removeItem(`context_stitch_${user}`);
        setWelcomeBackStitch(null);
    };

    if (!isStitching && !welcomeBackStitch) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => isStitching ? setIsStitching(false) : setWelcomeBackStitch(null)}></div>
            
            <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl animate-scale-in">
                {isStitching && (
                    <>
                        <button onClick={() => setIsStitching(false)} className="absolute top-4 left-4 p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full">
                            <XIcon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center">
                                <SparkleIcon className="w-6 h-6 text-brand-cyan" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">{language === 'ar' ? 'تجهيز الجلسة القادمة' : 'Stitch Your Context'}</h2>
                                <p className="text-sm text-gray-400 font-medium">
                                    {language === 'ar' ? 'أين توقفت؟ ما الذي كنت تفكر فيه؟' : 'Where did you stop? What was on your mind?'}
                                </p>
                            </div>
                        </div>

                        <textarea
                            value={stitchNote}
                            onChange={e => setStitchNote(e.target.value)}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 outline-none resize-none placeholder:text-gray-600 mb-6 custom-scrollbar"
                            placeholder={language === 'ar' ? 'توقفت عند المسألة رقم 5، وتوجد فكرة في معامل الاحتكاك أحتاج لمراجعتها...' : 'I stopped at problem 5, need to review friction coefficients...'}
                            autoFocus
                        />

                        <div className="flex flex-col-reverse md:flex-row justify-end gap-3 w-full">
                            <button onClick={() => setIsStitching(false)} className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 font-black text-sm hover:bg-white/5 transition-all">
                                {language === 'ar' ? 'تخطي' : 'Skip'}
                            </button>
                            <button onClick={handleSaveStitch} className="px-6 py-3 rounded-xl bg-brand-cyan text-black font-black text-sm hover:bg-brand-cyan/90 transition-all flex items-center gap-2 shadow-glow-brand">
                                <SparkleIcon className="w-4 h-4" />
                                {language === 'ar' ? 'حفظ الجلسة' : 'Save Session'}
                            </button>
                        </div>
                    </>
                )}

                {welcomeBackStitch && !isStitching && (
                    <>
                        <button onClick={() => setWelcomeBackStitch(null)} className="absolute top-4 left-4 p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full z-10">
                            <XIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="relative z-0 flex flex-col items-center text-center">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand-cyan/20 rounded-full blur-[50px] pointer-events-none"></div>
                            
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center shadow-glow-brand mb-6 border-2 border-white/10 relative">
                                <SparkleIcon className="w-10 h-10 text-white" />
                                <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 rounded-full p-2">
                                    <ClockIcon className="w-4 h-4 text-brand-cyan" />
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                {language === 'ar' ? 'مرحباً بعودتك' : 'Welcome Back'}
                            </h2>
                            <p className="text-brand-cyan/80 text-sm font-black uppercase tracking-widest mb-8">
                                {language === 'ar' ? 'جلسة سابقة في الانتظار' : 'Pending Session Available'}
                            </p>

                            <div className="w-full bg-white/5 border border-brand-cyan/20 rounded-2xl p-6 mb-8 text-right relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-1 h-full bg-brand-cyan"></div>
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap italic">"{welcomeBackStitch.note}"</p>
                            </div>

                            <div className="flex w-full gap-3">
                                <button onClick={handleClear} className="flex-1 py-4 rounded-xl border border-white/10 text-gray-400 font-black text-sm hover:bg-white/5 transition-all">
                                    {language === 'ar' ? 'تجاهل الجلسة' : 'Dismiss'}
                                </button>
                                <button onClick={handleResume} className="flex-[2] py-4 rounded-xl bg-white text-black font-black text-sm hover:bg-gray-200 transition-all shadow-glow-white">
                                    {language === 'ar' ? 'استئناف الدراسة' : 'Resume Where I Left Off'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ContextStitcherModal;
