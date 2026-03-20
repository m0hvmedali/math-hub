import React, { useEffect, useRef } from 'react';
// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { mathBox } from 'mathbox/build/esm/index.js';
import 'mathbox/build/mathbox.css';

interface MathBoxVisualizerProps {
    data: any;
}

const MathBoxVisualizer: React.FC<MathBoxVisualizerProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mathboxRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize MathBox
        const box = mathBox({
            plugins: ['core', 'controls', 'cursor', 'mathbox'],
            controls: {
                klass: (THREE as any).OrbitControls,
            },
            element: containerRef.current,
        });

        const three = box.three;
        three.renderer.setClearColor(new THREE.Color(0x000000), 0);
        
        // Setup View
        const view = box
            .set({ focus: 3 })
            .cartesian({
                range: [[-5, 5], [-5, 5], [-5, 5]],
                scale: [2, 2, 2],
            });

        // Add Grid & Axes
        view.grid({ width: 2, divideX: 20, divideY: 20, opacity: 0.25 });
        view.axis({ axis: 1, width: 3, color: 0xff4444 });
        view.axis({ axis: 2, width: 3, color: 0x44ff44 });
        view.axis({ axis: 3, width: 3, color: 0x4444ff });

        // Logic to render based on 'data'
        if (data.equation) {
            // Example: Surface z = f(x, y)
            view.area({
                id: 'surface-data',
                width: 64,
                height: 64,
                axes: [1, 3],
                expr: (emit: any, x: number, y: number, i: number, j: number, t: number) => {
                    // This is where we'd parse data.equation
                    // For now, let's use a placeholder or safe eval
                    try {
                        const z = Math.sin(x + t) * Math.cos(y + t);
                        emit(x, z, y);
                    } catch (e) {
                        emit(x, 0, y);
                    }
                },
            });
            view.surface({
                shaded: true,
                color: 0x00ffff,
                opacity: 0.8,
            });
        }

        mathboxRef.current = box;

        return () => {
            if (mathboxRef.current) {
                // Cleanup mathbox/three resources if necessary
                // mathboxRef.current.destroy();
            }
        };
    }, [data]);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full relative"
            style={{ minHeight: '500px' }}
        />
    );
};

export default MathBoxVisualizer;
