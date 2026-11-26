import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { FamilyTime } from '../../domain/familyRoutine';
import { getCafeTextures } from '../cafeTextures';
import { EAST_DOOR, EAST_WALL_X, type TapSpot } from '../familyHomeLayout';
import { useMapFrame } from '../mapVisibility';
import { ball, box, cyl, merge, once, paint, pill, toyMaterial } from '../toyKit';
import { Steam } from './bakeryProps';

const noRaycast = () => null;

type Position = [number, number, number];

/** Generous invisible hit box over an object; children are placed relative to its base. */
export function TapArea({ at, hit, onTap, children }: TapSpot & { onTap: () => void; children?: ReactNode }) {
  return (
    <group
      position={at}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onTap();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* an invisible material is still tapped but stays out of the contact shadows */}
      <mesh position={[0, hit[1] / 2, 0]}>
        <boxGeometry args={hit} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {children}
    </group>
  );
}

function Block({ at, size, color, roughness = 0.8 }: { at: Position; size: Position; color: string; roughness?: number }) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

export function KitchenFloor({ onClick }: { onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  // Cloned so the floor repeat does not change the shared tile texture.
  const maps = useMemo(() => {
    const textures = getCafeTextures();
    const clone = (source: THREE.Texture | null) => {
      if (!source) return null;
      const copy = source.clone();
      copy.repeat.set(2, 1);
      copy.needsUpdate = true;
      return copy;
    };
    return { color: clone(textures.tileColor), bump: clone(textures.tileBump) };
  }, []);
  useEffect(
    () => () => {
      maps.color?.dispose();
      maps.bump?.dispose();
    },
    [maps],
  );
  return (
    <mesh position={[2.95, 0.024, -2.88]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={[5.3, 2.36]} />
      <meshStandardMaterial map={maps.color} bumpMap={maps.bump} bumpScale={0.012} color="#f4efe4" roughness={0.6} />
    </mesh>
  );
}

export function CookingPot({ position }: { position: Position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.15, 0.2, 18]} />
        <meshStandardMaterial color="#2563eb" roughness={0.35} metalness={0.3} />
      </mesh>
      <Block at={[0, 0.17, 0]} size={[0.44, 0.035, 0.06]} color="#27272a" />
      <mesh position={[0, 0.215, 0]}>
        <cylinderGeometry args={[0.165, 0.175, 0.035, 18]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.65} />
      </mesh>
      <Block at={[0, 0.26, 0]} size={[0.07, 0.055, 0.07]} color="#27272a" />
      <Steam position={[0, 0.32, 0]} size={0.065} rise={0.45} />
    </group>
  );
}

const CLOCK: Record<FamilyTime, { hour: number; face: string; hands: string }> = {
  morning: { hour: 7, face: '#fef3c7', hands: '#1f2937' },
  afternoon: { hour: 3, face: '#fdba74', hands: '#1f2937' },
  night: { hour: 9, face: '#312e81', hands: '#fef9c3' },
};

export function WallClock({ position, time }: { position: Position; time: FamilyTime }) {
  const { hour, face, hands } = CLOCK[time];
  const hand = (angle: number, length: number, width: number) => (
    <group rotation={[0, 0, angle]} position={[0, 0, 0.065]}>
      <mesh position={[0, length / 2, 0]}>
        <boxGeometry args={[width, length, 0.02]} />
        <meshBasicMaterial color={hands} />
      </mesh>
    </group>
  );
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
        <meshStandardMaterial color="#7a4e32" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <circleGeometry args={[0.43, 32]} />
        <meshStandardMaterial color={face} emissive={face} emissiveIntensity={0.2} roughness={0.6} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 6) * 0.36, Math.cos((i * Math.PI) / 6) * 0.36, 0.055]}>
          <circleGeometry args={[i % 3 ? 0.014 : 0.028, 8]} />
          <meshBasicMaterial color={hands} />
        </mesh>
      ))}
      {hand((-hour / 12) * Math.PI * 2, 0.22, 0.06)}
      {hand(0, 0.34, 0.032)}
    </group>
  );
}

export function WashingMachine() {
  return (
    <>
      <Block at={[0, 0.45, 0]} size={[0.85, 0.9, 0.68]} color="#f1f5f9" roughness={0.35} />
      <Block at={[0, 0.95, -0.2]} size={[0.85, 0.12, 0.26]} color="#94a3b8" />
      <mesh position={[0, 0.42, 0.355]}>
        <torusGeometry args={[0.24, 0.045, 10, 28]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0.35]}>
        <circleGeometry args={[0.22, 24]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.15} metalness={0.3} />
      </mesh>
      <mesh position={[0.26, 0.96, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 14]} />
        <meshStandardMaterial color="#e05a47" roughness={0.4} />
      </mesh>
    </>
  );
}

export function StudyDesk() {
  return (
    <>
      <Block at={[0, 0.58, 0]} size={[1.15, 0.07, 0.66]} color="#b97f4a" />
      {[-0.5, 0.5].flatMap((x) =>
        [-0.26, 0.26].map((z) => <Block key={`${x}:${z}`} at={[x, 0.27, z]} size={[0.07, 0.55, 0.07]} color="#6b4226" />),
      )}
      {['#ef4444', '#2563eb', '#16a34a'].map((color, i) => (
        <Block key={color} at={[-0.32 + i * 0.015, 0.65 + i * 0.07, -0.05]} size={[0.34, 0.065, 0.26]} color={color} />
      ))}
      {[-0.12, 0.12].map((x) => (
        <Block key={x} at={[0.24 + x, 0.628, 0.04]} size={[0.23, 0.025, 0.3]} color="#fffbeb" />
      ))}
    </>
  );
}

