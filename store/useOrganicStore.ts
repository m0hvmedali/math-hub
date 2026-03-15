import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { OrgCompound, OrgReaction, OrgLesson, OrgReactionEdge } from '../types/organic';
import seedCompounds from '../utils/org_seed_compounds.json';
import seedReactions from '../utils/org_seed_reactions.json';

interface OrganicState {
    compounds: OrgCompound[];
    reactions: OrgReaction[];
    lessons: OrgLesson[];
    edges: OrgReactionEdge[];
    isLoading: boolean;

    fetchOrganicData: () => Promise<void>;
    
    // Simulations
    simulateReaction: (reactants: string[], reagents?: string) => OrgReaction[];
    
    // Pathfinder
    findPath: (startId: string, endId: string, maxSteps?: number) => any[];
}

export const useOrganicStore = create<OrganicState>((set, get) => ({
    compounds: [],
    reactions: [],
    lessons: [],
    edges: [],
    isLoading: false,

    fetchOrganicData: async () => {
        set({ isLoading: true });
        try {
            const [compRes, reactRes, lessRes, edgeRes] = await Promise.all([
                supabase.from('org_compounds').select('*'),
                supabase.from('org_reactions').select('*'),
                supabase.from('org_lessons').select('*').order('order_index'),
                supabase.from('org_reaction_edges').select('*')
            ]);

            const compounds = compRes.data?.length ? compRes.data : seedCompounds as any[];
            const reactions = reactRes.data?.length ? reactRes.data : seedReactions as any[];
            
            // Auto-generate edges for seeds if needed
            let finalEdges = edgeRes.data || [];
            if (!finalEdges.length && compounds.length && reactions.length) {
                // Dummy edge generation for seeds
                finalEdges = [
                    { id: 'se-1', reaction_id: 're-001', from_compound_id: 'eth-001', to_compound_id: 'etn-001' },
                    { id: 'se-2', reaction_id: 're-002', from_compound_id: 'eth-001', to_compound_id: 'eta-001' }
                ];
            }

            set({
                compounds,
                reactions,
                lessons: lessRes.data || [],
                edges: finalEdges,
                isLoading: false
            });
        } catch (error) {
            console.error("Error fetching organic data, using seeds:", error);
            set({ 
                compounds: seedCompounds as any[], 
                reactions: seedReactions as any[],
                edges: [
                    { id: 'se-1', reaction_id: 're-001', from_compound_id: 'eth-001', to_compound_id: 'etn-001' },
                    { id: 'se-2', reaction_id: 're-002', from_compound_id: 'eth-001', to_compound_id: 'eta-001' }
                ],
                isLoading: false 
            });
        }
    },

    simulateReaction: (reactants, reagents) => {
        const { reactions } = get();
        // Simple logic: match reactions where all reactants are present
        return reactions.filter(r => {
            const hasReactants = r.reactants.every(reactant => 
                reactants.includes(reactant)
            );
            if (!hasReactants) return false;
            
            if (reagents) {
                return r.reagents?.toLowerCase().includes(reagents.toLowerCase());
            }
            return true;
        });
    },

    findPath: (startId, endId, maxSteps = 4) => {
        const { edges, reactions } = get();
        
        // BFS for pathfinding
        const queue: { current: string, path: any[] }[] = [{ current: startId, path: [] }];
        const visited = new Set([startId]);
        const results = [];

        while (queue.length > 0) {
            const { current, path } = queue.shift()!;
            
            if (path.length >= maxSteps) continue;

            const neighbors = edges.filter(e => e.from_compound_id === current);
            
            for (const edge of neighbors) {
                const reaction = reactions.find(r => r.id === edge.reaction_id);
                const nextId = edge.to_compound_id;

                if (nextId === endId) {
                    results.push([...path, { edge, reaction }]);
                }

                if (!visited.has(nextId)) {
                    // visited.add(nextId); // Removing this to allow finding multiple paths
                    queue.push({ current: nextId, path: [...path, { edge, reaction }] });
                }
            }
        }
        
        return results;
    }
}));
