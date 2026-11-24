import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';
import { MarketVendorNpc } from './StylizedCharacters';
import { getWorldGeometries } from './worldGeometries';

export type MarketStage = 'explore' | 'contrast' | 'basket';

export interface MarketSceneProps {
  visible: boolean;
  stage: MarketStage;
  onStageChange: (next: MarketStage) => void;
  onPlayAudio: (key: SpeechKey) => void;
  onComplete: () => void;
}

function SculptedApple({
  scale = 1,
  highlighted = false,
}: {
  scale?: number;
  highlighted?: boolean;
}) {
  const worldGeos = useMemo(() => getWorldGeometries(), []);

  return (
    <group scale={scale}>
      <mesh geometry={worldGeos.apple} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#dc2626"
          emissive={highlighted ? '#f97316' : '#000000'}
          emissiveIntensity={highlighted ? 0.35 : 0}
          roughness={0.2}
          clearcoat={0.82}
          clearcoatRoughness={0.14}
        />
      </mesh>
      {/* Stem */}
      <mesh position={[0.004, 0.168, 0]} rotation={[0, 0, -0.14]}>
        <cylinderGeometry args={[0.007, 0.01, 0.048, 8]} />
        <meshStandardMaterial color="#5a3827" roughness={0.85} />
      </mesh>
      {/* Sculpted organic apple leaf */}
      <mesh
        geometry={worldGeos.organicLeaf}
        position={[0.036, 0.182, 0]}
        rotation={[0.25, 0.15, -0.42]}
        scale={1.1}
        castShadow
      >
        <meshStandardMaterial color="#22c55e" roughness={0.62} />
      </mesh>
    </group>
  );
}

