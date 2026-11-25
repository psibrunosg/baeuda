/** Merged body parts for the clay people: one mesh per torso, head, limb and pair of eyes. */
import * as THREE from 'three';
import { ball, box, cyl, merge, once, paint, pill, rbox, ring, tone } from './toyKit';

const HALF = Math.PI / 2;
const SHOE = '#4a3024';

type Parts = THREE.BufferGeometry[];

const cap = (r: number, theta: number, w = 20, h = 12) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, Math.PI * theta);

export function eyesGeometry(z: number, spread: number, glasses: boolean, glassesColor: string) {
  return once(`eyes:${z}:${spread}:${glasses}:${glassesColor}`, () => {
    const parts: Parts = [];
    for (const x of [-spread, spread]) {
      parts.push(
        paint(ball(0.021, 12, 10), '#16110f', { scale: [0.95, 1.12, 0.9], at: [x, 0, z], shade: 0 }),
        paint(ball(0.0068, 8, 6), '#d9d9d9', { at: [x + 0.007, 0.008, z + 0.018], shade: 0 }),
        paint(ball(0.0032, 6, 5), '#bdbdbd', { at: [x - 0.006, -0.008, z + 0.019], shade: 0 }),
      );
      if (glasses) parts.push(paint(ring(0.034, 0.0045), tone(glassesColor, -0.2), { at: [x, 0, z + 0.018], shade: 0 }));
    }
    if (glasses) parts.push(paint(box(spread * 0.6, 0.007, 0.006), tone(glassesColor, -0.2), { at: [0, 0.004, z + 0.02], shade: 0 }));
    return merge(parts);
  });
}

/** Features common to every head of radius r: ears, nose, blush, smile and brows. */
function face(r: number, skin: string, hair: string, mustache?: string): Parts {
  const k = r / 0.145;
  const parts: Parts = [
    paint(ball(r, 18, 14), skin, { shade: 0.14 }),
    paint(ball(0.019 * k, 10, 8), tone(skin, -0.06), { at: [0, -0.01 * k, 0.143 * k] }),
  ];
  const blush = new THREE.Color(skin).lerp(new THREE.Color('#f4776e'), 0.5);
  for (const s of [-1, 1]) {
    parts.push(
      paint(ball(0.032 * k, 10, 8), tone(skin, -0.05), { scale: [0.55, 1, 0.8], at: [s * 0.142 * k, -0.004, 0] }),
      paint(ball(0.025 * k, 10, 8), blush, { scale: [1, 0.72, 0.32], rot: [0.18, s * 0.66, 0], at: [s * 0.085 * k, -0.032 * k, 0.113 * k], shade: 0 }),
      paint(pill(0.0065, 0.028, 6), tone(hair, -0.1), { rot: [0, 0, HALF - s * 0.14], at: [s * 0.048 * k, 0.054 * k, 0.134 * k], shade: 0 }),
    );
  }
  if (mustache) {
    for (const s of [-1, 1]) parts.push(paint(pill(0.014, 0.034, 8), mustache, { rot: [0, 0, HALF + s * 0.25], at: [s * 0.024, -0.034, 0.137] }));
  }
  parts.push(paint(ring(0.026 * k, 0.0072, Math.PI * 0.8, 10), '#9b2c2c', { rot: [0, 0, Math.PI * 1.1], at: [0, (mustache ? -0.045 : -0.032) * k, 0.1375 * k], shade: 0 }));
  return parts;
}

/** Hair cap tipped backwards so the forehead shows, plus a soft fringe. */
function hairCap(r: number, hair: string): Parts {
  return [
    paint(cap(r + 0.008, 0.55), hair, { rot: [-0.5, 0, 0], at: [0, 0.012, -0.006], shade: 0.28 }),
    ...[[-0.062, 0.094, 0.092, 0.3], [0.005, 0.112, 0.092, -0.1], [0.07, 0.09, 0.086, -0.45]].map(([x, y, z, tilt]) =>
      paint(ball(0.05, 10, 8), tone(hair, 0.07), { scale: [1.25, 0.55, 0.8], rot: [0.35, 0, tilt], at: [x, y, z] }),
    ),
  ];
}

