/**
 * Vehicles, nature, animals and furniture built from toyKit parts. Geometry only (no textures,
 * no materials) and cached by key. Origins sit on the ground; vehicles and animals face +x.
 */
import * as THREE from 'three';
import { ball, box, cyl, lathe, merge, once, paint, pill, rbox, ring, tile, tone, type Vec3 } from './toyKit';

const HALF = Math.PI / 2;
const TYRE = '#20242c';
const CHROME = '#d5dbe3';
const WOOD = '#8a5a3b';
const WOOD_DARK = '#5c3a26';
const BRASS = '#d4a017';

type Parts = THREE.BufferGeometry[];

/** Thin cylinder between two points: frames, stems, legs. */
function rod(a: Vec3, b: Vec3, r: number, color: THREE.ColorRepresentation, seg = 6): THREE.BufferGeometry {
  const from = new THREE.Vector3(...a);
  const dir = new THREE.Vector3(...b).sub(from);
  const geo = cyl(r, r, dir.length(), seg);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  const mid = from.addScaledVector(dir, 0.5);
  return paint(geo, color, { at: [mid.x, mid.y, mid.z], shade: 0.05 });
}

/** Side silhouette (x, y) extruded across the vehicle with a rounded bevel. */
function profile(points: ReadonlyArray<readonly [number, number]>, width: number, bevel: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const depth = width - bevel * 2;
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 3,
  }).translate(0, 0, -depth / 2);
}

// ------------------------------------------------------------------ vehicles

export type CarStyle = 0 | 1 | 2;

/** Cabin silhouettes: sedan, hatchback, microvan. [rear base, front base, front top, rear top] */
const CABINS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.29, 0.17, 0.05, -0.21],
  [-0.4, 0.15, 0.03, -0.36],
  [-0.41, 0.27, 0.17, -0.39],
];

export function carGeometry(color: string, style: CarStyle) {
  return once(`car:${color}:${style}`, () => {
    const [rb, fb, ft, rt] = CABINS[style];
    const top = style === 2 ? 0.4 : 0.36;
    const roofColor = style === 1 ? '#f8f4ea' : color;
    const parts: Parts = [
      // lower body with a sloped hood and rounded shoulders
      paint(profile([[-0.44, 0.085], [0.43, 0.085], [0.455, 0.15], [0.4, 0.21], [0.19, 0.238], [-0.4, 0.238], [-0.445, 0.19]], 0.4, 0.035), color, { shade: 0.22 }),
      // dark sill
      paint(rbox(0.8, 0.04, 0.37, 0.012), '#2b3039', { at: [0, 0.085, 0] }),
      // glasshouse
      paint(profile([[rb, 0.225], [fb, 0.225], [ft, top], [rt, top]], 0.335, 0.02), '#24455f', { shade: 0.35 }),
      // roof cap
      paint(rbox(ft - rt + 0.04, 0.035, 0.35, 0.016), roofColor, { at: [(ft + rt) / 2, top + 0.008, 0] }),
      // bumpers, grille, plates
      paint(rbox(0.055, 0.05, 0.4, 0.022), CHROME, { at: [0.45, 0.108, 0] }),
      paint(rbox(0.055, 0.05, 0.4, 0.022), CHROME, { at: [-0.445, 0.108, 0] }),
      paint(box(0.012, 0.045, 0.13), '#1c212a', { at: [0.462, 0.155, 0] }),
      paint(box(0.012, 0.04, 0.12), '#fdfaf2', { at: [-0.462, 0.155, 0] }),
    ];
    // window pillars
    const pillarX = style === 2 ? [-0.2, 0.04] : [(fb + rb) / 2];
    for (const x of pillarX) parts.push(paint(box(0.024, top - 0.225, 0.342), color, { at: [x, (top + 0.225) / 2, 0] }));
    for (const z of [-1, 1]) {
      parts.push(
        paint(rbox(0.045, 0.04, 0.05, 0.015), color, { at: [fb - 0.01, 0.25, z * 0.215] }),
        // door seam and handle
        paint(box(0.006, 0.11, 0.004), tone(color, -0.35), { at: [-0.05, 0.165, z * 0.201] }),
        paint(box(0.05, 0.012, 0.012), CHROME, { at: [-0.1, 0.19, z * 0.203] }),
      );
      for (const x of [-0.27, 0.27]) {
        parts.push(
          paint(ring(0.088, 0.016, Math.PI, 12), '#2b3039', { at: [x, 0.07, z * 0.198] }),
          paint(cyl(0.074, 0.074, 0.075, 14), TYRE, { at: [x, 0.074, z * 0.188], rot: [HALF, 0, 0], shade: 0.05 }),
          paint(cyl(0.042, 0.042, 0.012, 12), CHROME, { at: [x, 0.074, z * 0.228], rot: [HALF, 0, 0], shade: 0.1 }),
          paint(ball(0.016, 8, 6), '#8b94a3', { at: [x, 0.074, z * 0.234] }),
        );
      }
    }
    const lights = merge(
      [-1, 1].flatMap((z) => [
        paint(rbox(0.018, 0.042, 0.075, 0.009), '#ffedb0', { at: [0.458, 0.165, z * 0.128], shade: 0 }),
        paint(rbox(0.016, 0.034, 0.06, 0.007), '#a5120f', { at: [-0.453, 0.19, z * 0.135], shade: 0 }),
      ]),
    );
    return { body: merge(parts), lights };
  });
}

