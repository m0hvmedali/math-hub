import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mic, MicOff, Settings2, Sparkles, Languages, Check, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Zod Schema ---
const formSchema = z.object({
  explanation: z.string().min(10, 'يرجى كتابة شرح وافٍ ليتمكن الذكاء الاصطناعي من تحليله بفعالية'),
  subject: z.string().min(1, 'يرجى اختيار المادة'),
  level: z.string().min(1, 'يرجى اختيار المستوى'),
  outputOptions: z.array(z.string()).min(1, 'اختر نوع مخرجات واحد على الأقل'),
  language: z.enum(['arabic', 'english']),
  preferences: z.object({
    length: z.enum(['concise', 'detailed']),
    theme: z.enum(['dark', 'light', 'neon']),
    tone: z.enum(['academic', 'casual', 'visual'])
  })
});

export type AICompanionFormData = z.infer<typeof formSchema>;

interface Props {
  onSubmit: (data: AICompanionFormData) => void;
  isLoading: boolean;
}

export const AICompanionInputForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const recognitionRef = useRef<any>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AICompanionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      explanation: '',
      subject: 'physics',
      level: 'high_school',
      outputOptions: ['summary', 'mindmap'],
      language: 'arabic',
      preferences: {
        length: 'concise',
        theme: 'neon',
        tone: 'casual'
      }
    }
  });

  const language = watch('language');

  // --- Voice Recognition Setup ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        
        // Append to existing text
        const currentVal = watch('explanation');
        if (event.results[event.results.length - 1].isFinal) {
           setValue('explanation', currentVal + ' ' + currentTranscript, { shouldValidate: true });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current.lang = language === 'arabic' ? 'ar-SA' : 'en-US';
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-4xl mx-auto space-y-6" dir={language === 'arabic' ? 'rtl' : 'ltr'}>
      {/* Header Area */}
      <div className="flex items-center justify-between pointer-events-none mb-8">
         <div className="flex items-center gap-3">
             <div className="p-3 bg-brand-cyan/20 rounded-2xl border border-brand-cyan/30">
                 <Sparkles className="w-6 h-6 text-accent-cyan" />
             </div>
             <div>
                 <h2 className="text-2xl font-black text-white">AI Study Companion</h2>
                 <p className="text-xs text-brand-cyan font-bold uppercase tracking-widest">
                     {language === 'arabic' ? 'رفيق المذاكرة الذكي 🧠' : 'Smart Tutor Assistant 🧠'}
                 </p>
             </div>
         </div>
      </div>

      {/* Main Input Area */}
      <div className="relative group">
        <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">
            {language === 'arabic' ? 'اشرح ما فهمته بطريقتك' : 'Explain what you understood in your words'}
        </label>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/20 to-brand-purple/20 rounded-3xl blur transition-opacity opacity-0 group-hover:opacity-100 -z-10" />
        
        <div className="relative bg-black/40 border border-white/10 rounded-3xl p-4 transition-all focus-within:border-brand-cyan/50 backdrop-blur-xl">
            <textarea
                {...register('explanation')}
                className="w-full h-40 bg-transparent text-white resize-none outline-none leading-relaxed text-lg placeholder-white/30"
                placeholder={language === 'arabic' ? "السرعة تساوي المسافة على الزمن بص مش فاهم امتى استخدم العجلة..." : "Velocity equals distance over time, but I don't get acceleration..."}
            />
            
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                <div className="flex gap-2 relative z-20">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-3 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10'}`}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-3 rounded-2xl flex items-center justify-center transition-all border ${showSettings ? 'border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2">
                     <select 
                       {...register('language')} 
                       className="bg-white/5 border border-white/10 text-xs font-black text-gray-300 rounded-xl px-3 py-2 outline-none"
                     >
                         <option value="arabic">العربية</option>
                         <option value="english">English</option>
                     </select>
                </div>
            </div>
        </div>
        {errors.explanation && (
            <p className="text-red-400 text-xs font-bold mt-2 ml-4">{errors.explanation.message}</p>
        )}
      </div>

      {/* Settings / Preferences Panel */}
      <AnimatePresence>
          {showSettings && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
              >
                  <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Topic Metadata */}
                      <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                              <Languages className="w-4 h-4" /> Context
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <select {...register('subject')} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none">
                                  <option value="physics">Physics / فيزياء</option>
                                  <option value="math">Math / رياضيات</option>
                                  <option value="chemistry">Chemistry / كيمياء</option>
                                  <option value="biology">Biology / أحياء</option>
                                  <option value="history">History / تاريخ</option>
                              </select>
                              <select {...register('level')} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none">
                                  <option value="middle_school">إعدادي</option>
                                  <option value="high_school">ثانوي</option>
                                  <option value="university">جامعي</option>
                              </select>
                          </div>
                      </div>

                      {/* Aesthetics */}
                      <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                              <Palette className="w-4 h-4" /> Aesthetics & Format
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <select {...register('preferences.length')} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none">
                                  <option value="concise">مختصر (سريع)</option>
                                  <option value="detailed">مفصل (عميق)</option>
                              </select>
                              <select {...register('preferences.tone')} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none">
                                  <option value="casual">ودي (بسيط)</option>
                                  <option value="academic">أكاديمي (رسمي)</option>
                                  <option value="visual">مرئي (تخيلي)</option>
                              </select>
                          </div>
                      </div>

                      {/* Output Targets */}
                      <div className="md:col-span-2 space-y-4">
                           <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">Output Targets</h3>
                           <Controller
                               name="outputOptions"
                               control={control}
                               render={({ field }) => {
                                   const toggleOption = (opt: string) => {
                                       const current = field.value || [];
                                       if (current.includes(opt)) {
                                           field.onChange(current.filter(i => i !== opt));
                                       } else {
                                           field.onChange([...current, opt]);
                                       }
                                   };

                                   const options = [
                                       { id: 'summary', icon: '📝', label: 'Summary' },
                                       { id: 'mindmap', icon: '🕸️', label: 'Mind Map' },
                                       { id: 'practice', icon: '❓', label: 'Practice Quiz' },
                                       { id: 'infographic', icon: '📊', label: 'Infographic' },
                                   ];

                                   return (
                                       <div className="flex flex-wrap gap-3">
                                           {options.map(opt => {
                                               const isSelected = field.value?.includes(opt.id);
                                               return (
                                                   <button
                                                       type="button"
                                                       key={opt.id}
                                                       onClick={() => toggleOption(opt.id)}
                                                       className={`px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all border ${isSelected ? 'bg-brand-cyan/20 border-brand-cyan/50 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
                                                   >
                                                       <span>{opt.icon}</span> {opt.label}
                                                       {isSelected && <Check className="w-4 h-4 text-brand-cyan" />}
                                                   </button>
                                               )
                                           })}
                                       </div>
                                   )
                               }}
                           />
                           {errors.outputOptions && <p className="text-red-400 text-xs font-bold">{errors.outputOptions.message}</p>}
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-cyan hover:bg-accent-cyan text-black p-5 rounded-3xl font-black text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 uppercase tracking-widest relative overflow-hidden"
      >
          {isLoading ? (
             <span className="animate-pulse">{language === 'arabic' ? 'جاري التحليل المعرفي...' : 'Processing Knowledge...'}</span>
          ) : (
             language === 'arabic' ? 'بناء المحتوى والفهم 🚀' : 'Generate Understanding 🚀'
          )}
      </button>

    </form>
  );
};
