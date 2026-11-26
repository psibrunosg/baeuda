import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { getCafeTextures } from '../cafeTextures';
import { useMapFrame } from '../mapVisibility';
import { SCHOOL_SPARE_DESKS, SCHOOL_TARGETS } from '../schoolLayout';
import { ball, box, cyl, merge, once, paint, pill, rbox, ring, tone, toyMaterial, type Vec3 } from '../toyKit';
import { chairGeometry } from '../toyProps';

const noRaycast = () => null;
const HALF = Math.PI / 2;
const WOOD = '#b98352';
const DARK_WOOD = '#6b4226';
const BRASS = '#d4a017';
const WINDOW_XS = [-2.75, 2.75] as const;

const legs = (x: number, z: number, halfW: number, halfD: number, height: number) =>
  [-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) => paint(box(0.07, height, 0.07), DARK_WOOD, { at: [x + sx * halfW, height / 2, z + sz * halfD] })),
  );

/** Everything that never moves: desks, stands, board frame and window frames. */
function furnitureParts() {
  const { notebook, pencil, globe, science, board } = SCHOOL_TARGETS;
  const [gx, gy, gz] = globe.at;
  const [sx, sy, sz] = science.at;
  const [bx, by] = board.at;
  return [
    // student desk
    paint(rbox(2.5, 0.06, 0.72, 0.02), WOOD, { at: [pencil.at[0], notebook.at[1] - 0.03, notebook.at[2]] }),
    paint(box(2.3, 0.26, 0.04), tone(WOOD, -0.2), { at: [pencil.at[0], 0.42, notebook.at[2] - 0.3] }),
    ...legs(pencil.at[0], notebook.at[2], 1.16, 0.28, 0.56),
    // globe table
    paint(cyl(0.38, 0.36, 0.05, 24), WOOD, { at: [gx, gy - 0.025, gz] }),
    paint(cyl(0.05, 0.08, 0.53, 12), DARK_WOOD, { at: [gx, 0.28, gz] }),
    paint(cyl(0.24, 0.27, 0.05, 20), DARK_WOOD, { at: [gx, 0.025, gz] }),
    // science bench
    paint(rbox(1.02, 0.07, 0.66, 0.02), '#e5e7eb', { at: [sx, sy - 0.035, sz] }),
    paint(box(0.94, 0.05, 0.56), '#2a6f62', { at: [sx, 0.2, sz] }),
    ...legs(sx, sz, 0.44, 0.26, 0.54),
    // blackboard frame, chalk ledge and chalks
    ...[by - 0.025, by + 1.025].map((y) => paint(rbox(2.76, 0.08, 0.08, 0.02), WOOD, { at: [bx, y, -2.17] })),
    ...[-1.34, 1.34].map((dx) => paint(rbox(0.08, 1.1, 0.08, 0.02), WOOD, { at: [bx + dx, by + 0.5, -2.17] })),
    paint(rbox(2.5, 0.035, 0.12, 0.012), DARK_WOOD, { at: [bx, by - 0.06, -2.12] }),
    ...['#fdf6ea', '#fde68a', '#f9a8d4'].map((color, i) =>
      paint(cyl(0.016, 0.016, 0.12, 8), color, { rot: [0, 0, HALF], at: [bx - 0.7 + i * 0.18, by - 0.028, -2.1] }),
    ),
    // tall window frames
    ...WINDOW_XS.flatMap((x) => [
      ...[-0.4, 0, 0.4].map((dx) => paint(rbox(0.06, 1.46, 0.07, 0.015), '#fdf6ea', { at: [x + dx, 1.45, -2.17] })),
      ...[0.75, 1.45, 2.15].map((y) => paint(rbox(0.88, 0.07, 0.08, 0.015), '#fdf6ea', { at: [x, y, -2.165] })),
      paint(rbox(0.98, 0.06, 0.18, 0.02), WOOD, { at: [x, 0.7, -2.13] }),
    ]),
  ];
}

/** One desk with its chair (backrest toward the camera), instanced for the rest of the class. */
function spareDeskParts() {
  const chair = chairGeometry('#8a5a3b', '#2a6f62').clone();
  chair.scale(0.85, 0.85, 0.85).rotateY(Math.PI).translate(0, 0, 0.24);
  return [
    paint(rbox(0.8, 0.055, 0.46, 0.018), WOOD, { at: [0, 0.54, -0.14] }),
    ...legs(0, -0.14, 0.34, 0.17, 0.52),
    chair,
  ];
}