export function trafficPoleGeometry() {
  return once('trafficPole', () =>
    merge([
      paint(cyl(0.075, 0.09, 0.06, 12), '#2b3340', { at: [0, 0.03, 0] }),
      paint(cyl(0.028, 0.036, 1.0, 10), '#3f4856', { at: [0, 0.5, 0] }),
      paint(cyl(0.045, 0.045, 0.03, 10), '#f2c14e', { at: [0, 0.42, 0] }),
      paint(rbox(0.18, 0.4, 0.14, 0.05), '#232b37', { at: [0, 1.08, 0] }),
      paint(cyl(0.02, 0.03, 0.05, 8), '#3f4856', { at: [0, 1.305, 0] }),
      // lamp hoods
      ...[1.17, 1.0].map((y) =>
        paint(new THREE.CylinderGeometry(0.058, 0.058, 0.055, 10, 1, true, -HALF - 0.2, Math.PI + 0.4).rotateX(-HALF), '#151b25', { at: [0, y + 0.004, 0.09], shade: 0 }),
      ),
      paint(rbox(0.095, 0.095, 0.045, 0.015), '#232b37', { at: [0.1, 0.78, -0.012] }),
    ]),
  );
}

export function bicycleGeometry(frame: string) {
  // faces along z, like the café bicycle it replaces
  return once(`bike:${frame}`, () => {
    const parts: Parts = [];
    for (const z of [-0.24, 0.24]) {
      parts.push(
        paint(ring(0.15, 0.022, Math.PI * 2, 20), TYRE, { at: [0, 0.16, z], rot: [0, HALF, 0] }),
        paint(ring(0.122, 0.006, Math.PI * 2, 20), CHROME, { at: [0, 0.16, z], rot: [0, HALF, 0] }),
        paint(cyl(0.022, 0.022, 0.05, 8), CHROME, { at: [0, 0.16, z], rot: [0, 0, HALF] }),
      );
      for (let i = 0; i < 3; i++) parts.push(paint(box(0.005, 0.25, 0.005), CHROME, { at: [0, 0.16, z], rot: [(i * Math.PI) / 3, 0, 0] }));
    }
    const rear: Vec3 = [0, 0.16, -0.24];
    const crank: Vec3 = [0, 0.15, -0.03];
    const seat: Vec3 = [0, 0.37, -0.1];
    const head: Vec3 = [0, 0.37, 0.16];
    const front: Vec3 = [0, 0.16, 0.24];
    for (const [a, b] of [[rear, crank], [rear, seat], [crank, seat], [seat, head], [crank, head], [head, front]]) {
      parts.push(rod(a, b, 0.014, frame));
    }
    parts.push(
      paint(rbox(0.06, 0.03, 0.12, 0.014), WOOD_DARK, { at: [0, 0.4, -0.11] }),
      rod(head, [0, 0.45, 0.15], 0.01, CHROME),
      rod([-0.1, 0.45, 0.13], [0.1, 0.45, 0.13], 0.012, CHROME),
      paint(rbox(0.14, 0.09, 0.11, 0.02), '#c49563', { at: [0, 0.38, 0.27] }),
      paint(ball(0.035, 8, 6), '#f472b6', { at: [-0.03, 0.44, 0.27] }),
      paint(ball(0.03, 8, 6), '#facc15', { at: [0.035, 0.435, 0.29] }),
    );
    return merge(parts);
  });
}

// ------------------------------------------------------------------ nature

/** Smooth organic blob: a sphere with a continuous ripple so it stays watertight. */
function blob(r: number, at: Vec3, bump = 0.09, w = 12, h = 9): THREE.BufferGeometry {
  const geo = ball(r, w, h);
  const pos = geo.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin((v.x / r) * 4.1 + at[0] * 7) * Math.sin((v.y / r) * 3.7 + at[1] * 5) * Math.sin((v.z / r) * 4.5 + at[2] * 9);
    v.multiplyScalar(1 + bump * n * 1.6);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo.translate(...at);
}

/** Recolours by height across the whole object: shaded underside, sunlit crown. */
function sunlit(geo: THREE.BufferGeometry, low: string, high: string): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox!;
  const a = new THREE.Color(low);
  const b = new THREE.Color(high);
  const c = new THREE.Color();
  const pos = geo.getAttribute('position');
  const color = geo.getAttribute('color');
  for (let i = 0; i < pos.count; i++) {
    c.lerpColors(a, b, (pos.getY(i) - min.y) / (max.y - min.y || 1));
    color.setXYZ(i, c.r, c.g, c.b);
  }
  return geo;
}

