import { describe, expect, it } from 'vitest';
import { CURIOSITY_CATALOG, getCuriosityChoices } from '../../domain/curiosityCatalog';
import {
  ACTIVE_WORLD_MAPS,
  lotBox,
  resolveObstacleCollision,
  WORLD_MAP_REGISTRY,
} from '../worldNavigation';

describe('worldNavigation & WorldGraph registry', () => {
  it('keeps every registered map defaultSpawn strictly inside its walkable bounds', () => {
    for (const config of Object.values(WORLD_MAP_REGISTRY)) {
      const { defaultSpawn, bounds, shadowFrustum } = config;
      expect(defaultSpawn.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(defaultSpawn.x).toBeLessThanOrEqual(bounds.maxX);
      expect(defaultSpawn.z).toBeGreaterThanOrEqual(bounds.minZ);
      expect(defaultSpawn.z).toBeLessThanOrEqual(bounds.maxZ);
      expect(shadowFrustum.right).toBeGreaterThan(shadowFrustum.left);
      expect(shadowFrustum.top).toBeGreaterThan(shadowFrustum.bottom);
    }
    expect(ACTIVE_WORLD_MAPS).toContain('town');
    expect(ACTIVE_WORLD_MAPS).toContain('interior_house_leo');
    expect(ACTIVE_WORLD_MAPS).toContain('farm');
  });

  it('slides cleanly along AABB obstacles and honors custom blockers (rivers/walls)', () => {
    const obstacles = [lotBox(0, 0, 1.0, 1.0)];
    // Approaching from West (-1.2 -> -0.5) slides along Z while clamping X
    const [sx, sz] = resolveObstacleCollision(-0.5, 0.25, -1.2, 0.0, obstacles);
    expect(sx).toBe(-1.2);
    expect(sz).toBe(0.25);

    // Custom water blocker stops crossing river
    const riverBlocker = (x: number) => x > 9.5 && x < 11.7;
    const [rx, rz] = resolveObstacleCollision(10.0, 2.0, 9.2, 1.5, [], riverBlocker);
    expect(rx).toBe(9.2);
    expect(rz).toBe(2.0);
  });

  it('provides 3 distinct curiosity choices for new home and farm categories', () => {
    const homeItems = Object.values(CURIOSITY_CATALOG).filter((i) => i.category === 'home');
    const farmItems = Object.values(CURIOSITY_CATALOG).filter((i) => i.category === 'farm');
    expect(homeItems.length).toBeGreaterThanOrEqual(3);
    expect(farmItems.length).toBeGreaterThanOrEqual(3);
    expect(getCuriosityChoices(homeItems[0])).toHaveLength(3);
    expect(getCuriosityChoices(farmItems[0])).toHaveLength(3);
  });
});
