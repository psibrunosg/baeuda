import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';
import { PlazaMusicianNpc } from './StylizedCharacters';

export type PlazaStage = 'explore' | 'rhythm';

export interface PlazaSceneProps {
  visible: boolean;
  stage: PlazaStage;
  onStageChange: (next: PlazaStage) => void;
  onPlayAudio: (key: SpeechKey) => void;
  onComplete: () => void;
}

function StylizedBluebird({ excited }: { excited: boolean }) {
  const birdRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!birdRef.current) return;
    const t = state.clock.elapsedTime;
    birdRef.current.position.y = excited
      ? Math.abs(Math.sin(t * 9)) * 0.12
      : Math.sin(t * 2.5) * 0.015;
  });

  return (
    <group ref={birdRef}>
      <mesh position={[0, 0.08, 0]} scale={[1.15, 0.95, 1]} castShadow>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.65} />
      </mesh>
      <mesh position={[0.05, 0.15, 0.03]} castShadow>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.65} />
      </mesh>
      {/* Yellow beak */}
      <mesh position={[0.105, 0.15, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.018, 0.045, 6]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.09, 0.08, -0.02]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.08, 0.02, 0.045]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function PlazaScene({
  visible,
  stage,
  onStageChange,
  onPlayAudio,
  onComplete,
}: PlazaSceneProps) {
  const [touchedMusic, setTouchedMusic] = useState(false);
  const [touchedBird, setTouchedBird] = useState(false);
  const [playedFast, setPlayedFast] = useState(false);
  const [playedSlow, setPlayedSlow] = useState(false);
  const [tempo, setTempo] = useState<'normal' | 'fast' | 'slow'>('normal');

  const waterRingRef = useRef<THREE.Mesh>(null);
  const fastOrbRef = useRef<THREE.Mesh>(null);
  const slowOrbRef = useRef<THREE.Mesh>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
      setTouchedMusic(false);
      setTouchedBird(false);
      setPlayedFast(false);
      setPlayedSlow(false);
      setTempo('normal');
    }
  }, [visible]);

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.elapsedTime;
    if (waterRingRef.current) {
      const s = 1 + Math.sin(t * 4.2) * 0.1;
      waterRingRef.current.scale.set(s, s, 1);
    }
    if (fastOrbRef.current) {
      const s = 1 + Math.sin(t * 10) * 0.14;
      fastOrbRef.current.scale.setScalar(s);
    }
    if (slowOrbRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.1;
      slowOrbRef.current.scale.setScalar(s);
    }
  });

  if (!visible) return null;

  const setPointer = (active: boolean) => {
    document.body.style.cursor = active ? 'pointer' : 'auto';
  };

  const handleExplore = (target: 'music' | 'bird') => {
    onPlayAudio(target === 'music' ? 'plaza_music' : 'plaza_bird');
    const nextMusic = touchedMusic || target === 'music';
    const nextBird = touchedBird || target === 'bird';
    setTouchedMusic(nextMusic);
    setTouchedBird(nextBird);
    if (nextMusic && nextBird) {
      setTimeout(() => {
        onStageChange('rhythm');
        onPlayAudio('plaza_ask_fast');
      }, 950);
    }
  };

  const handleTempo = (kind: 'fast' | 'slow') => {
    setTempo(kind);
    onPlayAudio(kind === 'fast' ? 'plaza_fast' : 'plaza_slow');
    const nextFast = playedFast || kind === 'fast';
    const nextSlow = playedSlow || kind === 'slow';
    setPlayedFast(nextFast);
    setPlayedSlow(nextSlow);

    if (kind === 'fast' && !playedSlow) {
      setTimeout(() => onPlayAudio('plaza_ask_slow'), 950);
    } else if (nextFast && nextSlow) {
      setTimeout(() => {
        onPlayAudio('plaza_celebrate');
        setTimeout(() => onComplete(), 1600);
      }, 900);
    }
  };

  return (
    <group name="Central_Plaza_Scene">
      <ContactShadows
        key={stage}
        frames={1}
        position={[0, 0.02, 0]}
        opacity={0.35}
        scale={6}
        blur={2.2}
        far={2}
        color="#3b2f24"
      />

      {/* Plaza cobblestone floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.5, 40]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.016}
          roughness={0.88}
        />
      </mesh>

      {/* Tiered Stone Water Fountain on right-back */}
      <group position={[0.78, 0, -0.45]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.65, 0.72, 0.48, 24]} />
          <meshStandardMaterial color="#e7dac5" bumpMap={textures.plasterBump} bumpScale={0.01} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.58, 24]} />
          <meshPhysicalMaterial color="#38bdf8" roughness={0.08} clearcoat={1} />
        </mesh>
        <mesh ref={waterRingRef} position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.42, 24]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.75} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.24, 0.45, 16]} />
          <meshStandardMaterial color="#d6cbb8" roughness={0.85} />
        </mesh>

        {/* Interactive Bluebird perched on fountain rim */}
        <group
          position={[-0.38, 0.5, 0.35]}
          onClick={(e) => {
            e.stopPropagation();
            if (stage === 'explore') {
              handleExplore('bird');
            } else {
              onPlayAudio('plaza_bird');
            }
          }}
          onPointerOver={() => setPointer(true)}
          onPointerOut={() => setPointer(false)}
        >
          <StylizedBluebird excited={touchedBird || tempo === 'fast'} />
        </group>
      </group>

      {/* Wooden Park Bench + Sam the Musician */}
      <group
        position={[-0.62, 0, -0.35]}
        rotation={[0, 0.35, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (stage === 'explore') {
            handleExplore('music');
          } else {
            onPlayAudio('plaza_music');
          }
        }}
        onPointerOver={() => setPointer(true)}
        onPointerOut={() => setPointer(false)}
      >
        <RoundedBox args={[1.15, 0.14, 0.44]} radius={0.025} smoothness={2} position={[0, 0.42, 0]} castShadow>
          <meshStandardMaterial color="#8b5a3c" bumpMap={textures.woodCounterBump} bumpScale={0.008} roughness={0.82} />
        </RoundedBox>
        <RoundedBox args={[1.15, 0.36, 0.08]} radius={0.02} smoothness={2} position={[0, 0.68, -0.18]} castShadow>
          <meshStandardMaterial color="#8b5a3c" roughness={0.82} />
        </RoundedBox>
        <group position={[0, 0.34, 0.05]} scale={1.4}>
          <PlazaMusicianNpc />
        </group>
      </group>

      {/* STAGE 2: Interactive Tempo Orbs (Fast vs Slow) */}
      {stage === 'rhythm' && (
        <group position={[0, 0.92, 0.55]}>
          <group
            position={[-0.5, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              handleTempo('fast');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <mesh ref={fastOrbRef} castShadow>
              <octahedronGeometry args={[0.17, 0]} />
              <meshPhysicalMaterial
                color="#f43f5e"
                emissive="#fb7185"
                emissiveIntensity={tempo === 'fast' ? 1.1 : 0.45}
                roughness={0.15}
                clearcoat={1}
              />
            </mesh>
          </group>

          <group
            position={[0.5, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              handleTempo('slow');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <mesh ref={slowOrbRef} castShadow>
              <sphereGeometry args={[0.16, 20, 20]} />
              <meshPhysicalMaterial
                color="#10b981"
                emissive="#34d399"
                emissiveIntensity={tempo === 'slow' ? 1.1 : 0.45}
                roughness={0.15}
                clearcoat={1}
              />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
