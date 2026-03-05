
export interface CinematicTheme {
    name: string;
    primary: string;
    gradientStart: string;
    gradientEnd: string;
    glow: string;
    bgOverlay?: string; // Optional CSS background overlay
    background?: string;
}

export const cinematicThemes: CinematicTheme[] = [
    {
        name: 'Cyberpunk Neon',
        primary: '#f472b6', // Pink-400
        gradientStart: '#ec4899',
        gradientEnd: '#8b5cf6', // Violet
        glow: 'rgba(236, 72, 153, 0.6)',
        background: '#0f172a' // Slate-900 with tint
    },
    {
        name: 'Deep Ocean',
        primary: '#22d3ee', // Cyan-400
        gradientStart: '#0ea5e9',
        gradientEnd: '#3b82f6', // Blue
        glow: 'rgba(34, 211, 238, 0.6)',
        background: '#0c4a6e' // Sky-900 (Deep Blue)
    },
    {
        name: 'Matrix Code',
        primary: '#4ade80', // Green-400
        gradientStart: '#22c55e',
        gradientEnd: '#065f46', // Emerald
        glow: 'rgba(74, 222, 128, 0.6)',
        background: '#022c22' // Emerald-950
    },
    {
        name: 'Sunset Blvd',
        primary: '#fb923c', // Orange-400
        gradientStart: '#f97316',
        gradientEnd: '#db2777', // Pink
        glow: 'rgba(251, 146, 60, 0.6)',
        background: '#451a03' // Amber-950
    },
    {
        name: 'Royal Galaxy',
        primary: '#c084fc', // Purple-400
        gradientStart: '#a855f7',
        gradientEnd: '#4f46e5', // Indigo
        glow: 'rgba(192, 132, 252, 0.6)',
        background: '#1e1b4b' // Indigo-950
    },
    {
        name: 'Crimson Night',
        primary: '#f87171', // Red-400
        gradientStart: '#ef4444',
        gradientEnd: '#991b1b', // Red-900
        glow: 'rgba(248, 113, 113, 0.6)',
        background: '#450a0a' // Red-950
    },
    {
        name: 'Golden Hour',
        primary: '#facc15', // Yellow-400
        gradientStart: '#eab308',
        gradientEnd: '#a16207', // Yellow-800
        glow: 'rgba(250, 204, 21, 0.6)',
        background: '#422006' // Yellow-950
    },
    {
        name: 'Midnight Slate',
        primary: '#94a3b8', // Slate-400
        gradientStart: '#64748b',
        gradientEnd: '#1e293b', // Slate-800
        glow: 'rgba(148, 163, 184, 0.4)',
        background: '#020617' // Slate-950
    }
];

export const getRandomTheme = (): CinematicTheme => {
    const randomIndex = Math.floor(Math.random() * cinematicThemes.length);
    return cinematicThemes[randomIndex];
};

export const getThemeForSubject = (subjectName?: string): CinematicTheme => {
    // If we want deterministic themes for specific names, we can map them here
    // For now, return random or a default if name matches known ones? 
    // Actually, App.tsx has `subjectDefaultColors`. 
    // We can migrate that here later, but for now this is for the randomizer.
    return getRandomTheme();
};
