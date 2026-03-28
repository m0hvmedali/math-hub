import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { useHubCore, assistant } from '../utils/HubCore';
import { routeAI, generateText } from '../services/ai-router';
import { SparkleIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';

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
    const { language } = useContext(AppContext) as any;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSocratic, setIsSocratic] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Register with HubCore
    useHubCore({
        id: 'GeminiAssistantAtom',
        state: { messageCount: messages.length, isLoading, isSocratic },
        actions: {
            send: (text: string) => { setInput(text); setTimeout(() => sendMessage(), 100); },
            clear: () => setMessages([]),
            close: () => onClose(),
            toggleSocratic: () => setIsSocratic(!isSocratic),
            performCommand: (cmd: string) => assistant.performBrainAction(cmd, generateText)
        }
    });

    const handleBrainAction = async () => {
        if (!input.trim() || isLoading) return;
        const cmd = input.trim();
        setInput('');
        setIsLoading(true);
        await assistant.performBrainAction(cmd, generateText);
        setIsLoading(false);
    };

    const systemPrompt = customSystemPrompt ||
        `[SYSTEM_OVERRIDE_INITIATED]
        أنت محرك معالجة منطقي من المستوى الأول (L1 Logical Processing Engine) في مادة "${subjectName}"، فصل "${branchName}"، درس "${lessonName}".
        
مهمتك: تطبيق "تحليل الاستخراج العميق" (Deep Extraction Analysis).

${contentSummary ? `ملخص محتوى الدرس: ${contentSummary}` : ''}

قواعد:
- خاطب المتلقي كـ "ند فكري" بمستوى ذكاء مرتفع. ممنوع التبسيط المفرط.
- استخدم الهيكل التالي في إجاباتك:
[الحالة الابتدائية]: مدخل دقيق للموضوع.
[التفكيك التسلسلي]: استخدم (Bullet points) والأسهم (->) لبيان تسلسل المنطق.
[تحليل الفجوات]: اطرح أسئلة نقدية معقدة واستنتج إجاباتها.
[الحالة النهائية]: الاستنتاج المقطر في جملة واحدة.
- أجب بالعربية دائماً ما لم يطلب المستخدم الإنجليزية.`;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const currentInput = input.trim();
        const userMsg: Message = { role: 'user', content: currentInput };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const fullSystem = systemPrompt + (isSocratic ? "\n\nCRITICAL: SOCRATIC MODE ACTIVE. Do NOT provide direct answers. Ask guiding questions to lead the student to the solution step-by-step. Encourage critical thinking." : "");
            
            const response = await routeAI({
                prompt: currentInput,
                systemInstruction: fullSystem,
                task: 'lesson_explanation',
                history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
        } catch (err: any) {
            const errorMsg = language === 'ar' 
                ? 'عذراً، حدث خطأ في النظام العصبي. يرجى التأكد من صحة مفاتيح الـ API (VITE_GEMINI_API_KEY) ومن وجود مساحة كافية في ذاكرة المتصفح.' 
                : 'Apologies, a neural error occurred. Please check your API keys (VITE_GEMINI_API_KEY) and ensure you have enough browser storage space.';
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMsg,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 right-4 md:right-6 w-[90vw] max-w-[400px] h-[600px] bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[9990] animate-scale-in origin-bottom-right">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-purple/30 to-brand-cyan/10 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center text-lg shadow-glow-brand">
                        🤖
                    </div>
                    <div>
                        <p className="text-white font-black text-sm">المساعد الذكي</p>
                        <p className="text-brand-cyan text-[10px] font-bold uppercase tracking-widest">{lessonName || 'AI Tutor'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsSocratic(!isSocratic)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isSocratic ? 'bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan' : 'bg-white/5 border-white/10 text-gray-500'}`}
                        title="Socratic Tutoring Mode"
                    >
                        {language === 'ar' ? 'وضع سقراط' : 'Socratic'}
                    </button>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8 space-y-3">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <SparkleIcon className="w-8 h-8 text-brand-purple opacity-50" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white">{language === 'ar' ? 'اسألني أي سؤال عن الدرس' : 'Ask me anything about the lesson'}</p>
                            <p className="text-xs text-gray-600 mt-1">{language === 'ar' ? 'أنا هنا لمساعدتك في فهم المحتوى' : 'I am here to help you master the content'}</p>
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-purple/30 text-white rounded-br-sm border border-brand-purple/20' : 'bg-[#1a1a1a] text-gray-200 rounded-bl-sm border border-white/5'}`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-1.5">
                                    <SparkleIcon className="w-3 h-3 text-brand-cyan" />
                                    <span className="text-[9px] font-black text-brand-cyan uppercase tracking-widest">Neural Assistant</span>
                                </div>
                            )}
                            {msg.role === 'assistant' ? (
                                <MarkdownRenderer content={msg.content} />
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-3">
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-4 border-t border-white/5 bg-black/40">
                <div className="flex gap-2">
                    <input
                        type="text" value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={language === 'ar' ? 'اكتب تساؤلك...' : 'Type your question...'}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-cyan/50 placeholder-gray-600 outline-none transition-all"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="w-11 h-11 rounded-xl bg-brand-cyan/20 hover:bg-brand-cyan/40 border border-brand-cyan/30 text-brand-cyan disabled:opacity-30 transition-all flex items-center justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeminiChatWidget;