export function treeTrunkGeometry() {
  return once('tree:trunk', () =>
    merge([
      paint(lathe([[0.17, 0], [0.12, 0.07], [0.09, 0.22], [0.075, 0.55], [0.06, 0.78]], 10), '#7c5234', { shade: 0.35 }),
      rod([0, 0.42, 0], [-0.2, 0.7, 0.12], 0.032, '#6f4a2f'),
      rod([0, 0.5, 0], [0.21, 0.76, -0.08], 0.028, '#6f4a2f'),
    ]),
  );
}

export function treeCanopyGeometry() {
  return once('tree:canopy', () => {
    const lobes: ReadonlyArray<readonly [number, number, number, number]> = [
      [0, 0.92, 0, 0.38], [-0.27, 0.76, 0.14, 0.26], [0.28, 0.81, -0.1, 0.26], [0.05, 1.2, 0.02, 0.25],
      [-0.14, 0.99, -0.23, 0.24], [0.15, 0.74, 0.23, 0.22], [-0.2, 1.08, 0.12, 0.19],
    ];
    return sunlit(merge(lobes.map(([x, y, z, r]) => paint(blob(r, [x, y, z], 0.09, 10, 8), '#ffffff'))), '#38603c', '#93c16d');
  });
}

/** White-based so the instance colour tints it; blossoms stay brighter than the leaves. */
export function bushGeometry() {
  return once('bush', () => {
    const lobes: ReadonlyArray<readonly [number, number, number, number]> = [
      [0, 0.02, 0, 0.23], [-0.19, -0.06, 0.07, 0.17], [0.19, -0.05, -0.04, 0.18], [0.04, -0.07, 0.18, 0.15],
    ];
    const leaves = sunlit(merge(lobes.map(([x, y, z, r]) => paint(blob(r, [x, y, z], 0.12, 8, 6), '#ffffff'))), '#7f8f7a', '#ffffff');
    const blooms = [[-0.1, 0.2, 0.11], [0.13, 0.13, 0.12], [0.02, 0.25, -0.06], [-0.24, 0.07, 0.1]].map((at) =>
      paint(ball(0.03, 5, 3), new THREE.Color(2.6, 2.1, 1.7), { at: at as unknown as Vec3, shade: 0 }),
    );
    return merge([leaves, ...blooms]);
  });
}

export function flowerHeadGeometry() {
  return once('flower:head', () =>
    merge(
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const petal = new THREE.CircleGeometry(0.045, 6).scale(1.15, 0.75, 1).translate(0.048, 0, 0).rotateX(-HALF);
        petal.rotateZ(0.38).rotateY(a);
        return paint(petal, i % 2 ? '#ffffff' : '#ececec', { shade: 0 });
      }),
    ),
  );
}

export function flowerCenterGeometry() {
  return once('flower:center', () => paint(ball(0.028, 6, 4), '#ffd23f', { scale: [1, 0.7, 1], at: [0, 0.012, 0], shade: 0.25 }));
}

/** 0.13 tall and centred on its origin, with two leaves. */
export function flowerStemGeometry() {
  return once('flower:stem', () =>
    merge([
      paint(cyl(0.009, 0.013, 0.13, 5), '#4d7c4a'),
      ...[-1, 1].map((s) => paint(ball(0.038, 5, 3), '#6b9a52', { scale: [1.1, 0.18, 0.55], rot: [0, s * 0.5, s * 0.45], at: [s * 0.035, -0.025, 0] })),
    ]),
  );
}

export function cloudGeometry() {
  return once('cloud', () =>
    sunlit(
      merge(
        ([[0, 0.03, 0, 0.42], [-0.4, -0.06, 0.05, 0.3], [0.4, -0.05, -0.04, 0.32], [-0.14, 0.14, -0.05, 0.28], [0.18, 0.1, 0.12, 0.27], [0.66, -0.12, 0.02, 0.18], [-0.65, -0.13, 0, 0.17]] as const).map(
          ([x, y, z, r]) => paint(ball(r, 14, 10), '#ffffff', { scale: [1, 0.82, 1], at: [x, y, z] }),
        ),
      ),
      '#d9dcea',
      '#ffffff',
    ),
  );
}

// ------------------------------------------------------------------ animals

export type PetKind = 'dog' | 'cat';

const PET_FUR: Record<PetKind, { fur: string; light: string; dark: string; collar: string }> = {
  dog: { fur: '#c08a52', light: '#f6e2c4', dark: '#7a4c2a', collar: '#e0473c' },
  cat: { fur: '#6d6760', light: '#efe9e0', dark: '#403b37', collar: '#2f9e8f' },
};

/** Faces +x. The tail is separate (pivot at PET_TAIL_PIVOT) so it can wag. */
export const PET_TAIL_PIVOT: Vec3 = [-0.19, 0.21, 0];

