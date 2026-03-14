import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AppContext } from '../App';
import { ClockIcon, PlayIcon, PauseIcon, RefreshIcon, TrophyIcon, UserIcon, CheckCircleIcon, XIcon, MessageSquareIcon, SparkleIcon } from '../components/Icons';
import { supabase } from '../supabaseClient';
import { Competition, ParticipantData } from '../types';

const StudyTimerPage: React.FC = () => {
    const { user, addStudySession, language } = useContext(AppContext);

    // Timer State
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Competition State
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [isBattleMode, setIsBattleMode] = useState(false);

    // New Battle Form
    const [participantIdsInput, setParticipantIdsInput] = useState('');
    const [goalMinutes, setGoalMinutes] = useState(60);
    const [bet, setBet] = useState('');
    const [secretMessage, setSecretMessage] = useState('');
    const [targetType, setTargetType] = useState<'time' | 'task'>('time');

    // UI State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [pendingInvite, setPendingInvite] = useState<Competition | null>(null);
    const [inviteSecretMessage, setInviteSecretMessage] = useState('');

    // --- Wake Lock API ---
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    useEffect(() => {
        if (isActive) requestWakeLock();
        else releaseWakeLock();
        return () => { releaseWakeLock(); };
    }, [isActive]);


    // --- Persistence & Timer Logic ---
    useEffect(() => {
        const savedSeconds = localStorage.getItem('timer_seconds');
        const savedIsActive = localStorage.getItem('timer_active');
        const savedLastTick = localStorage.getItem('timer_last_tick');

        if (savedSeconds) setSeconds(parseInt(savedSeconds));

        if (savedIsActive === 'true') {
            setIsActive(true);
            if (savedLastTick) {
                const now = Date.now();
                const last = parseInt(savedLastTick);
                const elapsedSinceLastTick = Math.floor((now - last) / 1000);
                if (elapsedSinceLastTick > 0 && elapsedSinceLastTick < 86400) {
                    setSeconds(prev => prev + elapsedSinceLastTick);
                }
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('timer_seconds', seconds.toString());
        localStorage.setItem('timer_active', isActive.toString());
        localStorage.setItem('timer_last_tick', Date.now().toString());

        if (isActive && seconds > 0 && seconds % 60 === 0) {
            updateCompetitionProgress(0); 
        }
    }, [seconds, isActive]);

    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    // --- Competition Logic ---
    const fetchCompetitions = useCallback(async () => {
        if (!user || !supabase) return;
        const { data } = await supabase
            .from('competitions')
            .select('*')
            .contains('participant_ids', [user])
            .in('status', ['active', 'pending'])
            .order('created_at', { ascending: false });

        setCompetitions(data || []);
    }, [user]);

    useEffect(() => {
        fetchCompetitions();
        const interval = setInterval(fetchCompetitions, 5000); 
        return () => clearInterval(interval);
    }, [fetchCompetitions]);

    const handleCreateBattle = async () => {
        if (!user || !supabase) return;
        const ids = participantIdsInput.split('_').map(s => s.trim()).filter(s => s && s !== user);
        const allIds = [user, ...ids];

        const initialParticipantData: Record<string, ParticipantData> = {};
        allIds.forEach(id => {
            initialParticipantData[id] = {
                user_id: id,
                progress_minutes: 0,
                secret_message: id === user ? secretMessage : '',
                status: id === user ? 'active' : 'inactive',
                acceptance_status: id === user ? 'accepted' : 'pending',
                last_activity: new Date().toISOString()
            };
        });

        const { error } = await supabase.from('competitions').insert([{
            creator_id: user,
            participant_ids: allIds,
            participant_data: initialParticipantData,
            goal_minutes: goalMinutes || 60,
            target_type: targetType,
            bet_description: bet,
            status: 'pending' 
        }]);

        if (error) {
            console.error("Error creating battle:", error);
            return;
        }

        setIsBattleMode(false);
        setParticipantIdsInput('');
        setSecretMessage('');
        fetchCompetitions();
    };

    const handleAcceptInvite = async (compId: string, currentData: ParticipantData) => {
        if (!user || !supabase) return;

        const competition = competitions.find(c => c.id === compId);
        if (!competition) return;

        const newData = {
            ...competition.participant_data,
            [user]: {
                ...currentData,
                acceptance_status: 'accepted',
                secret_message: inviteSecretMessage
            }
        };

        const allAccepted = competition.participant_ids.every(pid => {
            if (pid === user) return true;
            return competition.participant_data[pid].acceptance_status === 'accepted';
        });

        const updatePayload: any = { participant_data: newData };
        if (allAccepted) {
            updatePayload.status = 'active';
            updatePayload.start_time = new Date().toISOString();
        }

        await supabase.from('competitions').update(updatePayload).eq('id', compId);
        setPendingInvite(null);
        setInviteSecretMessage('');
        fetchCompetitions();
    };

    const handleDeclineInvite = async (compId: string) => {
        if (!user || !supabase) return;
        const competition = competitions.find(c => c.id === compId);
        if (!competition) return;

        const newData = {
            ...competition.participant_data,
            [user]: {
                ...competition.participant_data[user],
                acceptance_status: 'declined'
            }
        };
        await supabase.from('competitions').update({ participant_data: newData }).eq('id', compId);
        setPendingInvite(null);
    };


    // Auto-Reveal State
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [finishedCompetition, setFinishedCompetition] = useState<Competition | null>(null);

    const updateCompetitionProgress = async (durationToAdd: number) => {
        if (!user || !supabase || competitions.length === 0) return;

        const activeComps = competitions.filter(c => c.status === 'active');

        for (const comp of activeComps) {
            const currentData = comp.participant_data[user];
            if (currentData && currentData.acceptance_status === 'accepted') {

                const newTotalMinutes = Math.floor(seconds / 60);

                if (newTotalMinutes === currentData.progress_minutes && durationToAdd === 0 && Math.random() > 0.1) continue;

                const newData = {
                    ...comp.participant_data,
                    [user]: {
                        ...currentData,
                        progress_minutes: newTotalMinutes,
                        status: isActive ? 'active' : 'inactive',
                        last_activity: new Date().toISOString()
                    }
                };

                let winner_id = comp.winner_id;
                let status = comp.status;

                if (newTotalMinutes >= comp.goal_minutes && !winner_id) {
                    winner_id = user;
                    status = 'finished';
                    const opponentId = comp.participant_ids.find(id => id !== user);
                    if (opponentId && comp.participant_data[opponentId]?.progress_minutes >= comp.goal_minutes) {
                        winner_id = 'DRAW';
                    }
                }

                await supabase.from('competitions')
                    .update({ participant_data: newData, winner_id, status })
                    .eq('id', comp.id);
            }
        }
    };

    useEffect(() => {
        const finishedComp = competitions.find(c => c.status === 'finished' && !showWinnerModal);
        if (finishedComp) {
            setFinishedCompetition(finishedComp);
            setShowWinnerModal(true);
        }
    }, [competitions]);

    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFinishSession = async () => {
        if (seconds < 60) {
            alert(language === 'ar' ? 'الجلسة قصيرة جداً (دقيقة واحدة على الأقل).' : "Session too short to record (min 1 minute).");
            return;
        }
        const duration = Math.floor(seconds / 60);
        await updateCompetitionProgress(0);
        await addStudySession(duration, 8);
        setIsActive(false);
        setSeconds(0);
        localStorage.removeItem('timer_seconds');
        localStorage.removeItem('timer_active');
    };

    return (
        <div className="p-6 md:p-16 max-w-[1200px] mx-auto min-h-screen animate-premium-fade pb-32">
            
            {/* Header */}
            <header className="mb-20 relative">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-brand-cyan/10 blur-[1200px] rounded-full -z-10" />
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-secondary flex items-center justify-center shadow-glow-brand">
                        <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.4em] text-brand-cyan uppercase font-outfit">Chronos System v4.2</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-6">
                    {language === 'ar' ? 'مؤقت التركيز' : 'Focus Laboratory'}<span className="text-brand-cyan">.</span>
                </h1>
                <p className="text-gray-500 font-bold max-w-xl text-lg">
                    {language === 'ar' ? 'ادخل في وضع التركيز العميق وتحدى أصدقائك في سباق الإنتاجية.' : 'Enter deep work mode. Synchronize your focus cycles and dominate the academic arena.'}
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                
                {/* Main Timer Section */}
                <div className="lg:col-span-8 space-y-12">
                    <section className="bg-cinematic-card border border-white/5 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden group">
                        <div className={`absolute inset-0 bg-gradient-to-b from-brand-cyan/5 to-transparent transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                        
                        <div className="relative z-10 space-y-12">
                            <div className="space-y-4">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">
                                    {isActive ? (language === 'ar' ? 'جاري التسجيل...' : 'SYNCHRONIZING...') : (language === 'ar' ? 'جاهز للانطلاق' : 'SYSTEM STANDBY')}
                                </span>
                                <div className="text-7xl md:text-[10rem] font-black text-white tracking-tighter tabular-nums drop-shadow-glow-brand transition-all duration-500 font-outfit">
                                    {formatTime(seconds)}
                                </div>
                            </div>

                            <div className="flex justify-center gap-8">
                                {!isActive ? (
                                    <button
                                        onClick={() => setIsActive(true)}
                                        className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-glow-brand group/btn"
                                    >
                                        <PlayIcon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsActive(false)}
                                        className="w-24 h-24 rounded-full bg-black border-2 border-white/10 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl group/btn"
                                    >
                                        <PauseIcon className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                    </button>
                                )}
                                <button
                                    onClick={() => { setSeconds(0); setIsActive(false); }}
                                    className="w-24 h-24 rounded-full bg-white/5 border border-white/10 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
                                >
                                    <RefreshIcon className="w-8 h-8" />
                                </button>
                            </div>

                            <button
                                onClick={handleFinishSession}
                                className="w-full max-w-sm mx-auto bg-gradient-to-r from-brand-cyan to-brand-secondary py-6 rounded-2xl font-black text-white text-lg hover:shadow-glow-brand transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
                            >
                                {language === 'ar' ? 'إكمال المهمة' : 'Finalize Session'}
                            </button>
                        </div>
                    </section>

                    {/* Pending Invites */}
                    {competitions.some(c => c.status === 'pending' && c.participant_data[user]?.acceptance_status === 'pending') && (
                        <div className="space-y-6">
                            <h2 className="text-xs font-black text-brand-magenta uppercase tracking-widest flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-brand-magenta animate-pulse" />
                                {language === 'ar' ? 'تحديات بانتظارك' : 'Incoming Challenges'}
                            </h2>
                            <div className="grid gap-6">
                                {competitions.filter(c => c.status === 'pending' && c.participant_data[user]?.acceptance_status === 'pending').map(comp => (
                                    <div key={comp.id} className="bg-white/5 border border-brand-magenta/20 p-8 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-brand-magenta/10 flex items-center justify-center">
                                                <TrophyIcon className="w-8 h-8 text-brand-magenta" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                                                    {comp.goal_minutes} Min Battle <span className="text-gray-600 font-bold ml-2">by {comp.creator_id}</span>
                                                </h3>
                                                <p className="text-gray-500 font-bold text-sm italic">"{comp.bet_description}"</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPendingInvite(comp)}
                                            className="px-8 py-4 bg-brand-magenta text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                                        >
                                            Join Arena
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Arena */}
                <div className="lg:col-span-4 space-y-12">
                    <section className="bg-cinematic-card border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                                {language === 'ar' ? 'ساحة التنافس' : 'Arena Status'}
                            </h2>
                            <button
                                onClick={() => setIsBattleMode(true)}
                                className="w-8 h-8 rounded-lg bg-brand-cyan/10 text-brand-cyan flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                            >
                                <span className="text-xl font-black">+</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {competitions.length === 0 ? (
                                <div className="py-12 text-center text-gray-600 font-bold text-[10px] uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                                    No active battles.
                                </div>
                            ) : (
                                competitions.map(comp => (
                                    <div key={comp.id} className="p-5 rounded-2xl border border-white/5 bg-white/5 space-y-4 group hover:border-brand-cyan/30 transition-all">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{comp.goal_minutes}m Plan</span>
                                            <span className="px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan text-[8px] font-black uppercase">{comp.status}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {comp.participant_ids.map(pId => {
                                                const p = comp.participant_data[pId];
                                                const isActivePlayer = p?.status === 'active';
                                                return (
                                                    <div 
                                                        key={pId} 
                                                        onClick={() => setSelectedUser(p)}
                                                        className={`p-3 rounded-xl border transition-all cursor-pointer ${pId === user ? 'bg-brand-cyan/10 border-brand-cyan/20' : 'bg-black/20 border-white/5'}`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isActivePlayer ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
                                                            <span className="text-[10px] font-black text-white uppercase truncate flex-1">{pId === user ? 'YOU' : pId}</span>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-gray-500">{p?.progress_minutes || 0}m / {comp.goal_minutes}m</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Personal Stats / ID */}
                    <section className="bg-cinematic-card border border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-16 h-16 rounded-2xl bg-brand-secondary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <UserIcon className="w-8 h-8 text-brand-secondary" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{language === 'ar' ? 'معرف النبض' : 'Neural Identity'}</span>
                            <div 
                                onClick={() => { navigator.clipboard.writeText(user!); }}
                                className="text-4xl font-black text-white tracking-tighter cursor-pointer hover:text-brand-secondary transition-colors"
                            >
                                {user}
                            </div>
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-4">Tap to synchronize</p>
                        </div>
                    </section>
                </div>
            </div>

            {/* Overlays (Battle Mode, Invite Response, Winner) */}
            {isBattleMode && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-cinematic-card border border-white/10 w-full max-w-lg p-10 md:p-14 rounded-[3rem] shadow-2xl relative animate-scale-up">
                        <button onClick={() => setIsBattleMode(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-colors">
                            <XIcon className="w-8 h-8" />
                        </button>
                        <h2 className="text-4xl font-black text-white mb-10 tracking-tighter uppercase">{language === 'ar' ? 'تحدي جديد' : 'Battle Draft'}</h2>
                        
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Target IDs (Separate by _ )</label>
                                <input
                                    type="text"
                                    value={participantIdsInput}
                                    onChange={(e) => setParticipantIdsInput(e.target.value)}
                                    placeholder="e.g. USER_001_USER_002"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-brand-cyan transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Goal (Min)</label>
                                    <input
                                        type="number"
                                        value={goalMinutes}
                                        onChange={(e) => setGoalMinutes(parseInt(e.target.value) || 0)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-brand-cyan transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Wager / Reward</label>
                                    <input
                                        type="text"
                                        value={bet}
                                        onChange={(e) => setBet(e.target.value)}
                                        placeholder="e.g. Free Coffee"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-brand-cyan transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Your Private Key (Winner takes all)</label>
                                <input
                                    type="text"
                                    value={secretMessage}
                                    onChange={(e) => setSecretMessage(e.target.value)}
                                    placeholder="Enter secret message..."
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-brand-cyan transition-all"
                                />
                            </div>
                            <button
                                onClick={handleCreateBattle}
                                disabled={!participantIdsInput.trim()}
                                className="w-full bg-gradient-to-r from-brand-cyan to-brand-secondary py-6 rounded-2xl font-black text-white text-xl hover:shadow-glow-brand transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest disabled:opacity-20"
                            >
                                Initiate Battle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Winner Modal */}
            {showWinnerModal && finishedCompetition && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-6 animate-fade-in text-center">
                    <div className="max-w-xl space-y-12 animate-scale-up">
                        <div className="relative inline-block">
                            <TrophyIcon className="w-32 h-32 text-brand-cyan mx-auto animate-bounce" />
                            <div className="absolute inset-0 bg-brand-cyan/20 blur-[100px] rounded-full -z-10" />
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-6xl md:text-8xl font-black text-white tracking-widest uppercase">
                                {finishedCompetition.winner_id === user ? 'VICTORY' : 'DEFEAT'}
                            </h2>
                            <p className="text-gray-500 font-black uppercase tracking-[0.4em]">
                                {finishedCompetition.winner_id === user ? 'You dominated the session' : `${finishedCompetition.winner_id} took the glory`}
                            </p>
                        </div>

                        {finishedCompetition.winner_id === user && (
                            <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] space-y-6">
                                <h3 className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Exposed Secrets</h3>
                                <div className="space-y-4">
                                    {Object.entries(finishedCompetition.participant_data).map(([uid, u]: [string, any]) => (
                                        u.secret_message && (
                                            <div key={uid} className="text-left bg-black/40 p-4 rounded-xl border border-white/5">
                                                <span className="text-[10px] text-gray-500 font-black uppercase mb-2 block">@{uid}</span>
                                                <p className="text-white font-bold">"{u.secret_message}"</p>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowWinnerModal(false)}
                            className="bg-white text-black px-12 py-6 rounded-2xl font-black text-xl hover:scale-110 active:scale-95 transition-all uppercase tracking-widest"
                        >
                            Return to Nexus
                        </button>
                    </div>
                </div>
            )}

            {/* Pending Invite Modal */}
            {pendingInvite && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-cinematic-card border border-white/5 w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative text-center space-y-8">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Incoming Challenge</h2>
                        <div className="bg-black/40 p-8 rounded-2xl border border-white/5 space-y-2">
                            <span className="text-[10px] font-black text-gray-600 uppercase">Mission Duration</span>
                            <div className="text-5xl font-black text-white">{pendingInvite.goal_minutes}m</div>
                            <p className="text-brand-magenta font-black uppercase mt-4">Stakes: {pendingInvite.bet_description}</p>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block text-left">Your Wager Secret</label>
                            <input
                                type="text"
                                value={inviteSecretMessage}
                                onChange={(e) => setInviteSecretMessage(e.target.value)}
                                placeholder="Only visible if you win..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-brand-magenta transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleDeclineInvite(pendingInvite.id)} className="py-5 rounded-2xl bg-white/5 text-gray-500 font-black uppercase hover:bg-red-500/10 hover:text-red-500 transition-all">Abadon</button>
                            <button onClick={() => handleAcceptInvite(pendingInvite.id, pendingInvite.participant_data[user!])} className="py-5 rounded-2xl bg-brand-magenta text-white font-black uppercase hover:shadow-glow-brand transition-all">Deploy</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyTimerPage;
