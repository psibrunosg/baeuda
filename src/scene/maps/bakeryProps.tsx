import { useEffect, useMemo, useRef } from 'react';
import { type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import type { BakeryItem } from '../../domain/bakeryBasket';
import { useMapFrame } from '../mapVisibility';
import { ball, box, cyl, merge, once, paint, pill, rbox, ring, toyMaterial, type Vec3 } from '../toyKit';
import { createCakeWedgeGeometry } from '../worldGeometries';

const noRaycast = () => null;

const baguetteParts = (at: Vec3, yaw = 0) => {
  const place = (dx: number, dy: number): Vec3 => [at[0] + dx * Math.cos(yaw), at[1] + dy, at[2] - dx * Math.sin(yaw)];
  return [
    paint(pill(0.05, 0.38), '#d4893a', { at: place(0, 0.05), rot: [0, yaw, Math.PI / 2] }),
    ...[-0.12, 0, 0.12].map((dx) =>
      paint(box(0.03, 0.016, 0.075), '#f3d39b', { at: place(dx, 0.097), rot: [0, yaw + 0.65, 0] }),
    ),
  ];
};

const loafParts = (at: Vec3, s = 1) => [
  paint(ball(0.14, 18, 14), '#b8702f', { at: [at[0], at[1] + 0.095 * s, at[2]], scale: [1.15 * s, 0.72 * s, s], shade: 0.35 }),
  ...[0.6, -0.6].map((yaw) =>
    paint(box(0.18, 0.012, 0.022), '#f1d19a', { at: [at[0], at[1] + 0.195 * s, at[2]], rot: [0, yaw, 0], scale: [s, s, s] }),
  ),
];

/** Five overlapping tapered balls along an arc. */
const croissantParts = (at: Vec3, yaw = 0) =>
  [-2, -1, 0, 1, 2].map((i) => {
    const a = i * 0.48;
    const dx = Math.sin(a) * 0.13;
    const dz = Math.cos(a) * 0.13 - 0.1;
    const r = 0.062 - Math.abs(i) * 0.012;
    return paint(ball(r), i % 2 === 0 ? '#e2a042' : '#c8842f', {
      at: [at[0] + dx * Math.cos(yaw) + dz * Math.sin(yaw), at[1] + r * 0.85, at[2] - dx * Math.sin(yaw) + dz * Math.cos(yaw)],
      rot: [0, yaw + a, 0],
      scale: [1.15, 0.85, 1],
    });
  });

const butterParts = (at: Vec3) => [
  paint(box(0.22, 0.11, 0.14), '#fcdc6a', { at: [at[0] - 0.02, at[1] + 0.055, at[2]] }),
  paint(box(0.035, 0.11, 0.14), '#fde68a', { at: [at[0] + 0.14, at[1] + 0.035, at[2]], rot: [0, 0, -0.5] }),
];

const sliceParts = (at: Vec3) => {
  const layer = (color: string, y: number, sy: number, sxz: number) =>
    paint(createCakeWedgeGeometry(), color, {
      at: [at[0], at[1] + y, at[2]],
      rot: [0, -0.42, 0],
      scale: [sxz, sy, sxz],
    });
  return [
    layer('#eab676', 0, 1.6, 1.7),
    layer('#fff6e0', 0.07, 0.25, 1.74),
    layer('#5c2d16', 0.16, 0.35, 1.76),
    paint(ball(0.04), '#ef4444', { at: [at[0] - 0.06, at[1] + 0.235, at[2] - 0.02] }),
  ];
};

const plate = (r: number) => paint(cyl(r, r * 0.88, 0.025, 20), '#fdf6ea', { at: [0, 0.0125, 0] });

export type BakeryProp =
  | 'tray'
  | 'loaf'
  | 'butterDish'
  | 'croissantPlate'
  | 'slicePlate'
  | BakeryItem
  | 'dough'
  | 'peel';

const BUILDERS: Record<BakeryProp, () => THREE.BufferGeometry[]> = {
  tray: () => [
    paint(rbox(0.74, 0.04, 0.46, 0.015), '#8b5a3c', { at: [0, 0.02, 0] }),
    ...baguetteParts([0, 0.04, -0.14], 0.06),
    ...baguetteParts([0.03, 0.04, 0.15], -0.08),
  ],
  loaf: () => loafParts([0, 0, 0]),
  butterDish: () => [plate(0.2), ...butterParts([-0.02, 0.025, 0])],
  croissantPlate: () => [plate(0.22), ...croissantParts([-0.05, 0.025, 0.04], 0.5), ...croissantParts([0.09, 0.025, -0.07], -0.8)],
  slicePlate: () => [plate(0.2), ...sliceParts([0, 0.025, 0])],
  bread: () => loafParts([0, 0, 0]),
  butter: () => butterParts([0, 0, 0]),
  croissant: () => croissantParts([0, 0, 0]),
  slice: () => sliceParts([0, 0, 0]),
  dough: () => [paint(ball(0.18, 18, 14), '#f4dfb6', { at: [0, 0.11, 0], scale: [1.15, 0.65, 1], shade: 0.25 })],
  peel: () => [
    paint(rbox(0.54, 0.025, 0.5, 0.01), '#d9a066', { at: [0, 0.0125, 0] }),
    paint(box(0.62, 0.035, 0.07), '#b97f4a', { at: [0.55, 0.018, 0] }),
  ],
};

/** One merged, vertex-painted mesh per food or tool, built once. */
export function Prop({ kind, ...props }: { kind: BakeryProp } & ThreeElements['group']) {
  const geometry = once(`bakery:${kind}`, () => merge(BUILDERS[kind]()));
  return (
    <group {...props}>
      <mesh geometry={geometry} material={toyMaterial()} castShadow />
    </group>
  );
}

/** Oak shelf with a row of loaves, baguettes and croissants. */
export function BreadShelf({ position, width }: { position: [number, number, number]; width: number }) {
  const geometry = once(`bakery:shelf:${width}`, () => {
    const parts = [
      paint(box(width, 0.06, 0.32), '#9c6b3f', { at: [0, -0.03, 0] }),
      ...[-1, 1].map((side) =>
        paint(box(0.06, 0.18, 0.24), '#7a4e32', { at: [side * (width / 2 - 0.12), -0.15, -0.03] }),
      ),
    ];
    const count = Math.floor(width / 0.46);
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + (width / count) * (i + 0.5);
      if (i % 3 === 0) parts.push(...loafParts([x, 0, 0]));
      else if (i % 3 === 1) parts.push(...baguetteParts([x, 0, -0.05], 0.15), ...baguetteParts([x, 0, 0.07], -0.1));
      else parts.push(...croissantParts([x, 0, 0.02], 0.4));
    }
    return merge(parts);
  });
  return <mesh position={position} geometry={geometry} material={toyMaterial()} castShadow />;
}