export function petGeometry(kind: PetKind) {
  return once(`pet:${kind}`, () => {
    const { fur, light, dark, collar } = PET_FUR[kind];
    const cat = kind === 'cat';
    const parts: Parts = [
      paint(pill(0.11, 0.19, 12), fur, { rot: [0, 0, HALF], at: [-0.01, 0.17, 0], shade: 0.25 }),
      paint(ball(0.1, 12, 9), light, { scale: [0.9, 0.95, 0.92], at: [0.1, 0.15, 0] }),
      paint(ball(0.115, 16, 12), fur, { at: [0.2, 0.3, 0] }),
      paint(ball(0.062, 12, 9), light, { scale: cat ? [0.75, 0.62, 1.1] : [1.15, 0.72, 0.95], at: [cat ? 0.285 : 0.3, 0.265, 0] }),
      paint(ball(cat ? 0.014 : 0.025, 8, 6), cat ? '#e8859a' : '#221a17', { at: [cat ? 0.332 : 0.372, 0.28, 0] }),
      paint(ring(0.085, 0.014, Math.PI * 2, 16), collar, { rot: [HALF, -0.75, 0], at: [0.145, 0.225, 0] }),
      paint(ball(0.022, 8, 6), BRASS, { at: [0.225, 0.19, 0] }),
    ];
    for (const s of [-1, 1]) {
      parts.push(
        paint(ball(0.025, 10, 8), '#171210', { at: [0.296, 0.325, s * 0.047], shade: 0 }),
        paint(ball(0.0085, 6, 5), '#ffffff', { at: [0.318, 0.336, s * 0.052], shade: 0 }),
      );
      if (cat) {
        parts.push(
          paint(new THREE.ConeGeometry(0.05, 0.095, 8), fur, { rot: [s * 0.28, 0, 0], at: [0.19, 0.415, s * 0.065] }),
          paint(new THREE.ConeGeometry(0.028, 0.055, 6), '#f2a7b5', { rot: [s * 0.28, 0, 0], at: [0.214, 0.402, s * 0.064], shade: 0 }),
          rod([0.31, 0.262, s * 0.035], [0.31, 0.28, s * 0.125], 0.0022, '#f5f2ea', 3),
          rod([0.31, 0.252, s * 0.035], [0.31, 0.248, s * 0.125], 0.0022, '#f5f2ea', 3),
        );
      } else {
        parts.push(paint(ball(0.06, 10, 8), dark, { scale: [0.72, 1.35, 0.42], rot: [-s * 0.45, 0, 0.18], at: [0.17, 0.3, s * 0.12] }));
      }
      for (const x of [-0.12, 0.11]) {
        parts.push(
          paint(pill(0.032, 0.07, 8), fur, { at: [x, 0.09, s * 0.065] }),
          paint(ball(0.038, 8, 6), light, { scale: [1.2, 0.65, 1], at: [x + 0.012, 0.027, s * 0.065] }),
        );
      }
    }
    // coat markings: tabby stripes for the cat, saddle patch for the dog
    if (cat) for (const x of [-0.12, -0.05, 0.02]) parts.push(paint(ring(0.108, 0.012, Math.PI, 12), dark, { rot: [0, HALF, 0], at: [x, 0.17, 0] }));
    else parts.push(paint(ball(0.085, 12, 9), dark, { scale: [1.15, 0.6, 1.12], at: [-0.07, 0.235, 0] }));

    const curve = new THREE.CatmullRomCurve3(
      (cat
        ? [[0, 0, 0], [-0.09, 0.05, 0], [-0.12, 0.16, 0], [-0.07, 0.24, 0]]
        : [[0, 0, 0], [-0.07, 0.05, 0], [-0.1, 0.13, 0]]
      ).map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    );
    const end = curve.getPoint(1);
    const tail = merge([
      paint(new THREE.TubeGeometry(curve, 10, cat ? 0.024 : 0.028, 7), fur),
      paint(ball(cat ? 0.028 : 0.034, 8, 6), cat ? dark : light, { at: [end.x, end.y, end.z] }),
    ]);
    return { body: merge(parts), tail };
  });
}

export function birdBodyGeometry(body: string) {
  return once(`bird:${body}`, () =>
    merge([
      paint(ball(0.065, 10, 8), body, { scale: [1.4, 0.92, 0.9], shade: 0.3 }),
      paint(ball(0.044, 10, 8), body, { at: [0.082, 0.04, 0] }),
      paint(new THREE.ConeGeometry(0.016, 0.05, 6), '#f59e0b', { rot: [0, 0, -HALF], at: [0.14, 0.034, 0] }),
      paint(ball(0.04, 8, 6), '#fdfaf2', { scale: [1.2, 0.75, 0.9], at: [0.035, -0.022, 0] }),
      paint(rbox(0.09, 0.012, 0.07, 0.005), tone(body, -0.2), { rot: [0, 0, -0.22], at: [-0.11, 0.015, 0] }),
      ...[-1, 1].map((s) => paint(ball(0.01, 6, 5), '#17130f', { at: [0.105, 0.055, s * 0.033], shade: 0 })),
    ]),
  );
}

