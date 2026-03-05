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

                // Brand Colors (Madrasetna Plus)
                brand: {
                    cyan: '#11D3EE',
                    purple: '#8A3FFC',
                    magenta: '#D2267D',
                    dark: '#121212',
                    black: '#000000'
                },

                'theme-primary': '#D2267D',
                'theme-input': 'var(--input-bg)',
                'theme-divider': 'var(--divider)',
                'theme-progress-track': 'var(--progress-track)',
                'theme-overlay': 'var(--overlay-bg)',

                // Functional accent colors (static)
                accent: {
                    blue: '#3B82F6',
                    green: '#22C55E',
                    red: '#EF4444',
                    amber: '#F59E0B',
                    cyan: '#06B6D4',
                    violet: '#8B5CF6',
                    pink: '#EC4899',
                },
            },
            boxShadow: {
                'glass': 'var(--card-shadow)',
                'glass-hover': 'var(--card-shadow-hover)',
                'glow-brand': '0 0 20px rgba(138, 63, 252, 0.5)',
            },
            backgroundImage: {
                'theme-gradient': 'linear-gradient(135deg, var(--bg-base) 0%, var(--bg-base-end) 100%)',
                'ott-gradient': 'linear-gradient(90deg, #11D3EE 0%, #8A3FFC 50%, #D2267D 100%)',
                'btn-power': 'linear-gradient(135deg, #8A3FFC 0%, #D2267D 100%)',
            },
        },
    },
    plugins: [],
}
