import { useRef, type ReactNode } from 'react';
import { type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapFrame } from '../mapVisibility';
import { PET_SHOP_TARGETS, PET_SHOP_WATER_BOWL } from '../petShopLayout';
import { ball, box, cyl, merge, once, paint, rbox, ring, tone, toyMaterial } from '../toyKit';
import { PET_TAIL_PIVOT, petGeometry } from '../toyProps';
import { getWorldGeometries } from '../worldGeometries';

const noRaycast = () => null;
const HALF = Math.PI / 2;
const WOOD = '#b98352';
const DARK_WOOD = '#6b4226';
const STEEL = '#cbd5e1';
const WHITE = '#f8fafc';
const SKY = '#7dd3fc';
const BOWL_SCALE = 1.35;

/** Pose of the puppy inside its hit box: almost side on, nose toward the learner. */
export const PUPPY = { scale: 1.35, yaw: -0.45, x: -0.06, hop: 0.1 };
/** How far the brush scrubs to each side (with its lift and tilt), and how high the ball bounces. */
export const BRUSH = { swing: 0.08, lift: 0.05, tilt: 0.18, yaw: 0.35 };
export const BALL_BOUNCE = 0.28;

/** A bag of pet food with a paw label, base at (x, y, z). */
const sack = (x: number, y: number, z: number, color: string, s = 1) => [
  paint(rbox(0.28 * s, 0.34 * s, 0.17 * s, 0.05 * s, 2), color, { at: [x, y + 0.17 * s, z] }),
  paint(rbox(0.22 * s, 0.05 * s, 0.1 * s, 0.015 * s), tone(color, -0.25), { at: [x, y + 0.355 * s, z] }),
  paint(cyl(0.065 * s, 0.065 * s, 0.01, 16), '#fdf6ea', { rot: [HALF, 0, 0], at: [x, y + 0.16 * s, z + 0.088 * s], shade: 0 }),
  paint(ball(0.025 * s, 8, 6), DARK_WOOD, { scale: [1, 1, 0.3], at: [x, y + 0.148 * s, z + 0.096 * s], shade: 0 }),
  ...[-1, 0, 1].map((i) =>
    paint(ball(0.011 * s, 6, 5), DARK_WOOD, { at: [x + i * 0.028 * s, y + (i ? 0.182 : 0.194) * s, z + 0.096 * s], shade: 0 }),
  ),
];

const legs = (x: number, z: number, halfW: number, halfD: number, height: number, color: string) =>
  [-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) => paint(box(0.06, height, 0.06), color, { at: [x + sx * halfW, height / 2, z + sz * halfD] })),
  );

/** Everything that never moves: grooming bench, stools, tables, shelves, sacks and toy basket. */
function furnitureParts() {
  const { tub, cat, collar, stethoscope, brush } = PET_SHOP_TARGETS;
  const [tx, ty, tz] = tub.at;
  return [
    // grooming bench with towels, and the tap behind the tub
    paint(rbox(1.5, 0.07, 0.68, 0.02), STEEL, { at: [tx, ty - 0.035, tz] }),
    paint(box(1.38, 0.05, 0.56), '#0e7490', { at: [tx, 0.2, tz] }),
    ...legs(tx, tz, 0.68, 0.28, 0.56, '#0e7490'),
    ...['#fda4af', '#fde68a', '#a7f3d0'].map((color, i) =>
      paint(rbox(0.3, 0.07, 0.3, 0.025), color, { at: [tx - 0.4 + i * 0.4, 0.26, tz + 0.08] }),
    ),
    paint(cyl(0.025, 0.025, 0.5, 10), STEEL, { at: [tx - 0.35, ty + 0.25, tz - 0.31] }),
    paint(box(0.05, 0.045, 0.2), STEEL, { at: [tx - 0.35, ty + 0.5, tz - 0.22] }),
    // cat stool, collar and stethoscope tables, brush stool
    ...[
      [...cat.at, 0.38],
      [...collar.at, 0.38],
      [...stethoscope.at, 0.38],
      [...brush.at, 0.34],
    ].flatMap(([x, y, z, r]) => [
      paint(cyl(r, r - 0.02, 0.05, 24), WOOD, { at: [x, y - 0.025, z] }),
      paint(cyl(0.05, 0.08, y - 0.07, 12), DARK_WOOD, { at: [x, (y - 0.07) / 2 + 0.02, z] }),
      paint(cyl(0.22, 0.25, 0.04, 20), DARK_WOOD, { at: [x, 0.02, z] }),
    ]),
    // wall shelves full of food sacks
    ...[1.5, 2.02].flatMap((y, row) => [
      ...[-1.55, 1.55].map((x) => paint(box(2.3, 0.05, 0.28), WOOD, { at: [x, y - 0.025, -2.06] })),
      ...[-2.5, -2.05, -1.6, -1.15, -0.7, 0.7, 1.15, 1.6, 2.05, 2.5].flatMap((x, i) =>
        sack(x, y, -2.08, ['#f97316', '#2563eb', '#16a34a', '#db2777'][(i + row) % 4], row ? 0.9 : 1.05),
      ),
    ]),
    // heavy sacks and the toy basket by the door
    ...sack(-2.35, 0, 1.45, '#f97316', 1.5),
    ...sack(-1.9, 0, 1.55, '#2563eb', 1.25),
    paint(cyl(0.38, 0.3, 0.3, 20), WOOD, { at: [2.15, 0.15, 1.5] }),
    paint(ring(0.38, 0.035, Math.PI * 2, 24), DARK_WOOD, { rot: [HALF, 0, 0], at: [2.15, 0.3, 1.5] }),
    ...(
      [
        [2.0, 1.45, '#a855f7'],
        [2.28, 1.4, '#22c55e'],
        [2.17, 1.65, '#facc15'],
      ] as const
    ).map(([x, z, color]) => paint(ball(0.14, 14, 10), color, { at: [x, 0.34, z] })),
  ];
}