/** Wing rooted at the origin and reaching toward side * z, so flapping hinges at the body. */
export function birdWingGeometry(side: 1 | -1) {
  return once(`wing:${side}`, () =>
    merge(
      ([[0.045, 0.1, 0.06, '#dfe5ee'], [0.022, 0.06, 0.135, '#8d9bb0']] as const).map(([len, wide, z, color]) =>
        paint(ball(0.05, 8, 5), color, { scale: [(len * 1.1) / 0.05 / 1.4, 0.14, wide / 0.1], at: [-0.005, 0, side * z], shade: 0 }),
      ),
    ),
  );
}

// ------------------------------------------------------------------ furniture

/** Bistro chair, seat at y 0.44, backrest on -z. */
export function chairGeometry(wood = WOOD, seat = '#c9563c') {
  return once(`chair:${wood}:${seat}`, () => {
    const parts: Parts = [
      paint(cyl(0.2, 0.19, 0.045, 20), wood, { at: [0, 0.43, 0] }),
      paint(ball(0.17, 16, 8), seat, { scale: [1, 0.22, 1], at: [0, 0.452, 0] }),
      paint(ring(0.16, 0.022, Math.PI, 20), wood, { at: [0, 0.76, -0.18], rot: [-0.08, 0, 0] }),
      rod([-0.16, 0.44, -0.15], [-0.16, 0.76, -0.18], 0.022, wood),
      rod([0.16, 0.44, -0.15], [0.16, 0.76, -0.18], 0.022, wood),
      paint(rbox(0.31, 0.06, 0.028, 0.012), wood, { at: [0, 0.65, -0.172] }),
    ];
    for (const x of [-0.055, 0.055]) parts.push(rod([x, 0.45, -0.16], [x, 0.9 - Math.abs(x) * 0.2, -0.186], 0.012, wood));
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) parts.push(rod([x * 0.13, 0.43, z * 0.13], [x * 0.175, 0, z * 0.175], 0.019, tone(wood, -0.3)));
      parts.push(rod([x * 0.157, 0.16, -0.157], [x * 0.157, 0.16, 0.157], 0.009, tone(wood, -0.3)));
    }
    return merge(parts);
  });
}

/** Pedestal table, top surface at y 0.74. */
export function tableGeometry(top = '#e8d3b0', base = WOOD_DARK) {
  return once(`table:${top}:${base}`, () =>
    merge([
      paint(lathe([[0, 0.7], [0.42, 0.7], [0.46, 0.712], [0.47, 0.727], [0.455, 0.74], [0, 0.74]], 32), top, { shade: 0.3 }),
      paint(ring(0.462, 0.009, Math.PI * 2, 36), base, { rot: [HALF, 0, 0], at: [0, 0.716, 0] }),
      paint(lathe([[0.1, 0.06], [0.055, 0.12], [0.04, 0.3], [0.07, 0.42], [0.04, 0.55], [0.05, 0.66], [0.15, 0.7]], 14), base),
      paint(lathe([[0, 0], [0.27, 0], [0.27, 0.025], [0.2, 0.045], [0.1, 0.07], [0, 0.07]], 24), base),
      paint(lathe([[0, 0], [0.065, 0], [0.085, 0.012], [0.078, 0.014], [0, 0.008]], 18), '#fdf6ea', { at: [-0.16, 0.74, -0.06] }),
      paint(ball(0.032, 10, 8), '#d98e4a', { scale: [1.25, 0.6, 1], at: [-0.16, 0.768, -0.06] }),
    ]),
  );
}

/** Café mug with handle and coffee, origin at its centre like the cylinder it replaces. */
export function salonMugGeometry() {
  return once('salonMug', () =>
    merge([
      paint(lathe([[0, -0.045], [0.034, -0.045], [0.045, -0.03], [0.048, 0.045], [0.04, 0.046], [0.037, -0.025], [0, -0.03]], 18), '#fbf3e4'),
      paint(cyl(0.039, 0.039, 0.006, 18), '#6b3d22', { at: [0, 0.028, 0] }),
      paint(ring(0.025, 0.008, Math.PI * 2, 12), '#fbf3e4', { at: [0.056, 0.004, 0] }),
    ]),
  );
}

/** Dome pendant: shade centred on the origin, cord rising 1 unit. */
export function pendantGeometry(color = '#d97706') {
  return once(`pendant:${color}`, () =>
    merge([
      paint(cyl(0.006, 0.006, 0.92, 5), '#1f2937', { at: [0, 0.54, 0] }),
      paint(cyl(0.024, 0.036, 0.06, 10), BRASS, { at: [0, 0.105, 0] }),
      // outer skin then pale inner skin, wound to face down and in
      paint(lathe([[0.2, -0.09], [0.19, -0.02], [0.14, 0.045], [0.07, 0.078], [0.012, 0.086]], 24), color, { shade: 0.3 }),
      paint(lathe([[0.012, 0.078], [0.065, 0.07], [0.132, 0.038], [0.18, -0.025], [0.19, -0.09]], 24), '#fff0c9', { shade: 0 }),
      paint(ring(0.196, 0.011, Math.PI * 2, 28), BRASS, { rot: [HALF, 0, 0], at: [0, -0.088, 0] }),
    ]),
  );
}

