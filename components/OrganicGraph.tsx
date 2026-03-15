import React, { useMemo, useRef, useEffect, useState, useContext } from 'react';
import cytoscape from 'cytoscape';
import { useOrganicStore } from '../store/useOrganicStore';
import { AppContext } from '../App';
import { useNavigate } from 'react-router-dom';

interface OrganicGraphProps {
    searchQuery?: string;
    onNodeSelect?: (nodeId: string) => void;
}

const OrganicGraph: React.FC<OrganicGraphProps> = ({ searchQuery, onNodeSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const { compounds, reactions, edges, isLoading } = useOrganicStore();
    const { language } = useContext(AppContext);
    const navigate = useNavigate();
    const [zoom, setZoom] = useState(1);

    const elements = useMemo(() => {
        const els: any[] = [];
        
        // Compound Nodes
        compounds.forEach(comp => {
            els.push({
                data: {
                    id: comp.id,
                    name: language === 'ar' ? comp.name_ar : comp.name_en,
                    formula: comp.formula,
                    type: 'compound',
                    color: '#00d2ff',
                    val: 30
                }
            });
        });

        // Reaction Edges
        edges.forEach(edge => {
            const reaction = reactions.find(r => r.id === edge.reaction_id);
            els.push({
                data: {
                    id: edge.id,
                    source: edge.from_compound_id,
                    target: edge.to_compound_id,
                    label: reaction?.name || '',
                    type: 'reaction',
                    color: 'rgba(255, 255, 255, 0.2)'
                }
            });
        });

        return els;
    }, [compounds, reactions, edges, language]);

    useEffect(() => {
        if (!containerRef.current || isLoading) return;

        const cy = cytoscape({
            container: containerRef.current,
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': 'data(color)',
                        'width': 'data(val)',
                        'height': 'data(val)',
                        'label': (node: any) => {
                            if (zoom > 0.6) return `${node.data('name')}\n(${node.data('formula')})`;
                            return node.data('formula');
                        },
                        'color': '#fff',
                        'font-size': '10px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'text-wrap': 'wrap',
                        'text-max-width': '80px',
                        'font-family': 'Outfit, sans-serif',
                        'transition-property': 'background-color, width, height',
                        'transition-duration': 300
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': 8,
                        'color': '#94a3b8',
                        'text-rotation': 'autorotate',
                        'text-margin-y': -10,
                        'overlay-opacity': 0
                    }
                }
            ],
            layout: {
                name: 'cose',
                animate: true,
                nodeRepulsion: 10000,
                idealEdgeLength: 100
            }
        });

        cy.on('tap', 'node', (evt) => {
            const id = evt.target.id();
            if (onNodeSelect) onNodeSelect(id);
        });

        cy.on('zoom', () => setZoom(cy.zoom()));
        cyRef.current = cy;

        return () => {
            cy.destroy();
            cyRef.current = null;
        };
    }, [elements, isLoading, onNodeSelect]);

    return (
        <div className="w-full h-full bg-[#020617]/50 relative rounded-3xl border border-white/5 overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};

export default OrganicGraph;