/** Screen on a low rack; the base of the group is on the floor. */
export function Television() {
  return (
    <>
      <Block at={[0, 0.22, 0]} size={[1.2, 0.42, 0.45]} color="#8b5a3c" />
      <Block at={[0, 0.48, 0]} size={[0.14, 0.1, 0.1]} color="#18181b" />
      <Block at={[0, 0.84, 0]} size={[1.04, 0.64, 0.08]} color="#18181b" roughness={0.4} />
      <mesh position={[0, 0.84, 0.042]}>
        <planeGeometry args={[0.94, 0.54]} />
        <meshStandardMaterial color="#1d4ed8" emissive="#60a5fa" emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
    </>
  );
}

/** Sliding door parked open beside the doorway; it never takes taps. */
export function GlassDoor() {
  const length = 1.2;
  return (
    <group position={[EAST_WALL_X + 0.2, 0, EAST_DOOR.maxZ + length / 2]}>
      {[0.06, 1.7].map((y) => (
        <mesh key={y} position={[0, y, 0]} raycast={noRaycast}>
          <boxGeometry args={[0.08, 0.08, length]} />
          <meshStandardMaterial color="#7a4e32" roughness={0.7} />
        </mesh>
      ))}
      {[-length / 2, length / 2].map((z) => (
        <mesh key={z} position={[0, 0.88, z]} raycast={noRaycast}>
          <boxGeometry args={[0.08, 1.72, 0.08]} />
          <meshStandardMaterial color="#7a4e32" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.88, 0]} raycast={noRaycast}>
        <boxGeometry args={[0.03, 1.56, length - 0.08]} />
        <meshStandardMaterial color="#dff3ff" transparent opacity={0.28} roughness={0.05} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** White picket fence around the three open sides of the backyard. */
export function Fence() {
  const geometry = once('family:fence', () => {
    const white = '#fbfaf5';
    const picket = (x: number, z: number) => paint(box(0.1, 0.62, 0.1), white, { at: [x, 0.33, z] });
    const parts = [
      ...Array.from({ length: 25 }, (_, i) => picket(9.62, -4.2 + i * 0.35)),
      paint(box(0.05, 0.08, 8.4), white, { at: [9.62, 0.42, 0] }),
    ];
    for (const z of [-4.2, 4.2]) {
      parts.push(...Array.from({ length: 10 }, (_, i) => picket(6.2 + i * 0.35, z)));
      parts.push(paint(box(3.55, 0.08, 0.05), white, { at: [7.85, 0.42, z] }));
    }
    return merge(parts);
  });
  return <mesh geometry={geometry} material={toyMaterial()} castShadow />;
}

/** Picnic table with a kettle grill beside it. */
export function Barbecue() {
  const geometry = once('family:barbecue', () =>
    merge([
      paint(box(1.05, 0.07, 0.75), '#b97f4a', { at: [-0.35, 0.56, 0] }),
      ...[-0.8, 0.1].map((x) => paint(box(0.08, 0.54, 0.6), '#7a4e32', { at: [x, 0.27, 0] })),
      ...[-0.6, -0.1].map((x) => paint(cyl(0.14, 0.12, 0.03, 16), '#fdf6ea', { at: [x, 0.61, 0] })),
      ...[-0.18, 0, 0.18].map((x) => paint(cyl(0.022, 0.022, 0.55, 8), '#27272a', { at: [0.6 + x, 0.27, 0] })),
      paint(cyl(0.34, 0.2, 0.24, 18), '#dc2626', { at: [0.6, 0.66, 0] }),
      paint(cyl(0.32, 0.32, 0.03, 18), '#27272a', { at: [0.6, 0.79, 0] }),
      ...[-0.1, 0.1].map((z) => paint(pill(0.035, 0.2), '#a8452c', { at: [0.6, 0.835, z], rot: [0, 0, Math.PI / 2] })),
      paint(ball(0.07), '#16a34a', { at: [-0.35, 0.65, 0.05] }),
    ]),
  );
  return <mesh geometry={geometry} material={toyMaterial()} castShadow />;
}

/** A-frame swing that rocks gently. */
export function Swing() {
  const seatRef = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    if (seatRef.current) seatRef.current.rotation.x = Math.sin(clock.elapsedTime * 1.7) * 0.3;
  });
  const frame = once('family:swing', () =>
    merge([
      paint(box(1.7, 0.1, 0.1), '#0f766e', { at: [0, 1.5, 0] }),
      ...[-0.8, 0.8].flatMap((x) =>
        [-1, 1].map((s) => paint(box(0.09, 1.58, 0.09), '#0f766e', { at: [x, 0.75, s * 0.22], rot: [-s * 0.28, 0, 0] })),
      ),
    ]),
  );
  return (
    <>
      <mesh geometry={frame} material={toyMaterial()} castShadow />
      <group ref={seatRef} position={[0, 1.48, 0]}>
        {[-0.28, 0.28].map((x) => (
          <Block key={x} at={[x, -0.52, 0]} size={[0.025, 1.04, 0.025]} color="#d9c7a3" />
        ))}
        <Block at={[0, -1.06, 0]} size={[0.68, 0.07, 0.3]} color="#facc15" />
      </group>
    </>
  );
}
