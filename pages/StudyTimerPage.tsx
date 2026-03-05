import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AppContext } from '../App';
import { ClockIcon, PlayIcon, PauseIcon, RefreshIcon, TrophyIcon, UserIcon, CheckCircleIcon, XIcon, MessageSquareIcon } from '../components/Icons';
import { supabase } from '../supabaseClient';
import { Competition, ParticipantData } from '../types';

const StudyTimerPage: React.FC = () => {
    const { user, addStudySession } = useContext(AppContext);

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
                console.log('Wake Lock is active');
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            console.log('Wake Lock released');
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

        // "Resume" logic: If text was active, add the elapsed time while closed
        if (savedIsActive === 'true') {
            setIsActive(true);
            if (savedLastTick) {
                const now = Date.now();
                const last = parseInt(savedLastTick);
                const elapsedSinceLastTick = Math.floor((now - last) / 1000);
                // Only add reasonable time (max 24 hours) to prevent huge jumps from bugs
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

        // Auto-sync progress to DB every minute if active
        if (isActive && seconds % 60 === 0) {
            updateCompetitionProgress(0); // Sync only
        }
    }, [seconds, isActive]);

    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
                // We also update DB progress periodically in the effect above
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
        const interval = setInterval(fetchCompetitions, 5000); // Fast poll
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
            goal_minutes: goalMinutes || 60, // Fallback to 60 if 0 or NaN
            target_type: targetType,
            bet_description: bet,
            status: 'pending' // Start as pending
        }]);

        if (error) {
            console.error("Error creating battle:", error);
            alert(`Failed to create battle: ${error.message}`);
            return;
        }

        setIsBattleMode(false);
        setParticipantIdsInput('');
        setSecretMessage('');
        fetchCompetitions();
    };

    const handleAcceptInvite = async (compId: string, currentData: ParticipantData) => {
        if (!user || !supabase) return;

        // 1. Update my status to Accepted
        // 2. Add my Secret Message
        // 3. Check if ALL participants accepted. If so, START BATTLE.

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

        // Check if everyone else has accepted
        const allAccepted = competition.participant_ids.every(pid => {
            if (pid === user) return true; // I just accepted
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
        // Ideally remove self from array, but for now just mark Declined?
        // Or just delete the competition if it's 1v1?
        // Simplest: Mark acceptance_status = 'declined'
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

                // Optimization
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

                // Check winner or draw
                let winner_id = comp.winner_id;
                let status = comp.status;

                // Win Condition: Reached Goal
                if (newTotalMinutes >= comp.goal_minutes && !winner_id) {

                    // Check if anyone else also reached it at the same sync tick (Draw?)
                    // For now, simpler: First to sync wins.
                    // BUT, if I see opponent has ALSO reached goal in 'comp.participant_data', it's a draw?
                    // Real-time draws are hard. Let's stick to: If I reach goal, I claim win.

                    winner_id = user;
                    status = 'finished';

                    // However, let's check if opponent already finished?
                    const opponentId = comp.participant_ids.find(id => id !== user);
                    if (opponentId && comp.participant_data[opponentId]?.progress_minutes >= comp.goal_minutes) {
                        // Opponent also finished. It is a DRAW.
                        winner_id = 'DRAW';
                    }
                }

                await supabase.from('competitions')
                    .update({ participant_data: newData, winner_id, status })
                    .eq('id', comp.id);
            }
        }
    };

    // Effect to detect finish and show modal
    useEffect(() => {
        const finishedComp = competitions.find(c => c.status === 'finished' && !showWinnerModal);

        // Only show if I haven't seen it yet (local state check)
        if (finishedComp) {
            // We need a way to track "seen". For now, just show if it's recent?
            // Or better: Show if status is finished. User closes modal -> we don't show again?
            // Let's use a ref or local state to track "seen" competions in this session.
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
            alert("Session too short to record (min 1 minute).");
            return;
        }
        const duration = Math.floor(seconds / 60);
        await updateCompetitionProgress(0); // Final sync
        await addStudySession(duration, 8);
        setIsActive(false);
        setSeconds(0);
        localStorage.removeItem('timer_seconds');
        localStorage.removeItem('timer_active');
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 animate-fade-in pb-32 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase">Focus <span className="text-brand-cyan">Battle</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">Persistent Real-Time Chronometer v3.0</p>
                </header>

                {/* Main Timer Display */}
                <div className="glass-card border border-[var(--glass-border)] rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-center shadow-2xl relative overflow-hidden mb-8 md:mb-12 group">
                    {/* Dynamic Glow */}
                    <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'bg-brand-cyan/5 opacity-100' : 'opacity-0'} pointer-events-none`}></div>

                    <div className="text-6xl md:text-9xl font-black text-white mb-8 md:mb-12 font-mono tracking-tighter tabular-nums drop-shadow-2xl relative z-10">
                        {formatTime(seconds)}
                    </div>

                    <div className="flex justify-center gap-4 md:gap-6 relative z-10">
                        {!isActive ? (
                            <button
                                onClick={() => setIsActive(true)}
                                className="bg-white text-black p-6 md:p-8 rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                            >
                                <PlayIcon className="w-8 h-8 md:w-10 md:h-10" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsActive(false)}
                                className="bg-[var(--input-bg)] border-4 border-white/10 text-white p-6 md:p-8 rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"
                            >
                                <PauseIcon className="w-8 h-8 md:w-10 md:h-10" />
                            </button>
                        )}
                        <button
                            onClick={() => { setSeconds(0); setIsActive(false); }}
                            className="bg-gray-900 text-gray-400 p-6 md:p-8 rounded-full hover:bg-gray-800 transition-all border border-[var(--glass-border)]"
                        >
                            <RefreshIcon className="w-8 h-8 md:w-10 md:h-10" />
                        </button>
                    </div>

                    <button
                        onClick={handleFinishSession}
                        className="mt-8 md:mt-12 w-full max-w-sm mx-auto bg-brand-cyan/10 border border-brand-cyan/50 text-brand-cyan py-4 md:py-5 rounded-2xl font-black text-sm md:text-lg hover:bg-brand-cyan hover:text-white transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] relative z-10 uppercase tracking-widest"
                    >
                        Complete Mission
                    </button>
                </div>

                {/* Invitations Section */}
                {competitions.some(c => c.status === 'pending' && c.participant_data[user]?.acceptance_status === 'pending') && (
                    <div className="mb-8 animate-slide-up">
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <MessageSquareIcon className="w-5 h-5 text-brand-magenta" /> PENDING INVITATIONS
                        </h2>
                        <div className="space-y-4">
                            {competitions.filter(c => c.status === 'pending' && c.participant_data[user]?.acceptance_status === 'pending').map(comp => (
                                <div key={comp.id} className="bg-brand-magenta/10 border border-brand-magenta/30 p-6 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-brand-magenta font-bold text-sm uppercase mb-1">Challenge from {comp.creator_id}</p>
                                        <p className="text-white font-black text-lg">{comp.goal_minutes} Minutes Battle</p>
                                        <p className="text-gray-400 text-xs italic">"{comp.bet_description}"</p>
                                    </div>
                                    <button
                                        onClick={() => setPendingInvite(comp)}
                                        className="bg-brand-magenta text-white px-6 py-3 rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg"
                                    >
                                        RESPOND
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Competitions Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-card border border-[var(--glass-border)] rounded-3xl p-8 min-h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <TrophyIcon className="w-6 h-6 text-yellow-500" /> ARENA
                            </h2>
                            <button
                                onClick={() => setIsBattleMode(true)}
                                className="text-brand-cyan font-black uppercase tracking-widest text-[10px] hover:underline"
                            >
                                + New Battle
                            </button>
                        </div>

                        <div className="space-y-4">
                            {competitions.length === 0 ? (
                                <div className="text-center py-20 text-gray-600 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-gray-800 rounded-3xl">
                                    No active challenges.
                                </div>
                            ) : (
                                competitions.map(comp => {
                                    const isPending = comp.status === 'pending';
                                    const myStatus = comp.participant_data[user]?.acceptance_status;

                                    if (isPending && myStatus === 'pending') return null; // Shown in invites section

                                    return (
                                        <div key={comp.id} className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${isPending ? 'bg-gray-900/50 border-gray-800 opacity-70' : 'bg-[var(--input-bg)] border-[var(--glass-border)] hover:border-brand-cyan'}`}>
                                            {isPending && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-2 py-1 uppercase">Waiting for Players</div>}

                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-white font-black text-sm uppercase">{comp.goal_minutes} MIN GOAL</h3>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${isPending ? 'bg-gray-800 text-gray-400' : 'bg-accent-green/20 text-accent-green'}`}>{comp.status}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                {comp.participant_ids.map(pId => {
                                                    const p = comp.participant_data[pId];
                                                    const isWinner = comp.winner_id === pId;
                                                    const accepted = p.acceptance_status === 'accepted';

                                                    return (
                                                        <button
                                                            key={pId}
                                                            onClick={() => setSelectedUser({ ...p, competitionId: comp.id })}
                                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all relative ${pId === user ? 'bg-brand-cyan/10 border-brand-cyan/30' : 'bg-gray-900/50 border-gray-800'
                                                                }`}
                                                        >
                                                            {!accepted && (
                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-10">
                                                                    <span className="text-[8px] font-black text-gray-400 uppercase">Pending</span>
                                                                </div>
                                                            )}

                                                            <div className="relative">
                                                                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-cinematic-bg ${p?.status === 'active' ? 'bg-accent-green animate-pulse' : 'bg-gray-600'}`}></div>
                                                            </div>
                                                            <div className="text-left overflow-hidden">
                                                                <div className="text-[10px] text-white font-black truncate w-20">{pId === user ? 'YOU' : pId}</div>
                                                                <div className="text-[8px] text-gray-500 font-bold">{p?.progress_minutes || 0}m / {comp.goal_minutes}m</div>
                                                            </div>
                                                            {isWinner && <TrophyIcon className="w-4 h-4 text-yellow-500 ml-auto animate-bounce" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {comp.bet_description && <p className="text-gray-500 text-xs font-medium italic mb-2 border-l-2 border-gray-700 pl-2">"{comp.bet_description}"</p>}

                                            {comp.winner_id && (
                                                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/10 to-transparent border-t border-yellow-500/20 rounded-xl animate-fade-in">
                                                    <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-2">🏆 Victory: {comp.winner_id}</p>
                                                    {comp.winner_id === user && (
                                                        <div className="space-y-2">
                                                            <p className="text-white text-[10px] font-bold underline">Unlocked Secrets:</p>
                                                            {Object.entries(comp.participant_data).map(([uid, u]: [string, any]) => (
                                                                u.secret_message && <div key={uid} className="text-[10px] text-gray-300 bg-black/40 p-2 rounded border border-white/5">
                                                                    <span className="text-brand-cyan font-bold">@{uid}:</span> {u.secret_message}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="glass-card border border-[var(--glass-border)] rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-accent-green/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0">
                            <CheckCircleIcon className="w-10 h-10 text-accent-green" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 decoration-accent-green decoration-4 underline-offset-8">YOUR ID</h3>
                        <div onClick={() => { navigator.clipboard.writeText(user!); alert("Copied!") }} className="cursor-pointer hover:scale-105 transition-transform">
                            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-emerald-600 tracking-tighter font-mono mt-4 drop-shadow-lg">{user}</p>
                        </div>

                        <p className="text-gray-500 text-[10px] font-bold mt-8 uppercase tracking-widest">Tap to copy • Share to challenge</p>
                    </div>
                </div>
            </div>

            {/* Create Battle Overlay */}
            {isBattleMode && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="glass-card border border-[var(--glass-border)] w-full max-w-lg p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative">
                        <button
                            onClick={() => setIsBattleMode(false)}
                            className="absolute top-8 right-8 text-gray-600 hover:text-white transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase">New <span className="text-brand-magenta">Contract</span></h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Opponent IDs (Underscore separated)</label>
                                <input
                                    type="text"
                                    value={participantIdsInput}
                                    onChange={(e) => setParticipantIdsInput(e.target.value)}
                                    placeholder="e.g. 1234_5678"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] p-4 rounded-xl text-white font-bold outline-none focus:border-brand-magenta focus:ring-1 focus:ring-brand-magenta transition-all font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Type</label>
                                    <select
                                        value={targetType}
                                        onChange={(e) => setTargetType(e.target.value as any)}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] p-4 rounded-xl text-white font-bold outline-none"
                                    >
                                        <option value="time">Time Target</option>
                                        <option value="task" disabled>Task (Coming Soon)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Goal (Minutes)</label>
                                    <input
                                        type="number"
                                        value={goalMinutes}
                                        onChange={(e) => setGoalMinutes(parseInt(e.target.value) || 0)}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] p-4 rounded-xl text-white font-bold outline-none focus:border-brand-magenta transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Your Secret Message (For Winner)</label>
                                <input
                                    type="text"
                                    value={secretMessage}
                                    onChange={(e) => setSecretMessage(e.target.value)}
                                    placeholder="e.g. Code: 9942, or 'You are amazing!'"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] p-4 rounded-xl text-white font-bold outline-none focus:border-brand-magenta transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Wager / Bet</label>
                                <input
                                    type="text"
                                    value={bet}
                                    onChange={(e) => setBet(e.target.value)}
                                    placeholder="e.g. Loser buys coffee"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] p-4 rounded-xl text-white font-bold outline-none focus:border-brand-magenta transition-all"
                                />
                            </div>
                            <button
                                onClick={handleCreateBattle}
                                disabled={!participantIdsInput.trim()}
                                className="w-full bg-brand-magenta text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-magenta/20 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                SEND CHALLENGE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Accept Invite Overlay */}
            {pendingInvite && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="glass-card border border-[var(--glass-border)] w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl">
                        <h2 className="text-2xl font-black text-white mb-6 text-center">Accept Challenge?</h2>
                        <div className="bg-gray-900/50 p-6 rounded-2xl mb-6 text-center">
                            <p className="text-gray-400 text-xs uppercase mb-2">Goal</p>
                            <p className="text-3xl font-black text-white mb-4">{pendingInvite.goal_minutes} Min</p>
                            <p className="text-gray-400 text-xs uppercase mb-2">Stakes</p>
                            <p className="text-brand-magenta font-bold">"{pendingInvite.bet_description}"</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Set Your Secret Message</label>
                            <input
                                type="text"
                                value={inviteSecretMessage}
                                onChange={(e) => setInviteSecretMessage(e.target.value)}
                                placeholder="Only the winner will see this..."
                                className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] p-4 rounded-xl text-white font-bold outline-none focus:border-accent-green"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleDeclineInvite(pendingInvite.id)}
                                className="bg-gray-800 text-gray-400 py-4 rounded-xl font-bold hover:bg-red-500/20 hover:text-red-500 transition-all"
                            >
                                DECLINE
                            </button>
                            <button
                                onClick={() => handleAcceptInvite(pendingInvite.id, pendingInvite.participant_data[user!])}
                                className="bg-accent-green text-black py-4 rounded-xl font-black hover:scale-105 transition-all shadow-lg shadow-accent-green/20"
                            >
                                ACCEPT & START
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Overlay */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6" onClick={() => setSelectedUser(null)}>
                    <div className="glass-card border border-[var(--glass-border)] w-full max-w-sm p-8 rounded-[2rem] shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-20 h-20 bg-brand-cyan/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <UserIcon className="w-10 h-10 text-brand-cyan" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">{selectedUser.user_id}</h2>
                        <div className="flex justify-center gap-2 mb-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUser.status === 'active' ? 'bg-accent-green text-black' : 'bg-gray-800 text-gray-500'}`}>
                                {selectedUser.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUser.acceptance_status === 'accepted' ? 'bg-blue-500 text-white' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {selectedUser.acceptance_status}
                            </span>
                        </div>
                        <div className="space-y-4 text-left bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--glass-border)] mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-xs font-bold uppercase">Progress</span>
                                <span className="text-white text-xs font-black">{selectedUser.progress_minutes}m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-xs font-bold uppercase">Last Beacon</span>
                                <span className="text-white text-xs font-black">{new Date(selectedUser.last_activity).toLocaleTimeString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200"
                        >
                            CLOSE INTEL
                        </button>
                    </div>
                </div>
            )}
            {/* Winner / Draw Modal */}
            {showWinnerModal && finishedCompetition && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-fade-in">
                    <div className="glass-card border border-[var(--glass-border)] w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl relative text-center overflow-hidden">
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-purple-500/10 pointer-events-none"></div>

                        {finishedCompetition.winner_id === 'DRAW' ? (
                            <>
                                <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">IT'S A DRAW!</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Both warriors fought bravely.</p>
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest">Secrets Status</p>
                                    <p className="text-white font-bold">🔒 Secrets kept safe (No Winner)</p>
                                </div>
                            </>
                        ) : finishedCompetition.winner_id === user ? (
                            <>
                                <h2 className="text-5xl font-black text-yellow-500 mb-2 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">VICTORY!</h2>
                                <p className="text-white font-bold uppercase tracking-widest text-xs mb-8">You conquered the session.</p>

                                <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
                                    <h3 className="text-brand-cyan font-black uppercase tracking-widest text-xs mb-4">Unlocked Secrets</h3>
                                    <div className="space-y-4">
                                        {Object.entries(finishedCompetition.participant_data).map(([uid, u]: [string, any]) => (
                                            u.secret_message ? (
                                                <div key={uid} className="text-left">
                                                    <span className="text-xs font-bold text-gray-500 block mb-1">@{uid}'s Secret:</span>
                                                    <p className="text-white font-medium text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                                                        "{u.secret_message}"
                                                    </p>
                                                </div>
                                            ) : null
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-5xl font-black text-red-500 mb-2 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">DEFEAT</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">{finishedCompetition.winner_id} claimed the glory.</p>
                                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                    <p className="text-xs text-red-400 uppercase tracking-widest">Secrets Status</p>
                                    <p className="text-white font-bold">🔒 Only the winner sees the secrets.</p>
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => setShowWinnerModal(false)}
                            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            CLOSE & CONTINUE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyTimerPage;