export type HeadStyle = 'none' | 'toque' | 'cap' | 'hardhat' | 'beret' | 'sunhat' | 'postal' | 'beanie' | 'quiff';

function hatParts(hat: HeadStyle, color: string, hair: string): Parts {
  const band = '#e05a47';
  if (hat === 'toque') {
    return [
      paint(cyl(0.132, 0.12, 0.13, 20), color, { at: [0, 0.14, 0] }),
      paint(ring(0.124, 0.016), tone(color, -0.08), { rot: [HALF, 0, 0], at: [0, 0.095, 0] }),
      ...[0, 1, 2, 3, 4].map((i) => paint(ball(0.085, 12, 10), color, { at: [Math.cos(i * 1.257) * 0.085, 0.235, Math.sin(i * 1.257) * 0.085] })),
      paint(ball(0.1, 12, 10), color, { at: [0, 0.27, 0] }),
    ];
  }
  if (hat === 'cap') {
    return [
      paint(cap(0.161, 0.5), color, { at: [0, 0.075, -0.004], rot: [-0.12, 0, 0] }),
      paint(cyl(0.105, 0.11, 0.022, 18), tone(color, -0.12), { scale: [1.15, 1, 1], rot: [0.1, 0, 0], at: [0, 0.092, 0.14] }),
      paint(ball(0.018, 8, 6), tone(color, 0.4), { at: [0, 0.235, -0.02] }),
    ];
  }
  if (hat === 'hardhat') {
    return [
      paint(cap(0.163, 0.5), color, { at: [0, 0.075, 0] }),
      paint(cyl(0.188, 0.195, 0.022, 22), color, { at: [0, 0.075, 0] }),
      paint(rbox(0.05, 0.04, 0.26, 0.018), tone(color, 0.18), { at: [0, 0.228, 0] }),
    ];
  }
  if (hat === 'beret') {
    return [
      paint(ball(0.14, 18, 12), color, { scale: [1.15, 0.5, 1.15], rot: [-0.12, 0, -0.22], at: [0.02, 0.135, -0.015] }),
      paint(ring(0.125, 0.014), tone(color, -0.18), { rot: [HALF - 0.2, -0.18, 0], at: [0.004, 0.105, -0.008] }),
      paint(cyl(0.01, 0.012, 0.035, 8), tone(color, -0.2), { rot: [0, 0, -0.22], at: [0.036, 0.208, -0.02] }),
    ];
  }
  if (hat === 'sunhat') {
    return [
      paint(cyl(0.215, 0.245, 0.026, 28), color, { rot: [-0.14, 0, 0], at: [0, 0.108, -0.008] }),
      paint(cyl(0.1, 0.138, 0.1, 22), color, { rot: [-0.14, 0, 0], at: [0, 0.163, -0.016] }),
      paint(cyl(0.133, 0.141, 0.03, 22), band, { rot: [-0.14, 0, 0], at: [0, 0.135, -0.012] }),
    ];
  }
  if (hat === 'postal') {
    return [
      paint(cyl(0.162, 0.14, 0.085, 20), color, { at: [0, 0.13, 0] }),
      paint(ring(0.142, 0.012), '#eab308', { rot: [HALF, 0, 0], at: [0, 0.095, 0] }),
      paint(cyl(0.105, 0.11, 0.016, 16), '#0f172a', { scale: [1, 1, 0.8], rot: [0.18, 0, 0], at: [0, 0.084, 0.13] }),
      paint(ball(0.022, 8, 6), '#eab308', { at: [0, 0.13, 0.152] }),
    ];
  }
  if (hat === 'beanie') {
    return [
      paint(cap(0.158, 0.5), color, { scale: [1, 1.12, 1], rot: [-0.14, 0, 0], at: [0, 0.068, -0.006] }),
      paint(ring(0.15, 0.027, Math.PI * 2, 24), tone(color, -0.14), { rot: [HALF - 0.14, 0, 0], at: [0, 0.07, -0.006] }),
      paint(ball(0.047, 12, 10), '#fdf6ea', { at: [0, 0.252, -0.04] }),
    ];
  }
  if (hat === 'quiff') {
    return [
      paint(pill(0.038, 0.055, 10), tone(hair, 0.1), { rot: [0.3, -0.2, -1.15], at: [0.018, 0.158, 0.07] }),
      paint(pill(0.032, 0.045, 10), hair, { rot: [0.35, 0.15, 1.25], at: [-0.045, 0.145, 0.07] }),
    ];
  }
  return [];
}

