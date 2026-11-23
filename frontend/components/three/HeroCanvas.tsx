"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function SkyWaveOrb() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const accentRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.18;
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.14;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.4) * 0.12;
      ringRef.current.rotation.z = t * 0.22;
    }
    if (accentRef.current) {
      accentRef.current.position.x = Math.cos(t * 0.8) * 1.95;
      accentRef.current.position.z = Math.sin(t * 0.8) * 1.95;
      accentRef.current.position.y = Math.sin(t * 1.2) * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core translucent sky-blue geodesic sphere */}
      <mesh>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.22}
          metalness={0.18}
          wireframe={false}
          transparent
          opacity={0.78}
        />
      </mesh>

      {/* Outer wireframe shell */}
      <mesh scale={1.18}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.45} />
      </mesh>

      {/* Soft yellow orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.95, 0.045, 16, 80]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#fef08a"
          emissiveIntensity={0.45}
          roughness={0.25}
        />
      </mesh>

      {/* Floating soft yellow satellite node */}
      <mesh ref={accentRef}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#facc15"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.2, 5.2], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.95} />
      <directionalLight position={[4, 5, 4]} intensity={1.25} color="#ffffff" />
      <directionalLight position={[-4, -2, -2]} intensity={0.55} color="#fde047" />
      <SkyWaveOrb />
    </Canvas>
  );
}
