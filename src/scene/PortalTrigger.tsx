import { useRef, type MutableRefObject } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapFrame } from './mapVisibility';
import type { AvatarPose } from './worldNavigation';

interface PortalTriggerProps {
  position: [number, number, number];
  color?: string;
  radius?: number;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  enableProximity?: boolean;
  proximityRadius?: number;
  onEnter: () => void;
}

/**
 * Reusable 2.5D doorway/road portal with pulsing ground ring, pointer click,
 * and optional proximity activation with spawn-exit cooldown to avoid bounce loops.
 */
export function PortalTrigger({
  position,
  color = '#fbbf24',
  radius = 0.48,
  avatarPoseRef,
  enableProximity = false,
  proximityRadius = 0.78,
  onEnter,
}: PortalTriggerProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const cooldownRef = useRef(0.95);
  const triggeredRef = useRef(false);

  useMapFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (ringRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3.4) * 0.12;
      ringRef.current.scale.set(s, s, 1);
    }

    if (!enableProximity || !avatarPoseRef || triggeredRef.current) return;
    if (cooldownRef.current > 0) {
      cooldownRef.current = Math.max(0, cooldownRef.current - dt);
      return;
    }

    const p = avatarPoseRef.current;
    const dist = Math.hypot(p.x - position[0], p.z - position[2]);
    if (dist <= proximityRadius) {
      triggeredRef.current = true;
      onEnter();
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    onEnter();
  };

  return (
    <group position={position}>
      <mesh
        ref={ringRef}
        position={[0, 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <ringGeometry args={[radius * 0.72, radius, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {/* Subtle clickable inner disk so tapping anywhere inside the ring triggers */}
      <mesh
        position={[0, 0.035, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <circleGeometry args={[radius * 0.72, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}
