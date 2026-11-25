import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';
import { StylizedHumanoid, type StylizedHumanoidProps } from './StylizedCharacters';

/**
 * The room around the counter: tables with guests, a reading corner, the front door,
 * pendant lamps, plants and wall art. Only visible in the wide establishing shot
 * (cam_salao) and at the edges of the counter shots, so it stays cheap:
 * no real lights, no per-frame allocation.
 */

type GuestTap = (key: SpeechKey) => void;

const WOOD = '#8a5a3b';
const WOOD_DARK = '#5c3a26';

function useStop(onTap?: () => void) {
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onTap?.();
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      document.body.style.cursor = 'auto';
    },
  };
}

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.44, 0]} castShadow>
        <boxGeometry args={[0.38, 0.045, 0.38]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, -0.17]} castShadow>
        <boxGeometry args={[0.36, 0.42, 0.04]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {[-0.16, 0.16].flatMap((x) =>
        [-0.16, 0.16].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.21, z]}>
            <cylinderGeometry args={[0.018, 0.018, 0.42, 6]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
          </mesh>
        )),
      )}
    </group>
  );
}

function RoundTable({ position, mugPhase }: { position: [number, number, number]; mugPhase: number }) {
  const mugRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!mugRef.current) return;
    // a sip every ~7 s: the mug lifts and tilts toward the guest, then rests
    const k = Math.max(0, Math.sin(state.clock.elapsedTime * 0.9 + mugPhase));
    const sip = Math.pow(k, 6);
    mugRef.current.position.y = 0.745 + sip * 0.12;
    mugRef.current.rotation.z = sip * 0.35;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.04, 24]} />
        <meshStandardMaterial color="#e8d3b0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.72, 10]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.04, 16]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
      </mesh>
      <group ref={mugRef} position={[0.14, 0.745, 0.05]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 12]} />
          <meshStandardMaterial color="#f5ebd8" roughness={0.35} />
        </mesh>
      </group>
      <mesh position={[-0.16, 0.745, -0.06]}>
        <cylinderGeometry args={[0.07, 0.07, 0.012, 14]} />
        <meshStandardMaterial color="#fdf6ea" roughness={0.3} />
      </mesh>
    </group>
  );
}

/** cold / warm: the lesson's thermal-contrast customer, shown as a blue or orange order bubble. */
export type GuestState = 'idle' | 'ordering' | 'served' | 'cold' | 'warm';

const MARKER: Record<GuestState, { color: string; glow: string }> = {
  idle: { color: '#fbbf24', glow: '#f59e0b' },
  ordering: { color: '#fbbf24', glow: '#f59e0b' },
  served: { color: '#22c55e', glow: '#16a34a' },
  cold: { color: '#60a5fa', glow: '#2563eb' },
  warm: { color: '#fb923c', glow: '#ea580c' },
};

/** The three seated guests. `tray` is where a delivery lands (table top, or the reader's hands). */
export const SALON_GUESTS: ReadonlyArray<{
  pos: [number, number, number];
  facing: number;
  speech: SpeechKey;
  tray: [number, number, number];
  look: StylizedHumanoidProps;
}> = [
  {
    pos: [-1.45, 0.34, 0.95],
    facing: 0,
    speech: 'cafe_guest_cake',
    tray: [-1.45, 0.8, 1.5],
    look: { shirtColor: '#db2777', hat: 'sunhat', hatColor: '#fde68a', skinColor: '#c68642' },
  },
  {
    pos: [1.45, 0.34, 1.15],
    facing: 0,
    speech: 'cafe_guest_coffee',
    tray: [1.45, 0.8, 1.7],
    look: { shirtColor: '#2563eb', hat: 'cap', hatColor: '#facc15' },
  },
  {
    pos: [2.1, 0.2, -0.45],
    facing: -Math.PI / 2 - 0.4,
    speech: 'cafe_guest_book',
    tray: [1.8, 0.85, -0.25],
    look: { shirtColor: '#16a34a', glasses: true, hairColor: '#78350f' },
  },
];

