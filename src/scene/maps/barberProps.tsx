import { useEffect, useRef, type ReactNode } from 'react';
import { type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapFrame } from '../mapVisibility';
import { ball, box, cyl, lathe, merge, once, paint, pill, rbox, ring, tone, toyMaterial, type Vec3 } from '../toyKit';
import { createMedicineBottleGeometry } from '../worldGeometries';

const HALF = Math.PI / 2;
const CHROME = '#d5dbe3';
const BRASS = '#d4a017';
const LEATHER = '#8f1d1d';
const SKIN = '#eab890';
const BEARD = '#5b3216';

type Parts = THREE.BufferGeometry[];

const cap = (r: number, theta: number) => new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI * theta);

// ------------------------------------------------------------------ counter tools

const mat = (color: string) => paint(rbox(0.74, 0.012, 0.42, 0.005), color, { at: [0, 0.006, 0] });

const combParts = (): Parts => [
  mat('#f8f1e0'),
  paint(rbox(0.62, 0.045, 0.1, 0.018), '#0f766e', { at: [0, 0.035, -0.08] }),
  ...Array.from({ length: 15 }, (_, i) =>
    paint(box(0.021, 0.032, 0.18), '#0f766e', { at: [-0.29 + i * (0.58 / 14), 0.032, 0.05] }),
  ),
];

const scissorsParts = (): Parts => [
  mat('#1e3a5f'),
  ...[-1, 1].flatMap((side) => {
    const yaw = side * 0.34;
    const along = (d: number, y: number): Vec3 => [d * Math.cos(yaw), y, -d * Math.sin(yaw)];
    const y = side > 0 ? 0.042 : 0.03;
    return [
      // blade, tip towards +x
      paint(cyl(0.004, 0.042, 0.34, 8), '#f1f5f9', { scale: [0.35, 1, 1], rot: [0, yaw, -HALF], at: along(0.16, y) }),
      paint(box(0.14, 0.024, 0.036), '#cbd5e1', { rot: [0, yaw, 0], at: along(-0.07, y) }),
      paint(ring(0.07, 0.022), BRASS, { rot: [HALF, 0, 0], at: along(-0.2, y) }),
    ];
  }),
  paint(ball(0.024), BRASS, { at: [0, 0.06, 0] }),
];

const medicineBottle = (color: string): Parts => [
  paint(createMedicineBottleGeometry(), color),
  paint(cyl(0.1, 0.1, 0.08, 20), '#fdf6ea', { at: [0, 0.095, 0] }),
  paint(cyl(0.064, 0.064, 0.05), '#1f2937', { at: [0, 0.285, 0] }),
];

const bottle = (at: Vec3, color: string): Parts => [
  paint(lathe([[0, 0], [0.065, 0], [0.072, 0.02], [0.072, 0.17], [0.03, 0.21], [0.026, 0.24], [0, 0.24]]), color, { at }),
  paint(cyl(0.034, 0.034, 0.05), '#1f2937', { at: [at[0], at[1] + 0.26, at[2]] }),
  paint(cyl(0.074, 0.074, 0.07, 18), '#fdf6ea', { at: [at[0], at[1] + 0.095, at[2]] }),
];

const dryerParts = (): Parts => [
  paint(cyl(0.1, 0.1, 0.24, 16), '#db2777', { rot: [0, 0, HALF], at: [0, 0.1, 0] }),
  paint(ball(0.1, 14, 10), '#db2777', { scale: [0.6, 1, 1], at: [0.12, 0.1, 0] }),
  paint(cyl(0.055, 0.075, 0.12, 14), '#1f2937', { rot: [0, 0, HALF], at: [-0.17, 0.1, 0] }),
  paint(rbox(0.08, 0.06, 0.22, 0.025), '#9d174d', { rot: [0, 0.25, 0], at: [0.06, 0.05, 0.16] }),
];