export function pottedPlantGeometry() {
  return once('pottedPlant', () => {
    const parts: Parts = [
      paint(lathe([[0, 0], [0.1, 0], [0.135, 0.28], [0.16, 0.29], [0.162, 0.34], [0.135, 0.345], [0.128, 0.31], [0, 0.31]], 20), '#bf6038', { shade: 0.35 }),
      paint(ring(0.118, 0.008, Math.PI * 2, 24), '#f1d9b5', { rot: [HALF, 0, 0], at: [0, 0.15, 0] }),
      paint(cyl(0.128, 0.128, 0.02, 18), '#4a2f1f', { at: [0, 0.31, 0] }),
    ];
    // two whorls of broad leaves around a short stem
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4;
      const lift = 0.25 + (i / 18) * 1.1;
      const len = 0.15 - i * 0.0025;
      const leaf = ball(len, 8, 6).scale(1, 0.13, 0.52).translate(len * 0.95, 0, 0).rotateZ(lift).rotateY(a);
      parts.push(paint(leaf, ['#3f7447', '#5a9150', '#79ab5c'][i % 3], { at: [0, 0.34 + (i / 18) * 0.22, 0] }));
    }
    return merge(parts);
  });
}

/** Reading armchair: backrest on +x, seat top at y 0.48. */
export function armchairGeometry(fabric = '#a53d1c') {
  return once(`armchair:${fabric}`, () => {
    const parts: Parts = [
      paint(rbox(0.62, 0.26, 0.62, 0.08, 2), fabric, { at: [0, 0.23, 0], shade: 0.35 }),
      paint(rbox(0.5, 0.14, 0.44, 0.06, 2), tone(fabric, 0.14), { at: [-0.04, 0.41, 0] }),
      paint(rbox(0.18, 0.74, 0.6, 0.085, 2), fabric, { at: [0.29, 0.6, 0], rot: [0, 0, -0.08] }),
      paint(rbox(0.1, 0.34, 0.34, 0.045, 2), '#f2c14e', { at: [0.17, 0.62, 0], rot: [0, 0, -0.22] }),
    ];
    for (const z of [-1, 1]) {
      parts.push(paint(rbox(0.58, 0.2, 0.15, 0.07, 2), fabric, { at: [-0.01, 0.47, z * 0.285] }));
      for (const x of [-0.24, 0.24]) parts.push(paint(cyl(0.028, 0.018, 0.1, 8), WOOD_DARK, { at: [x, 0.05, z * 0.24] }));
    }
    return merge(parts);
  });
}

export function streetlampGeometry() {
  return once('streetlamp', () =>
    merge([
      paint(lathe([[0, 0], [0.13, 0], [0.13, 0.05], [0.085, 0.09], [0.07, 0.24], [0.048, 0.28]], 14), '#25313a'),
      paint(cyl(0.032, 0.048, 1.5, 10), '#2d3a45', { at: [0, 1.02, 0] }),
      ...[0.3, 1.45].map((y) => paint(ring(0.05, 0.013, Math.PI * 2, 14), BRASS, { rot: [HALF, 0, 0], at: [0, y, 0] })),
      rod([-0.17, 1.62, 0], [0.17, 1.62, 0], 0.012, '#2d3a45'),
      ...[-0.17, 0.17].map((x) => paint(ball(0.026, 8, 6), BRASS, { at: [x, 1.62, 0] })),
      paint(cyl(0.12, 0.05, 0.08, 8), '#25313a', { at: [0, 1.81, 0] }),
      paint(new THREE.ConeGeometry(0.21, 0.13, 8), '#25313a', { at: [0, 2.14, 0] }),
      ...[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return rod([Math.cos(a) * 0.095, 1.84, Math.sin(a) * 0.095], [Math.cos(a) * 0.155, 2.09, Math.sin(a) * 0.155], 0.011, '#25313a');
      }),
      paint(ball(0.035, 8, 6), BRASS, { at: [0, 2.23, 0] }),
    ]),
  );
}

// ------------------------------------------------------------------ market

export type CrateKind = 'apple' | 'banana' | 'orange' | 'strawberry' | 'grapes' | 'watermelon';

