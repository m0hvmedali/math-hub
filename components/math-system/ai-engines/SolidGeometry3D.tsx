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
    const dir = new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
    const length = dir.length();
    
    return (
        <arrowHelper 
            args={[
                dir.normalize(), 
                new THREE.Vector3(...start), 
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
    const { vectors = [], planes = [] } = data;

    return (
        <div className="w-full h-full min-h-[500px] bg-black/40">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                <OrbitControls makeDefault />
                
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    
                    <Grid 
                        infiniteGrid 
                        fadeDistance={20} 
                        fadeStrength={5} 
                        sectionSize={1} 
                        cellSize={0.5} 
                        sectionColor="#444" 
                        cellColor="#222" 
                    />
                    
                    {/* Vectors */}
                    {vectors.map((v: any, idx: number) => (
                        <Vector 
                            key={`v-${idx}`} 
                            start={v.start || [0, 0, 0]} 
                            end={v.end || v} 
                            color={v.color || (idx === 0 ? "#00ffff" : "#ff00ff")} 
                        />
                    ))}

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