/** White tub on short feet, open on top, with water inside. */
const tubParts = () => [
  paint(box(0.94, 0.05, 0.46), WHITE, { at: [0, 0.06, 0] }),
  ...[-1, 1].map((s) => paint(box(0.98, 0.24, 0.04), WHITE, { at: [0, 0.16, s * 0.23] })),
  ...[-1, 1].map((s) => paint(box(0.04, 0.24, 0.46), WHITE, { at: [s * 0.47, 0.16, 0] })),
  ...[-1, 1].map((s) => paint(box(1.02, 0.035, 0.065), SKY, { at: [0, 0.29, s * 0.23], shade: 0 })),
  ...[-1, 1].map((s) => paint(box(0.065, 0.035, 0.46), SKY, { at: [s * 0.47, 0.29, 0], shade: 0 })),
  paint(box(0.9, 0.012, 0.42), '#38bdf8', { at: [0, 0.2, 0], shade: 0 }),
  ...[-1, 1].flatMap((x) => [-1, 1].map((z) => paint(ball(0.035, 8, 6), STEEL, { at: [x * 0.4, 0.036, z * 0.18] }))),
];

const foamParts = () =>
  (
    [
      [-0.3, 0.05, 0.1], [-0.2, -0.08, 0.08], [-0.08, 0.06, 0.12], [0.05, -0.05, 0.09],
      [0.18, 0.07, 0.11], [0.3, -0.07, 0.08], [0.33, 0.08, 0.07], [-0.36, -0.1, 0.07],
    ] as const
  ).map(([x, z, r]) => paint(ball(r, 12, 9), WHITE, { at: [x, 0.23, z], shade: 0.08 }));

const kibbleParts = () =>
  Array.from({ length: 22 }, (_, i) => {
    const a = i * 2.4;
    const r = 0.036 * Math.sqrt(i);
    return paint(ball(0.04, 8, 6), i % 3 ? '#92400e' : '#b45309', {
      at: [Math.cos(a) * r, 0.17 - r * 0.2, Math.sin(a) * r],
    });
  });

/** Grooming brush: bristles down, wooden back and handle. */
const brushParts = () => [
  paint(rbox(0.26, 0.06, 0.18, 0.025), '#db2777', { at: [-0.07, 0.095, 0] }),
  paint(rbox(0.2, 0.045, 0.06, 0.02), '#be185d', { at: [0.13, 0.095, 0] }),
  ...[-0.16, -0.11, -0.06, -0.01, 0.03].flatMap((x) =>
    [-0.055, 0, 0.055].map((z) => paint(cyl(0.008, 0.012, 0.06, 5), '#1f2937', { at: [x, 0.035, z] })),
  ),
];

/** Red rubber ball with a white stripe, resting on y 0. */
const ballParts = () => [
  paint(ball(0.15, 20, 14), '#ef4444', { at: [0, 0.152, 0] }),
  paint(ring(0.148, 0.014, Math.PI * 2, 28), WHITE, { rot: [HALF - 0.5, 0, 0.35], at: [0, 0.152, 0], shade: 0 }),
];