const bookStackParts = () =>
  ['#b91c1c', '#1d4ed8', '#d97706', '#15803d'].flatMap((color, i) => {
    const y = 0.03 + i * 0.058;
    const yaw = [0.1, -0.16, 0.22, -0.05][i];
    return [
      paint(rbox(0.3, 0.054, 0.22, 0.01), color, { rot: [0, yaw, 0], at: [0, y, 0] }),
      paint(box(0.28, 0.032, 0.226), '#fdf6ea', { rot: [0, yaw, 0], at: [0.014, y, 0] }),
    ];
  });

const GLOBE_RADIUS = 0.26;

/** Ocean ball with flattened blobs laid on the surface as continents: [lat, lon, width, height]. */
function globeParts() {
  const lands: ReadonlyArray<readonly [number, number, number, number, string]> = [
    [0.8, -1.7, 0.12, 0.08, '#4d9a52'],
    [-0.25, -1.1, 0.07, 0.12, '#5cab5a'],
    [0.1, 0.25, 0.09, 0.12, '#c9a24a'],
    [0.85, 0.4, 0.1, 0.06, '#4d9a52'],
    [0.7, 1.55, 0.16, 0.1, '#6aa35c'],
    [-0.5, 2.35, 0.09, 0.065, '#c9a24a'],
    [-1.4, 0, 0.12, 0.12, '#f1f5f9'],
  ];
  return [
    paint(ball(GLOBE_RADIUS, 28, 20), '#2f86c9', { shade: 0.2 }),
    ...lands.map(([lat, lon, w, h, color]) =>
      paint(ball(1, 14, 10).scale(w, h, 0.03).translate(0, 0, GLOBE_RADIUS - 0.018).rotateX(-lat).rotateY(lon), color, { shade: 0 }),
    ),
  ];
}

const globeStandParts = () => [
  paint(cyl(0.15, 0.18, 0.04, 20), BRASS, { at: [0, 0.02, 0] }),
  paint(cyl(0.022, 0.03, 0.07, 10), BRASS, { at: [0, 0.065, 0] }),
  // meridian arc behind the ball, leaning with the axis
  paint(ring(GLOBE_RADIUS + 0.035, 0.012, Math.PI, 28).rotateZ(-HALF - 0.4), BRASS, { at: [0, 0.39, 0] }),
];

const microscopeParts = () => [
  paint(rbox(0.28, 0.05, 0.3, 0.02), '#1f2937', { at: [0, 0.025, 0] }),
  paint(rbox(0.07, 0.38, 0.07, 0.025), '#e5e7eb', { at: [0, 0.22, -0.1], rot: [-0.08, 0, 0] }),
  paint(rbox(0.19, 0.03, 0.17, 0.01), '#374151', { at: [0, 0.17, 0.03] }),
  paint(cyl(0.045, 0.045, 0.2, 12), '#e5e7eb', { at: [0, 0.34, 0.01], rot: [0.5, 0, 0] }),
  paint(cyl(0.032, 0.04, 0.08, 12), '#1f2937', { at: [0, 0.465, 0.08], rot: [0.5, 0, 0] }),
  paint(cyl(0.022, 0.016, 0.08, 10), BRASS, { at: [0, 0.23, 0.045] }),
  ...[-0.06, 0.06].map((x) => paint(cyl(0.035, 0.035, 0.03, 12), BRASS, { rot: [0, 0, HALF], at: [x, 0.26, -0.1] })),
];

const tubeRackParts = () => [
  paint(rbox(0.36, 0.035, 0.14, 0.012), WOOD, { at: [0, 0.018, 0] }),
  paint(rbox(0.36, 0.025, 0.035, 0.008), WOOD, { at: [0, 0.17, -0.05] }),
  ...[-0.17, 0.17].map((x) => paint(box(0.022, 0.17, 0.022), DARK_WOOD, { at: [x, 0.09, -0.05] })),
];

