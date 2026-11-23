import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';

interface StreetMicroEventsProps {
  onTriggerAudio: (key: SpeechKey, ringPos: [number, number, number]) => void;
}

/**
 * Micro-Event 2: Interactive Red Mailbox ("Open! A letter!" / "Close.")
 * Hinged flap opens, yellow flag lowers, and a wax-sealed letter pops out.
 */
function MailboxEvent({
  position,
  onTriggerAudio,
}: {
  position: [number, number, number];
  onTriggerAudio: (key: SpeechKey, ringPos: [number, number, number]) => void;
}) {
  const [opened, setOpened] = useState(false);
  const flagRef = useRef<THREE.Group>(null);
  const letterRef = useRef<THREE.Group>(null);
  const doorRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (flagRef.current) {
      const targetRot = opened ? 1.35 : 0;
      flagRef.current.rotation.x = THREE.MathUtils.damp(flagRef.current.rotation.x, targetRot, 10, dt);
    }
    if (doorRef.current) {
      const targetRot = opened ? 1.25 : 0;
      doorRef.current.rotation.x = THREE.MathUtils.damp(doorRef.current.rotation.x, targetRot, 10, dt);
    }
    if (letterRef.current) {
      const targetZ = opened ? 0.16 : 0.02;
      const targetY = opened ? 0.56 + Math.sin(t * 4) * 0.015 : 0.52;
      letterRef.current.position.z = THREE.MathUtils.damp(letterRef.current.position.z, targetZ, 10, dt);
      letterRef.current.position.y = THREE.MathUtils.damp(letterRef.current.position.y, targetY, 10, dt);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const next = !opened;
    setOpened(next);
    onTriggerAudio(next ? 'world_mailbox_open' : 'world_mailbox_close', [
      position[0],
      0.07,
      position[2],
    ]);
  };

  return (
    <group
      position={position}
      rotation={[0, -0.35, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Wooden post */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.075, 0.48, 0.075]} />
        <meshStandardMaterial color="#6b4226" roughness={0.85} />
      </mesh>
      {/* Crimson mailbox body */}
      <RoundedBox args={[0.22, 0.2, 0.3]} radius={0.05} smoothness={3} position={[0, 0.54, 0]} castShadow>
        <meshStandardMaterial color="#c9463c" roughness={0.42} metalness={0.18} />
      </RoundedBox>
      {/* Hinged front door */}
      <mesh ref={doorRef} position={[0, 0.5, 0.155]}>
        <boxGeometry args={[0.18, 0.15, 0.016]} />
        <meshStandardMaterial color="#a83229" roughness={0.45} />
      </mesh>
      {/* Yellow flag on the side */}
      <group ref={flagRef} position={[0.125, 0.54, 0.02]}>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.015, 0.14, 0.02]} />
          <meshStandardMaterial color="#facc15" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.13, 0.03]}>
          <boxGeometry args={[0.018, 0.05, 0.075]} />
          <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={opened ? 0 : 0.45} />
        </mesh>
      </group>
      {/* Crisp white letter with red wax seal */}
      <group ref={letterRef} position={[0, 0.52, 0.02]}>
        <RoundedBox args={[0.15, 0.1, 0.018]} radius={0.004} smoothness={2} castShadow>
          <meshStandardMaterial color="#fffbeb" roughness={0.75} />
        </RoundedBox>
        <mesh position={[0, 0, 0.011]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Micro-Event 3: Rolled Apple & Crate ("Apple! In the box! Thanks!")
 * Clicking the fallen apple arcs it neatly back into the wooden crate.
 */
function RolledAppleEvent({
  position,
  onTriggerAudio,
}: {
  position: [number, number, number];
  onTriggerAudio: (key: SpeechKey, ringPos: [number, number, number]) => void;
}) {
  const [inBox, setInBox] = useState(false);
  const progressRef = useRef(0);
  const appleRef = useRef<THREE.Group>(null);
  const textures = useMemo(() => getCafeTextures(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = inBox ? 1 : 0;
    progressRef.current = THREE.MathUtils.damp(progressRef.current, target, 7, dt);
    const p = progressRef.current;

    if (appleRef.current) {
      appleRef.current.position.x = THREE.MathUtils.lerp(0.24, 0, p);
      appleRef.current.position.z = THREE.MathUtils.lerp(0.12, 0, p);
      // Smooth parabolic jump into the wooden crate
      const arc = Math.sin(p * Math.PI) * 0.28;
      appleRef.current.position.y = THREE.MathUtils.lerp(0.065, 0.19, p) + arc;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const next = !inBox;
    setInBox(next);
    onTriggerAudio(next ? 'world_apple_return' : 'market_apple', [
      position[0],
      0.07,
      position[2],
    ]);
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Mini wooden produce crate */}
      <RoundedBox args={[0.28, 0.18, 0.24]} radius={0.012} smoothness={2} position={[0, 0.09, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#ffffff"
          map={textures.woodCrateColor}
          bumpMap={textures.woodCrateBump}
          bumpScale={0.01}
          roughness={0.85}
        />
      </RoundedBox>
      {/* Resting crate apple */}
      <mesh position={[-0.055, 0.19, -0.02]} castShadow>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.28} />
      </mesh>
      {/* Interactive rolled apple */}
      <group ref={appleRef} position={[0.24, 0.065, 0.12]}>
        <mesh castShadow>
          <sphereGeometry args={[0.064, 14, 14]} />
          <meshPhysicalMaterial color="#ef4444" roughness={0.2} clearcoat={0.8} />
        </mesh>
        <mesh position={[0.022, 0.068, 0]} rotation={[0, 0, -0.5]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#22c55e" roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Micro-Event 4: Drizzle Cloud & Pop-Open Umbrella ("Rain! Open umbrella!" / "Close umbrella.")
 */
function UmbrellaRainEvent({
  position,
  onTriggerAudio,
}: {
  position: [number, number, number];
  onTriggerAudio: (key: SpeechKey, ringPos: [number, number, number]) => void;
}) {
  const [open, setOpen] = useState(false);
  const canopyRef = useRef<THREE.Group>(null);
  const dropsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (canopyRef.current) {
      const targetScaleXZ = open ? 1.0 : 0.24;
      const targetScaleY = open ? 0.72 : 1.35;
      canopyRef.current.scale.x = THREE.MathUtils.damp(canopyRef.current.scale.x, targetScaleXZ, 10, dt);
      canopyRef.current.scale.z = THREE.MathUtils.damp(canopyRef.current.scale.z, targetScaleXZ, 10, dt);
      canopyRef.current.scale.y = THREE.MathUtils.damp(canopyRef.current.scale.y, targetScaleY, 10, dt);
    }
    if (dropsRef.current) {
      dropsRef.current.children.forEach((drop, i) => {
        const cycle = (t * 1.4 + i * 0.25) % 1;
        drop.position.y = 1.18 - cycle * (open ? 0.36 : 0.92);
      });
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const next = !open;
    setOpen(next);
    onTriggerAudio(next ? 'world_umbrella_open' : 'world_umbrella_close', [
      position[0],
      0.07,
      position[2],
    ]);
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Stand base */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.085, 0.12, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>
      {/* Umbrella pole */}
      <mesh position={[0, 0.44, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.82, 8]} />
        <meshStandardMaterial color="#7a4e32" roughness={0.7} />
      </mesh>
      {/* Pop-open colorful canopy */}
      <group ref={canopyRef} position={[0, 0.76, 0]} scale={[0.24, 1.35, 0.24]}>
        <mesh castShadow>
          <coneGeometry args={[0.38, 0.26, 8]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.65} />
        </mesh>
      </group>
      {/* Playful miniature drizzle cloud hovering above */}
      <group position={[0, 1.28, 0]}>
        <mesh>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.95} />
        </mesh>
        <mesh position={[-0.12, -0.02, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.95} />
        </mesh>
        <mesh position={[0.12, -0.02, 0]}>
          <sphereGeometry args={[0.105, 10, 10]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.95} />
        </mesh>
      </group>
      {/* Animated blue raindrops */}
      <group ref={dropsRef}>
        {[
          [-0.08, 1.1, 0.04],
          [0.07, 0.95, -0.03],
          [-0.02, 0.8, 0.06],
          [0.09, 0.65, 0.02],
        ].map(([dx, dy, dz], idx) => (
          <mesh key={idx} position={[dx, dy, dz]}>
            <capsuleGeometry args={[0.011, 0.032, 4, 6]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Collection of zero-dialogue emergent street micro-events around the neighborhood block.
 */
export function StreetMicroEvents({ onTriggerAudio }: StreetMicroEventsProps) {
  return (
    <group name="Street_Micro_Events">
      <MailboxEvent position={[1.62, 0.06, 0.45]} onTriggerAudio={onTriggerAudio} />
      <RolledAppleEvent position={[-1.92, 0.06, 0.96]} onTriggerAudio={onTriggerAudio} />
      <UmbrellaRainEvent position={[-1.32, 0.06, 1.38]} onTriggerAudio={onTriggerAudio} />
    </group>
  );
}
