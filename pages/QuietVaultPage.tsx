import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../App';
import { LockIcon, UnlockIcon, PlayIcon, PauseIcon, SaveIcon, XIcon } from '../components/Icons';

// --- Web Crypto E2EE Helpers ---
const deriveKey = async (password: string, salt: Uint8Array) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as unknown as BufferSource,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

const encryptText = async (text: string, password: string) => {
    if (!text) return '';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(text)
    );

    const cipherArray = new Uint8Array(cipherBuffer);
    const combined = new Uint8Array(salt.length + iv.length + cipherArray.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(cipherArray, salt.length + iv.length);

    // To Base64 safely
    const binStr = Array.from(combined).map(b => String.fromCharCode(b)).join('');
    return btoa(binStr);
};

const decryptText = async (base64Str: string, password: string) => {
    if (!base64Str) return '';
    try {
        const binStr = atob(base64Str);
        const combined = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) combined[i] = binStr.charCodeAt(i);

        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const cipherArray = combined.slice(28);

        const key = await deriveKey(password, salt);
        const plainBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            cipherArray
        );

        return new TextDecoder().decode(plainBuffer);
    } catch (e) {
        throw new Error('INVALID_PASSWORD');
    }
};

const QuietVaultPage: React.FC = () => {
    const { user, language } = useContext(AppContext);
    const [isLocked, setIsLocked] = useState(true);
    const [password, setPassword] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // A soothing Nahawand / Quranic aesthetic audio source
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const STORAGE_KEY = `quiet_vault_${user}`;

    useEffect(() => {
        // Init audio placeholder, user can replace the src.
        // Using a soothing ambient rain / meditation track if Nahawand isn't directly available.
        audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fdd97e.mp3?filename=desert-ambient-111161.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.4;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.log('Audio play error:', e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const encryptedData = localStorage.getItem(STORAGE_KEY);
        if (!encryptedData) {
            // First time setup
            setIsLocked(false);
            return;
        }

        try {
            const dec = await decryptText(encryptedData, password);
            setContent(dec);
            setIsLocked(false);
        } catch (err: any) {
             setError(language === 'ar' ? 'كلمة المرور غير صحيحة.' : 'Incorrect password.');
        }
    };

    const handleSave = async () => {
        if (isLocked || !password) return;
        setIsSaving(true);
        try {
            const enc = await encryptText(content, password);
            localStorage.setItem(STORAGE_KEY, enc);
            
            // Show brief save indicator
            setTimeout(() => setIsSaving(false), 800);
        } catch (err) {
            console.error("Save failed:", err);
            setIsSaving(false);
        }
    };

    // Auto-save on blur or 3s after typing
    useEffect(() => {
        if (isLocked || !password) return;
        const timer = setTimeout(() => {
            handleSave();
        }, 3000);
        return () => clearTimeout(timer);
    }, [content, isLocked]);

    const handleLock = () => {
        handleSave().then(() => {
            setContent('');
            setPassword('');
            setIsLocked(true);
            if (isPlaying) toggleAudio();
        });
    };

    if (isLocked) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6 bg-black relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Visual Aesthetics */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a120b] to-black opacity-80 mix-blend-multiply"></div>
                <div className="absolute w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}></div>
                
                <div className="relative z-10 w-full max-w-md bg-[#0a0705]/80 backdrop-blur-2xl border border-[#d4af37]/20 rounded-3xl p-10 shadow-[0_0_50px_rgba(212,175,55,0.05)] text-center animate-fade-in">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full flex items-center justify-center border border-[#d4af37]/30 mb-8 shadow-inner shadow-[#d4af37]/20">
                        <LockIcon className="w-8 h-8 text-[#d4af37]" />
                    </div>
                    
                    <h2 className="text-3xl font-arabic font-black text-[#d4af37] mb-2 tracking-wide">
                        {language === 'ar' ? 'التوثيق الصامت' : 'The Quiet Vault'}
                    </h2>
                    <p className="text-sm text-[#d4af37]/60 mb-8 font-serif italic">
                        {language === 'ar' 
                            ? 'مساحتك الآمنة للتأمل وتفريغ الذهن. مشفرة بالكامل (E2EE) ولا تخرج من جهازك.'
                            : 'Your safe space for reflection. Completely Encrypted (E2EE) and stays on device.'}
                    </p>

                    <form onSubmit={handleUnlock} className="flex flex-col gap-4">
                        <div className="relative">
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={language === 'ar' ? 'مفتاح الخزنة...' : 'Vault Key...'}
                                className="w-full bg-black/50 border border-[#d4af37]/30 rounded-xl px-5 py-4 text-[#efdfa3] text-center focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 outline-none transition-all placeholder:text-[#d4af37]/30 tracking-[0.2em]"
                                required
                            />
                        </div>
                        {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                        
                        <button type="submit" className="w-full py-4 mt-2 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] rounded-xl font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                            {language === 'ar' ? 'فتح الخزنة' : 'Unlock'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#050302] relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="absolute w-full h-full opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}></div>
            
            <header className="px-8 py-5 border-b border-[#d4af37]/10 flex items-center justify-between relative z-10 bg-[#0a0705]/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
                        <UnlockIcon className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-arabic font-black text-[#d4af37] tracking-wider">
                            {language === 'ar' ? 'التوثيق الصامت' : 'The Quiet Vault'}
                        </h1>
                        <p className="text-[10px] text-[#d4af37]/50 uppercase tracking-widest font-bold">End-To-End Encrypted</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${isSaving ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37]' : 'bg-transparent border-transparent text-[#d4af37]/30'}`}>
                        <SaveIcon className="w-3 h-3" />
                        {language === 'ar' ? (isSaving ? 'قيد الحفظ...' : 'محفوظ') : (isSaving ? 'Saving...' : 'Saved')}
                    </div>

                    <button 
                        onClick={toggleAudio}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${isPlaying ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' : 'bg-white/5 border-white/5 text-gray-500 hover:text-[#d4af37]'}`}
                        title={language === 'ar' ? 'موسيقى مقام النهاوند للخلفية' : 'Nahawand Background Audio'}
                    >
                        {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    </button>
                    
                    <button 
                        onClick={handleLock}
                        className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                    >
                        <LockIcon className="w-4 h-4" />
                        {language === 'ar' ? 'أغلق الخزنة' : 'Lock Vault'}
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 relative z-10 flex flex-col">
                <div className="mb-8 text-center">
                    <p className="text-[#d4af37]/60 font-serif leading-relaxed text-lg italic">
                        {language === 'ar' 
                            ? 'أرحل عن ضجيج الأمس.. مساحة خالية من الرقابة والضغوط. كل ما يكتب هنا، يبقى هنا.'
                            : 'Leave the noise behind. A space free of pressure and surveillance. What is written here, stays here.'}
                    </p>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent mx-auto mt-6"></div>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={language === 'ar' ? 'اكتب ما يعتريك...' : 'Write your thoughts...'}
                    className="flex-1 w-full bg-transparent text-[#efdfa3] text-lg md:text-xl font-medium leading-loose resize-none outline-none placeholder:text-[#d4af37]/20 custom-scrollbar pb-20"
                    spellCheck={false}
                    autoFocus
                />
            </main>
        </div>
    );
};

export default QuietVaultPage;