const clockParts = () => [
  paint(cyl(0.26, 0.26, 0.05, 28), '#fffbeb', { rot: [HALF, 0, 0], shade: 0 }),
  paint(ring(0.265, 0.028, Math.PI * 2, 32), '#9a3412', { at: [0, 0, 0.02] }),
  ...Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return paint(box(0.014, i % 3 ? 0.03 : 0.055, 0.01), '#1e293b', {
      rot: [0, 0, -a],
      at: [Math.sin(a) * 0.205, Math.cos(a) * 0.205, 0.03],
      shade: 0,
    });
  }),
];

const backpackParts = () => [
  paint(rbox(0.5, 0.54, 0.32, 0.12, 3), '#e0474c', { at: [0, 0.27, -0.04], shade: 0.3 }),
  paint(rbox(0.36, 0.24, 0.1, 0.045, 2), '#f2c14e', { at: [0, 0.18, 0.14] }),
  paint(box(0.3, 0.018, 0.012), '#1f2937', { at: [0, 0.28, 0.195] }),
  paint(ring(0.1, 0.022, Math.PI, 16), '#9f2d33', { at: [0, 0.53, -0.04] }),
  ...[-0.17, 0.17].map((x) => paint(rbox(0.07, 0.4, 0.05, 0.02), '#9f2d33', { at: [x, 0.28, -0.21] })),
  // pencil case lying in front of the bag
  paint(pill(0.055, 0.24), '#2563eb', { rot: [0, 0.35, HALF], at: [-0.1, 0.06, 0.25] }),
  paint(box(0.24, 0.012, 0.02), '#fde68a', { rot: [0, 0.35, 0], at: [-0.1, 0.115, 0.25] }),
];

const notebookParts = () => [
  paint(rbox(0.32, 0.03, 0.42, 0.008), '#fdf6ea', { at: [0.15, 0.015, 0], shade: 0.1 }),
  ...[-0.12, -0.06, 0, 0.06, 0.12].map((z) => paint(box(0.24, 0.004, 0.008), '#93c5fd', { at: [0.16, 0.032, z], shade: 0 })),
  paint(cyl(0.018, 0.018, 0.4, 8), '#475569', { rot: [HALF, 0, 0], at: [-0.012, 0.025, 0] }),
];

/** Origin on the spine, so rotating around z opens it to the left. */
const coverParts = () => [
  paint(rbox(0.33, 0.016, 0.43, 0.006), '#7c3aed', { at: [0.165, 0.008, 0] }),
  paint(box(0.18, 0.004, 0.1), '#fde68a', { at: [0.17, 0.018, -0.08], shade: 0 }),
];

const pencilParts = () => [
  paint(cyl(0.03, 0.03, 0.34, 6), '#facc15', { rot: [HALF, 0, 0], at: [0, 0.03, 0] }),
  paint(new THREE.ConeGeometry(0.03, 0.08, 6), '#e8c39e', { rot: [-HALF, 0, 0], at: [0, 0.03, -0.21] }),
  paint(new THREE.ConeGeometry(0.011, 0.03, 6), '#1f2937', { rot: [-HALF, 0, 0], at: [0, 0.03, -0.245] }),
  paint(cyl(0.032, 0.032, 0.03, 8), '#cbd5e1', { rot: [HALF, 0, 0], at: [0, 0.03, 0.185] }),
  paint(cyl(0.029, 0.029, 0.045, 8), '#fb7185', { rot: [HALF, 0, 0], at: [0, 0.03, 0.222] }),
];

const homeworkParts = () => [
  paint(box(0.34, 0.008, 0.42), '#ffffff', { at: [0, 0.006, 0], shade: 0 }),
  paint(box(0.2, 0.004, 0.035), '#ef4444', { at: [-0.04, 0.012, -0.15], shade: 0 }),
  ...[-0.07, 0, 0.07, 0.14].map((z) => paint(box(0.25, 0.004, 0.014), '#64748b', { at: [0, 0.012, z], shade: 0 })),
  paint(cyl(0.035, 0.035, 0.004, 5), '#f59e0b', { at: [0.115, 0.012, -0.15], shade: 0 }),
];

const EASEL_TILT = -0.16;

