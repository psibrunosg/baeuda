/** Shared architecture for houses and shopfronts: shingled roofs, scalloped awnings, window joinery. */
import * as THREE from 'three';
import { ball, box, cyl, merge, once, paint, rbox, ring, tile, tone, toyMaterial, type Vec3 } from './toyKit';

const HALF = Math.PI / 2;
const CREAM = '#f6ead3';

type Parts = THREE.BufferGeometry[];

/** Stepped, tiled hip roof over a cornice, plus pale corner posts when bodyHeight is given. */
export function roofGeometry(width: number, depth: number, color: string, bodyHeight = 0) {
  return once(`roof:${width}:${depth}:${color}:${bodyHeight}`, () => {
    const parts: Parts = [paint(rbox(width, 0.085, depth, 0.025), CREAM, { at: [0, -0.078, 0], shade: 0.25 })];
    for (let k = 0; k < 4; k++) {
      const w = width + 0.07 - k * 0.13;
      const d = depth + 0.07 - k * 0.13;
      const y = -0.03 + k * 0.048;
      parts.push(paint(box(w - 0.06, 0.06, d - 0.06), tone(color, -0.28), { at: [0, y, 0] }));
      // overlapping tiles along all four eaves, alternating shades
      for (const [len, across, alongX] of [[w, d, true], [d, w, false]] as const) {
        const n = Math.max(3, Math.round(len / 0.19));
        const step = len / n;
        for (let i = 0; i < n; i++) {
          const u = -len / 2 + step * (i + 0.5);
          for (const side of [-1, 1]) {
            const v = side * (across / 2 - 0.045);
            parts.push(
              paint(tile(alongX ? step - 0.012 : 0.1, 0.045, alongX ? 0.1 : step - 0.012), tone(color, ((i + k) % 3) * 0.07 - 0.04), {
                at: alongX ? [u, y + 0.012, v] : [v, y + 0.012, u],
              }),
            );
          }
        }
      }
    }
    parts.push(paint(box(width - 0.46, 0.05, depth - 0.46), tone(color, -0.24), { at: [0, 0.15, 0] }));
    // flat tiles over the deck, laid like brickwork
    const rows = Math.round((depth - 0.46) / 0.19);
    const cols = Math.round((width - 0.46) / 0.27);
    const rowD = (depth - 0.46) / rows;
    const colW = (width - 0.46) / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols + (r % 2); c++) {
        const from = Math.max(0, c - (r % 2) * 0.5) * colW;
        const to = Math.min(cols, c + 1 - (r % 2) * 0.5) * colW;
        parts.push(
          paint(tile(to - from - 0.012, 0.024, rowD - 0.012, 0.01), tone(color, ((r * 2 + c) % 4) * 0.035 - 0.02), {
            at: [-(width - 0.46) / 2 + (from + to) / 2, 0.18, -(depth - 0.46) / 2 + rowD * (r + 0.5)],
            shade: 0,
          }),
        );
      }
    }
    if (bodyHeight > 0) {
      for (const x of [-1, 1]) {
        for (const z of [-1, 1]) {
          const px = x * (width / 2 - 0.1);
          const pz = z * (depth / 2 - 0.09);
          parts.push(
            paint(rbox(0.13, bodyHeight, 0.11, 0.03), CREAM, { at: [px, -0.1 - bodyHeight / 2, pz], shade: 0.28 }),
            paint(rbox(0.17, 0.07, 0.15, 0.02), CREAM, { at: [px, -0.15, pz] }),
          );
        }
      }
    }
    return merge(parts);
  });
}

/** position is the centre of the flat slab this roof replaces. */
export function ToyRoof({ position, width, depth, color, bodyHeight }: { position: Vec3; width: number; depth: number; color: string; bodyHeight?: number }) {
  return <mesh geometry={roofGeometry(width, depth, color, bodyHeight)} material={toyMaterial()} position={[...position]} castShadow receiveShadow />;
}

