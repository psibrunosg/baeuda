import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { BOOKSHOP_BAYS, BOOKSHOP_LADDER, BOOKSHOP_SHELF_LEVELS, BOOKSHOP_TARGETS, fillerBooks } from '../bookshopLayout';
import { getCafeTextures } from '../cafeTextures';
import { useMapFrame } from '../mapVisibility';
import { ball, box, cyl, lathe, merge, once, paint, rbox, ring, tone, toyMaterial } from '../toyKit';

const noRaycast = () => null;
const HALF = Math.PI / 2;
const WOOD = '#b98352';
const DARK_WOOD = '#5c3a26';
const BRASS = '#d4a017';
const PAPER = '#fdf6ea';

/** Centre of the reading lamp's shade. */
export const LAMP_AT: [number, number, number] = [2.82, 1.45, -0.72];

const legs = (x: number, z: number, halfW: number, halfD: number, height: number) =>
  [-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) => paint(box(0.07, height, 0.07), DARK_WOOD, { at: [x + sx * halfW, height / 2, z + sz * halfD] })),
  );

/** Walnut carcass of the three bookcases; unpainted, it wears the dark wood texture. */
function bookcaseParts() {
  const plank = (w: number, h: number, d: number, x: number, y: number, z: number) => box(w, h, d).translate(x, y, z);
  return [
    plank(6.9, 2.2, 0.03, 0, 1.1, -2.185),
    ...[...BOOKSHOP_SHELF_LEVELS, 2.22].map((y) => plank(6.9, 0.05, 0.32, 0, y - 0.025, -2.04)),
    ...[...BOOKSHOP_BAYS.map((x) => x - 1.15), 3.45].map((x) => plank(0.1, 2.24, 0.34, x, 1.12, -2.03)),
    plank(6.9, 0.15, 0.34, 0, 0.075, -2.03),
  ];
}

/** Everything else that never moves: tables, display crate, brass ladder rail and the lamp stand. */
function furnitureParts() {
  const { pen, globe, storybook } = BOOKSHOP_TARGETS;
  const [px, py, pz] = pen.at;
  const [gx, gy, gz] = globe.at;
  const [sx, sy, sz] = storybook.at;
  const [lx, ly, lz] = LAMP_AT;
  return [
    // stationery table
    paint(rbox(2.5, 0.06, 0.72, 0.02), WOOD, { at: [px, py - 0.03, pz] }),
    paint(box(2.3, 0.26, 0.04), tone(WOOD, -0.2), { at: [px, 0.42, pz - 0.3] }),
    ...legs(px, pz, 1.16, 0.28, 0.56),
    // globe table and reading side table
    ...[
      [gx, gy, gz, 0.38],
      [sx, sy, sz, 0.44],
    ].flatMap(([x, y, z, r]) => [
      paint(cyl(r, r - 0.02, 0.05, 24), WOOD, { at: [x, y - 0.025, z] }),
      paint(cyl(0.05, 0.08, 0.53, 12), DARK_WOOD, { at: [x, 0.28, z] }),
      paint(cyl(0.24, 0.27, 0.05, 20), DARK_WOOD, { at: [x, 0.025, z] }),
    ]),
    // display crate by the door
    paint(rbox(0.8, 0.4, 0.6, 0.03), WOOD, { at: [2.15, 0.2, 1.5] }),
    ...[0.12, 0.28].map((y) => paint(box(0.82, 0.025, 0.62), DARK_WOOD, { at: [2.15, y, 1.5] })),
    // rail the ladder rolls on
    paint(cyl(0.018, 0.018, 2.9, 8), BRASS, { rot: [0, 0, HALF], at: [1.95, 1.9, BOOKSHOP_LADDER.topZ - 0.02] }),
    // reading lamp
    paint(cyl(0.15, 0.18, 0.04, 20), BRASS, { at: [lx, 0.02, lz] }),
    paint(cyl(0.018, 0.022, ly, 10), BRASS, { at: [lx, ly / 2, lz] }),
    paint(lathe([[0.25, -0.1], [0.2, 0.02], [0.11, 0.11], [0.015, 0.13]], 24), '#c2571f', { at: [lx, ly, lz] }),
  ];
}

/** Ladder leaning on the shelves, foot at the origin of x. */
function ladderParts() {
  const { halfWidth, height, footZ, topZ } = BOOKSHOP_LADDER;
  const lean = Math.atan2(footZ - topZ, height);
  const length = Math.hypot(footZ - topZ, height);
  const mid = (footZ + topZ) / 2;
  return [
    ...[-1, 1].map((s) =>
      paint(box(0.05, length, 0.05), WOOD, { rot: [-lean, 0, 0], at: [s * (halfWidth - 0.025), height / 2, mid] }),
    ),
    ...[1, 2, 3, 4, 5, 6].map((i) =>
      paint(box(2 * halfWidth - 0.05, 0.035, 0.09), DARK_WOOD, { at: [0, (i / 7) * height, footZ - (i / 7) * (footZ - topZ)] }),
    ),
    ...[-1, 1].map((s) => paint(ball(0.04, 10, 8), BRASS, { at: [s * (halfWidth - 0.025), height - 0.04, topZ] })),
  ];
}