/** Slatted crate heaped with produce, centred like the 0.46 x 0.2 x 0.36 box it replaces. */
export function fruitCrateGeometry(kind: CrateKind, color: string) {
  return once(`crate:${kind}:${color}`, () => {
    const wood = '#b47b4e';
    const parts: Parts = [paint(box(0.42, 0.03, 0.32), tone(wood, -0.35), { at: [0, -0.085, 0] })];
    for (const y of [-0.055, 0.04]) {
      for (const z of [-0.17, 0.17]) parts.push(paint(rbox(0.46, 0.075, 0.025, 0.01), wood, { at: [0, y, z] }));
      for (const x of [-0.218, 0.218]) parts.push(paint(rbox(0.025, 0.075, 0.33, 0.01), wood, { at: [x, y, 0] }));
    }
    for (const x of [-0.218, 0.218]) for (const z of [-0.17, 0.17]) parts.push(paint(rbox(0.045, 0.21, 0.045, 0.012), tone(wood, -0.25), { at: [x, 0, z] }));
    parts.push(paint(rbox(0.38, 0.06, 0.28, 0.02), '#e9cd8f', { at: [0, 0.045, 0] }));

    if (kind === 'watermelon') {
      for (let i = 0; i < 8; i++) {
        const slice = new THREE.SphereGeometry(0.14, 4, 12, (i / 8) * Math.PI * 2, Math.PI / 4);
        slice.rotateZ(HALF);
        parts.push(paint(slice, i % 2 ? '#14702f' : '#4aa84a', { scale: [1.3, 0.85, 0.9], at: [0, 0.16, 0] }));
      }
    } else if (kind === 'banana') {
      for (let i = 0; i < 4; i++) {
        parts.push(paint(ring(0.095, 0.028, Math.PI * 0.8, 12), i % 2 ? color : '#fbd84a', { rot: [-0.9, 0, 0.3], at: [-0.06 + (i % 2) * 0.1, 0.09 + i * 0.012, -0.05 + i * 0.045] }));
      }
      for (const x of [-0.14, 0.06]) parts.push(paint(ball(0.018, 6, 5), WOOD_DARK, { at: [x, 0.15, 0] }));
    } else {
      const r = kind === 'grapes' ? 0.038 : kind === 'strawberry' ? 0.05 : 0.06;
      const heap: Vec3[] = [
        [-0.13, 0.1, -0.07], [0, 0.1, -0.08], [0.13, 0.1, -0.06], [-0.12, 0.1, 0.07], [0.01, 0.1, 0.08], [0.13, 0.1, 0.06],
        [-0.065, 0.17, 0], [0.065, 0.17, 0.01], [0, 0.19, -0.04],
      ];
      heap.forEach((at, i) => {
        const shape: Vec3 = kind === 'strawberry' ? [1, 1.2, 1] : [1, 0.95, 1];
        parts.push(paint(ball(r, 9, 7), tone(color, (i % 3) * 0.07), { scale: shape, at, shade: 0.35 }));
        if (kind === 'grapes') parts.push(paint(ball(r * 0.8, 8, 6), color, { at: [at[0] + 0.03, at[1] + 0.02, at[2] + 0.025] }));
        else parts.push(paint(ball(r * 0.42, 6, 4), '#4f8a3a', { scale: [1.3, 0.3, 0.7], rot: [0, i, 0], at: [at[0], at[1] + r, at[2]], shade: 0 }));
      });
    }
    return merge(parts);
  });
}

// ------------------------------------------------------------------ café room

/** Fluted counter body, front on +z, matching the 3.24 x 0.91 x 0.9 block centred on z 0.05. */
export function counterGeometry() {
  return once('counter', () => {
    const parts: Parts = [
      paint(box(3.24, 0.91, 0.9), '#6a4029', { at: [0, 0.455, 0.05], shade: 0.35 }),
      paint(rbox(3.28, 0.075, 0.05, 0.02), '#9a6238', { at: [0, 0.855, 0.505] }),
      paint(rbox(3.28, 0.1, 0.06, 0.02), '#4f2e1d', { at: [0, 0.115, 0.505] }),
      paint(rbox(3.26, 0.07, 0.025, 0.01), '#d6a548', { at: [0, 0.04, 0.515], shade: 0.35 }),
    ];
    for (let i = 0; i < 19; i++) {
      parts.push(paint(rbox(0.12, 0.66, 0.055, 0.026), i % 2 ? '#8a5532' : '#945d37', { at: [-1.53 + i * 0.17, 0.49, 0.495], shade: 0.3 }));
    }
    for (const x of [-1.64, 1.64]) parts.push(paint(rbox(0.09, 0.9, 0.1, 0.03), '#4f2e1d', { at: [x, 0.455, 0.485] }));
    return merge(parts);
  });
}