/** Striped canvas with a scalloped valance on the `front` (+1 = +z, -1 = -z) edge. */
export function awningGeometry(colors: readonly string[], stripe: number, depth: number, front: 1 | -1) {
  return once(`awning:${colors.join()}:${stripe}:${depth}:${front}`, () => {
    const parts: Parts = [];
    colors.forEach((color, i) => {
      const x = (i - (colors.length - 1) / 2) * stripe;
      const edge = front * (depth / 2);
      parts.push(
        paint(rbox(stripe + 0.004, 0.07, depth, 0.025), color, { at: [x, 0, 0], shade: 0.2 }),
        // rolled front seam
        paint(cyl(0.045, 0.045, stripe, 10), color, { rot: [0, 0, HALF], at: [x, -0.004, edge], shade: 0.25 }),
        paint(box(stripe - 0.006, 0.075, 0.025), color, { at: [x, -0.06, edge + front * 0.02], shade: 0.15 }),
        // scallop: half disc hanging from the valance
        paint(
          new THREE.CylinderGeometry(stripe / 2 - 0.003, stripe / 2 - 0.003, 0.024, 12, 1, false, -HALF, Math.PI).rotateX(HALF),
          color,
          { scale: [1, 0.62, 1], at: [x, -0.096, edge + front * 0.02], shade: 0.15 },
        ),
      );
    });
    return merge(parts);
  });
}

export function ToyAwning({ colors, stripe, depth, front, fogged = false }: { colors: readonly string[]; stripe: number; depth: number; front: 1 | -1; fogged?: boolean }) {
  return <mesh geometry={awningGeometry(colors, stripe, depth, front)} material={toyMaterial(fogged ? 'fog' : 'matte')} castShadow={!fogged} />;
}

/** Mullions, lintel and flower sill laid over an existing glowing pane. Origin at the pane centre. */
export function windowTrimGeometry(width: number, height: number, color: string = CREAM) {
  return once(`windowTrim:${width}:${height}:${color}`, () => {
    const panes = Math.max(2, Math.round(width / 0.42));
    const parts: Parts = [
      paint(rbox(width + 0.2, 0.08, 0.08, 0.02), color, { at: [0, height / 2 + 0.07, 0.005] }),
      paint(rbox(width + 0.22, 0.075, 0.14, 0.022), color, { at: [0, -height / 2 - 0.075, 0.035] }),
      paint(box(width, 0.028, 0.022), color, { at: [0, height * 0.17, 0], shade: 0 }),
    ];
    for (let i = 0; i <= panes; i++) {
      const outer = i === 0 || i === panes;
      parts.push(paint(box(outer ? 0.045 : 0.028, height + 0.04, outer ? 0.05 : 0.022), color, { at: [-width / 2 + (width / panes) * i, 0, 0], shade: 0.05 }));
    }
    // leaves and blooms spilling over the sill
    const n = Math.round(width / 0.16);
    for (let i = 0; i < n; i++) {
      const x = -width / 2 + (width / n) * (i + 0.5);
      parts.push(paint(ball(0.052, 6, 4), i % 2 ? '#4f8a4c' : '#67a05a', { scale: [1.2, 0.75, 0.8], at: [x, -height / 2 - 0.012, 0.06] }));
      if (i % 2 === 0) parts.push(paint(ball(0.025, 5, 3), i % 4 ? '#ffd23f' : '#f472b6', { at: [x + 0.02, -height / 2 + 0.025, 0.095], shade: 0 }));
    }
    return merge(parts);
  });
}

/** facing: +1 for panes looking toward +z, -1 toward -z. */
export function ToyWindowTrim({ position, width, height, facing, color }: { position: Vec3; width: number; height: number; facing: 1 | -1; color?: string }) {
  return (
    <mesh
      geometry={windowTrimGeometry(width, height, color)}
      material={toyMaterial()}
      position={[...position]}
      rotation={[0, facing === 1 ? 0 : Math.PI, 0]}
    />
  );
}