function Guest({ index, state, onTap }: { index: number; state: GuestState; onTap: GuestTap }) {
  const g = SALON_GUESTS[index];
  const wave: MutableRefObject<number> = useRef(0);
  const marker = useRef<THREE.Group>(null);
  const idle = useRef(0);
  const handlers = useStop(() => {
    wave.current = 1.4;
    onTap(g.speech);
  });
  useFrame((fs, delta) => {
    const dt = Math.min(delta, 0.05);
    // an ordering guest waves for attention every few seconds
    const waiting = state === 'ordering' || state === 'cold' || state === 'warm';
    if (waiting) {
      idle.current += dt;
      if (idle.current > 3.2) {
        idle.current = 0;
        wave.current = 1.2;
      }
    }
    if (marker.current) {
      marker.current.visible = state !== 'idle';
      marker.current.position.y = 1.32 + Math.sin(fs.clock.elapsedTime * 4) * (waiting ? 0.05 : 0.015);
    }
  });
  const mk = MARKER[state];
  return (
    <group position={g.pos}>
      <group rotation={[0, g.facing, 0]} {...handlers}>
        {/* generous invisible hit box so small guests are easy to tap on touch screens */}
        <mesh position={[0, 0.55, 0]} visible={false}>
          <boxGeometry args={[0.6, 1.1, 0.6]} />
        </mesh>
        <StylizedHumanoid {...g.look} waveTimerRef={wave} scale={0.82} />
      </group>
      {/* order marker: amber bubble while waiting, green once served */}
      <group ref={marker} visible={false}>
        <mesh>
          <sphereGeometry args={[0.1, 14, 12]} />
          <meshStandardMaterial color={mk.color} emissive={mk.glow} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, -0.11, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.04, 0.07, 8]} />
          <meshStandardMaterial color={mk.color} emissive={mk.glow} emissiveIntensity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** Tray that flies from the counter to a guest, then disappears. */
function DeliveryTray({ delivery }: { delivery: { guest: number; seq: number } | null }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef(0);
  const lastSeq = useRef(-1);
  useFrame((fs) => {
    const tray = ref.current;
    if (!tray) return;
    if (delivery && delivery.seq !== lastSeq.current) {
      lastSeq.current = delivery.seq;
      start.current = fs.clock.elapsedTime;
    }
    const u = delivery ? (fs.clock.elapsedTime - start.current) / 1.1 : 2;
    tray.visible = delivery !== null && u >= 0 && u <= 1;
    if (!tray.visible || !delivery) return;
    const to = SALON_GUESTS[delivery.guest].tray;
    const e = u * u * (3 - 2 * u);
    tray.position.set(to[0] * e, 1.0 + (to[1] - 1.0) * e + Math.sin(u * Math.PI) * 0.35, 0.2 + (to[2] - 0.2) * e);
  });
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.4} />
      </mesh>
      <mesh position={[-0.04, 0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.08, 10]} />
        <meshStandardMaterial color="#dc5a2c" roughness={0.3} />
      </mesh>
      <mesh position={[0.05, 0.04, 0.02]}>
        <boxGeometry args={[0.06, 0.05, 0.06]} />
        <meshStandardMaterial color="#eab676" roughness={0.8} />
      </mesh>
    </group>
  );
}

function PendantLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 1.0, 4]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh>
        <coneGeometry args={[0.2, 0.18, 14, 1, true]} />
        <meshStandardMaterial color="#d97706" side={THREE.DoubleSide} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#fff3c4" emissive="#fbbf24" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.1, 0.34, 12]} />
        <meshStandardMaterial color="#b4572f" roughness={0.85} />
      </mesh>
      {[
        [0, 0.55, 0, 0.2],
        [-0.12, 0.45, 0.05, 0.14],
        [0.13, 0.5, -0.04, 0.15],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i === 0 ? '#4d7c4a' : '#6b9a5e'} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Frame({ position, size, color }: { position: [number, number, number]; size: [number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[size[0], size[1], 0.03]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.018]}>
        <planeGeometry args={[size[0] - 0.08, size[1] - 0.08]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Glass front door set into the back wall; tap it to hear the welcome. */
function Door({ position, onTap }: { position: [number, number, number]; onTap: GuestTap }) {
  const bell = useRef<THREE.Mesh>(null);
  const handlers = useStop(() => onTap('cafe_door_welcome'));
  useFrame((state) => {
    if (bell.current) bell.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.6) * 0.06;
  });
  return (
    <group position={position} {...handlers}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[1.0, 2.1, 0.08]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.2, 0.045]}>
        <planeGeometry args={[0.76, 1.55]} />
        <meshStandardMaterial color="#cfe8f5" emissive="#bfe3f7" emissiveIntensity={0.55} roughness={0.15} />
      </mesh>
      <mesh position={[0.32, 0.95, 0.07]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={bell} position={[-0.3, 2.0, 0.09]}>
        <coneGeometry args={[0.05, 0.08, 10]} />
        <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function CafeSalon({
  onGuestTap,
  guestStates,
  delivery = null,
}: {
  onGuestTap?: GuestTap;
  guestStates?: readonly GuestState[];
  delivery?: { guest: number; seq: number } | null;
}) {
  const textures = useMemo(() => getCafeTextures(), []);
  const tap: GuestTap = (k) => onGuestTap?.(k);
  const st = (i: number): GuestState => guestStates?.[i] ?? 'idle';
  return (
    <group name="ENV_Salon">
      {/* side walls and a timber ceiling close the room */}
      {[-3.4, 3.4].map((x) => (
        <mesh key={x} position={[x, 1.9, 1.7]} receiveShadow>
          <boxGeometry args={[0.18, 3.8, 6.7]} />
          <meshStandardMaterial color="#ffffff" map={textures.plasterColor} bumpMap={textures.plasterBump} bumpScale={0.012} roughness={0.92} />
        </mesh>
      ))}
      {/* single-sided, faces down: invisible from above so the camera can dive in from the street */}
      <mesh position={[0, 3.45, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.8, 6.7]} />
        <meshStandardMaterial color="#e9dcc6" roughness={0.9} />
      </mesh>
      {/* warm rug under the seating */}
      <mesh position={[0, 0.006, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.2, 2.6]} />
        <meshStandardMaterial color="#c2703d" roughness={1} />
      </mesh>
      <mesh position={[0, 0.008, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.9, 2.3]} />
        <meshStandardMaterial color="#e6c9a0" roughness={1} />
      </mesh>

      {/* table 1 (west) and table 2 (east): guests sit across so the camera sees their faces */}
      <RoundTable position={[-1.45, 0, 1.5]} mugPhase={0.5} />
      <Chair position={[-1.45, 0, 0.95]} />
      <Chair position={[-0.8, 0, 1.5]} rotation={-Math.PI / 2} />
      <PendantLamp position={[-1.45, 2.45, 1.5]} />
      <RoundTable position={[1.45, 0, 1.7]} mugPhase={2.4} />
      <Chair position={[1.45, 0, 1.15]} />
      <Chair position={[0.8, 0, 1.7]} rotation={Math.PI / 2} />
      <PendantLamp position={[1.45, 2.45, 1.7]} />

      {/* reading corner near the door */}
      <mesh position={[2.35, 0.24, -0.45]} castShadow>
        <boxGeometry args={[0.6, 0.48, 0.6]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} />
      </mesh>
      <mesh position={[2.62, 0.62, -0.45]} castShadow>
        <boxGeometry args={[0.12, 0.7, 0.6]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} />
      </mesh>
      <PendantLamp position={[2.1, 2.45, -0.45]} />

      {SALON_GUESTS.map((_, i) => (
        <Guest key={i} index={i} state={st(i)} onTap={tap} />
      ))}
      <DeliveryTray delivery={delivery} />

      <Door position={[2.55, 0, -1.54]} onTap={tap} />

      <Plant position={[-3.0, 0, 2.6]} scale={1.3} />
      <Plant position={[3.0, 0, 2.7]} scale={1.1} />
      <Plant position={[-3.0, 0, -0.9]} />

      <group rotation={[0, Math.PI / 2, 0]}>
        <Frame position={[-0.6, 1.9, -3.3]} size={[0.7, 0.5]} color="#e9c46a" />
        <Frame position={[0.4, 1.7, -3.3]} size={[0.5, 0.65]} color="#8ab17d" />
        <Frame position={[2.0, 1.85, -3.3]} size={[0.6, 0.45]} color="#e76f51" />
      </group>
    </group>
  );
}
