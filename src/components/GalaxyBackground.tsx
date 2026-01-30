"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  galaxyVertexShader,
  galaxyFragmentShader,
  distantGalaxyVertexShader,
  distantGalaxyFragmentShader,
  generateSpiralGalaxyPositions,
  generateMiniSpiralPositions,
} from "./shaders/galaxyParticleShader";

// Section-based colors
const SECTION_COLORS = [
  { primary: new THREE.Color("#3b82f6"), secondary: new THREE.Color("#8b5cf6") },
  { primary: new THREE.Color("#6366f1"), secondary: new THREE.Color("#ec4899") },
  { primary: new THREE.Color("#8b5cf6"), secondary: new THREE.Color("#3b82f6") },
  { primary: new THREE.Color("#06b6d4"), secondary: new THREE.Color("#8b5cf6") },
  { primary: new THREE.Color("#6366f1"), secondary: new THREE.Color("#06b6d4") },
];

interface GalaxyBackgroundProps {
  currentSection?: number;
}

// ============================================
// Twinkling Stars
// ============================================
function TwinklingStars() {
  const starsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.x = state.clock.elapsedTime * 0.008;
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.004;
    }
  });

  return (
    <group ref={starsRef}>
      <Stars
        radius={120}
        depth={60}
        count={4000}
        factor={4}
        saturation={0.1}
        fade
        speed={0.3}
      />
    </group>
  );
}

// ============================================
// Spiral Galaxy - Logarithmic Spiral with Central Bulge
// ============================================
function SpiralGalaxy({ currentSection }: { currentSection: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const particleCount = 12000;
  const colors = SECTION_COLORS[currentSection] || SECTION_COLORS[0];
  const targetCoreColor = useRef(colors.primary.clone());
  const targetArmColor = useRef(colors.secondary.clone());

  // Update colors on section change
  useEffect(() => {
    const newColors = SECTION_COLORS[currentSection] || SECTION_COLORS[0];
    targetCoreColor.current.copy(newColors.primary);
    targetArmColor.current.copy(newColors.secondary);
  }, [currentSection]);

  const galaxyData = useMemo(
    () => generateSpiralGalaxyPositions(particleCount, 3, 0.4, 18, 0.8),
    []
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uCoreColor: { value: colors.primary.clone() },
      uArmColor: { value: colors.secondary.clone() },
    }),
    []
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uCoreColor.value.lerp(targetCoreColor.current, delta * 0.3);
      materialRef.current.uniforms.uArmColor.value.lerp(targetArmColor.current, delta * 0.3);
    }
  });

  return (
    <points ref={pointsRef} position={[0, -5, -55]} rotation={[0.7, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[galaxyData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[galaxyData.sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aBrightness"
          args={[galaxyData.brightness, 1]}
        />
        <bufferAttribute
          attach="attributes-aDistanceFromCenter"
          args={[galaxyData.distanceFromCenter, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={galaxyVertexShader}
        fragmentShader={galaxyFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================
// Distant Galaxies - Mini Spiral Galaxies
// ============================================
function DistantGalaxies() {
  const galaxyConfigs = useMemo(
    () => [
      {
        position: [-45, 15, -70] as [number, number, number],
        rotation: [0.3, 0.2, 0.5] as [number, number, number],
        scale: 0.8,
        color: new THREE.Color("#8b5cf6"),
        particleCount: 800,
      },
      {
        position: [50, -10, -80] as [number, number, number],
        rotation: [0.7, 0.1, -0.3] as [number, number, number],
        scale: 0.6,
        color: new THREE.Color("#6366f1"),
        particleCount: 600,
      },
      {
        position: [30, 25, -90] as [number, number, number],
        rotation: [0.2, 0.5, 0.1] as [number, number, number],
        scale: 0.5,
        color: new THREE.Color("#3b82f6"),
        particleCount: 500,
      },
      {
        position: [-35, -20, -85] as [number, number, number],
        rotation: [0.9, 0.3, 0.2] as [number, number, number],
        scale: 0.4,
        color: new THREE.Color("#ec4899"),
        particleCount: 400,
      },
    ],
    []
  );

  return (
    <group>
      {galaxyConfigs.map((config, i) => (
        <DistantGalaxy key={i} {...config} />
      ))}
    </group>
  );
}

function DistantGalaxy({
  position,
  rotation,
  scale,
  color,
  particleCount,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: THREE.Color;
  particleCount: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const galaxyData = useMemo(
    () => generateMiniSpiralPositions(particleCount, 5 * scale),
    [particleCount, scale]
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: color },
    }),
    [color]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef} position={position} rotation={rotation} scale={scale}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[galaxyData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[galaxyData.sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aBrightness"
          args={[galaxyData.brightness, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={distantGalaxyVertexShader}
        fragmentShader={distantGalaxyFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================
// Shooting Stars
// ============================================
function ShootingStars() {
  const [shootingStars, setShootingStars] = useState<
    Array<{
      id: number;
      position: [number, number, number];
      velocity: [number, number, number];
      life: number;
    }>
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const newStar = {
          id: Date.now(),
          position: [
            (Math.random() - 0.5) * 80,
            Math.random() * 30 + 15,
            (Math.random() - 0.5) * 40 - 30,
          ] as [number, number, number],
          velocity: [
            (Math.random() - 0.5) * 2.5,
            -Math.random() * 2 - 0.8,
            Math.random() * 0.8,
          ] as [number, number, number],
          life: 1,
        };
        setShootingStars((prev) => [...prev.slice(-6), newStar]);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useFrame((_, delta) => {
    setShootingStars((prev) =>
      prev
        .map((star) => ({
          ...star,
          position: [
            star.position[0] + star.velocity[0] * delta * 25,
            star.position[1] + star.velocity[1] * delta * 25,
            star.position[2] + star.velocity[2] * delta * 25,
          ] as [number, number, number],
          life: star.life - delta * 0.4,
        }))
        .filter((star) => star.life > 0)
    );
  });

  return (
    <group>
      {shootingStars.map((star) => (
        <mesh key={star.id} position={star.position}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={star.life} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// Main Scene Component
// ============================================
function GalaxyScene({ currentSection }: { currentSection: number }) {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.05} />

      {/* Stars background */}
      <TwinklingStars />

      {/* Main spiral galaxy */}
      <SpiralGalaxy currentSection={currentSection} />

      {/* Distant galaxies */}
      <DistantGalaxies />

      {/* Shooting stars */}
      <ShootingStars />

      {/* Post-processing effects - reduced brightness */}
      <EffectComposer>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.1} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

// ============================================
// Main Export Component
// ============================================
export default function GalaxyBackground({
  currentSection = 0,
}: GalaxyBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        background: "linear-gradient(to bottom, #000005, #0a0a15, #000005)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 25], fov: 75 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
      >
        <GalaxyScene currentSection={currentSection} />
      </Canvas>

      {/* Reading Zone - dark radial gradient overlay for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
