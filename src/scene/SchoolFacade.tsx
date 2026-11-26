import { useRef } from 'react';
import * as THREE from 'three';
import { useMapFrame } from './mapVisibility';
import { houseGlassMaterial, ToyRoof } from './toyBuildings';
import { box, cyl, lathe, merge, once, paint, rbox, ring, toyMaterial } from './toyKit';

const HALF = Math.PI / 2;
const CREAM = '#f6ead3';
const WALL = '#e9a15b';
const TRIM = '#2a6f62';
const BRASS = '#d4a017';

/** Fits a 3.0 x 2.0 lot, front on +z. `solid` is every opaque part; `glow` is windows and clock face. */
export function schoolFacadeGeometry() {
  return once('schoolFacade', () => {
    const solid: THREE.BufferGeometry[] = [
      paint(rbox(2.72, 1.72, 1.66, 0.05, 2), WALL, { at: [0, 0.86, 0], shade: 0.2 }),
      paint(rbox(2.82, 0.22, 1.76, 0.04), '#cfc0a8', { at: [0, 0.11, 0], shade: 0.3 }),
      paint(box(2.76, 0.07, 1.7), CREAM, { at: [0, 1.03, 0] }),
      // clock gable over the door, with its own little roof and the school bell
      paint(rbox(0.9, 0.62, 0.34, 0.04), WALL, { at: [0, 2.18, 0.62] }),
      paint(new THREE.ConeGeometry(0.62, 0.34, 4).rotateY(Math.PI / 4).scale(1.2, 1, 0.46), TRIM, { at: [0, 2.66, 0.62] }),
      paint(cyl(0.014, 0.014, 0.1, 6), BRASS, { at: [0, 2.87, 0.62] }),
      paint(lathe([[0.001, 0.14], [0.05, 0.13], [0.07, 0.07], [0.085, 0.02], [0.12, 0]], 18), BRASS, { at: [0, 2.9, 0.62] }),
      paint(ring(0.21, 0.028, Math.PI * 2, 24), CREAM, { at: [0, 2.2, 0.8] }),
      paint(box(0.022, 0.14, 0.012), '#1e293b', { at: [0, 2.26, 0.815] }),
      paint(box(0.11, 0.022, 0.012), '#1e293b', { at: [0.045, 2.2, 0.815] }),
      // double door, frame, knobs and steps
      paint(rbox(0.7, 0.92, 0.06, 0.02), CREAM, { at: [0, 0.55, 0.84] }),
      ...[-0.145, 0.145].map((x) => paint(rbox(0.27, 0.82, 0.06, 0.015), TRIM, { at: [x, 0.51, 0.866] })),
      ...[-0.05, 0.05].map((x) => paint(box(0.03, 0.03, 0.03), BRASS, { at: [x, 0.5, 0.905] })),
      paint(rbox(1.0, 0.07, 0.15, 0.02), '#d8cbb4', { at: [0, 0.035, 0.915] }),
      paint(rbox(0.82, 0.07, 0.09, 0.02), '#d8cbb4', { at: [0, 0.095, 0.885] }),
      // open-book sign above the door
      paint(rbox(0.74, 0.28, 0.06, 0.02), CREAM, { at: [0, 1.31, 0.85] }),
      ...[-1, 1].map((s) => paint(rbox(0.25, 0.17, 0.025, 0.008), '#2563eb', { at: [s * 0.13, 1.31, 0.89], rot: [0, -s * 0.2, s * 0.08] })),
      ...[-1, 1].map((s) => paint(box(0.19, 0.12, 0.012), '#ffffff', { at: [s * 0.125, 1.32, 0.908], rot: [0, -s * 0.2, s * 0.08], shade: 0 })),
      // flag pole on the west corner of the roof
      paint(cyl(0.018, 0.018, 0.92, 8), '#cbd5e1', { at: [-1.1, 2.4, 0.4] }),
      paint(box(0.05, 0.05, 0.05), BRASS, { at: [-1.1, 2.88, 0.4] }),
    ];
    const glow: THREE.BufferGeometry[] = [paint(cyl(0.2, 0.2, 0.02, 24), '#fffbeb', { rot: [HALF, 0, 0], at: [0, 2.2, 0.795], shade: 0 })];
    for (const x of [-1.07, -0.62, 0.62, 1.07]) {
      for (const [y, h] of [[0.6, 0.52], [1.42, 0.42]] as const) {
        glow.push(paint(box(0.3, h, 0.02), '#fff0a8', { at: [x, y, 0.835], shade: 0.3 }));
        solid.push(
          paint(rbox(0.4, 0.06, 0.07, 0.015), CREAM, { at: [x, y + h / 2 + 0.03, 0.84] }),
          paint(rbox(0.42, 0.06, 0.1, 0.018), CREAM, { at: [x, y - h / 2 - 0.03, 0.85] }),
          paint(box(0.024, h, 0.04), CREAM, { at: [x, y, 0.85] }),
          ...[-1, 1].map((s) => paint(box(0.035, h, 0.05), CREAM, { at: [x + s * 0.165, y, 0.845] })),
        );
      }
    }
    return { solid: merge(solid), glow: merge(glow) };
  });
}

export function SchoolFacade({ position, isNight }: { position: [number, number, number]; isNight: boolean }) {
  const { solid, glow } = schoolFacadeGeometry();
  const flagRef = useRef<THREE.Group>(null);
  useMapFrame(({ clock }) => {
    if (flagRef.current) flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 2.3) * 0.28;
  });
  return (
    <group position={position}>
      <mesh geometry={solid} material={toyMaterial()} castShadow receiveShadow />
      <mesh geometry={glow} material={houseGlassMaterial(isNight)} />
      <ToyRoof position={[0, 1.83, 0]} width={2.86} depth={1.84} color="#9a3412" />
      <group ref={flagRef} position={[-1.1, 2.68, 0.4]}>
        <mesh position={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.38, 0.24, 0.012]} />
          <meshStandardMaterial color="#2563eb" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0, 0.008]}>
          <circleGeometry args={[0.065, 5]} />
          <meshStandardMaterial color="#fde68a" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
