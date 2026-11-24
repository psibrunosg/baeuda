import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';
import { PlazaMusicianNpc } from './StylizedCharacters';
import { getWorldGeometries } from './worldGeometries';

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
  const spoutRef = useRef<THREE.Mesh>(null);
  const fastPendulumRef = useRef<THREE.Group>(null);
  const slowPendulumRef = useRef<THREE.Group>(null);
  const textures = useMemo(() => getCafeTextures(), []);
  const worldGeos = useMemo(() => getWorldGeometries(), []);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busyRef = useRef(false);

  const clearTimers = () => {
    for (const id of timersRef.current) clearTimeout(id);
    timersRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  };

  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
      clearTimers();
      busyRef.current = false;
      setTouchedMusic(false);
      setTouchedBird(false);
      setPlayedFast(false);
      setPlayedSlow(false);
      setTempo('normal');
    }
    return () => clearTimers();
  }, [visible]);

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.elapsedTime;
    if (waterRingRef.current) {
      const s = 1 + Math.sin(t * 4.2) * 0.1;
      waterRingRef.current.scale.set(s, s, 1);
    }
    if (spoutRef.current) {
      spoutRef.current.scale.y = 0.92 + Math.sin(t * 8.5) * 0.1;
    }
    if (fastPendulumRef.current) {
      fastPendulumRef.current.rotation.z = Math.sin(t * 9.5) * 0.52;
    }
    if (slowPendulumRef.current) {
      slowPendulumRef.current.rotation.z = Math.sin(t * 2.1) * 0.45;
    }
  });

  if (!visible) return null;

  const setPointer = (active: boolean) => {
    document.body.style.cursor = active ? 'pointer' : 'auto';
  };

  const handleExplore = (target: 'music' | 'bird') => {
    if (busyRef.current) return;
    onPlayAudio(target === 'music' ? 'plaza_music' : 'plaza_bird');
    const nextMusic = touchedMusic || target === 'music';
    const nextBird = touchedBird || target === 'bird';
    setTouchedMusic(nextMusic);
    setTouchedBird(nextBird);
    if (nextMusic && nextBird) {
      busyRef.current = true;
      schedule(() => {
        busyRef.current = false;
        onStageChange('rhythm');
        onPlayAudio('plaza_ask_fast');
      }, 950);
    }
  };

  const handleTempo = (kind: 'fast' | 'slow') => {
    if (busyRef.current) return;
    setTempo(kind);
    onPlayAudio(kind === 'fast' ? 'plaza_fast' : 'plaza_slow');
    const nextFast = playedFast || kind === 'fast';
    const nextSlow = playedSlow || kind === 'slow';
    setPlayedFast(nextFast);
    setPlayedSlow(nextSlow);

    if (kind === 'fast' && !playedSlow) {
      schedule(() => onPlayAudio('plaza_ask_slow'), 950);
    } else if (nextFast && nextSlow) {
      busyRef.current = true;
      schedule(() => {
        onPlayAudio('plaza_celebrate');
        schedule(() => {
          busyRef.current = false;
          onComplete();
        }, 1600);
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

      {/* Tiered Sculpted Stone Water Fountain on right-back */}
      <group position={[0.78, 0, -0.45]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.65, 0.72, 0.48, 28]} />
          <meshStandardMaterial
            color="#f0e8dc"
            map={textures.marbleColor}
            bumpMap={textures.marbleBump}
            bumpScale={0.01}
            roughness={0.78}
          />
        </mesh>
        {/* Carved top coping ring */}
        <mesh position={[0, 0.49, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.64, 0.045, 10, 28]} />
          <meshStandardMaterial color="#e7dac5" bumpMap={textures.marbleBump} bumpScale={0.008} roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.58, 24]} />
          <meshPhysicalMaterial color="#38bdf8" roughness={0.08} clearcoat={1} />
        </mesh>
        <mesh ref={waterRingRef} position={[0, 0.492, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.42, 24]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.75} />
        </mesh>
        {/* Central pedestal + sculpted upper basin + animated water spout */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.22, 0.42, 18]} />
          <meshStandardMaterial color="#ddd2bf" bumpMap={textures.marbleBump} bumpScale={0.008} roughness={0.8} />
        </mesh>
        <mesh geometry={worldGeos.fountainBasin} position={[0, 0.85, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#efe6d8" bumpMap={textures.marbleBump} bumpScale={0.008} roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.34, 20]} />
          <meshPhysicalMaterial color="#7dd3fc" roughness={0.06} clearcoat={1} />
        </mesh>
        <mesh ref={spoutRef} position={[0, 1.12, 0]}>
          <cylinderGeometry args={[0.024, 0.055, 0.26, 12]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.78} roughness={0.05} clearcoat={1} />
        </mesh>

        {/* Interactive Bluebird perched on fountain rim */}
        <group
          position={[-0.38, 0.52, 0.35]}
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

      {/* Grounded Wrought-Iron & Timber Park Bench + Sam the Musician */}
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
        {/* Wrought-iron bench legs & side armrest frames */}
        {[-0.48, 0.48].map((lx, idx) => (
          <group key={idx} position={[lx, 0, 0]}>
            <mesh position={[0, 0.2, 0.16]} castShadow>
              <boxGeometry args={[0.055, 0.4, 0.055]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.42} />
            </mesh>
            <mesh position={[0, 0.34, -0.17]} castShadow>
              <boxGeometry args={[0.055, 0.68, 0.055]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.42} />
            </mesh>
            {/* Side armrest bar */}
            <mesh position={[0, 0.52, 0]} castShadow>
              <boxGeometry args={[0.045, 0.04, 0.42]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.42} />
            </mesh>
          </group>
        ))}
        {/* Timber seat + slatted backrest */}
        <RoundedBox args={[1.15, 0.1, 0.44]} radius={0.025} smoothness={2} position={[0, 0.42, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#9a643f"
            map={textures.darkWoodColor}
            bumpMap={textures.darkWoodBump}
            bumpScale={0.01}
            roughness={0.78}
          />
        </RoundedBox>
        <RoundedBox args={[1.15, 0.16, 0.065]} radius={0.018} smoothness={2} position={[0, 0.6, -0.18]} castShadow>
          <meshStandardMaterial
            color="#9a643f"
            map={textures.darkWoodColor}
            bumpMap={textures.darkWoodBump}
            bumpScale={0.01}
            roughness={0.78}
          />
        </RoundedBox>
        <RoundedBox args={[1.15, 0.16, 0.065]} radius={0.018} smoothness={2} position={[0, 0.79, -0.18]} castShadow>
          <meshStandardMaterial
            color="#9a643f"
            map={textures.darkWoodColor}
            bumpMap={textures.darkWoodBump}
            bumpScale={0.01}
            roughness={0.78}
          />
        </RoundedBox>
        <group position={[0, 0.34, 0.05]} scale={1.4}>
          <PlazaMusicianNpc />
        </group>
      </group>

      {/* STAGE 2: Diegetic Wooden Metronomes (Fast vs Slow Tempo) */}
      {stage === 'rhythm' && (
        <group position={[0, 0.02, 0.65]}>
          {/* Fast Metronome (Coral/Crimson accent, brisk swinging brass arm) */}
          <group
            position={[-0.5, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              handleTempo('fast');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            {/* Stone pedestal */}
            <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.16, 0.19, 0.56, 18]} />
              <meshStandardMaterial color="#e7dfd3" map={textures.marbleColor} roughness={0.75} />
            </mesh>
            <group position={[0, 0.56, 0]} scale={1.25}>
              <mesh geometry={worldGeos.metronomeBody} castShadow>
                <meshPhysicalMaterial
                  color="#e11d48"
                  emissive="#fb7185"
                  emissiveIntensity={tempo === 'fast' ? 0.55 : 0.12}
                  roughness={0.32}
                  clearcoat={0.6}
                />
              </mesh>
              <mesh position={[0, 0.12, 0.056]}>
                <planeGeometry args={[0.065, 0.18]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.5} />
              </mesh>
              <group ref={fastPendulumRef} position={[0, 0.035, 0.064]}>
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[0.01, 0.21, 0.008]} />
                  <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.165, 0.004]}>
                  <boxGeometry args={[0.032, 0.028, 0.018]} />
                  <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={tempo === 'fast' ? 1.2 : 0.35} metalness={0.75} roughness={0.22} />
                </mesh>
              </group>
            </group>
          </group>

          {/* Slow Metronome (Emerald/Sage accent, gentle unhurried brass arm) */}
          <group
            position={[0.5, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              handleTempo('slow');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            {/* Stone pedestal */}
            <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.16, 0.19, 0.56, 18]} />
              <meshStandardMaterial color="#e7dfd3" map={textures.marbleColor} roughness={0.75} />
            </mesh>
            <group position={[0, 0.56, 0]} scale={1.25}>
              <mesh geometry={worldGeos.metronomeBody} castShadow>
                <meshPhysicalMaterial
                  color="#059669"
                  emissive="#34d399"
                  emissiveIntensity={tempo === 'slow' ? 0.55 : 0.12}
                  roughness={0.32}
                  clearcoat={0.6}
                />
              </mesh>
              <mesh position={[0, 0.12, 0.056]}>
                <planeGeometry args={[0.065, 0.18]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.5} />
              </mesh>
              <group ref={slowPendulumRef} position={[0, 0.035, 0.064]}>
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[0.01, 0.21, 0.008]} />
                  <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.12, 0.004]}>
                  <boxGeometry args={[0.032, 0.028, 0.018]} />
                  <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={tempo === 'slow' ? 1.2 : 0.35} metalness={0.6} roughness={0.25} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      )}
    </group>
  );
}