/** Collar tilted toward the learner, with its buckle and brass tag. */
const collarParts = () => [
  paint(ring(0.17, 0.032, Math.PI * 2, 28), '#7c3aed', { rot: [-1.05, 0, 0], at: [0, 0.13, 0] }),
  paint(rbox(0.085, 0.07, 0.05, 0.012), STEEL, { rot: [-1.05, 0, 0], at: [0.17, 0.13, 0] }),
  paint(cyl(0.055, 0.055, 0.015, 18), '#eab308', { rot: [0.5, 0, 0], at: [0, 0.075, 0.17], shade: 0 }),
];

/** Stethoscope lying flat: looped tube, two earpieces and the round chest piece. */
const stethoscopeParts = () => {
  const tube = (points: ReadonlyArray<readonly [number, number, number]>, radius: number, color: string) =>
    paint(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 32, radius, 8),
      color,
    );
  return [
    tube([[-0.2, 0.03, -0.18], [-0.17, 0.03, 0.02], [-0.04, 0.03, 0.1], [0.09, 0.03, 0.02], [0.08, 0.03, -0.18]], 0.022, '#1e3a8a'),
    tube([[-0.04, 0.03, 0.1], [0.02, 0.03, 0.2], [0.16, 0.03, 0.18], [0.23, 0.03, 0.08]], 0.022, '#1e3a8a'),
    ...[-0.2, 0.08].map((x) => paint(ball(0.036, 10, 8), '#334155', { at: [x, 0.037, -0.19] })),
    paint(cyl(0.085, 0.085, 0.04, 20), STEEL, { at: [0.23, 0.025, 0.06] }),
    paint(cyl(0.05, 0.05, 0.015, 18), '#64748b', { at: [0.23, 0.05, 0.06], shade: 0 }),
  ];
};

/** Worn by the vet, in the vet's own coordinates (see torsoGeometry). */
const vetStethoscopeParts = () => {
  const loop = new THREE.CatmullRomCurve3(
    [[-0.09, 0.56, 0.08], [-0.085, 0.47, 0.162], [0, 0.39, 0.185], [0.085, 0.47, 0.162], [0.09, 0.56, 0.08]].map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    ),
  );
  return [
    paint(new THREE.TubeGeometry(loop, 28, 0.013, 7), '#1e293b'),
    paint(cyl(0.012, 0.012, 0.09, 7), '#1e293b', { at: [0, 0.35, 0.185] }),
    paint(cyl(0.042, 0.042, 0.025, 16), STEEL, { rot: [HALF, 0, 0], at: [0, 0.29, 0.186], shade: 0 }),
  ];
};

const cushionParts = () => [
  paint(cyl(0.31, 0.33, 0.06, 24), '#f472b6', { at: [0, 0.03, 0] }),
  paint(ring(0.3, 0.035, Math.PI * 2, 28), '#db2777', { rot: [HALF, 0, 0], at: [0, 0.055, 0] }),
];

const heartParts = () => [
  ...[-1, 1].map((s) => paint(ball(0.065, 12, 9), '#f43f5e', { at: [s * 0.048, 0.03, 0], scale: [1, 1, 0.55] })),
  paint(new THREE.ConeGeometry(0.108, 0.13, 4), '#f43f5e', { rot: [Math.PI, 0, 0], at: [0, -0.04, 0], scale: [1, 1, 0.45] }),
];

/** Every merged, vertex-painted geometry of the pet shop, by name. */
export const PET_SHOP_GEOMETRY = {
  furniture: furnitureParts,
  tub: tubParts,
  foam: foamParts,
  kibble: kibbleParts,
  brush: brushParts,
  ball: ballParts,
  collar: collarParts,
  stethoscope: stethoscopeParts,
  vetStethoscope: vetStethoscopeParts,
  cushion: cushionParts,
  heart: heartParts,
};

/** One merged mesh, built once. Moving or decorative parts never take taps. */
export function PetShopProp({
  kind,
  gloss = false,
  ...props
}: { kind: keyof typeof PET_SHOP_GEOMETRY; gloss?: boolean } & ThreeElements['mesh']) {
  const geometry = once(`petShop:${kind}`, () => merge(PET_SHOP_GEOMETRY[kind]()));
  return <mesh geometry={geometry} material={toyMaterial(gloss ? 'gloss' : 'matte')} castShadow receiveShadow raycast={noRaycast} {...props} />;
}

