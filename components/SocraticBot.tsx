import React, { useState, useEffect } from 'react';
import { SparkleIcon, SendIcon } from './Icons';

interface SocraticBotProps {
    lessonId: string;
    lessonName: string;
    onClose: () => void;
    language: 'ar' | 'en';
}

const SocraticBot: React.FC<SocraticBotProps> = ({ lessonId, lessonName, onClose, language }) => {
    const [messages, setMessages] = useState<{ text: string; isAi: boolean }[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        // Initial Socratic question based on the fact that an error happened
        const intro = language === 'ar'
            ? `أهلاً بك. لاحظت تعثرك في [${lessonName}]. دعنا نفكر سوياً...`
            : `Hello. I noticed a struggle in [${lessonName}]. Let's think together...`;

        const firstQuestion = language === 'ar'
            ? `ما هو القانون أو الجزء الذي تعتقد أنه سبب المشكلة هنا؟ هل تذكر كيف نطبق القاعدة في هذه الحالة؟`
            : `What part of the rule do you think caused the issue? Do you remember how to apply it here?`;

        setMessages([
            { text: intro, isAi: true },
            { text: firstQuestion, isAi: true }
        ]);
    }, [lessonName, language]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMsg = { text: inputValue, isAi: false };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');

        // Simple Socratic logic (Socratic bot asks more than tells)
        setTimeout(() => {
            const aiMsg = language === 'ar'
                ? "تفكير جيد. هل تعتقد أن هذا يؤثر على النتيجة النهائية؟ جرب التأكد من الوحدات المستخدمة."
                : "Good thinking. Do you believe this affects the final result? Try double-checking the units.";
            setMessages(prev => [...prev, { text: aiMsg, isAi: true }]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <SparkleIcon className="w-5 h-5 text-accent-cyan" />
                    <span className="font-black text-white text-xs uppercase tracking-widest">Socratic Assistant</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xs font-bold font-bold uppercase">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.isAi ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${m.isAi
                                ? 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                                : 'bg-accent-blue text-white rounded-tr-none shadow-lg shadow-accent-blue/20'
                            }`}>
                            {m.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={language === 'ar' ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white text-sm outline-none focus:border-accent-blue transition-all"
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-accent-cyan hover:scale-110 transition-transform"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocraticBot;
