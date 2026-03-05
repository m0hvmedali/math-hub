import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { useCosmicStore } from '../store/useCosmicStore';
import { Subject, CustomNode, ManualLink } from '../types';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, LinkIcon } from './Icons';

interface CosmicGraphProps {
    subjects: Subject[];
    searchQuery?: string;
    searchResults?: any[];
    customNodes: CustomNode[];
    manualLinks: ManualLink[];
    onOpenInjector: () => void;
    addManualLink?: (sourceId: string, targetId: string) => Promise<void>;
}

const CosmicGraph: React.FC<CosmicGraphProps> = ({ subjects, searchQuery, searchResults, customNodes, manualLinks, onOpenInjector, addManualLink }) => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const { reflexNodeId, setSelectedNodeId, tempNodes, setPanelOpen, selectedNodeId, language } = useCosmicStore();
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [linkingMode, setLinkingMode] = useState(false);
    const [linkSource, setLinkSource] = useState<string | null>(null);

    // Prepare data for Cytoscape
    const elements = useMemo(() => {
        const els: any[] = [];
        const resultIds = new Set(searchResults?.map(r => r.ref) || []);
        const isFiltering = !!searchQuery && searchQuery.length > 0;

        subjects.forEach(subject => {
            let subjectVisible = false;
            const isPulsing = reflexNodeId === subject.id;

            // Subject Node
            const subjectNode = {
                data: {
                    id: subject.id,
                    name: subject.name,
                    type: 'subject',
                    val: 40,
                    color: isPulsing ? '#ef4444' : '#00d2ff',
                    isPulsing
                }
            };

            subject.branches?.forEach(branch => {
                let branchVisible = false;

                branch.lessons?.forEach(lesson => {
                    const isResult = resultIds.has(lesson.id);
                    if (!isFiltering || isResult || isPulsing) {
                        subjectVisible = true;
                        branchVisible = true;

                        els.push({
                            data: {
                                id: lesson.id,
                                name: lesson.name,
                                type: 'lesson',
                                val: 15,
                                color: '#94a3b8',
                                parentId: branch.id,
                                subjectId: subject.id,
                                isSearchResult: isResult
                            }
                        });

                        els.push({
                            data: {
                                id: `e-${branch.id}-${lesson.id}`,
                                source: branch.id,
                                target: lesson.id,
                                color: 'rgba(0, 210, 255, 0.1)'
                            }
                        });
                    }
                });

                if (!isFiltering || branchVisible || isPulsing) {
                    els.push({
                        data: {
                            id: branch.id,
                            name: branch.name,
                            type: 'branch',
                            val: 25,
                            color: '#60a5fa',
                            parentId: subject.id
                        }
                    });

                    els.push({
                        data: {
                            id: `e-${subject.id}-${branch.id}`,
                            source: subject.id,
                            target: branch.id,
                            color: 'rgba(0, 210, 255, 0.2)'
                        }
                    });
                }
            });

            if (!isFiltering || subjectVisible || isPulsing) {
                els.push(subjectNode);

                // Temp Nodes
                tempNodes.filter(tn => tn.parentId === subject.id).forEach(tn => {
                    els.push({
                        data: {
                            ...tn,
                            type: 'temp',
                            val: 20,
                            color: tn.color || '#fff'
                        }
                    });
                    els.push({
                        data: {
                            id: `e-${subject.id}-${tn.id}`,
                            source: subject.id,
                            target: tn.id,
                            color: 'rgba(255, 255, 255, 0.3)',
                            dashed: true
                        }
                    });
                });

                // Persistent Custom Nodes
                (customNodes || []).filter(cn => cn.subject_id === subject.id).forEach(cn => {
                    els.push({
                        data: {
                            id: cn.id,
                            name: cn.label,
                            type: 'temp', // Style same as temp
                            url: cn.url,
                            val: 20,
                            color: '#fbbf24'
                        }
                    });
                    els.push({
                        data: {
                            id: `e-${subject.id}-${cn.id}`,
                            source: subject.id,
                            target: cn.id,
                            color: 'rgba(251, 191, 36, 0.3)',
                            dashed: true
                        }
                    });
                });
            }
        });

        // Manual Links
        if (manualLinks) {
            manualLinks.forEach(link => {
                els.push({
                    data: {
                        id: `manual-e-${link.source_id}-${link.target_id}`,
                        source: link.source_id,
                        target: link.target_id,
                        color: '#8b5cf6',
                        dashed: true,
                        manual: true
                    }
                });
            });
        }

        return els;
    }, [subjects, searchQuery, searchResults, reflexNodeId, tempNodes, customNodes, manualLinks]);

    // Initialize Cytoscape
    useEffect(() => {
        if (!containerRef.current) return;

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
                        'opacity': (node: any) => {
                            if (!hoveredNodeId && !selectedNodeId && !linkingMode) return 1;
                            const nid = node.id();
                            if (nid === hoveredNodeId || nid === selectedNodeId || (linkingMode && nid === linkSource)) return 1;
                            const activeId = hoveredNodeId || selectedNodeId || linkSource;
                            if (!activeId) return 1; // If no active node, all visible
                            const edges = node.connectedEdges();
                            const isConnected = edges.some((e: any) => e.source().id() === activeId || e.target().id() === activeId);
                            return isConnected ? 1 : 0.1;
                        },
                        'label': (node: any) => {
                            const type = node.data('type');
                            if (type === 'subject' || zoom > 0.8 || node.id() === hoveredNodeId || node.id() === selectedNodeId || (linkingMode && node.id() === linkSource)) {
                                return node.data('name');
                            }
                            return '';
                        },
                        'color': '#fff',
                        'font-size': '10px',
                        'text-valign': 'bottom',
                        'text-margin-y': '5px',
                        'text-wrap': 'wrap',
                        'text-max-width': '80px',
                        'font-family': 'Outfit, sans-serif',
                        'overlay-opacity': 0,
                        'transition-property': 'background-color, width, height, opacity',
                        'transition-duration': '0.3s'
                    }
                },
                {
                    selector: 'node[type="temp"]',
                    style: {
                        'shape': 'triangle',
                        'background-color': '#fbbf24',
                        'border-width': 2,
                        'border-color': '#fbbf24',
                        'border-opacity': 0.5
                    }
                },
                {
                    selector: 'node[type="subject"]',
                    style: {
                        'font-size': '14px',
                        'font-weight': 'bold',
                        'border-width': 3,
                        'border-color': 'data(color)',
                        'border-opacity': 0.4
                    }
                },
                {
                    selector: 'node[?isSearchResult]',
                    style: {
                        'border-width': 4,
                        'border-color': '#fff',
                        'border-opacity': 0.8
                    }
                },
                {
                    selector: 'node[?isPulsing]',
                    style: {
                        'background-color': '#ef4444',
                        'border-width': 5,
                        'border-color': '#ef4444',
                        'border-opacity': 0.6
                    }
                },
                {
                    selector: '.source-selected',
                    style: {
                        'border-width': 4,
                        'border-color': '#fff',
                        'border-style': 'double'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 1,
                        'line-color': 'data(color)',
                        'curve-style': 'bezier',
                        'opacity': 0.3,
                        'line-dash-pattern': [5, 5]
                    }
                },
                {
                    selector: 'edge[?dashed]',
                    style: {
                        'line-style': 'dashed'
                    }
                }
            ],
            layout: {
                name: 'cose',
                animate: true,
                randomize: true,
                componentSpacing: 100,
                nodeRepulsion: (node: any) => 400000,
                nestingFactor: 1.2,
                idealEdgeLength: (edge: any) => 100,
                edgeElasticity: (edge: any) => 100
            }
        });

        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            const id = node.id();
            const type = node.data('type');

            if (linkingMode) {
                if (!linkSource) {
                    if (type !== 'subject') {
                        setLinkSource(id);
                        node.addClass('source-selected');
                    } else {
                        alert(language === 'ar' ? 'اختر القمر أولاً للربط' : 'Select a moon first to link');
                    }
                } else {
                    if (type === 'subject') {
                        if (addManualLink) {
                            addManualLink(linkSource, id);
                            setLinkingMode(false);
                            setLinkSource(null);
                            cy.nodes().removeClass('source-selected');
                        }
                    } else {
                        setLinkSource(id);
                        cy.nodes().removeClass('source-selected');
                        node.addClass('source-selected');
                    }
                }
                return;
            }

            setSelectedNodeId(node.id());
            if (node.data('isPulsing')) {
                setPanelOpen(true);
            } else if (type === 'subject') {
                navigate(`/subject/${id}`);
            } else if (type === 'lesson') {
                navigate(`/subject/${node.data('subjectId')}/branch/${node.data('parentId')}/lesson/${id}`);
            } else if (type === 'temp') {
                if (node.data('url')) window.open(node.data('url'), '_blank');
            }
        });

        cy.on('mouseover', 'node', (evt) => setHoveredNodeId(evt.target.id()));
        cy.on('mouseout', 'node', () => setHoveredNodeId(null));
        cy.on('zoom', () => setZoom(cy.zoom()));

        cyRef.current = cy;

        return () => {
            cy.destroy();
            cyRef.current = null;
        };
    }, [linkingMode, linkSource, addManualLink, language]);

    // Update elements when they change
    useEffect(() => {
        if (cyRef.current && elements.length > 0) {
            try {
                cyRef.current.json({ elements });
                cyRef.current.layout({ name: 'cose', animate: true, fit: true }).run();
            } catch (e) {
                console.warn("Cytoscape update failed:", e);
            }
        }
    }, [elements, linkingMode]);

    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [showMenu, setShowMenu] = useState(false);

    // Right-click handling in Cytoscape
    useEffect(() => {
        if (!cyRef.current || linkingMode) return; // Disable right-click menu in linking mode
        cyRef.current.on('cxttap', 'node', (evt) => {
            const pos = evt.renderedPosition;
            setMenuPos(pos);
            setShowMenu(true);
        });
        return () => {
            if (cyRef.current) {
                cyRef.current.off('cxttap', 'node');
            }
        };
    }, [cyRef.current, linkingMode]);

    return (
        <div className="w-full h-full bg-[#020617] relative overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
            <div ref={containerRef} className="w-full h-full" />

            {showMenu && (
                <div
                    className="fixed z-[100] animate-scale-up"
                    style={{ left: menuPos.x, top: menuPos.y }}
                >
                    <button
                        onClick={() => {
                            setShowMenu(false);
                            onOpenInjector();
                        }}
                        className="bg-accent-blue w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"
                    >
                        <PlusIcon className="w-6 h-6" />
                        <div className="absolute inset-0 pointer-events-none rounded-full border border-accent-blue animate-ping opacity-20"></div>
                    </button>
                </div>
            )}

            {/* Global FAB */}
            <div className="absolute top-6 right-6 flex flex-col gap-3 z-50">
                <button
                    onClick={() => {
                        setLinkingMode(!linkingMode);
                        setLinkSource(null);
                        if (cyRef.current) cyRef.current.nodes().removeClass('source-selected');
                    }}
                    className={`p-2.5 rounded-xl border backdrop-blur-xl transition-all flex items-center gap-2 font-bold shadow-2xl ${linkingMode ? 'bg-accent-blue border-accent-blue text-white animate-pulse' : 'bg-black/40 border-white/10 text-white hover:border-accent-blue'}`}
                >
                    <LinkIcon className="w-4 h-4" />
                    <span className="text-xs">{linkingMode ? (language === 'ar' ? 'جاري الربط...' : 'Linking...') : (language === 'ar' ? 'ربط' : 'Link')}</span>
                </button>

                <button
                    onClick={onOpenInjector}
                    className="p-2.5 bg-accent-blue/20 hover:bg-accent-blue/40 border border-accent-blue/30 rounded-xl text-accent-blue font-bold backdrop-blur-xl transition-all shadow-2xl flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="text-xs">{language === 'ar' ? 'حقن' : 'Inject'}</span>
                </button>
            </div>

            {/* Cinematic HUD Overlay */}
            <div className="absolute bottom-8 left-8 p-5 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] pointer-events-none z-10 shadow-2xl">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#00d2ff] shadow-[0_0_15px_#00d2ff]"></div>
                        <span className="text-xs font-black text-white uppercase tracking-tighter">Planets (Subjects)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent-blue opacity-60"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Moons (Branches)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-tighter">Stars (Lessons)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CosmicGraph;
