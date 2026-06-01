"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

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
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <MeshDistortMaterial
          color="#3b82f6"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="h-[400px] w-full md:h-[600px] absolute right-0 top-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <AbstractShape />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