// ------------------------------------------------------------------ cottage

const EAVE_Y = 1.8;
const RIDGE_Y = 2.55;
const EAVE_Z = 1.04;

/**
 * Gabled cottage on a 2.15 x 1.72 footprint, front on +z.
 * `solid` is every opaque part; `glow` is the warm window glass.
 */
export function houseGeometry(wall: string, roof: string, door: string) {
  return once(`house:${wall}:${roof}:${door}`, () => {
    const gable = new THREE.Shape([new THREE.Vector2(-0.86, 0), new THREE.Vector2(0.86, 0), new THREE.Vector2(0, RIDGE_Y - EAVE_Y - 0.03)]);
    const parts: Parts = [
      paint(rbox(2.15, 1.85, 1.72, 0.05, 2), wall, { at: [0, 0.92, 0], shade: 0.18 }),
      paint(rbox(2.24, 0.2, 1.8, 0.04), '#cfc0a8', { at: [0, 0.1, 0], shade: 0.3 }),
      paint(new THREE.ExtrudeGeometry(gable, { depth: 2.15, bevelEnabled: false }).rotateY(HALF).translate(-1.075, 0, 0), wall, { at: [0, EAVE_Y, 0] }),
    ];
    const rise = RIDGE_Y - EAVE_Y;
    const slope = Math.atan2(rise, EAVE_Z);
    const rows = 5;
    const rowLen = Math.hypot(rise, EAVE_Z) / rows;
    for (const side of [-1, 1]) {
      for (let k = 0; k < rows; k++) {
        const u = (k + 0.5) / rows;
        const y = EAVE_Y + rise * u + 0.045;
        const z = side * EAVE_Z * (1 - u);
        parts.push(paint(box(2.34, 0.05, rowLen), tone(roof, -0.25), { rot: [side * slope, 0, 0], at: [0, y - 0.02, z] }));
        for (let i = 0; i < 11; i++) {
          // half-step offset between rows, like laid tiles
          const x = -1.1 + i * 0.22 + (k % 2) * 0.04 - 0.02;
          parts.push(paint(tile(0.212, 0.05, rowLen + 0.035, 0.02), tone(roof, ((i * 3 + k) % 4) * 0.055 - 0.05), { rot: [side * (slope - 0.07), 0, 0], at: [x, y + 0.012, z] }));
        }
      }
      // bargeboards down each gable
      for (const x of [-1.19, 1.19]) {
        parts.push(paint(rbox(0.07, 0.085, rowLen * rows + 0.05, 0.025), CREAM, { rot: [side * slope, 0, 0], at: [x, EAVE_Y + rise / 2 + 0.035, (side * EAVE_Z) / 2] }));
      }
    }
    parts.push(paint(cyl(0.065, 0.065, 2.44, 10), tone(roof, 0.12), { rot: [0, 0, HALF], at: [0, RIDGE_Y + 0.07, 0] }));
    // attic vents on the gables
    for (const x of [-1.085, 1.085]) parts.push(paint(ring(0.12, 0.03), CREAM, { rot: [0, HALF, 0], at: [x, 2.08, 0] }), paint(cyl(0.11, 0.11, 0.02, 16), '#5a4636', { rot: [0, 0, HALF], at: [x, 2.08, 0] }));
    // chimney
    parts.push(
      paint(box(0.27, 0.56, 0.27), '#a35a43', { at: [0.62, 2.47, -0.34], shade: 0.35 }),
      paint(rbox(0.35, 0.08, 0.35, 0.02), '#d9c6ab', { at: [0.62, 2.77, -0.34] }),
      paint(cyl(0.06, 0.07, 0.11, 10), '#6d3a2b', { at: [0.62, 2.86, -0.34] }),
    );
    const panes: Parts = [];
    for (const x of [-0.58, 0.58]) {
      panes.push(paint(box(0.38, 0.42, 0.02), '#fff0a8', { at: [x, 1.15, 0.872], shade: 0.3 }));
      for (const [w, h, y] of [[0.52, 0.075, 1.4], [0.52, 0.06, 0.92], [0.024, 0.42, 1.15], [0.38, 0.024, 1.18]]) {
        parts.push(paint(box(w, h, 0.07), CREAM, { at: [x, y, 0.88], shade: 0.05 }));
      }
      for (const s of [-1, 1]) {
        parts.push(paint(rbox(0.05, 0.46, 0.07, 0.012), CREAM, { at: [x + s * 0.215, 1.15, 0.88] }));
        // louvred shutters
        parts.push(paint(rbox(0.13, 0.46, 0.04, 0.015), door, { at: [x + s * 0.315, 1.15, 0.885] }));
        for (let j = 0; j < 4; j++) parts.push(paint(box(0.095, 0.022, 0.02), tone(door, 0.18), { at: [x + s * 0.315, 1.0 + j * 0.1, 0.91] }));
      }
      parts.push(paint(tile(0.54, 0.13, 0.17), '#8a5636', { at: [x, 0.82, 0.93] }));
      for (let j = 0; j < 5; j++) {
        parts.push(
          paint(ball(0.065, 6, 4), j % 2 ? '#4f8a4c' : '#6aa35c', { at: [x - 0.2 + j * 0.1, 0.9, 0.95] }),
          paint(ball(0.032, 5, 3), ['#f472b6', '#ffd23f', '#fb7185'][j % 3], { at: [x - 0.19 + j * 0.1, 0.945, 0.995], shade: 0 }),
        );
      }
    }
    // arched door with frame, panels, knob, step and canopy
    const arch = (r: number, h: number) => {
      const s = new THREE.Shape();
      s.moveTo(-r, 0);
      s.lineTo(r, 0);
      s.lineTo(r, h);
      s.absarc(0, h, r, 0, Math.PI, false);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 12 });
    };
    parts.push(
      paint(arch(0.31, 0.76), CREAM, { at: [0, 0.05, 0.84] }),
      paint(arch(0.245, 0.74), door, { at: [0, 0.07, 0.875] }),
      paint(rbox(0.3, 0.28, 0.03, 0.012), tone(door, 0.16), { at: [0, 0.34, 0.928] }),
      paint(ring(0.07, 0.016), CREAM, { at: [0, 0.74, 0.93] }),
      paint(cyl(0.062, 0.062, 0.012, 16), '#a9d8ef', { rot: [HALF, 0, 0], at: [0, 0.74, 0.928] }),
      paint(ball(0.032, 8, 6), '#facc15', { at: [0.15, 0.52, 0.945] }),
      paint(rbox(0.76, 0.1, 0.28, 0.03), '#d8cbb4', { at: [0, 0.05, 0.98] }),
      paint(rbox(0.66, 0.025, 0.3, 0.01), '#c49563', { at: [0, 0.012, 1.2] }),
    );
    // front garden bushes
    for (const [x, bloom] of [[-0.9, '#f472b6'], [0.9, '#ffd23f']] as const) {
      for (const [dx, dy, r] of [[0, 0, 0.19], [-0.13, -0.05, 0.13], [0.13, -0.04, 0.14]]) {
        parts.push(paint(ball(r, 10, 8), '#5d9256', { at: [x + dx, 0.17 + dy, 1.05], shade: 0.45 }));
      }
      for (const [dx, dy] of [[-0.09, 0.1], [0.05, 0.17], [0.13, 0.06]]) parts.push(paint(ball(0.035, 8, 6), bloom, { at: [x + dx, 0.17 + dy, 1.19], shade: 0 }));
    }
    return { solid: merge(parts), glow: merge(panes) };
  });
}

export function houseGlassMaterial(isNight: boolean) {
  return once(`houseGlass:${isNight}`, () => new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#f59e0b', emissiveIntensity: isNight ? 1.55 : 0.45, roughness: 0.25 }));
}
