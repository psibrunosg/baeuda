import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SpeechKey } from '../domain/types';
import { getCafeTextures } from './cafeTextures';
import { StylizedHumanoid, type StylizedHumanoidProps } from './StylizedCharacters';
import { BlobShadow, toyMaterial } from './toyKit';
import {
  armchairGeometry,
  chairGeometry,
  doorGeometry,
  pendantGeometry,
  pictureGeometry,
  pottedPlantGeometry,
  rugTrimGeometry,
  salonMugGeometry,
  tableGeometry,
} from './toyProps';

/**
 * The room around the counter: tables with guests, a reading corner, the front door,
 * pendant lamps, plants and wall art. Only visible in the wide establishing shot
 * (cam_salao) and at the edges of the counter shots, so it stays cheap:
 * no real lights, no per-frame allocation.
 */

type GuestTap = (key: SpeechKey) => void;

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
  return <mesh geometry={chairGeometry()} material={toyMaterial()} position={position} rotation={[0, rotation, 0]} castShadow />;
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
      <BlobShadow size={[1.25, 1.25]} y={0.014} />
      <mesh geometry={tableGeometry()} material={toyMaterial()} castShadow receiveShadow />
      <group ref={mugRef} position={[0.14, 0.745, 0.05]}>
        <mesh geometry={salonMugGeometry()} material={toyMaterial('gloss')} castShadow />
      </group>
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
    pos: [-2.5, 0.34, 1.5],
    facing: 0,
    speech: 'cafe_guest_cake',
    tray: [-2.5, 0.8, 2.05],
    look: { shirtColor: '#db2777', hat: 'sunhat', hatColor: '#fde68a', skinColor: '#c68642' },
  },
  {
    pos: [2.5, 0.34, 1.75],
    facing: 0,
    speech: 'cafe_guest_coffee',
    tray: [2.5, 0.8, 2.3],
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
      <mesh geometry={pendantGeometry()} material={toyMaterial('gloss')} />
      <mesh position={[0, -0.04, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#fff3c4" emissive="#fbbf24" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <mesh geometry={pottedPlantGeometry()} material={toyMaterial()} position={position} scale={scale} castShadow />;
}

function Frame({ position, size, color }: { position: [number, number, number]; size: [number, number]; color: string }) {
  return <mesh geometry={pictureGeometry(size[0], size[1], color)} material={toyMaterial()} position={position} />;
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
      <mesh geometry={doorGeometry()} material={toyMaterial()} castShadow />
      <mesh position={[0, 1.2, 0.045]}>
        <planeGeometry args={[0.76, 1.55]} />
        <meshStandardMaterial color="#cfe8f5" emissive="#bfe3f7" emissiveIntensity={0.55} roughness={0.15} />
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
      {[-5.2, 5.2].map((x) => (
        <mesh key={x} position={[x, 1.9, 3.4]} receiveShadow>
          <boxGeometry args={[0.18, 3.8, 10.2]} />
          <meshStandardMaterial color="#ffffff" map={textures.plasterColor} bumpMap={textures.plasterBump} bumpScale={0.012} roughness={0.92} />
        </mesh>
      ))}
      {/* single-sided, faces down: invisible from above so the camera can dive in from the street */}
      <mesh position={[0, 3.45, 3.4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.4, 10.2]} />
        <meshStandardMaterial color="#e9dcc6" roughness={0.9} />
      </mesh>
      {/* warm rug under the seating */}
      <mesh position={[0, 0.006, 2.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.2, 4.2]} />
        <meshStandardMaterial color="#c2703d" roughness={1} />
      </mesh>
      <mesh position={[0, 0.008, 2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.9, 3.9]} />
        <meshStandardMaterial color="#e6c9a0" roughness={1} />
      </mesh>

      <mesh geometry={rugTrimGeometry()} material={toyMaterial()} position={[0, 0.011, 2.6]} receiveShadow />

      {/* table 1 (west) and table 2 (east): guests sit across so the camera sees their faces */}
      <RoundTable position={[-2.5, 0, 2.05]} mugPhase={0.5} />
      <Chair position={[-2.5, 0, 1.5]} />
      <Chair position={[-1.85, 0, 2.05]} rotation={-Math.PI / 2} />
      <PendantLamp position={[-2.5, 2.45, 2.05]} />
      <RoundTable position={[2.5, 0, 2.3]} mugPhase={2.4} />
      <Chair position={[2.5, 0, 1.75]} />
      <Chair position={[1.85, 0, 2.3]} rotation={Math.PI / 2} />
      <PendantLamp position={[2.5, 2.45, 2.3]} />

      {/* two more tables further back so the room feels lived in */}
      <RoundTable position={[-1.0, 0, 4.4]} mugPhase={1.2} />
      <Chair position={[-1.0, 0, 3.85]} />
      <Chair position={[-1.0, 0, 4.95]} rotation={Math.PI} />
      <RoundTable position={[1.2, 0, 4.6]} mugPhase={3.3} />
      <Chair position={[1.2, 0, 4.05]} />
      <Chair position={[1.2, 0, 5.15]} rotation={Math.PI} />

      {/* reading corner near the door */}
      <mesh geometry={armchairGeometry()} material={toyMaterial()} position={[2.35, 0, -0.45]} castShadow />
      <PendantLamp position={[2.1, 2.45, -0.45]} />

      {SALON_GUESTS.map((_, i) => (
        <Guest key={i} index={i} state={st(i)} onTap={tap} />
      ))}
      <DeliveryTray delivery={delivery} />

      <Door position={[2.55, 0, -1.54]} onTap={tap} />

      <Plant position={[-4.7, 0, 3.4]} scale={1.3} />
      <Plant position={[4.7, 0, 3.6]} scale={1.1} />
      <Plant position={[-4.7, 0, -0.8]} />
      <Plant position={[-4.7, 0, 6.0]} scale={1.2} />
      <Plant position={[4.7, 0, 6.0]} />

      <group rotation={[0, Math.PI / 2, 0]}>
        <Frame position={[-0.6, 1.9, -5.1]} size={[0.7, 0.5]} color="#e9c46a" />
        <Frame position={[0.4, 1.7, -5.1]} size={[0.5, 0.65]} color="#8ab17d" />
        <Frame position={[2.0, 1.85, -5.1]} size={[0.6, 0.45]} color="#e76f51" />
      </group>
    </group>
  );
}
