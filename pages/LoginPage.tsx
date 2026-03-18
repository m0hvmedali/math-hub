import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (name: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [name, setName] = useState('');

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
                <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-2 tracking-tighter uppercase">MATH<span className="text-brand-cyan">HUB</span></h1>
                <p className="text-[var(--text-muted)] text-lg mb-12 tracking-widest uppercase">Identify Yourself</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full glass-card p-4 rounded-xl text-[var(--text-primary)] text-center text-lg md:text-xl focus:outline-none focus:border-brand-cyan/50 transition-colors placeholder-[var(--text-muted)] font-bold !transform-none"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="btn-power w-full p-4 rounded-xl text-lg md:text-xl uppercase tracking-widest disabled:opacity-50"
                    >
                        Initialize
                    </button>

                    <button
                        type="button"
                        onClick={() => window.location.href = '/guide'}
                        className="text-brand-cyan/60 hover:text-brand-cyan transition-colors font-bold uppercase tracking-widest text-sm py-2"
                    >
                        Read User Guide / دليل المستخدم
                    </button>
                </form>

                <p className="mt-8 text-[var(--text-muted)] text-xs">
                    * Data is synced to the cloud based on this ID.
                    <br /> Use "8128" to access public shared resources.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;