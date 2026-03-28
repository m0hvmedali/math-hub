import React, { Suspense } from 'react';
// @ts-ignore
import { Canvas } from '@react-three/fiber';
// @ts-ignore
import { OrbitControls, Grid, PerspectiveCamera, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';

interface SolidGeometry3DProps {
    data: any;
}

const Vector: React.FC<{ start: [number, number, number]; end: [number, number, number]; color: string; label?: string }> = ({ start, end, color }) => {
    // Defensive check to avoid iterator error if end/start are not arrays
    const s = Array.isArray(start) ? start : [0, 0, 0];
    const e = Array.isArray(end) ? end : [0, 0, 0];
    
    const dir = new THREE.Vector3(...e).sub(new THREE.Vector3(...s));
    const length = dir.length();
    
    return (
        <arrowHelper 
            args={[
                dir.normalize(), 
                new THREE.Vector3(...s), 
                length, 
                color, 
                0.2, 
                0.2
            ]} 
        />
    );
};

const Plane: React.FC<{ normal: [number, number, number]; constant: number; color: string }> = ({ normal, constant, color }) => {
    // Equation: ax + by + cz = d
    // n = [a, b, c], d = constant
    return (
        <mesh rotation-x={-Math.PI / 2} position={[0, constant, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
    );
};

const SolidGeometry3D: React.FC<SolidGeometry3DProps> = ({ data }) => {
    if (!data) return <div className="flex items-center justify-center h-full text-gray-500 italic">No 3D data available</div>;
    
    const vectors = Array.isArray(data.vectors) ? data.vectors : [];
    const planes = Array.isArray(data.planes) ? data.planes : [];

    return (
        <div className="w-full h-full min-h-[500px] bg-black/40">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                <OrbitControls makeDefault />
                
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <axesHelper args={[100]} />
                    
                    <Grid 
                        infiniteGrid 
                        fadeDistance={20} 
                        fadeStrength={5} 
                        sectionSize={1} 
                        cellSize={0.5} 
                        sectionColor="#444" 
                        cellColor="#222" 
                    />
                    
                    {vectors.map((v: any, idx: number) => {
                        // Support multiple AI output formats: [x,y,z], {start:[], end:[]}, {origin:[], direction:[]}
                        const vStart = v.start || v.origin || [0, 0, 0];
                        const vEnd = v.end || v.direction || (Array.isArray(v) ? v : [0, 0, 0]);

                        return (
                            <Vector 
                                key={`v-${idx}`} 
                                start={vStart} 
                                end={vEnd} 
                                color={v.color || (idx === 0 ? "#00ffff" : "#ff00ff")} 
                            />
                        );
                    })}

                    {/* Planes */}
                    {planes.map((p: any, idx: number) => (
                        <Plane 
                            key={`p-${idx}`} 
                            normal={p.normal || [0, 1, 0]} 
                            constant={p.constant || 0} 
                            color={p.color || "#ffff00"} 
                        />
                    ))}

                    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                        <GizmoViewport axisColors={['#ff4444', '#44ff44', '#4444ff']} labelColor="white" />
                    </GizmoHelper>
                </Suspense>
            </Canvas>
        </div>
    );
};

export default SolidGeometry3D;
