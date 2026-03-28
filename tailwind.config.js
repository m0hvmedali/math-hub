/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Cairo', 'sans-serif'],
                arabic: ['Cairo', 'sans-serif'],
            },
            colors: {
                // OTT Semantic theme tokens (Dark by default)
                'theme-base': 'var(--bg-base)',
                'theme-base-end': 'var(--bg-base-end)',
                'theme-glass': 'var(--glass-bg)',
                'theme-glass-border': 'var(--glass-border)',
                'theme-glass-hover': 'var(--glass-hover-border)',
                'theme-text': 'var(--text-primary)',
                'theme-text-secondary': 'var(--text-secondary)',
                'theme-text-muted': 'var(--text-muted)',

                // Brand Colors → NOW CSS VARIABLES (Dynamic!)
                brand: {
                    cyan: 'var(--brand-cyan)',
                    purple: 'var(--brand-purple)',
                    magenta: 'var(--brand-magenta)',
                    secondary: 'var(--brand-secondary)',
                    dark: '#121212',
                    black: '#000000'
                },

                'theme-primary': 'var(--brand-magenta)',
                'theme-input': 'var(--input-bg)',
                'theme-divider': 'var(--divider)',
                'theme-progress-track': 'var(--progress-track)',
                'theme-overlay': 'var(--overlay-bg)',
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },

                // Functional accent colors → NOW CSS VARIABLES (Dynamic!)
                accent: {
                    blue: 'var(--accent-blue)',
                    green: 'var(--accent-green)',
                    red: 'var(--accent-red)',
                    amber: 'var(--accent-amber)',
                    cyan: 'var(--accent-cyan)',
                    violet: 'var(--accent-violet)',
                    pink: 'var(--accent-pink)',
                },
            },
            boxShadow: {
                'glass': 'var(--card-shadow)',
                'glass-hover': 'var(--card-shadow-hover)',
                'glow-brand': '0 0 20px color-mix(in srgb, var(--brand-purple) 50%, transparent)',
            },
            backgroundImage: {
                'theme-gradient': 'linear-gradient(135deg, var(--bg-base) 0%, var(--bg-base-end) 100%)',
                'ott-gradient': 'linear-gradient(90deg, var(--brand-cyan) 0%, var(--brand-purple) 50%, var(--brand-magenta) 100%)',
                'btn-power': 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-magenta) 100%)',
            },
        },
    },
    plugins: [],
}