const easelParts = () => [
  ...[-1, 1].map((s) => paint(box(0.05, 1.18, 0.05), WOOD, { at: [s * 0.29, 0.58, 0], rot: [EASEL_TILT, 0, s * 0.07] })),
  paint(box(0.05, 1.16, 0.05), DARK_WOOD, { at: [0, 0.55, -0.2], rot: [0.2, 0, 0] }),
  paint(rbox(0.66, 0.54, 0.035, 0.012), '#fffdf7', { at: [0, 0.8, 0], rot: [EASEL_TILT, 0, 0], shade: 0.05 }),
  paint(rbox(0.72, 0.045, 0.14, 0.012), WOOD, { at: [0, 0.49, 0.1] }),
  ...['#ef4444', '#3b82f6', '#facc15', '#22c55e'].flatMap((color, i) => [
    paint(cyl(0.045, 0.038, 0.08, 10), tone(color, 0.35), { at: [-0.24 + i * 0.14, 0.552, 0.12] }),
    paint(cyl(0.04, 0.04, 0.008, 10), color, { at: [-0.24 + i * 0.14, 0.595, 0.12], shade: 0 }),
  ]),
  paint(cyl(0.01, 0.01, 0.26, 6), DARK_WOOD, { rot: [0, 0, HALF - 0.25], at: [0.24, 0.63, 0.15] }),
];

/** Sun, hill and flower, origin at the centre of the canvas. */
const paintingParts = () => {
  const dab = (r: number, color: string, x: number, y: number, sy = 1) =>
    paint(ball(r, 12, 8), color, { scale: [1, sy, 0.06], at: [x, y, 0], shade: 0 });
  return [
    dab(0.09, '#facc15', 0.17, 0.13),
    dab(0.3, '#4ade80', 0, -0.18, 0.28),
    paint(box(0.018, 0.17, 0.006), '#15803d', { at: [-0.13, -0.07, 0.012], shade: 0 }),
    ...[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2;
      return dab(0.045, '#f472b6', -0.13 + Math.sin(a) * 0.05, 0.04 + Math.cos(a) * 0.05);
    }),
    paint(ball(0.032, 10, 8), '#f59e0b', { at: [-0.13, 0.04, 0.014], shade: 0 }),
  ];
};

const teacherBookParts = () => [
  paint(rbox(0.19, 0.05, 0.14, 0.008), '#1d4ed8'),
  paint(box(0.17, 0.034, 0.145), '#fdf6ea', { at: [0.012, 0, 0] }),
];

/** Every merged geometry of the school, by name. */
export const SCHOOL_GEOMETRY = {
  furniture: furnitureParts,
  spareDesk: spareDeskParts,
  bookStack: bookStackParts,
  globe: globeParts,
  globeStand: globeStandParts,
  microscope: microscopeParts,
  tubeRack: tubeRackParts,
  clock: clockParts,
  backpack: backpackParts,
  notebook: notebookParts,
  cover: coverParts,
  pencil: pencilParts,
  homework: homeworkParts,
  easel: easelParts,
  painting: paintingParts,
  teacherBook: teacherBookParts,
};

/** One merged, vertex-painted mesh, built once. Moving or decorative parts never take taps. */
export function SchoolProp({
  kind,
  gloss = false,
  ...props
}: { kind: keyof typeof SCHOOL_GEOMETRY; gloss?: boolean } & ThreeElements['mesh']) {
  const geometry = once(`school:${kind}`, () => merge(SCHOOL_GEOMETRY[kind]()));
  return <mesh geometry={geometry} material={toyMaterial(gloss ? 'gloss' : 'matte')} castShadow receiveShadow raycast={noRaycast} {...props} />;
}

/** Eases its children toward a position and size. */
function Glide({ to, size = 1, children }: { to: Vec3; size?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const goal = useMemo(() => new THREE.Vector3(), []);
  useMapFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    const dt = Math.min(delta, 0.05);
    group.position.lerp(goal.set(...to), 1 - Math.exp(-5 * dt));
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, size, 5, dt));
  });
  return <group ref={ref}>{children}</group>;
}

export function SpareDesks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = once('school:spareDesk', () => merge(spareDeskParts()));
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    SCHOOL_SPARE_DESKS.forEach(([x, z], i) => mesh.setMatrixAt(i, matrix.makeTranslation(x, 0, z)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return <instancedMesh ref={ref} args={[geometry, toyMaterial(), SCHOOL_SPARE_DESKS.length]} castShadow receiveShadow />;
}

/** Turns slowly, and much faster once the learner has said "globe". */
export function Globe({ fast }: { fast: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const speedRef = useRef(0.25);
  useMapFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    speedRef.current = THREE.MathUtils.damp(speedRef.current, fast ? 2.6 : 0.25, 2, dt);
    if (ref.current) ref.current.rotation.y += speedRef.current * dt;
  });
  return (
    <group>
      <SchoolProp kind="globeStand" gloss />
      <group position={[0, 0.39, 0]} rotation={[0, 0, -0.4]}>
        <group ref={ref}>
          <SchoolProp kind="globe" gloss />
        </group>
      </group>
    </group>
  );
}

