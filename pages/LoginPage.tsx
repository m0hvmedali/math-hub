import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface LoginPageProps {
    onLogin: (name: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [name, setName] = useState('');

    const handleGoogleLogin = async () => {
        if (!supabase) return;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard'
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed) {
            // Admin or 4-digit ID
            if (trimmed === '8128' || /^\d{4}$/.test(trimmed)) {
                onLogin(trimmed);
            } else if (!isNaN(Number(trimmed))) {
                // Pad with zeros if it's a number but not 4 digits
                onLogin(trimmed.padStart(4, '0'));
            } else {
                onLogin(trimmed);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--bg-base) 0%, var(--bg-base-end) 100%)' }}>
            <div className="absolute top-[-20%] left-[-20%] w-[50vw] h-[50vw] bg-brand-cyan/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] bg-accent-violet/10 rounded-full blur-[120px]"></div>

            <div className="relative z-10 w-full max-w-md text-center">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[var(--text-primary)] mb-2 tracking-tighter uppercase">MATH<span className="text-brand-cyan">HUB</span></h1>
                <p className="text-[var(--text-muted)] text-lg mb-12 tracking-widest uppercase">Identify Yourself</p>

                <div className="flex flex-col gap-6">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full glass-card p-5 rounded-2xl flex items-center justify-center gap-4 hover:border-brand-cyan/50 hover:bg-brand-cyan/5 transition-all text-white font-black uppercase tracking-widest text-sm md:text-base border border-white/10"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                           <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                           <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                           <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                           <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                    </button>

                    <div className="flex items-center gap-4 py-4">
                        <div className="flex-1 h-px bg-white/5"></div>
                        <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em]">or use neural id</span>
                        <div className="flex-1 h-px bg-white/5"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name or ID..."
                            className="w-full glass-card p-4 rounded-xl text-[var(--text-primary)] text-center text-lg focus:outline-none focus:border-brand-cyan/50 transition-colors placeholder-[var(--text-muted)] font-bold !transform-none"
                        />
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="btn-power w-full p-4 rounded-xl text-lg uppercase tracking-widest disabled:opacity-50"
                        >
                            Initialize
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-[var(--text-muted)] text-xs">
                    * Data is synced to the cloud based on this ID.
                    <br /> Use "8128" to access public shared resources.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;