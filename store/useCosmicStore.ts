import { create } from 'zustand';

interface CosmicState {
    // View State
    activeView: 'list' | 'space';
    setActiveView: (view: 'list' | 'space') => void;

    // Selected Node (for Radar/Detail View)
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;

    reflexNodeId: string | null;
    reflexSubjectId: string | null;
    reflexKeyword: string | null;
    isPanelOpen: boolean;
    setPanelOpen: (open: boolean) => void;
    triggerRedPulse: (subjectId: string, keyword: string) => void;
    clearRedPulse: () => void;

    // Temporary Knowledge stars
    tempNodes: any[];
    addTempNode: (node: any) => void;
    clearTempNodes: () => void;

    // Ship Progress
    shipProgress: number;
    updateShipProgress: (completed: number, total: number, connections: number) => void;
}

export const useCosmicStore = create<CosmicState>((set) => ({
    activeView: 'list',
    setActiveView: (view) => set({ activeView: view }),

    reflexNodeId: null,
    reflexSubjectId: null,
    reflexKeyword: null,
    triggerRedPulse: (subjectId, keyword) => {
        set({ reflexNodeId: subjectId, reflexSubjectId: subjectId, reflexKeyword: keyword });
    },
    clearRedPulse: () => set({ reflexNodeId: null, reflexSubjectId: null, reflexKeyword: null }),

    shipProgress: 0,
    updateShipProgress: (completedLessons, totalLessons, connections) => {
        if (totalLessons === 0) return;
        const rawProgress = (completedLessons * connections) / Math.pow(totalLessons, 2);
        const progress = Math.min(Math.round(rawProgress * 100 * 5), 100);
        set({ shipProgress: progress });
    },

    selectedNodeId: null,
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),

    isPanelOpen: false,
    setPanelOpen: (open) => set({ isPanelOpen: open }),

    tempNodes: [],
    addTempNode: (node) => set((state) => ({ tempNodes: [...state.tempNodes, node] })),
    clearTempNodes: () => set({ tempNodes: [] }),
}));