const towelParts = (): Parts => [
  paint(cyl(0.2, 0.18, 0.03, 20), CHROME, { at: [0, 0.015, 0] }),
  ...[-0.06, 0.07].flatMap((z) => [
    paint(pill(0.062, 0.2), '#fdfaf2', { rot: [0, 0, HALF], at: [0, 0.09, z] }),
    paint(ring(0.062, 0.008), '#dc2626', { rot: [0, HALF, 0], at: [0.05, 0.09, z] }),
  ]),
];

// ------------------------------------------------------------------ mannequin heads

const HEAD_Y = 0.34;
/** Heads lean back so the face looks up at the high camera. */
const TILT = -0.3;

/** `onHead` parts are relative to the head centre and lean with it; `hanging` ones to the shelf, and fall straight. */
const mannequin = (onHead: Parts, hanging: Parts = []): Parts => [
  paint(cyl(0.12, 0.15, 0.05, 18), '#3b2418', { at: [0, 0.025, 0] }),
  paint(cyl(0.05, 0.065, 0.14, 14), '#e8c9a8', { at: [0, 0.11, 0] }),
  ...[
    paint(ball(0.17, 20, 16), '#e8c9a8'),
    ...[-1, 1].flatMap((s) => [
      paint(ball(0.025), '#1c1410', { at: [s * 0.058, 0.005, 0.162], shade: 0 }),
      paint(ball(0.034), '#d9ab86', { scale: [0.55, 1, 0.8], at: [s * 0.172, -0.035, 0] }),
    ]),
    paint(ball(0.02), '#d9ab86', { at: [0, -0.035, 0.17] }),
    paint(ring(0.032, 0.009, Math.PI * 0.8), '#9b2c2c', { rot: [0, 0, Math.PI * 1.1], at: [0, -0.064, 0.158], shade: 0 }),
    ...onHead,
  ].map((part) => part.rotateX(TILT).translate(0, HEAD_Y, 0)),
  ...hanging,
];

/** Scalp cap of radius `r`, tipped back by `back` so the forehead shows. */
const crown = (color: string, r: number, back: number) =>
  paint(cap(r, 0.5), color, { rot: [-back, 0, 0], shade: 0.25 });

/** Curls spread evenly (golden angle) over the head, leaving the face free. */
const curls = (color: string): Parts =>
  Array.from({ length: 60 }, (_, i) => {
    const y = 1 - (i / 59) * 1.5;
    const r = Math.sqrt(1 - y * y);
    const x = Math.cos(i * 2.4) * r;
    const z = Math.sin(i * 2.4) * r;
    return z > 0.35 && y < 0.62
      ? null
      : paint(ball(0.058, 10, 8), tone(color, i % 3 === 0 ? 0.18 : 0), { at: [x * 0.2, y * 0.19, z * 0.2], shade: 0.3 });
  }).filter((part) => part !== null);

/** Smooth rounded bob down to the chin, with a straight fringe and fine vertical strands. */
const bob = (color: string): Parts => {
  const shine = tone(color, 0.45);
  return [
    crown(color, 0.188, 0.55),
    paint(pill(0.13, 0.06, 18), color, { scale: [1.45, 1, 0.65], at: [0, -0.02, -0.095] }),
    paint(rbox(0.25, 0.075, 0.06, 0.028, 2), color, { at: [0, 0.1, 0.128] }),
    ...[-0.08, -0.04, 0, 0.04, 0.08].map((x) => paint(box(0.007, 0.055, 0.007), shine, { at: [x, 0.1, 0.158], shade: 0 })),
    ...[-1, 1].flatMap((s) => [
      paint(pill(0.07, 0.16, 16), color, { scale: [0.7, 1, 1.25], at: [s * 0.168, -0.03, -0.015] }),
      ...[0.15, 0.186].map((x) => paint(pill(0.0055, 0.18, 6), shine, { at: [s * x, -0.035, 0.068], shade: 0 })),
    ]),
  ];
};

/** Smooth lock along a curve, rounded at the tip. */
const strand = (points: readonly Vec3[], r: number, color: THREE.ColorRepresentation): Parts => {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return [
    paint(new THREE.TubeGeometry(curve, 24, r, 10), color, { shade: 0.2 }),
    paint(ball(r, 10, 8), color, { at: points[points.length - 1] }),
  ];
};

