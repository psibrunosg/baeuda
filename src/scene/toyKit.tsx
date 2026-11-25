/**
 * Shared "toy town" kit: bevelled primitives painted with vertex colours and merged,
 * so a detailed object costs one draw call and a handful of materials serve the whole game.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getCafeTextures } from './cafeTextures';

export type Vec3 = readonly [number, number, number];

export interface Place {
  at?: Vec3;
  rot?: Vec3;
  scale?: Vec3;
  /** how much the underside of the part is darkened (baked fake occlusion) */
  shade?: number;
}

// RoundedBoxGeometry clamps the radius to the half-size, unlike drei's RoundedBox.
export const rbox = (w: number, h: number, d: number, r = 0.02, seg = 1) => new RoundedBoxGeometry(w, h, d, seg, r);
export const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
export const ball = (r: number, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h);
export const cyl = (top: number, bottom: number, h: number, seg = 12) => new THREE.CylinderGeometry(top, bottom, h, seg);
export const pill = (r: number, length: number, seg = 10) => new THREE.CapsuleGeometry(r, length, 4, seg);
export const ring = (r: number, tube: number, arc = Math.PI * 2, seg = 18) => new THREE.TorusGeometry(r, tube, 6, seg, arc);
export const lathe = (profile: ReadonlyArray<readonly [number, number]>, seg = 18) =>
  new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg);

/** Box with a pinched top face: reads as bevelled for 12 triangles, for parts repeated by the hundred. */
export function tile(w: number, h: number, d: number, bevel = 0.016) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) pos.setXYZ(i, pos.getX(i) * (1 - (2 * bevel) / w), pos.getY(i), pos.getZ(i) * (1 - (2 * bevel) / d));
  }
  geo.computeVertexNormals();
  return geo;
}

/** Bakes transform and vertex colour into a throwaway primitive. */
export function paint(source: THREE.BufferGeometry, color: THREE.ColorRepresentation, place: Place = {}): THREE.BufferGeometry {
  const { at, rot, scale, shade = 0.16 } = place;
  const geo = source.index ? source.toNonIndexed() : source;
  if (geo !== source) source.dispose();
  geo.clearGroups();
  if (scale) geo.scale(...scale);
  if (rot) geo.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)));
  if (at) geo.translate(...at);
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox!;
  const span = max.y - min.y || 1;
  const base = new THREE.Color(color);
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const k = 1 - shade * (1 - (pos.getY(i) - min.y) / span);
    colors[i * 3] = base.r * k;
    colors[i * 3 + 1] = base.g * k;
    colors[i * 3 + 2] = base.b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = mergeGeometries(parts);
  if (!out) throw new Error('toyKit: parts have mismatched attributes');
  parts.forEach((p) => p.dispose());
  out.computeBoundingSphere();
  return out;
}

/** Lighter (amount > 0) or darker (amount < 0) variant of a colour. */
export function tone(color: THREE.ColorRepresentation, amount: number): THREE.Color {
  return new THREE.Color(color).lerp(new THREE.Color(amount > 0 ? '#ffffff' : '#000000'), Math.abs(amount));
}

const cache = new Map<string, unknown>();

/** Module-lifetime cache: geometries and materials are built once and never disposed. */
export function once<T>(key: string, build: () => T): T {
  let hit = cache.get(key) as T | undefined;
  if (hit === undefined) {
    hit = build();
    cache.set(key, hit);
  }
  return hit;
}

export type ToyFinish = 'matte' | 'gloss' | 'glow' | 'fog';

export function toyMaterial(finish: ToyFinish = 'matte'): THREE.Material {
  return once(`material:${finish}`, () => {
    if (finish === 'glow') return new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.5, 1.5, 1.5) });
    if (finish === 'gloss') return new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.12 });
    // 'fog' is the washed-out look of a locked district
    if (finish === 'fog') return new THREE.MeshStandardMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.5, roughness: 0.9 });
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      bumpMap: getCafeTextures().clayBump,
      bumpScale: 0.006,
    });
  });
}

const noRaycast = () => null;

/** Soft contact shadow that glues small objects to the ground; never takes pointer events. */
export function BlobShadow({ size, y = 0.004 }: { size: readonly [number, number]; y?: number }) {
  const geometry = once('blob:geometry', () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const material = once('blob:material', () => {
    const n = 32;
    const data = new Uint8Array(n * n * 4);
    for (let i = 0; i < n * n; i++) {
      const d = Math.hypot((i % n) - (n - 1) / 2, Math.floor(i / n) - (n - 1) / 2) / (n / 2);
      data[i * 4 + 3] = Math.round(255 * Math.max(0, 1 - d) ** 1.4);
    }
    const map = new THREE.DataTexture(data, n, n);
    map.magFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  });
  return <mesh geometry={geometry} material={material} position-y={y} scale={[size[0], 1, size[1]]} raycast={noRaycast} />;
}