/** The featured book: a fat red hardcover shown face out, base at the origin. */
const featuredBookParts = () => [
  paint(rbox(0.48, 0.62, 0.035, 0.012), '#dc2626', { at: [0, 0.31, 0.045] }),
  paint(rbox(0.48, 0.62, 0.035, 0.012), '#991b1b', { at: [0, 0.31, -0.045] }),
  paint(box(0.44, 0.57, 0.06), PAPER, { at: [0.012, 0.31, 0] }),
  paint(rbox(0.07, 0.62, 0.125, 0.015), '#991b1b', { at: [-0.225, 0.31, 0] }),
  ...[0.09, 0.53].map((y) => paint(box(0.36, 0.035, 0.012), '#fcd34d', { at: [0.03, y, 0.066], shade: 0 })),
  paint(cyl(0.11, 0.11, 0.012, 5), '#fcd34d', { rot: [HALF, 0, 0], at: [0.03, 0.31, 0.066], shade: 0 }),
];

const notebookParts = () => [
  paint(box(0.4, 0.03, 0.46), PAPER, { at: [0, 0.018, 0], shade: 0.1 }),
  paint(rbox(0.42, 0.018, 0.48, 0.006), '#0d9488', { at: [0, 0.042, 0] }),
  paint(box(0.24, 0.005, 0.13), PAPER, { at: [0.03, 0.054, -0.09], shade: 0 }),
  ...[-0.11, -0.07].map((z) => paint(box(0.18, 0.004, 0.012), '#64748b', { at: [0.03, 0.058, z], shade: 0 })),
  paint(box(0.04, 0.008, 0.485), '#f97316', { at: [0.15, 0.052, 0], shade: 0 }),
  // spiral binding: the silhouette that tells it apart from a book
  ...Array.from({ length: 7 }, (_, i) => paint(ring(0.04, 0.011, Math.PI * 2, 12), '#cbd5e1', { at: [-0.215, 0.036, -0.195 + i * 0.065] })),
];

const penParts = () => [
  paint(cyl(0.05, 0.05, 0.34, 16), '#2563eb', { rot: [HALF, 0, 0], at: [0, 0.058, 0.02] }),
  paint(cyl(0.058, 0.058, 0.15, 16), '#1e3a8a', { rot: [HALF, 0, 0], at: [0, 0.062, 0.19] }),
  paint(ball(0.058, 14, 10), '#1e3a8a', { at: [0, 0.062, 0.265], scale: [1, 1, 0.5] }),
  paint(rbox(0.028, 0.018, 0.2, 0.006), '#e2e8f0', { at: [0, 0.128, 0.16], shade: 0 }),
  paint(cyl(0.052, 0.052, 0.025, 16), '#e2e8f0', { rot: [HALF, 0, 0], at: [0, 0.058, -0.155] }),
  paint(new THREE.ConeGeometry(0.046, 0.1, 16), '#cbd5e1', { rot: [-HALF, 0, 0], at: [0, 0.058, -0.215] }),
  paint(ball(0.012, 8, 6), '#0f172a', { at: [0, 0.058, -0.266] }),
];

/** Open storybook: cover, two thick pages, a picture on the left and text on the right. */
const storybookParts = () => [
  paint(rbox(0.72, 0.025, 0.48, 0.008), '#15803d', { at: [0, 0.012, 0] }),
  ...[-1, 1].map((s) => paint(rbox(0.33, 0.035, 0.43, 0.01), PAPER, { rot: [0, 0, s * 0.05], at: [s * 0.172, 0.04, 0], shade: 0.08 })),
  paint(box(0.012, 0.012, 0.43), '#b45309', { at: [0, 0.055, 0] }),
  paint(cyl(0.06, 0.06, 0.006, 20), '#f59e0b', { at: [-0.1, 0.072, -0.09], shade: 0 }),
  paint(box(0.24, 0.006, 0.09), '#4ade80', { at: [-0.175, 0.072, 0.09], shade: 0 }),
  paint(cyl(0.07, 0.07, 0.006, 3), '#ef4444', { rot: [0, Math.PI, 0], at: [-0.21, 0.073, -0.02], shade: 0 }),
  ...[-0.14, -0.08, -0.02, 0.04, 0.1, 0.16].map((z) =>
    paint(box(0.24, 0.005, 0.016), '#475569', { at: [0.175, 0.072, z], shade: 0 }),
  ),
];

/** Loose page, origin on the spine, so rotating around z turns it to the left. */
const pageParts = () => [
  paint(box(0.31, 0.006, 0.41), '#fffdf7', { at: [0.158, 0, 0], shade: 0 }),
  ...[-0.12, -0.04, 0.04, 0.12].map((z) => paint(box(0.22, 0.003, 0.014), '#64748b', { at: [0.16, 0.005, z], shade: 0 })),
];