/** Ceramic bowl from the shared prep bowl. */
export function Bowl({ color, ...props }: { color: string } & ThreeElements['mesh']) {
  return (
    <mesh geometry={getWorldGeometries().prepBowl} scale={BOWL_SCALE} castShadow receiveShadow raycast={noRaycast} {...props}>
      <meshStandardMaterial color={color} roughness={0.35} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function WaterBowl() {
  return (
    <group position={PET_SHOP_WATER_BOWL}>
      <Bowl color="#2563eb" />
      <mesh position={[0, 0.135, 0]} rotation={[-HALF, 0, 0]} raycast={noRaycast}>
        <circleGeometry args={[0.235, 24]} />
        <meshStandardMaterial color="#7dd3fc" roughness={0.15} />
      </mesh>
    </group>
  );
}

/** Grows its children out of their own spot once `show` is true. */
export function Pop({ show, children }: { show: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    group.scale.setScalar(show ? THREE.MathUtils.damp(group.scale.x, 1, 6, Math.min(delta, 0.05)) : 0.001);
    group.visible = show;
  });
  return (
    <group ref={ref} scale={0.001} visible={false}>
      {children}
    </group>
  );
}

/** Soap bubbles rising from the tub, looping inside its hit box. */
export function Bubbles() {
  const ref = useRef<THREE.Group>(null);
  const geometry = once('petShop:bubble', () => ball(1, 12, 9));
  const material = once(
    'petShop:bubbleMaterial',
    () => new THREE.MeshStandardMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.7, roughness: 0.1, depthWrite: false }),
  );
  useMapFrame(({ clock }) => {
    ref.current?.children.forEach((bubble, i) => {
      bubble.position.y = 0.27 + ((clock.elapsedTime * 0.3 + i / 6) % 1) * 0.22;
    });
  });
  return (
    <group ref={ref}>
      {[-0.32, 0.12, -0.1, 0.34, -0.22, 0.22].map((x, i) => (
        <mesh key={x} geometry={geometry} material={material} position={[x, 0.3, (i % 3) * 0.08 - 0.08]} scale={0.03 + (i % 3) * 0.012} raycast={noRaycast} />
      ))}
    </group>
  );
}

/** The tail wags once the puppy is found; the puppy hops when the visit is done. */
export function Puppy({ found, jumping }: { found: boolean; jumping: boolean }) {
  const root = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const pet = petGeometry('dog');
  useMapFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (tail.current) tail.current.rotation.x = found ? Math.sin(t * 11) * 0.6 : Math.sin(t * 2) * 0.12;
    if (root.current) root.current.position.y = jumping ? Math.abs(Math.sin(t * 6)) * PUPPY.hop : 0;
  });
  return (
    <group ref={root}>
      <group position={[PUPPY.x, 0, 0]} rotation={[0, PUPPY.yaw, 0]} scale={PUPPY.scale}>
        <mesh geometry={pet.body} material={toyMaterial()} castShadow />
        <mesh ref={tail} geometry={pet.tail} material={toyMaterial()} position={[...PET_TAIL_PIVOT]} castShadow />
      </group>
    </group>
  );
}

/** Scrubs from side to side over its own stool. */
export function Brush({ moving }: { moving: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    if (!ref.current) return;
    const wave = moving ? Math.sin(clock.elapsedTime * 6) : 0;
    ref.current.position.set(wave * BRUSH.swing, moving ? BRUSH.lift : 0, 0);
    ref.current.rotation.z = wave * BRUSH.tilt;
  });
  return (
    <group ref={ref}>
      <PetShopProp kind="brush" rotation={[0, BRUSH.yaw, 0]} gloss />
    </group>
  );
}

/** Bounces straight up and down once the learner plays. */
export function Ball({ bouncing }: { bouncing: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = bouncing ? Math.abs(Math.sin(clock.elapsedTime * 4.5)) * BALL_BOUNCE : 0;
  });
  return (
    <group ref={ref}>
      <PetShopProp kind="ball" gloss />
    </group>
  );
}

/** Hearts floating over a happy pet. */
export function Hearts({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    ref.current?.children.forEach((heart, i) => {
      heart.position.y = Math.sin(clock.elapsedTime * 2.6 + i * 2) * 0.07 + (i % 2) * 0.14;
      heart.rotation.y = Math.sin(clock.elapsedTime * 1.8 + i) * 0.5;
    });
  });
  return (
    <group ref={ref} position={position}>
      {[-0.26, 0, 0.26].map((x, i) => (
        <PetShopProp key={x} kind="heart" position={[x, 0, 0]} scale={i === 1 ? 1 : 0.75} castShadow={false} gloss />
      ))}
    </group>
  );
}
