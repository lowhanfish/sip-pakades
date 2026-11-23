"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ClayWaveOrb() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringOuterRef = useRef<THREE.Mesh>(null);
  const orb1Ref = useRef<THREE.Mesh>(null);
  const orb2Ref = useRef<THREE.Mesh>(null);
  const pillRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.18;
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.12;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 3.2 + Math.sin(t * 0.5) * 0.15;
      ringRef.current.rotation.z = t * 0.25;
    }
    if (ringOuterRef.current) {
      ringOuterRef.current.rotation.x = Math.PI / 2.4 - Math.sin(t * 0.4) * 0.12;
      ringOuterRef.current.rotation.y = -t * 0.18;
    }
    if (orb1Ref.current) {
      orb1Ref.current.position.x = Math.cos(t * 0.85) * 2.0;
      orb1Ref.current.position.z = Math.sin(t * 0.85) * 2.0;
      orb1Ref.current.position.y = Math.sin(t * 1.3) * 0.4;
      orb1Ref.current.rotation.y = t * 0.5;
    }
    if (orb2Ref.current) {
      orb2Ref.current.position.x = Math.cos(t * 0.7 + Math.PI) * 1.8;
      orb2Ref.current.position.z = Math.sin(t * 0.7 + Math.PI) * 1.8;
      orb2Ref.current.position.y = Math.cos(t * 1.1) * 0.35;
    }
    if (pillRef.current) {
      pillRef.current.position.y = 1.35 + Math.sin(t * 1.5) * 0.15;
      pillRef.current.rotation.y = t * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main tactile clay sphere in vibrant sky blue */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshPhysicalMaterial
          color="#0284c7"
          roughness={0.3}
          metalness={0.05}
          clearcoat={0.65}
          clearcoatRoughness={0.15}
          reflectivity={0.6}
        />
      </mesh>

      {/* Floating glossy soft highlight inner layer */}
      <mesh scale={1.03}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#7dd3fc"
          roughness={0.4}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Primary Warm Yellow Clay Ring */}
      <mesh ref={ringRef} castShadow>
        <torusGeometry args={[1.9, 0.08, 24, 96]} />
        <meshPhysicalMaterial
          color="#facc15"
          roughness={0.25}
          metalness={0.05}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          emissive="#fde047"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Secondary Soft Sky Ring */}
      <mesh ref={ringOuterRef}>
        <torusGeometry args={[2.3, 0.04, 16, 80]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Floating Yellow Clay Orb Satellite */}
      <mesh ref={orb1Ref} castShadow>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshPhysicalMaterial
          color="#fde047"
          roughness={0.22}
          clearcoat={0.8}
          emissive="#eab308"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Floating Soft Emerald/Mint Clay Orb Satellite */}
      <mesh ref={orb2Ref} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshPhysicalMaterial
          color="#34d399"
          roughness={0.3}
          clearcoat={0.7}
        />
      </mesh>

      {/* Floating Clay Pill Node */}
      <mesh ref={pillRef} castShadow>
        <capsuleGeometry args={[0.1, 0.28, 16, 24]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.25}
          clearcoat={0.9}
        />
      </mesh>
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.3, 5.2], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      className="w-full h-full"
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 6, 4]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-4, -3, -2]} intensity={0.75} color="#fde047" />
      <pointLight position={[0, 3, 2]} intensity={0.8} color="#bae6fd" />
      <ClayWaveOrb />
    </Canvas>
  );
}