function SculptedBreadLoaf({ highlighted = false }: { highlighted?: boolean }) {
  const textures = useMemo(() => getCafeTextures(), []);
  return (
    <group>
      <mesh position={[0, 0.072, 0]} rotation={[0, 0.25, Math.PI / 2]} scale={[0.85, 1, 1.08]} castShadow receiveShadow>
        <capsuleGeometry args={[0.078, 0.18, 12, 18]} />
        <meshStandardMaterial
          color="#d98a36"
          emissive={highlighted ? '#f59e0b' : '#000000'}
          emissiveIntensity={highlighted ? 0.3 : 0}
          bumpMap={textures.clayBump}
          bumpScale={0.012}
          roughness={0.82}
        />
      </mesh>
      {/* Soft curved artisan crust ears / flour-dusted score slashes */}
      {[-0.062, 0, 0.062].map((x, idx) => (
        <mesh key={idx} position={[x, 0.132, 0]} rotation={[0.12, 0.45, Math.PI / 2]} scale={[0.55, 1, 0.45]}>
          <capsuleGeometry args={[0.013, 0.072, 6, 10]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

export function MarketScene({
  visible,
  stage,
  onStageChange,
  onPlayAudio,
  onComplete,
}: MarketSceneProps) {
  const [touchedApple, setTouchedApple] = useState(false);
  const [touchedBread, setTouchedBread] = useState(false);
  const [contrastTarget, setContrastTarget] = useState<'big' | 'small'>('big');
  const [packed, setPacked] = useState(false);
  const [contrastHintVisible, setContrastHintVisible] = useState(false);

  const ringRef = useRef<THREE.Mesh>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busyRef = useRef(false);
  const textures = useMemo(() => getCafeTextures(), []);

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
      setTouchedApple(false);
      setTouchedBread(false);
      setContrastTarget('big');
      setContrastHintVisible(false);
      setPacked(false);
    }
    return () => clearTimers();
  }, [visible]);

  useEffect(() => {
    if (!visible || stage !== 'contrast') {
      setContrastHintVisible(false);
      return;
    }
    setContrastHintVisible(false);
    const id = setTimeout(() => setContrastHintVisible(true), 5000);
    return () => clearTimeout(id);
  }, [visible, stage, contrastTarget]);

  useFrame((state) => {
    if (!visible) return;
    if (ringRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4.2) * 0.1;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  if (!visible) return null;

  const setPointer = (active: boolean) => {
    document.body.style.cursor = active ? 'pointer' : 'auto';
  };

  const handleTapExplore = (item: 'apple' | 'bread') => {
    if (busyRef.current) return;
    onPlayAudio(item === 'apple' ? 'market_apple' : 'market_bread');
    const nextApple = touchedApple || item === 'apple';
    const nextBread = touchedBread || item === 'bread';
    setTouchedApple(nextApple);
    setTouchedBread(nextBread);
    if (nextApple && nextBread) {
      busyRef.current = true;
      schedule(() => {
        busyRef.current = false;
        onStageChange('contrast');
        onPlayAudio('market_ask_big_apple');
      }, 950);
    }
  };

  const handleTapSize = (size: 'big' | 'small') => {
    if (busyRef.current) return;
    onPlayAudio(size === 'big' ? 'market_big' : 'market_small');
    if (size === contrastTarget) {
      if (contrastTarget === 'big') {
        busyRef.current = true;
        setContrastTarget('small');
        schedule(() => {
          busyRef.current = false;
          onPlayAudio('market_ask_small_apple');
        }, 900);
      } else {
        busyRef.current = true;
        schedule(() => {
          busyRef.current = false;
          onStageChange('basket');
          onPlayAudio('market_basket_prompt');
        }, 900);
      }
    } else {
      setContrastHintVisible(true);
    }
  };

  const handlePackBasket = () => {
    if (packed || busyRef.current) return;
    busyRef.current = true;
    setPacked(true);
    onPlayAudio('market_basket_done');
    schedule(() => {
      busyRef.current = false;
      onComplete();
    }, 1700);
  };

  return (
    <group name="Market_Stall_Scene">
      <ContactShadows
        key={stage}
        frames={1}
        position={[0, 0.973, 0.1]}
        opacity={0.4}
        scale={3.6}
        blur={2.1}
        far={0.7}
        color="#3b1d0f"
      />

      {/* Cobblestone ground + warm plaster backdrop */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.cobblestoneColor}
          bumpMap={textures.cobblestoneBump}
          bumpScale={0.015}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0, 1.9, -1.75]} receiveShadow>
        <boxGeometry args={[7, 3.8, 0.18]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.plasterColor}
          bumpMap={textures.plasterBump}
          bumpScale={0.01}
          roughness={0.92}
        />
      </mesh>

      {/* Striped Terracotta & Cream Market Canopy overhead */}
      <group position={[0, 2.22, 0.18]} rotation={[0.24, 0, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <RoundedBox
            key={i}
            args={[0.48, 0.1, 1.4]}
            radius={0.025}
            smoothness={2}
            position={[-1.44 + i * 0.48, 0, 0]}
            castShadow
          >
            <meshStandardMaterial
              color={i % 2 === 0 ? '#d96b47' : '#fdf6ea'}
              bumpMap={textures.awningBump}
              bumpScale={0.009}
              roughness={0.86}
            />
          </RoundedBox>
        ))}
      </group>

      {/* Wooden Market Stall Counter */}
      <mesh position={[0, 0.46, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[3.1, 0.92, 0.9]} />
        <meshStandardMaterial
          color="#ffffff"
          map={textures.woodCrateColor}
          bumpMap={textures.woodCrateBump}
          bumpScale={0.012}
          roughness={0.86}
        />
      </mesh>
      <RoundedBox args={[3.24, 0.08, 1.06]} radius={0.02} smoothness={3} position={[0, 0.94, 0.06]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#ffffff"
          map={textures.woodCounterColor}
          bumpMap={textures.woodCounterBump}
          bumpScale={0.008}
          roughness={0.68}
        />
      </RoundedBox>

      {/* Maya — Unique Market Vendor NPC behind the stall */}
      <group position={[0, 0.56, -0.72]} scale={1.45}>
        <MarketVendorNpc />
      </group>

      {/* STAGE 1: Explore Apple & Bread */}
      {stage === 'explore' && (
        <group>
          <group
            position={[-0.48, 0.98, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              handleTapExplore('apple');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <SculptedApple scale={1.15} highlighted={!touchedApple} />
          </group>

          <group
            position={[0.48, 0.98, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              handleTapExplore('bread');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <SculptedBreadLoaf highlighted={!touchedBread} />
          </group>

          <mesh
            ref={ringRef}
            position={[!touchedApple ? -0.48 : 0.48, 0.985, 0.14]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.16, 0.22, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.88} />
          </mesh>
        </group>
      )}

      {/* STAGE 2: Size Contrast (Big vs Small Apple) */}
      {stage === 'contrast' && (
        <group>
          <group
            position={[-0.48, 0.98, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              handleTapSize('big');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <SculptedApple scale={1.55} highlighted={contrastHintVisible && contrastTarget === 'big'} />
          </group>

          <group
            position={[0.48, 0.98, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              handleTapSize('small');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <SculptedApple scale={0.68} highlighted={contrastHintVisible && contrastTarget === 'small'} />
          </group>

          {contrastHintVisible && (
            <mesh
              ref={ringRef}
              position={[contrastTarget === 'big' ? -0.48 : 0.48, 0.985, 0.14]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.17, 0.23, 32]} />
              <meshBasicMaterial color="#f97316" transparent opacity={0.88} />
            </mesh>
          )}
        </group>
      )}

      {/* STAGE 3: Pack Wicker Basket */}
      {stage === 'basket' && (
        <group
          position={[0, 0.98, 0.16]}
          onClick={(e) => {
            e.stopPropagation();
            handlePackBasket();
          }}
          onPointerOver={() => setPointer(true)}
          onPointerOut={() => setPointer(false)}
        >
          {/* Woven basket body */}
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.24, 0.18, 0.2, 20]} />
            <meshStandardMaterial
              color="#c49563"
              bumpMap={textures.woodCrateBump}
              bumpScale={0.015}
              roughness={0.9}
            />
          </mesh>
          {/* Arched wicker handle */}
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.22, 0.018, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#a67c52" roughness={0.88} />
          </mesh>
          {packed && (
            <>
              <group position={[-0.07, 0.16, 0.02]}>
                <SculptedApple scale={0.85} />
              </group>
              <group position={[0.08, 0.18, -0.02]} scale={0.75}>
                <SculptedBreadLoaf />
              </group>
            </>
          )}
          <mesh ref={ringRef} position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.26, 0.33, 32]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.88} />
          </mesh>
        </group>
      )}
    </group>
  );
}
