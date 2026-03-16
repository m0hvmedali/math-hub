import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useHubCore } from '../utils/HubCore';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface GeminiChatWidgetProps {
    onClose: () => void;
    subjectName?: string;
    branchName?: string;
    lessonName?: string;
    contentSummary?: string;
    customSystemPrompt?: string;
}

const GeminiChatWidget: React.FC<GeminiChatWidgetProps> = ({
    onClose,
    subjectName = '',
    branchName = '',
    lessonName = '',
    contentSummary = '',
    customSystemPrompt = '',
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Register with HubCore
    useHubCore({
        id: 'GeminiAssistantAtom',
        state: { messageCount: messages.length, isLoading },
        actions: {
            send: (text: string) => { setInput(text); setTimeout(() => sendMessage(), 100); },
            clear: () => setMessages([]),
            close: () => onClose()
        }
    });

    const systemPrompt = customSystemPrompt ||
        `أنت مساعد دراسي ذكي ومتخصص في مادة "${subjectName}"، فصل "${branchName}"، درس "${lessonName}".
        
مهمتك الرئيسية: مساعدة الطالب على فهم هذا الدرس تحديداً.

${contentSummary ? `ملخص محتوى الدرس: ${contentSummary}` : ''}

قواعد:
- أجب بالعربية دائماً ما لم يكتب الطالب بالإنجليزية
- ركّز على المادة والدرس الحالي
- كن مشجعاً وصبوراً
- إذا سأل عن شيء خارج الدرس، أجب بإيجاز وعُد للموضوع
- استخدم أمثلة بسيطة عند الشرح`;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error('Gemini API key not set');

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-lite',
            });

            // Build history for chat context
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: m.content }],
            }));

            const historyWithSystem = [
                { role: 'user' as const, parts: [{ text: 'مرحباً، أعرّفك بنفسك' }] },
                { role: 'model' as const, parts: [{ text: systemPrompt + '\n\nأنا مساعدك الدراسي! أنا هنا لمساعدتك في فهم الدرس. بماذا يمكنني مساعدتك؟' }] },
                ...history,
            ];
            const chat = model.startChat({ history: historyWithSystem });
            const result = await chat.sendMessage(input.trim());
            const text = result.response.text();

            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'عذراً، حدث خطأ. تأكد من إعداد مفتاح Gemini API أو حاول مجدداً.',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 right-4 md:right-6 w-[90vw] max-w-[400px] h-[550px] bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[9990] animate-scale-in origin-bottom-right">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-purple/30 to-brand-cyan/10 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-lg shadow-glow-brand">
                        🤖
                    </div>
                    <div>
                        <p className="text-white font-black text-sm">المساعد الذكي</p>
                        <p className="text-brand-cyan text-xs font-bold uppercase tracking-widest">AI Tutor — {lessonName || subjectName}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8 space-y-2">
                        <div className="text-4xl">💬</div>
                        <p className="font-bold text-sm">اسألني أي سؤال عن الدرس</p>
                        <p className="text-xs text-gray-600">أنا هنا لمساعدتك في فهم {lessonName || 'هذا الدرس'}</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-brand-purple/30 text-white rounded-br-sm'
                            : 'bg-[#1a1a1a] text-gray-200 rounded-bl-sm border border-white/5'
                            }`}>
                            {msg.role === 'assistant' && (
                                <div className="text-xs font-bold text-brand-cyan mb-1 uppercase tracking-widest">المساعد</div>
                            )}
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                            <span className="text-xs text-gray-500">يفكر...</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-4 border-t border-white/5 bg-black/40">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="اكتب سؤالك هنا..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-cyan/50 placeholder-gray-600 transition-colors"
                        dir="auto"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="w-11 h-11 rounded-xl bg-brand-cyan/20 hover:bg-brand-cyan/40 border border-brand-cyan/30 text-brand-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeminiChatWidget;