const LOCK: readonly Vec3[] = [
  [0.1, 0.48, -0.01],
  [0.188, 0.36, 0.03],
  [0.2, 0.18, 0.12],
  [0.17, 0, 0.19],
  [0.15, -0.16, 0.19],
];

/** Straight locks falling in front of the shoulders, past the foot of the stand and over the shelf edge. */
const longLocks = (color: string): Parts => [
  paint(pill(0.13, 0.36, 16), color, { scale: [1.55, 1, 0.45], at: [0, 0.18, -0.13] }),
  ...[-1, 1].flatMap((s) => {
    const path = (dx: number, dz: number): Vec3[] => LOCK.map(([x, y, z]) => [s * (x + dx), y, z + dz]);
    return [
      ...strand(path(0, 0), 0.052, color),
      ...strand(path(-0.018, 0.05).slice(1), 0.007, tone(color, 0.5)),
      ...strand(path(0.022, 0.047).slice(1), 0.007, tone(color, -0.25)),
    ];
  }),
];

/** Thick dark crop: the top and the sides above the ears, with a rim that closes its edge. */
const shortHair = (color: string): Parts => [
  crown(color, 0.196, 0.5),
  paint(ring(0.183, 0.017, Math.PI * 2, 36), color, { rot: [HALF - 0.5, 0, 0] }),
  paint(ball(0.1, 14, 10), '#4d2a14', { scale: [1.4, 0.5, 1], at: [0.015, 0.165, 0] }),
];

// ------------------------------------------------------------------ client

/** Seated client, origin on the floor under the chair; head centre at y 1.1. */
const clientParts = (): Parts => [
  paint(lathe([[0, 0.48], [0.34, 0.5], [0.3, 0.64], [0.23, 0.8], [0.09, 0.93], [0, 0.93]], 24), '#93c5fd', { shade: 0.3 }),
  ...[-1, 1].flatMap((s) => [
    paint(pill(0.07, 0.26), '#334155', { rot: [HALF, 0, 0], at: [s * 0.11, 0.5, 0.24] }),
    paint(pill(0.06, 0.24), '#334155', { at: [s * 0.11, 0.33, 0.4] }),
    paint(rbox(0.12, 0.08, 0.19, 0.03), '#3b2418', { at: [s * 0.11, 0.18, 0.44] }),
    paint(ball(0.035), tone(SKIN, -0.05), { scale: [0.6, 1, 0.8], at: [s * 0.178, 1.1, 0] }),
    paint(ball(0.022), '#1c1410', { at: [s * 0.06, 1.125, 0.167], shade: 0 }),
    paint(pill(0.008, 0.036, 6), '#3b2418', { rot: [0, 0, HALF - s * 0.12], at: [s * 0.06, 1.17, 0.163], shade: 0 }),
  ]),
  paint(ball(0.18, 20, 16), SKIN, { at: [0, 1.1, 0] }),
  paint(ball(0.026), tone(SKIN, -0.08), { at: [0, 1.09, 0.18] }),
  paint(ring(0.028, 0.008, Math.PI * 0.8), '#9b2c2c', { rot: [0, 0, Math.PI * 1.1], at: [0, 1.037, 0.168], shade: 0 }),
  paint(cap(0.19, 0.46), '#3b2418', { rot: [-0.55, 0, 0], at: [0, 1.115, -0.008] }),
];

const mustache = (r: number, length: number): Parts =>
  [-1, 1].map((s) => paint(pill(r, length, 8), BEARD, { rot: [0, 0, HALF + s * 0.25], at: [s * 0.035, 1.058, 0.178] }));

/** Tufts lying on the head surface along the jaw, from ear to ear. */
const jaw = (drop: number, size: number, color: THREE.ColorRepresentation): Parts =>
  [-1.25, -0.94, -0.63, -0.32, 0, 0.32, 0.63, 0.94, 1.25].map((a) => {
    const dy = (1 - Math.cos(a)) * 0.1 - drop;
    const r = Math.sqrt(0.18 ** 2 - dy ** 2);
    return paint(ball(size, 10, 8), color, { at: [Math.sin(a) * r, 1.1 + dy, Math.cos(a) * r] });
  });