export function FlourSack({ position }: { position: [number, number, number] }) {
  const geometry = once('bakery:sack', () =>
    merge([
      paint(ball(0.26, 16, 12), '#e8dcc2', { at: [0, 0.29, 0], scale: [1, 1.15, 0.9], shade: 0.35 }),
      paint(cyl(0.12, 0.09, 0.14), '#e8dcc2', { at: [0, 0.6, 0] }),
      paint(ring(0.1, 0.018), '#8b5a3c', { at: [0, 0.57, 0], rot: [Math.PI / 2, 0, 0] }),
    ]),
  );
  return <mesh position={position} geometry={geometry} material={toyMaterial()} castShadow />;
}

/** Brass counter bell on a wooden base. */
export function BrassBell() {
  const dome = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.15, 0],
          [0.135, 0.035],
          [0.11, 0.1],
          [0.065, 0.145],
          [0.001, 0.16],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        24,
      ),
    [],
  );
  useEffect(() => () => dome.dispose(), [dome]);
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.19, 0.04, 20]} />
        <meshStandardMaterial color="#5a3827" roughness={0.75} />
      </mesh>
      <mesh geometry={dome} position={[0, 0.045, 0]} castShadow>
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

const BASKET_SLOTS: Record<BakeryItem, { at: [number, number, number]; yaw: number }> = {
  bread: { at: [-0.12, 0.09, -0.05], yaw: 0.3 },
  butter: { at: [0.15, 0.13, 0.07], yaw: -0.4 },
  croissant: { at: [0.12, 0.14, -0.09], yaw: 0.7 },
  slice: { at: [-0.07, 0.13, 0.12], yaw: 0 },
};