export interface HeadLook {
  skin: string;
  hair: string;
  hat: HeadStyle;
  hatColor: string;
  mustache?: string;
}

export function headGeometry({ skin, hair, hat, hatColor, mustache }: HeadLook) {
  return once(`head:${skin}:${hair}:${hat}:${hatColor}:${mustache}`, () =>
    merge([...face(0.145, skin, hair, mustache), ...(hat === 'toque' ? [] : hairCap(0.145, hair)), ...hatParts(hat, hatColor, hair)]),
  );
}

export function torsoGeometry(shirt: string, apron?: string, collar?: string) {
  return once(`torso:${shirt}:${apron}:${collar}`, () => {
    const parts: Parts = [
      paint(pill(0.155, 0.26, 18), shirt, { at: [0, 0.34, 0], shade: 0.3 }),
      paint(ring(0.15, 0.015, Math.PI * 2, 24), tone(shirt, -0.28), { rot: [HALF, 0, 0], at: [0, 0.205, 0] }),
      paint(ring(0.118, 0.022, Math.PI * 2, 22), collar ?? tone(shirt, 0.45), { rot: [HALF + 0.16, 0, 0], at: [0, 0.552, 0.008] }),
    ];
    for (const s of [-1, 1]) {
      parts.push(
        paint(ball(0.06, 12, 8), SHOE, { scale: [1, 0.62, 1.4], at: [s * 0.075, 0.038, 0.075] }),
        paint(rbox(0.115, 0.022, 0.16, 0.01), '#2b1c14', { at: [s * 0.075, 0.011, 0.075] }),
      );
    }
    if (apron) {
      parts.push(
        paint(rbox(0.22, 0.28, 0.09, 0.03, 2), apron, { at: [0, 0.3, 0.11] }),
        paint(rbox(0.13, 0.075, 0.02, 0.008), tone(apron, -0.2), { at: [0, 0.25, 0.162] }),
      );
      for (const s of [-1, 1]) {
        parts.push(
          paint(rbox(0.026, 0.14, 0.016, 0.007), tone(apron, -0.12), { rot: [-0.5, 0, s * 0.22], at: [s * 0.078, 0.485, 0.122] }),
          paint(ball(0.012, 8, 6), '#eab308', { at: [s * 0.072, 0.415, 0.156] }),
        );
      }
    } else {
      for (const y of [0.45, 0.37, 0.29]) parts.push(paint(ball(0.013, 8, 6), tone(shirt, 0.55), { at: [0, y, 0.154] }));
    }
    return merge(parts);
  });
}

/** Hangs from the shoulder: sleeve, cuff and hand with a thumb. */
export function armGeometry(shirt: string, skin: string) {
  return once(`arm:${shirt}:${skin}`, () =>
    merge([
      paint(pill(0.044, 0.15), shirt, { at: [0, -0.05, 0], shade: 0.22 }),
      paint(ring(0.04, 0.012, Math.PI * 2, 12), tone(shirt, -0.2), { rot: [HALF, 0, 0], at: [0, -0.12, 0.006] }),
      paint(ball(0.043, 12, 10), skin, { at: [0, -0.152, 0.015] }),
      paint(ball(0.018, 8, 6), skin, { at: [0, -0.14, 0.052] }),
    ]),
  );
}

// ------------------------------------------------------------------ learner avatar

export type AvatarHat = 'beret' | 'sunhat' | 'cap' | 'beanie';
export type AvatarHair = 'crop' | 'bob' | 'quiff' | 'bun';