/** Panelled wainscot with cap rail and skirting; faces +z, floor at y 0, stopping either side of the salon door. */
export function wainscotGeometry() {
  return once('wainscot', () => {
    const parts: Parts = [];
    for (const [from, to] of [[-5.2, 2.0], [3.1, 5.2]] as const) {
      const width = to - from;
      const mid = (from + to) / 2;
      parts.push(
        paint(box(width, 0.82, 0.05), '#80512f', { at: [mid, 0.41, 0], shade: 0.3 }),
        paint(rbox(width, 0.055, 0.11, 0.022), '#a8714a', { at: [mid, 0.825, 0.025] }),
        paint(rbox(width, 0.1, 0.085, 0.02), '#5c3822', { at: [mid, 0.05, 0.015] }),
      );
      const n = Math.round(width / 0.65);
      const step = width / n;
      for (let i = 0; i < n; i++) {
        const x = from + step * (i + 0.5);
        parts.push(
          paint(tile(step - 0.13, 0.02, 0.56, 0.02), '#6b4229', { rot: [HALF, 0, 0], at: [x, 0.45, 0.033] }),
          paint(rbox(step - 0.23, 0.46, 0.025, 0.012), '#8d5c39', { at: [x, 0.45, 0.04], shade: 0.3 }),
        );
      }
    }
    return merge(parts);
  });
}

/** Border stripes, centre diamonds and tassels for the 8.2 x 4.2 salon rug. Flat, origin at its centre. */
export function rugTrimGeometry() {
  return once('rugTrim', () => {
    const flat = (w: number, d: number, x: number, z: number, color: string, yaw = 0) =>
      paint(new THREE.PlaneGeometry(w, d).rotateX(-HALF), color, { rot: [0, yaw, 0], at: [x, 0, z], shade: 0 });
    const parts: Parts = [];
    for (const s of [-1, 1]) {
      parts.push(
        flat(7.4, 0.07, 0, s * 1.7, '#2f6f62'),
        flat(0.07, 3.33, s * 3.665, 0, '#2f6f62'),
        flat(7.1, 0.035, 0, s * 1.56, '#c2703d'),
        flat(0.035, 3.08, s * 3.53, 0, '#c2703d'),
      );
      for (let i = 0; i < 28; i++) parts.push(flat(0.2, 0.05, s * 4.19, -2.0 + i * 0.148, '#f3dfc0'));
    }
    for (let i = -5; i <= 5; i++) {
      for (const s of [-1, 1]) parts.push(flat(0.15, 0.15, i * 0.62, s * 1.38, i % 2 ? '#c2703d' : '#2f6f62', Math.PI / 4));
    }
    return merge(parts);
  });
}

/** Wooden joinery around the salon door glass (0.76 x 1.55 centred at y 1.2). */
export function doorGeometry() {
  return once('door', () => {
    const parts: Parts = [paint(box(1.0, 2.1, 0.07), WOOD_DARK, { at: [0, 1.05, 0] })];
    for (const x of [-0.44, 0.44]) parts.push(paint(rbox(0.12, 2.14, 0.13, 0.035), '#734a31', { at: [x, 1.07, 0.015] }));
    parts.push(
      paint(rbox(1.08, 0.13, 0.15, 0.04), '#734a31', { at: [0, 2.07, 0.015] }),
      paint(rbox(0.78, 0.07, 0.1, 0.02), '#734a31', { at: [0, 0.4, 0.03] }),
      paint(rbox(0.6, 0.22, 0.04, 0.018), '#80553a', { at: [0, 0.2, 0.045] }),
      paint(box(0.03, 1.55, 0.025), '#734a31', { at: [0, 1.2, 0.055], shade: 0 }),
      paint(box(0.76, 0.03, 0.025), '#734a31', { at: [0, 1.55, 0.055], shade: 0 }),
      paint(rbox(0.035, 0.26, 0.035, 0.015), BRASS, { at: [0.33, 0.95, 0.09] }),
    );
    return merge(parts);
  });
}

/** Framed little landscape, facing +z. */
export function pictureGeometry(width: number, height: number, sky: string) {
  return once(`picture:${width}:${height}:${sky}`, () => {
    const iw = width - 0.08;
    const ih = height - 0.08;
    const hill = (r: number, x: number, color: string, z: number) =>
      paint(new THREE.CircleGeometry(r, 20, 0, Math.PI), color, { scale: [1, ih / width / 1.1, 1], at: [x, -ih / 2, z], shade: 0 });
    const parts: Parts = [
      paint(box(width - 0.04, height - 0.04, 0.02), '#fbf3e4', { at: [0, 0, 0] }),
      paint(new THREE.PlaneGeometry(iw - 0.05, ih - 0.05), sky, { at: [0, 0, 0.012], shade: 0.1 }),
      paint(new THREE.CircleGeometry(Math.min(iw, ih) * 0.16, 18), '#fff3c4', { at: [iw * 0.18, ih * 0.16, 0.014], shade: 0 }),
      hill(iw * 0.3, -iw * 0.17, '#4f7d5a', 0.016),
      hill(iw * 0.27, iw * 0.19, '#356550', 0.018),
    ];
    for (const s of [-1, 1]) {
      parts.push(
        paint(rbox(width + 0.02, 0.055, 0.05, 0.018), WOOD_DARK, { at: [0, s * (height / 2 - 0.015), 0.008] }),
        paint(rbox(0.055, height + 0.02, 0.05, 0.018), WOOD_DARK, { at: [s * (width / 2 - 0.015), 0, 0.008] }),
      );
    }
    return merge(parts);
  });
}
