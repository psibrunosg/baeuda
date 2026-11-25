import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import type * as THREE from 'three';
import {
  CAFE_A1_SPIRAL_CONCEPTS,
  CAFE_C2_CONCEPTS,
  CAFE_C3_CONCEPTS,
} from '../domain/cefrEngine';
import type { CafeCycleId, ConceptId, SpeechKey } from '../domain/types';
import { getCafeGeometries } from './cafeGeometries';
import { getCafeTextures } from './cafeTextures';
import { CafeEnvironmentStatic } from './CafeScene';
import type { GuestState } from './CafeSalon';
import { getWorldGeometries } from './worldGeometries';

/** Which guest ordered each item in the food and quantity cycles. */
const ITEM_GUEST: Record<string, number> = {
  milk: 0,
  sugar: 1,
  cake: 2,
  one_big: 0,
  two_small: 1,
  full: 2,
};

export interface CafeDynamicSessionProps {
  visible: boolean;
  cycleId: Exclude<CafeCycleId, 'cafe_c1_drinks'>;
  onPlayAudio: (key: SpeechKey) => void;
  onCompleteCycle: (cycleId: CafeCycleId, concepts: readonly ConceptId[]) => void;
}

function CakeSlice({ highlighted = false }: { highlighted?: boolean }) {
  const cafeGeos = useMemo(() => getCafeGeometries(), []);
  const worldGeos = useMemo(() => getWorldGeometries(), []);
  const textures = useMemo(() => getCafeTextures(), []);

  return (
    <group>
      {/* Sculpted ceramic saucer plate */}
      <mesh geometry={cafeGeos.saucer} scale={1.12} castShadow receiveShadow>
        <meshPhysicalMaterial color="#fdf6ea" roughness={0.24} clearcoat={0.6} />
      </mesh>
      {/* Sculpted triangular sponge cake wedge */}
      <group position={[0, 0.018, 0]} rotation={[0, -0.42, 0]}>
        <mesh geometry={worldGeos.cakeWedge} castShadow receiveShadow>
          <meshStandardMaterial
            color="#eab676"
            emissive={highlighted ? '#f59e0b' : '#000000'}
            emissiveIntensity={highlighted ? 0.3 : 0}
            bumpMap={textures.clayBump}
            bumpScale={0.006}
            roughness={0.82}
          />
        </mesh>
        {/* Cream filling band */}
        <mesh geometry={worldGeos.cakeWedge} position={[0, 0.044, 0]} scale={[1.015, 0.18, 1.015]}>
          <meshStandardMaterial color="#fffbeb" roughness={0.45} />
        </mesh>
        {/* Rich glossy chocolate ganache top layer */}
        <mesh geometry={worldGeos.cakeWedge} position={[0, 0.092, 0]} scale={[1.02, 0.24, 1.02]} castShadow>
          <meshPhysicalMaterial color="#5c2d16" roughness={0.28} clearcoat={0.65} />
        </mesh>
        {/* Whipped cream rosette + sculpted strawberry & mint leaf */}
        <mesh position={[-0.032, 0.128, 0]} castShadow>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#fffdf7" roughness={0.55} />
        </mesh>
        <mesh position={[-0.032, 0.152, 0]} scale={[0.92, 1.15, 0.92]} castShadow>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshPhysicalMaterial color="#ef4444" roughness={0.2} clearcoat={0.85} />
        </mesh>
        <mesh
          geometry={worldGeos.organicLeaf}
          position={[-0.015, 0.156, 0.012]}
          rotation={[0.25, 0.6, -0.3]}
          scale={0.7}
        >
          <meshStandardMaterial color="#16a34a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function MilkPitcher({ highlighted = false }: { highlighted?: boolean }) {
  const geos = useMemo(() => getCafeGeometries(), []);
  return (
    <group>
      <mesh geometry={geos.carafe} scale={0.78} castShadow>
        <meshPhysicalMaterial
          color="#f8fafc"
          emissive={highlighted ? '#38bdf8' : '#000000'}
          emissiveIntensity={highlighted ? 0.28 : 0}
          roughness={0.18}
          clearcoat={0.85}
        />
      </mesh>
      <mesh geometry={geos.carafeHandle} scale={0.78} castShadow>
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
      </mesh>
    </group>
  );
}

function SugarJar({ highlighted = false }: { highlighted?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.075, 0]} castShadow>
        <cylinderGeometry args={[0.068, 0.064, 0.15, 18]} />
        <meshPhysicalMaterial
          color="#fffbeb"
          emissive={highlighted ? '#fbbf24' : '#000000'}
          emissiveIntensity={highlighted ? 0.3 : 0}
          roughness={0.22}
          clearcoat={0.7}
        />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.072, 0.072, 0.024, 18]} />
        <meshStandardMaterial color="#c49563" roughness={0.85} />
      </mesh>
      <mesh position={[0.03, 0.19, 0]} rotation={[0, 0, -0.35]}>
        <capsuleGeometry args={[0.008, 0.08, 4, 8]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

/**
 * Dynamic Café Counter Sessions for CEFR Cycles 2, 3, Pre-A1 Graduation Shift, and A1 Spiral Return.
 * Renders over the warm Café counter backdrop alongside Leo Barista.
 */
export function CafeDynamicSession({
  visible,
  cycleId,
  onPlayAudio,
  onCompleteCycle,
}: CafeDynamicSessionProps) {
  const [stepDone, setStepDone] = useState<string[]>([]);
  const [glassFull, setGlassFull] = useState(false);
  const [shiftOrderIndex, setShiftOrderIndex] = useState(0);
  const [shiftHintVisible, setShiftHintVisible] = useState(false);
  const [a1PlacedNextTo, setA1PlacedNextTo] = useState(false);
  const [a1CoinsPaid, setA1CoinsPaid] = useState(false);
  const [shiftServedAll, setShiftServedAll] = useState(false);
  const [delivery, setDelivery] = useState<{ guest: number; seq: number } | null>(null);
  const deliverySeq = useRef(0);

  const ringRef = useRef<THREE.Mesh>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busyRef = useRef(false);
  const geos = useMemo(() => getCafeGeometries(), []);

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
    clearTimers();
    busyRef.current = false;
    setStepDone([]);
    setGlassFull(false);
    setShiftOrderIndex(0);
    setShiftHintVisible(false);
    setA1PlacedNextTo(false);
    setA1CoinsPaid(false);
    setShiftServedAll(false);
    setDelivery(null);
    return () => clearTimers();
  }, [cycleId, visible]);

  useEffect(() => {
    if (!visible || cycleId !== 'cafe_pre_a1_shift') {
      setShiftHintVisible(false);
      return;
    }
    setShiftHintVisible(false);
    const id = setTimeout(() => setShiftHintVisible(true), 5000);
    return () => clearTimeout(id);
  }, [visible, cycleId, shiftOrderIndex]);

  useFrame((state) => {
    if (!visible) return;
    if (ringRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  if (!visible) return null;

  const setPointer = (active: boolean) => {
    document.body.style.cursor = active ? 'pointer' : 'auto';
  };

  const markAndCheck = (
    id: string,
    required: readonly string[],
    audio: SpeechKey,
    doneAudio: SpeechKey,
    concepts: readonly ConceptId[],
  ) => {
    if (busyRef.current) return;
    onPlayAudio(audio);
    const next = stepDone.includes(id) ? stepDone : [...stepDone, id];
    if (!stepDone.includes(id) && id in ITEM_GUEST) {
      setDelivery({ guest: ITEM_GUEST[id], seq: deliverySeq.current++ });
    }
    setStepDone(next);
    if (required.every((r) => next.includes(r))) {
      busyRef.current = true;
      schedule(() => {
        onPlayAudio(doneAudio);
        schedule(() => {
          busyRef.current = false;
          onCompleteCycle(cycleId, concepts);
        }, 1700);
      }, 950);
    }
  };

  const handleShiftTap = (choice: 'coffee_cake' | 'two_waters' | 'sweet_milk') => {
    if (busyRef.current) return;
    const expected: ('coffee_cake' | 'two_waters' | 'sweet_milk')[] = [
      'coffee_cake',
      'two_waters',
      'sweet_milk',
    ];
    if (choice !== expected[shiftOrderIndex]) {
      setShiftHintVisible(true);
      onPlayAudio(
        choice === 'coffee_cake'
          ? 'cafe_c2_cake'
          : choice === 'two_waters'
            ? 'demo_water'
            : 'cafe_c2_sweet',
      );
      return;
    }

    // right item: the tray flies to the guest who ordered, then the next guest orders
    busyRef.current = true;
    const guest = shiftOrderIndex;
    setDelivery({ guest, seq: deliverySeq.current++ });
    schedule(() => {
      if (guest < 2) {
        setShiftOrderIndex(guest + 1);
        onPlayAudio(guest === 0 ? 'cafe_shift_order_2' : 'cafe_shift_order_3');
        busyRef.current = false;
      } else {
        setShiftServedAll(true);
        onPlayAudio('cafe_shift_graduate');
        schedule(() => {
          busyRef.current = false;
          onCompleteCycle('cafe_pre_a1_shift', []);
        }, 1800);
      }
    }, 1100);
  };

  const itemOrdered = (guest: number) => stepDone.some((id) => ITEM_GUEST[id] === guest);
  const guestStates: GuestState[] | undefined =
    cycleId === 'cafe_pre_a1_shift'
      ? [0, 1, 2].map((i) =>
          shiftServedAll || i < shiftOrderIndex ? 'served' : i === shiftOrderIndex ? 'ordering' : 'idle',
        )
      : cycleId === 'cafe_c2_food' || cycleId === 'cafe_c3_quantity'
        ? [0, 1, 2].map((i) => (itemOrdered(i) ? 'served' : 'ordering'))
        : cycleId === 'cafe_a1_spiral'
          ? [a1CoinsPaid ? 'served' : 'ordering', 'idle', 'idle']
          : undefined;

  return (
    <group name="Cafe_Dynamic_Session">
      <ContactShadows
        key={cycleId}
        frames={1}
        position={[0, 0.973, 0.12]}
        opacity={0.4}
        scale={3.6}
        blur={2.1}
        far={0.7}
        color="#3b1d0f"
      />

      {/* Full shared Café interior backdrop (espresso machine, pendant lamp, window, dust motes, fluted counter) */}
      <CafeEnvironmentStatic showCloche={false} onGuestTap={onPlayAudio} guestStates={guestStates} delivery={delivery} />

      {/* CYCLE 2: Food & Mixing (milk, sugar, cake, sweet, more) */}
      {cycleId === 'cafe_c2_food' && (
        <group>
          <group
            position={[-0.54, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              markAndCheck('milk', ['milk', 'sugar', 'cake'], 'cafe_c2_milk', 'cafe_c2_done', CAFE_C2_CONCEPTS);
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <MilkPitcher highlighted={!stepDone.includes('milk')} />
          </group>

          <group
            position={[0, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              markAndCheck('sugar', ['milk', 'sugar', 'cake'], 'cafe_c2_sugar', 'cafe_c2_done', CAFE_C2_CONCEPTS);
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <SugarJar highlighted={!stepDone.includes('sugar')} />
          </group>

          <group
            position={[0.54, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              markAndCheck('cake', ['milk', 'sugar', 'cake'], 'cafe_c2_cake', 'cafe_c2_done', CAFE_C2_CONCEPTS);
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <CakeSlice highlighted={!stepDone.includes('cake')} />
          </group>
        </group>
      )}

      {/* CYCLE 3: Sizes, Numbers & Full/Empty */}
      {cycleId === 'cafe_c3_quantity' && (
        <group>
          {/* One big cup */}
          <group
            position={[-0.58, 0.973, 0.14]}
            scale={1.35}
            onClick={(e) => {
              e.stopPropagation();
              markAndCheck('one_big', ['one_big', 'two_small', 'full'], 'cafe_c3_one_big', 'cafe_c3_done', CAFE_C3_CONCEPTS);
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <mesh geometry={geos.mug} castShadow>
              <meshStandardMaterial color="#dc5a2c" roughness={0.3} />
            </mesh>
            <mesh geometry={geos.mugHandle}>
              <meshStandardMaterial color="#dc5a2c" roughness={0.3} />
            </mesh>
          </group>

          {/* Two small cups */}
          <group
            position={[0, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              markAndCheck('two_small', ['one_big', 'two_small', 'full'], 'cafe_c3_two_small', 'cafe_c3_done', CAFE_C3_CONCEPTS);
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            {[-0.1, 0.1].map((ox, idx) => (
              <group key={idx} position={[ox, 0, 0]} scale={0.72}>
                <mesh geometry={geos.mug} castShadow>
                  <meshStandardMaterial color="#fdf6ea" roughness={0.3} />
                </mesh>
                <mesh geometry={geos.mugHandle}>
                  <meshStandardMaterial color="#fdf6ea" roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Empty <-> Full glass */}
          <group
            position={[0.58, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              setGlassFull(true);
              markAndCheck('full', ['one_big', 'two_small', 'full'], 'cafe_c3_full_empty', 'cafe_c3_done', CAFE_C3_CONCEPTS);
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            {glassFull && (
              <mesh position={[0, 0.11, 0]}>
                <cylinderGeometry args={[0.072, 0.06, 0.18, 18]} />
                <meshStandardMaterial color="#22b8f0" roughness={0.12} />
              </mesh>
            )}
            <mesh geometry={geos.tallGlass} renderOrder={2}>
              <meshPhysicalMaterial color="#eef9ff" transparent opacity={0.28} roughness={0.05} clearcoat={1} depthWrite={false} />
            </mesh>
          </group>
        </group>
      )}

      {/* PRE-A1 GRADUATION SHIFT: 3 Combined Customer Orders */}
      {cycleId === 'cafe_pre_a1_shift' && (
        <group>
          {/* Option 1: Big Hot Coffee + Cake */}
          <group
            position={[-0.56, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              handleShiftTap('coffee_cake');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <group position={[-0.1, 0, 0]} scale={1.15}>
              <mesh geometry={geos.mug} castShadow>
                <meshStandardMaterial color="#dc5a2c" roughness={0.3} />
              </mesh>
            </group>
            <group position={[0.14, 0, 0.04]} scale={0.8}>
              <CakeSlice highlighted={shiftHintVisible && shiftOrderIndex === 0} />
            </group>
          </group>

          {/* Option 2: Two Cold Waters */}
          <group
            position={[0, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              handleShiftTap('two_waters');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            {[-0.1, 0.1].map((ox, idx) => (
              <group key={idx} position={[ox, 0, 0]} scale={0.85}>
                <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.065, 0.055, 0.16, 16]} />
                  <meshStandardMaterial color="#22b8f0" roughness={0.12} />
                </mesh>
                <mesh geometry={geos.tallGlass} renderOrder={2}>
                  <meshPhysicalMaterial color="#eef9ff" transparent opacity={0.28} roughness={0.05} clearcoat={1} depthWrite={false} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Option 3: Sweet Coffee with Milk */}
          <group
            position={[0.56, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              handleShiftTap('sweet_milk');
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <MilkPitcher highlighted={shiftHintVisible && shiftOrderIndex === 2} />
            <group position={[0.14, 0, 0.04]} scale={0.75}>
              <SugarJar highlighted={shiftHintVisible && shiftOrderIndex === 2} />
            </group>
          </group>

          {shiftHintVisible && (
            <mesh
              ref={ringRef}
              position={[shiftOrderIndex === 0 ? -0.56 : shiftOrderIndex === 1 ? 0 : 0.56, 0.98, 0.14]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.2, 0.27, 32]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.88} />
            </mesh>
          )}
        </group>
      )}

      {/* A1 SPIRAL RETURN TO CAFÉ: Spatial Prepositions (next to) + Coins Payment */}
      {cycleId === 'cafe_a1_spiral' && (
        <group>
          {/* Anchor Coffee Mug */}
          <group position={[-0.22, 0.973, 0.14]}>
            <mesh geometry={geos.mug} castShadow>
              <meshStandardMaterial color="#dc5a2c" roughness={0.28} />
            </mesh>
            <mesh geometry={geos.mugHandle}>
              <meshStandardMaterial color="#dc5a2c" roughness={0.28} />
            </mesh>
          </group>

          {/* Cake placed NEXT TO the cup when tapped */}
          <group
            position={[a1PlacedNextTo ? 0.08 : -0.68, 0.973, 0.14]}
            onClick={(e) => {
              e.stopPropagation();
              if (!a1PlacedNextTo) {
                setA1PlacedNextTo(true);
                onPlayAudio('cafe_a1_next_to');
                schedule(() => onPlayAudio('cafe_a1_coins'), 1900);
              }
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            <CakeSlice highlighted={!a1PlacedNextTo} />
          </group>

          {/* Golden Coins for A1 transaction */}
          <group
            position={[0.56, 0.973, 0.18]}
            onClick={(e) => {
              e.stopPropagation();
              if (!a1PlacedNextTo || a1CoinsPaid || busyRef.current) return;
              busyRef.current = true;
              setA1CoinsPaid(true);
              setDelivery({ guest: 0, seq: deliverySeq.current++ });
              onPlayAudio('cafe_a1_like_done');
              schedule(() => {
                busyRef.current = false;
                onCompleteCycle('cafe_a1_spiral', CAFE_A1_SPIRAL_CONCEPTS);
              }, 1800);
            }}
            onPointerOver={() => setPointer(true)}
            onPointerOut={() => setPointer(false)}
          >
            {[-0.06, 0.06].map((cx, idx) => (
              <mesh key={idx} position={[cx, 0.015, idx * 0.03]} castShadow>
                <cylinderGeometry args={[0.055, 0.055, 0.018, 18]} />
                <meshStandardMaterial
                  color="#facc15"
                  metalness={0.85}
                  roughness={0.22}
                  emissive={a1PlacedNextTo && !a1CoinsPaid ? '#f59e0b' : '#000000'}
                  emissiveIntensity={a1PlacedNextTo && !a1CoinsPaid ? 0.45 : 0}
                />
              </mesh>
            ))}
          </group>

          <mesh
            ref={ringRef}
            position={[!a1PlacedNextTo ? -0.68 : 0.56, 0.98, 0.16]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.16, 0.23, 32]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.88} />
          </mesh>
        </group>
      )}
    </group>
  );
}