const AVATAR_SKIN = '#eab890';

export function learnerGeometry(coat: string, hatColor: string, hairColor: string, hat: AvatarHat, hair: AvatarHair) {
  return once(`learner:${coat}:${hatColor}:${hairColor}:${hat}:${hair}`, () => {
    const leather = '#8a5138';
    const leg = merge([
      paint(pill(0.037, 0.08), '#33486b', { at: [0, -0.07, 0] }),
      paint(ball(0.047, 12, 8), '#6b4330', { scale: [1, 0.75, 1.35], at: [0, -0.134, 0.022] }),
      paint(rbox(0.092, 0.02, 0.128, 0.009), '#f1e4cf', { at: [0, -0.156, 0.022] }),
    ]);
    const torso: Parts = [
      paint(pill(0.13, 0.22, 18), coat, { at: [0, 0.34, 0], shade: 0.28 }),
      paint(ring(0.126, 0.017, Math.PI * 2, 24), tone(coat, -0.22), { rot: [HALF, 0, 0], at: [0, 0.23, 0] }),
      paint(ring(0.092, 0.032, Math.PI * 2, 22), '#fdf6ea', { rot: [HALF + 0.1, 0, 0], at: [0, 0.49, 0.008] }),
      paint(rbox(0.055, 0.14, 0.028, 0.012), '#f3e6d0', { rot: [-0.12, 0, 0.16], at: [0.052, 0.41, 0.132] }),
      // satchel and strap
      paint(rbox(0.07, 0.13, 0.15, 0.025), '#7c4732', { at: [-0.145, 0.28, -0.01] }),
      paint(rbox(0.082, 0.055, 0.158, 0.022), leather, { at: [-0.146, 0.322, -0.01] }),
      paint(ball(0.012, 8, 6), '#eab308', { at: [-0.189, 0.31, -0.01] }),
      paint(ring(0.136, 0.012, Math.PI * 2, 24), '#5a3322', { rot: [0, 0, -0.68], at: [0, 0.36, 0] }),
      // small backpack: the camera mostly follows the learner from behind
      paint(rbox(0.17, 0.19, 0.095, 0.042, 2), '#2f6f62', { at: [0, 0.34, -0.135] }),
      paint(rbox(0.175, 0.07, 0.1, 0.03), '#3d8b7a', { at: [0, 0.405, -0.14] }),
      paint(rbox(0.11, 0.07, 0.03, 0.014), '#25584e', { at: [0, 0.3, -0.188] }),
      paint(ball(0.011, 8, 6), '#eab308', { at: [0, 0.378, -0.192] }),
    ];
    for (const y of [0.4, 0.33]) torso.push(paint(ball(0.012, 8, 6), tone(coat, -0.45), { at: [-0.012, y, 0.131] }));
    const arm = merge([
      paint(pill(0.037, 0.12), coat, { at: [0, -0.08, 0], shade: 0.22 }),
      paint(ring(0.034, 0.012, Math.PI * 2, 12), tone(coat, -0.24), { rot: [HALF, 0, 0], at: [0, -0.142, 0] }),
      paint(ball(0.038, 12, 10), AVATAR_SKIN, { at: [0, -0.17, 0] }),
    ]);

    const head: Parts = [...face(0.142, AVATAR_SKIN, hairColor), ...hairCap(0.142, hairColor)];
    if (hair === 'bob') for (const s of [-1, 1]) head.push(paint(ball(0.064, 12, 10), hairColor, { scale: [0.85, 1.15, 1.05], at: [s * 0.122, -0.032, -0.03] }));
    if (hair === 'quiff') head.push(...hatParts('quiff', hatColor, hairColor));
    if (hair === 'bun') head.push(paint(ball(0.07, 14, 12), hairColor, { at: [0, 0.04, -0.17] }), paint(ring(0.045, 0.012), '#e05a47', { at: [0, 0.035, -0.13] }));
    head.push(...hatParts(hat, hatColor, hairColor));

    return { leg, torso: merge(torso), arm, head: merge(head) };
  });
}
