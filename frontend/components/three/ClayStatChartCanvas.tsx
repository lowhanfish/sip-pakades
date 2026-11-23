"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface BarProps {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  value: number;
}

function ClayBar({ position, height, color, label, value }: BarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.position.y =
        position[1] + (hovered ? 0.2 : 0) + Math.sin(t * 1.5 + position[0]) * 0.05;
    }
  });

  const radius = 0.38;
  const clampedHeight = Math.max(0.6, height);

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 3D Clay Cylinder with smooth rounded caps */}
      <mesh
        ref={meshRef}
        position={[0, clampedHeight / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radius, radius, clampedHeight, 32]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.28}
          metalness={0.06}
          clearcoat={0.8}
          clearcoatRoughness={0.12}
          reflectivity={0.6}
        />
      </mesh>

      {/* Top Gloss Cap */}
      <mesh position={[0, clampedHeight + (hovered ? 0.2 : 0), 0]}>
        <sphereGeometry args={[radius * 0.98, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.2} />
      </mesh>

      {/* Value label */}
      <Text
        position={[0, clampedHeight + 0.45, 0]}
        fontSize={0.22}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff" // fallback to system if not loaded
      >
        {`${value}%`}
      </Text>

      {/* Category label */}
      <Text
        position={[0, -0.32, 0]}
        fontSize={0.2}
        color="#475569"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

export default function ClayStatChartCanvas({
  data,
}: {
  data: Array<{ label: string; value: number; color: string }>;
}) {
  const spacing = 1.25;
  const startX = -((data.length - 1) * spacing) / 2;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.8, 4.5], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      className="w-full h-full cursor-pointer"
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#fde047" />

      <group position={[0, -0.4, 0]}>
        {data.map((item, index) => {
          const h = (item.value / 100) * 1.6;
          const x = startX + index * spacing;
          return (
            <ClayBar
              key={item.label}
              position={[x, 0, 0]}
              height={h}
              color={item.color}
              label={item.label}
              value={item.value}
            />
          );
        })}
      </group>
    </Canvas>
  );
}