export function Microscope({ lightOn }: { lightOn: boolean }) {
  return (
    <group>
      <SchoolProp kind="microscope" gloss />
      <mesh position={[0, 0.07, 0.04]} raycast={noRaycast}>
        <cylinderGeometry args={[0.05, 0.06, 0.035, 16]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={lightOn ? 2.6 : 0} />
      </mesh>
      {lightOn && (
        <mesh position={[0, 0.188, 0.04]} rotation={[-HALF, 0, 0]} raycast={noRaycast}>
          <circleGeometry args={[0.075, 20]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export function TestTubes() {
  return (
    <group>
      <SchoolProp kind="tubeRack" />
      {['#22c55e', '#ec4899', '#38bdf8'].map((color, i) => (
        <group key={color} position={[(i - 1) * 0.11, 0.035, 0]}>
          <mesh position={[0, 0.05 + i * 0.008, 0]} raycast={noRaycast}>
            <cylinderGeometry args={[0.028, 0.028, 0.1 + i * 0.016, 12]} />
            <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.12} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0.12, 0]} raycast={noRaycast}>
            <cylinderGeometry args={[0.036, 0.036, 0.24, 12, 1, true]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.28} roughness={0.05} clearcoat={1} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function WallClock({ position }: { position: [number, number, number] }) {
  const minuteRef = useRef<THREE.Group>(null);
  const secondRef = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    if (minuteRef.current) minuteRef.current.rotation.z = -clock.elapsedTime * (Math.PI / 1800);
    if (secondRef.current) secondRef.current.rotation.z = -Math.floor(clock.elapsedTime) * (Math.PI / 30);
  });
  const hand = (width: number, length: number, color: string, z: number) => (
    <mesh position={[0, length / 2 - 0.015, z]} raycast={noRaycast}>
      <boxGeometry args={[width, length, 0.008]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
  return (
    <group position={position}>
      <SchoolProp kind="clock" />
      {/* eight o'clock: school starts */}
      <group rotation={[0, 0, (Math.PI * 2) / 3]}>{hand(0.028, 0.13, '#1e293b', 0.036)}</group>
      <group ref={minuteRef}>{hand(0.018, 0.18, '#1e293b', 0.044)}</group>
      <group ref={secondRef}>{hand(0.008, 0.19, '#dc2626', 0.052)}</group>
    </group>
  );
}

/** Hops and shows a sheet sticking out once the homework is inside. */
export function Backpack({ filled }: { filled: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const hopRef = useRef(0);
  useEffect(() => {
    hopRef.current = filled ? 1.6 : 0;
  }, [filled]);
  useMapFrame((_, delta) => {
    if (!ref.current) return;
    hopRef.current = Math.max(0, hopRef.current - Math.min(delta, 0.05));
    ref.current.position.y = Math.abs(Math.sin(hopRef.current * Math.PI * 2.5)) * 0.12 * hopRef.current;
  });
  return (
    <group ref={ref}>
      <SchoolProp kind="backpack" />
      {filled && <SchoolProp kind="homework" position={[0.03, 0.6, -0.02]} rotation={[HALF - 0.2, 0, 0.12]} scale={0.7} />}
    </group>
  );
}

export function Notebook({ open }: { open: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useMapFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, open ? Math.PI * 0.99 : 0, 6, Math.min(delta, 0.05));
  });
  return (
    <group>
      <SchoolProp kind="notebook" />
      <group ref={ref} position={[-0.012, 0.036, 0]}>
        <SchoolProp kind="cover" />
      </group>
    </group>
  );
}

/** Pencil: `to` is where it rests, relative to its spot on the desk. */
export function Pencil({ to }: { to: Vec3 }) {
  return (
    <Glide to={to}>
      <SchoolProp kind="pencil" rotation={[0, -0.25, 0]} />
    </Glide>
  );
}

/** Homework sheet: rises when taken and, shrinking to nothing, flies into the bag. */
export function HomeworkSheet({ to, size }: { to: Vec3; size: number }) {
  return (
    <Glide to={to} size={size}>
      <SchoolProp kind="homework" />
    </Glide>
  );
}

export function Easel({ painted }: { painted: boolean }) {
  return (
    <group>
      <SchoolProp kind="easel" />
      <group position={[0, 0.8, 0.028]} rotation={[EASEL_TILT, 0, 0]}>
        <Glide to={[0, 0, 0]} size={painted ? 1 : 0.001}>
          {/* mounted only after the first paint so it grows from nothing */}
          {painted && <SchoolProp kind="painting" />}
        </Glide>
      </group>
    </group>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHALK_FONT = '"Comic Sans MS", "Chalkboard SE", "Segoe Print", cursive';

/** Chalk drawing: icons, ABC and the week; "Monday" appears once the learner writes it. */
function createBoardTexture(monday: boolean): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1040;
  canvas.height = 400;
  const c = canvas.getContext('2d');
  if (!c) return null;

  c.fillStyle = '#24463a';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.lineWidth = 7;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const circle = (x: number, y: number, r: number) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
  };
  const path = (points: ReadonlyArray<readonly [number, number]>) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  };

  // sun
  c.strokeStyle = '#fde68a';
  circle(110, 90, 34);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    path([
      [110 + Math.cos(a) * 48, 90 + Math.sin(a) * 48],
      [110 + Math.cos(a) * 68, 90 + Math.sin(a) * 68],
    ]);
  }
  // star
  path(
    Array.from({ length: 11 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? 24 : 58;
      return [770 + Math.cos(a) * r, 92 + Math.sin(a) * r] as const;
    }),
  );
  // apple
  c.strokeStyle = '#fca5a5';
  circle(912, 102, 30);
  circle(948, 102, 30);
  c.strokeStyle = '#86efac';
  path([
    [930, 76],
    [938, 40],
    [966, 36],
  ]);

  c.fillStyle = '#f8fafc';
  c.font = `bold 96px ${CHALK_FONT}`;
  c.fillText('ABC', 420, 95);
  if (monday) {
    c.fillStyle = '#fde68a';
    c.font = `bold 150px ${CHALK_FONT}`;
    c.fillText('Monday', 520, 224);
  } else {
    c.strokeStyle = 'rgba(248, 250, 252, 0.55)';
    c.setLineDash([22, 20]);
    path([
      [260, 262],
      [780, 262],
    ]);
    c.setLineDash([]);
  }
  c.fillStyle = '#bae6fd';
  c.font = `bold 54px ${CHALK_FONT}`;
  DAYS.forEach((day, i) => c.fillText(day, (canvas.width / DAYS.length) * (i + 0.5), 348));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function Blackboard({ monday }: { monday: boolean }) {
  const texture = useMemo(() => createBoardTexture(monday), [monday]);
  useEffect(() => () => texture?.dispose(), [texture]);
  const [x, y] = SCHOOL_TARGETS.board.at;
  return (
    <mesh position={[x, y + 0.5, -2.185]}>
      <planeGeometry args={[2.6, 1.0]} />
      <meshBasicMaterial map={texture} color={texture ? '#ffffff' : '#24463a'} />
    </mesh>
  );
}

/** Sky panes and the morning light shafts; frames are part of the furniture mesh. */
export function SchoolWindows() {
  const { sunbeamAlpha } = getCafeTextures();
  return (
    <>
      {WINDOW_XS.map((x) => (
        <group key={x}>
          <mesh position={[x, 1.45, -2.19]}>
            <planeGeometry args={[0.8, 1.4]} />
            <meshStandardMaterial color="#bfe6ff" emissive="#8fd0ff" emissiveIntensity={0.55} roughness={0.2} />
          </mesh>
          {sunbeamAlpha && (
            // additive light shaft; no raycast, or it would swallow taps on whatever is behind it
            <mesh position={[x, 0.95, -1.45]} rotation={[-0.7, 0, 0]} renderOrder={4} raycast={noRaycast}>
              <planeGeometry args={[0.9, 2.2]} />
              <meshBasicMaterial
                map={sunbeamAlpha}
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