const fullBeardParts = (): Parts => [
  ...jaw(0.14, 0.064, BEARD),
  paint(ball(0.13, 16, 12), BEARD, { scale: [1.15, 1.25, 0.7], at: [0, 0.9, 0.13] }),
  ...[-0.09, 0, 0.09].map((x) => paint(ball(0.06, 10, 8), tone(BEARD, 0.12), { at: [x, 0.8 + Math.abs(x) * 0.4, 0.15] })),
  ...mustache(0.026, 0.07),
];

// high enough on the chin to be seen from the camera above
const trimmedBeardParts = (): Parts => [...jaw(0.098, 0.034, tone(BEARD, 0.08)), ...mustache(0.014, 0.048)];

// ------------------------------------------------------------------

const BUILDERS = {
  comb: combParts,
  scissors: scissorsParts,
  curly: () => mannequin(curls('#c2410c')),
  straight: () => mannequin(bob('#7a2e5c')),
  long: () => mannequin([crown('#eab308', 0.188, 0.55)], longLocks('#eab308')),
  short: () => mannequin(shortHair('#3a1e0e')),
  client: clientParts,
  fullBeard: fullBeardParts,
  trimmedBeard: trimmedBeardParts,
  lotions: () => [...bottle([-0.1, 0, -0.02], '#16a34a'), ...bottle([0.09, 0, 0.03], '#7c3aed')],
  tonic: () => medicineBottle('#0284c7'),
  dryer: dryerParts,
  towel: towelParts,
};

/** One merged, vertex-painted mesh per tool, head or person part, built once. */
export function BarberProp({ kind, ...props }: { kind: keyof typeof BUILDERS } & ThreeElements['group']) {
  const geometry = once(`barber:${kind}`, () => merge(BUILDERS[kind]()));
  return (
    <group {...props}>
      <mesh geometry={geometry} material={toyMaterial()} castShadow />
    </group>
  );
}

const SPIN_SECONDS = 1.8;

