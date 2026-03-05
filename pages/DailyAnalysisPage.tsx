import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import { analyzeDayAndPlan } from '../utils/aiHelper';
import { SparkleIcon, TrendingUpIcon, MicrophoneIcon } from '../components/Icons';
import { supabase } from '../supabaseClient';
import AnalysisDisplay from '../components/AnalysisDisplay';
import { AnalysisResponse, WeeklySchedule } from '../types';

// Add Speech Recognition Types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const DailyAnalysisPage: React.FC = () => {
    const { subjects, studySessions, user } = useContext(AppContext);
    const [todayActions, setTodayActions] = useState('');
    const [lessonExplanation, setLessonExplanation] = useState('');
    const [mood, setMood] = useState('Satisfied');
    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
    const [isListening, setIsListening] = useState(false);

    // Speech Recognition Setup
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-EG'; // Set to Arabic for high accuracy
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            let finalizedTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalizedTranscript += event.results[i][0].transcript;
                }
            }
            if (finalizedTranscript) {
                setLessonExplanation(prev => (prev + ' ' + finalizedTranscript).trim());
            }
        };

        recognition.start();
        (window as any)._recognition = recognition;
    };

    const stopListening = () => {
        if ((window as any)._recognition) {
            (window as any)._recognition.stop();
            setIsListening(false);
        }
    };

    // Fetch Weekly Schedule
    const fetchSchedule = useCallback(async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('timeline_items')
            .select('*')
            .eq('type', 'weekly_schedule')
            .limit(1);
        if (data && data.length > 0) {
            try {
                setWeeklySchedule(JSON.parse(data[0].content));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        const nextDayName = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long' });

        const dailyReflection = `
            Today's Actions: ${todayActions}
            Mood: ${mood}
            Lesson Explanation: ${lessonExplanation}
        `;

        try {
            const result = await analyzeDayAndPlan(
                dailyReflection,
                weeklySchedule,
                nextDayName,
                'Secondary 3' // Defaulting to Secondary 3 for now, can be made dynamic
            );
            setAnalysisResult(result);
        } catch (error: any) {
            console.error("Analysis Error:", error);
            alert(`حدث خطأ أثناء التحليل: ${error.message || String(error)}`);
        }
        setIsAnalyzing(false);
    };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto pb-32 animate-fade-in">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                    <TrendingUpIcon className="w-10 h-10 text-brand-cyan" />
                    Daily Analysis
                </h1>
                <p className="text-gray-400">Reflect on your day, master your tomorrow.</p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {/* Inputs */}
                <section className="glass-card border border-[var(--glass-border)] rounded-3xl p-8 shadow-2xl">
                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Tactical Achievements</label>
                            <textarea
                                value={todayActions}
                                onChange={(e) => setTodayActions(e.target.value)}
                                placeholder="What did you conquer today?"
                                className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl p-6 text-white focus:border-brand-cyan outline-none h-32 resize-none transition-all"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Intel Explanation (Rubber Ducking)</label>
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] tracking-widest transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20'}`}
                                >
                                    <MicrophoneIcon className="w-4 h-4" />
                                    {isListening ? 'STOP RECORDING' : 'START VOICE INTEL'}
                                </button>
                            </div>
                            <textarea
                                value={lessonExplanation}
                                onChange={(e) => setLessonExplanation(e.target.value)}
                                placeholder="Explain your core mission status..."
                                className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl p-6 text-white focus:border-accent-green outline-none h-40 resize-none transition-all"
                            />
                            {isListening && <p className="mt-2 text-accent-green text-[10px] font-black animate-pulse">TRANSCRIBING REAL-TIME AUDIO...</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Status Report (Mood)</label>
                            <div className="flex gap-2 md:gap-3 flex-wrap">
                                {['Productive', 'Tired', 'Satisfied', 'Anxious', 'Determined'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMood(m)}
                                        className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs tracking-widest transition-all ${mood === m ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600'}`}
                                    >
                                        {m.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing || !todayActions}
                            className="w-full bg-brand-cyan hover:bg-blue-600 py-4 md:py-5 rounded-2xl font-black text-white text-lg md:text-xl transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-2xl shadow-brand-cyan/20"
                        >
                            {isAnalyzing ? "NEURAL PROCESSING..." : "EXECUTE ANALYSIS"}
                        </button>
                    </div>
                </section>

                {analysisResult && (
                    <AnalysisDisplay data={analysisResult} />
                )}
            </div>
        </div>
    );
};

export default DailyAnalysisPage;