const magnifierParts = () => [
  paint(ring(0.11, 0.022, Math.PI * 2, 24), BRASS, { rot: [HALF, 0, 0], at: [0, 0.022, 0] }),
  paint(cyl(0.1, 0.1, 0.006, 24), '#bae6fd', { at: [0, 0.022, 0], shade: 0 }),
  paint(cyl(0.025, 0.03, 0.17, 10), DARK_WOOD, { rot: [0, 0, HALF], at: [0.205, 0.026, 0] }),
];

/** Spare stock on the crate: a stack of notebooks and a cup of pens and pencils. */
const stockParts = () => [
  ...['#7c3aed', '#f97316', '#2563eb'].map((color, i) =>
    paint(rbox(0.26, 0.045, 0.32, 0.01), color, { rot: [0, i * 0.18 - 0.15, 0], at: [-0.2, 0.025 + i * 0.048, -0.05] }),
  ),
  paint(cyl(0.09, 0.075, 0.17, 16), '#d97706', { at: [0.22, 0.085, -0.12] }),
  ...['#facc15', '#2563eb', '#ef4444', '#facc15'].map((color, i) =>
    paint(cyl(0.017, 0.017, 0.28, 6), color, {
      rot: [(i % 2 ? 1 : -1) * 0.16, 0, (i - 1.5) * 0.17],
      at: [0.22 + (i - 1.5) * 0.03, 0.22, -0.12],
    }),
  ),
];

/** Every merged, vertex-painted geometry of the bookshop, by name. */
export const BOOKSHOP_GEOMETRY = {
  furniture: furnitureParts,
  ladder: ladderParts,
  book: featuredBookParts,
  notebook: notebookParts,
  pen: penParts,
  storybook: storybookParts,
  page: pageParts,
  magnifier: magnifierParts,
  stock: stockParts,
};

/** One merged mesh, built once. Moving or decorative parts never take taps. */
export function BookshopProp({
  kind,
  gloss = false,
  ...props
}: { kind: keyof typeof BOOKSHOP_GEOMETRY; gloss?: boolean } & ThreeElements['mesh']) {
  const geometry = once(`bookshop:${kind}`, () => merge(BOOKSHOP_GEOMETRY[kind]()));
  return <mesh geometry={geometry} material={toyMaterial(gloss ? 'gloss' : 'matte')} castShadow receiveShadow raycast={noRaycast} {...props} />;
}

export function Bookcases() {
  const { darkWoodColor, darkWoodBump } = getCafeTextures();
  const geometry = once('bookshop:bookcases', () => merge(bookcaseParts()));
  return (
    <mesh geometry={geometry} castShadow receiveShadow raycast={noRaycast}>
      <meshStandardMaterial
        color={darkWoodColor ? '#ffffff' : DARK_WOOD}
        map={darkWoodColor}
        bumpMap={darkWoodBump}
        bumpScale={0.012}
        roughness={0.8}
      />
    </mesh>
  );
}

export function FillerBooks() {
  const books = once('bookshop:spines', fillerBooks);
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = once('bookshop:spine', () => box(1, 1, 1));
  const material = once('bookshop:spineMaterial', () => new THREE.MeshStandardMaterial({ roughness: 0.7 }));
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    books.forEach((b, i) => {
      dummy.position.set(b.x, b.y + b.height / 2, -2.08);
      dummy.scale.set(b.width, b.height, 0.2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(b.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [books]);
  return <instancedMesh ref={ref} args={[geometry, material, books.length]} receiveShadow raycast={noRaycast} />;
}

/** Rolls slowly along its rail. */
export function Ladder() {
  const ref = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    if (ref.current) ref.current.position.x = BOOKSHOP_LADDER.x + Math.sin(clock.elapsedTime * 0.35) * BOOKSHOP_LADDER.travel;
  });
  return (
    <group ref={ref} position={[BOOKSHOP_LADDER.x, 0, 0]}>
      <BookshopProp kind="ladder" />
    </group>
  );
}

/** Warm bulb under the lamp shade and the light it casts on the reading corner. */
export function LampLight() {
  const [x, y, z] = LAMP_AT;
  return (
    <>
      <mesh position={[x, y - 0.08, z]} raycast={noRaycast}>
        <sphereGeometry args={[0.09, 14, 10]} />
        <meshStandardMaterial color="#fff4d6" emissive="#ffb454" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[x - 0.25, y - 0.2, z + 0.15]} color="#ffb45e" intensity={2.4} distance={3.2} />
    </>
  );
}

/** A taken object only rises over its own spot: moved elsewhere, tapping it would name another one. */
export function Lift({ by, children }: { by: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame((_, delta) => {
    if (ref.current) ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, by, 5, Math.min(delta, 0.05));
  });
  return <group ref={ref}>{children}</group>;
}

/** Open book tilted toward the reader; its loose page turns once the chapter is read. */
export function Storybook({ turned }: { turned: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, turned ? Math.PI * 0.95 : 0.06, 3, Math.min(delta, 0.05));
  });
  return (
    <group position={[0, 0.08, 0]} rotation={[0.3, 0, 0]}>
      <BookshopProp kind="storybook" />
      <group ref={ref} position={[0, 0.075, 0]} rotation={[0, 0, 0.06]}>
        <BookshopProp kind="page" />
      </group>
    </group>
  );
}