/** One full turn around its own axis when `spin` becomes true, ending where it started. */
export function Swivel({ spin, position, children }: { spin: boolean; position: [number, number, number]; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const turnRef = useRef(1);
  useEffect(() => {
    if (spin) turnRef.current = 0;
  }, [spin]);
  useMapFrame((_, delta) => {
    if (!ref.current) return;
    turnRef.current = Math.min(1, turnRef.current + Math.min(delta, 0.05) / SPIN_SECONDS);
    ref.current.rotation.y = THREE.MathUtils.smoothstep(turnRef.current, 0, 1) * Math.PI * 2;
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

const chromeMaterial = () =>
  once('barber:chrome', () => new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.85, roughness: 0.24 }));

/** Leather and chrome swivel chair facing +z; seat top at y 0.5. */
export function BarberChair() {
  const chrome = once('barber:chair:chrome', () =>
    merge([
      paint(lathe([[0, 0], [0.4, 0], [0.39, 0.035], [0.2, 0.07], [0.1, 0.1], [0, 0.1]], 28), CHROME),
      paint(cyl(0.07, 0.09, 0.3, 16), CHROME, { at: [0, 0.23, 0] }),
      paint(ring(0.1, 0.022), CHROME, { rot: [HALF, 0, 0], at: [0, 0.36, 0] }),
      ...[-1, 1].flatMap((s) => [
        paint(cyl(0.025, 0.025, 0.24, 8), CHROME, { at: [s * 0.37, 0.53, 0.14] }),
        paint(cyl(0.025, 0.025, 0.24, 8), CHROME, { at: [s * 0.37, 0.53, -0.18] }),
        paint(cyl(0.02, 0.02, 0.34, 8), CHROME, { rot: [-0.9, 0, 0], at: [s * 0.15, 0.27, 0.36] }),
      ]),
      paint(rbox(0.44, 0.035, 0.16, 0.015), CHROME, { at: [0, 0.13, 0.48] }),
    ]),
  );
  const leather = once('barber:chair:leather', () =>
    merge([
      paint(rbox(0.68, 0.14, 0.56, 0.055, 2), LEATHER, { at: [0, 0.43, 0] }),
      paint(rbox(0.6, 0.64, 0.13, 0.055, 2), LEATHER, { at: [0, 0.76, -0.27] }),
      paint(rbox(0.28, 0.16, 0.11, 0.045, 2), tone(LEATHER, 0.1), { at: [0, 1.15, -0.29] }),
      ...[-1, 1].map((s) => paint(rbox(0.12, 0.08, 0.5, 0.035, 2), LEATHER, { at: [s * 0.37, 0.68, -0.02] })),
    ]),
  );
  return (
    <group>
      <mesh geometry={chrome} material={chromeMaterial()} castShadow receiveShadow />
      <mesh geometry={leather} material={toyMaterial('gloss')} castShadow receiveShadow />
    </group>
  );
}

/** Standing framed mirror ringed with bulbs; origin at the bottom of the frame, feet 0.3 below. */
export function BulbMirror() {
  const frame = once('barber:mirror:frame', () =>
    merge([
      paint(rbox(0.72, 1.08, 0.07, 0.025), '#4a2c1a', { at: [0, 0.55, 0] }),
      ...[-1, 1].flatMap((s) => [
        paint(box(0.07, 0.34, 0.07), '#3b2314', { at: [s * 0.27, -0.13, -0.02] }),
        paint(rbox(0.12, 0.05, 0.28, 0.02), '#3b2314', { at: [s * 0.27, -0.275, 0] }),
      ]),
    ]),
  );
  const bulbs = once('barber:mirror:bulbs', () =>
    merge([
      ...[-1, 1].flatMap((s) =>
        [0, 1, 2, 3, 4].map((i) => paint(ball(0.032), '#ffffff', { at: [s * 0.305, 0.13 + i * 0.21, 0.05], shade: 0 })),
      ),
      ...[-0.15, 0, 0.15].map((x) => paint(ball(0.032), '#ffffff', { at: [x, 1.04, 0.05], shade: 0 })),
    ]),
  );
  // brighter than the Bloom threshold so only the bulbs glow
  const glow = once('barber:mirror:glow', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, 1.2) }));
  const glass = once(
    'barber:mirror:glass',
    () => new THREE.MeshStandardMaterial({ color: '#cfe8f5', metalness: 0.9, roughness: 0.08 }),
  );
  const pane = once('barber:mirror:pane', () => new THREE.PlaneGeometry(0.5, 0.86));
  return (
    <group>
      <mesh geometry={frame} material={toyMaterial()} castShadow />
      <mesh geometry={pane} material={glass} position={[0, 0.54, 0.037]} />
      <mesh geometry={bulbs} material={glow} />
    </group>
  );
}

/** Classic red, cream and navy wallpaper stripes, centred on the origin. */
export function WallStripes({ width, height, position }: { width: number; height: number; position: [number, number, number] }) {
  const geometry = once(`barber:stripes:${width}:${height}`, () => {
    const colors = ['#b91c1c', '#f4ead5', '#1e3a8a', '#f4ead5'];
    const count = Math.round(width / 0.22);
    const w = width / count;
    return merge(
      Array.from({ length: count }, (_, i) =>
        paint(box(w, height, 0.02), colors[i % colors.length], { at: [-width / 2 + w * (i + 0.5), 0, 0], shade: 0.1 }),
      ),
    );
  });
  return <mesh position={position} geometry={geometry} material={toyMaterial()} receiveShadow />;
}

/** Black and white checkerboard, two tiles of the texture per repeat. */
export function checkerMaterial(repeatX: number, repeatY: number) {
  return once(`barber:checker:${repeatX}:${repeatY}`, () => {
    const light = [232, 226, 214, 255];
    const dark = [52, 48, 52, 255];
    const map = new THREE.DataTexture(new Uint8Array([...light, ...dark, ...dark, ...light]), 2, 2);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = 8;
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, roughness: 0.5 });
  });
}