/** Wicker basket on the counter; hops when the order is complete. */
export function Basket({
  position,
  items,
  done,
}: {
  position: [number, number, number];
  items: readonly BakeryItem[];
  done: boolean;
}) {
  const geometry = once('bakery:basket', () =>
    merge([
      paint(cyl(0.26, 0.24, 0.03, 24), '#a8743f', { at: [0, 0.015, 0] }),
      paint(new THREE.CylinderGeometry(0.32, 0.25, 0.17, 24, 1, true), '#c89455', { at: [0, 0.095, 0], shade: 0.35 }),
      ...[0.07, 0.18].map((y, i) =>
        paint(ring(i ? 0.32 : 0.275, i ? 0.022 : 0.012, Math.PI * 2, 28), '#9a6534', { at: [0, y, 0], rot: [Math.PI / 2, 0, 0] }),
      ),
    ]),
  );
  const ref = useRef<THREE.Group>(null);
  const hopRef = useRef(0);
  useEffect(() => {
    hopRef.current = done ? 1.6 : 0;
  }, [done]);
  useMapFrame((_, delta) => {
    if (!ref.current) return;
    hopRef.current = Math.max(0, hopRef.current - Math.min(delta, 0.05));
    ref.current.position.y = Math.abs(Math.sin(hopRef.current * Math.PI * 2.5)) * 0.14 * hopRef.current;
  });

  return (
    <group position={position}>
      <group ref={ref}>
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial vertexColors roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {items.map((item) => (
          <Prop key={item} kind={item} position={BASKET_SLOTS[item].at} rotation={[0, BASKET_SLOTS[item].yaw, 0]} scale={0.85} />
        ))}
      </group>
    </group>
  );
}

/** Soft rising puffs; mounted only while something is hot. */
export function Steam({ position, size = 0.1, rise = 0.6 }: { position: [number, number, number]; size?: number; rise?: number }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    ref.current?.children.forEach((child, i) => {
      const puff = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
      const c = (clock.elapsedTime * 0.6 + i / 3) % 1;
      puff.position.set(Math.sin((c + i) * 5) * size * 0.5, c * rise, 0);
      puff.scale.setScalar(size * (0.5 + c));
      puff.material.opacity = 0.5 * (1 - c);
    });
  });
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} scale={0.001} raycast={noRaycast}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#fff8ee" transparent opacity={0} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Pulsing ring and bobbing arrow over the expected target. */
export function HintMarker({ at, hit }: { at: [number, number, number]; hit: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Mesh>(null);
  useMapFrame(({ clock }) => {
    const wave = Math.sin(clock.elapsedTime * 4.5);
    ringRef.current?.scale.setScalar(1 + wave * 0.1);
    if (arrowRef.current) arrowRef.current.position.y = hit[1] + 0.22 + wave * 0.06;
  });
  const radius = Math.min(hit[0], 0.8) * 0.48;
  return (
    <group position={at}>
      <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
        <ringGeometry args={[radius * 0.78, radius, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh ref={arrowRef} position={[0, hit[1] + 0.22, 0]} rotation={[Math.PI, 0, 0]} raycast={noRaycast}>
        <coneGeometry args={[0.12, 0.24, 14]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
}
