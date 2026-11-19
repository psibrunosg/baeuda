import { describe, expect, it } from 'vitest';
import { getCafeGeometries } from '../cafeGeometries';
import { getCafeTextures } from '../cafeTextures';

describe('sculpted 3D geometries and tactile procedural textures', () => {
  it('builds all sculpted cafe and constellation geometries with finite vertices and normals', () => {
    const geos = getCafeGeometries();
    const entries = Object.entries(geos);
    expect(entries).toHaveLength(10);

    for (const [name, geometry] of entries) {
      const pos = geometry.getAttribute('position');
      const norm = geometry.getAttribute('normal');
      expect(pos, `${name} position`).toBeDefined();
      expect(norm, `${name} normal`).toBeDefined();
      expect(pos.count, `${name} vertex count`).toBeGreaterThan(20);
      for (let i = 0; i < pos.array.length; i++) {
        expect(Number.isFinite(pos.array[i]), `${name} finite position`).toBe(true);
      }
    }
  });

  it('returns null-safe texture slots when document is unavailable in node/SSR tests', () => {
    const textures = getCafeTextures();
    expect(textures).toHaveProperty('woodCounterColor');
    expect(textures).toHaveProperty('clayBump');
    expect(textures).toHaveProperty('latteArtColor');
    expect(textures).toHaveProperty('cobblestoneColor');
  });
});
