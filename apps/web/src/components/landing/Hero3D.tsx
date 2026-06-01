"use client";

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function AbstractShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5}>
        <MeshDistortMaterial
          color="#3b82f6" // blue-500
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 z-0 h-full w-full pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ background: 'transparent' }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#9333ea" />
        
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <AbstractShape />
        </PresentationControls>
        
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
