import { describe, expect, it } from 'vitest';
import type { BufferGeometry } from 'three';
import { houseGeometry, roofGeometry, awningGeometry, windowTrimGeometry } from '../toyBuildings';
import { headGeometry, torsoGeometry, armGeometry, eyesGeometry, learnerGeometry } from '../toyCharacters';
import { merge, paint, rbox } from '../toyKit';
import * as props from '../toyProps';

const size = (g: BufferGeometry) => {
  g.computeBoundingBox();
  const { min, max } = g.boundingBox!;
  return { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z };
};

describe('toy town geometry kit', () => {
  it('never inflates thin rounded boxes', () => {
    expect(size(merge([paint(rbox(1, 0.02, 1, 0.05), '#fff')])).y).toBeCloseTo(0.02, 5);
  });

  it('builds every model with finite, coloured vertices', () => {
    const learner = learnerGeometry('#e09f3e', '#e05a47', '#292524', 'beret', 'bun');
    const house = houseGeometry('#fff', '#a00', '#00a');
    const all: BufferGeometry[] = [
      ...([0, 1, 2] as const).flatMap((style) => Object.values(props.carGeometry('#ef4444', style))),
      ...(['dog', 'cat'] as const).flatMap((kind) => Object.values(props.petGeometry(kind))),
      ...(['apple', 'banana', 'orange', 'strawberry', 'grapes', 'watermelon'] as const).map((k) => props.fruitCrateGeometry(k, '#f00')),
      ...Object.values(learner),
      house.solid,
      house.glow,
      ...(['none', 'toque', 'cap', 'hardhat', 'beret', 'sunhat', 'postal'] as const).map((hat) =>
        headGeometry({ skin: '#f3c6a5', hair: '#292524', hat, hatColor: '#fff' }),
      ),
      torsoGeometry('#00f', '#f00'),
      armGeometry('#00f', '#fc9'),
      eyesGeometry(0.128, 0.046, true, '#0f766e'),
      roofGeometry(2.6, 1.9, '#a00', 1.8),
      awningGeometry(['#f00', '#fff'], 0.4, 0.6, -1),
      windowTrimGeometry(1.2, 0.7),
      props.trafficPoleGeometry(), props.bicycleGeometry('#0f0'), props.treeTrunkGeometry(), props.treeCanopyGeometry(),
      props.bushGeometry(), props.flowerHeadGeometry(), props.flowerCenterGeometry(), props.flowerStemGeometry(),
      props.cloudGeometry(), props.birdBodyGeometry('#fff'), props.birdWingGeometry(1), props.birdWingGeometry(-1),
      props.chairGeometry(), props.tableGeometry(), props.salonMugGeometry(), props.pendantGeometry(),
      props.pottedPlantGeometry(), props.armchairGeometry(), props.streetlampGeometry(), props.counterGeometry(),
      props.wainscotGeometry(), props.rugTrimGeometry(), props.doorGeometry(), props.pictureGeometry(0.6, 0.4, '#abc'),
    ];
    for (const g of all) {
      const pos = g.getAttribute('position');
      expect(g.getAttribute('color').count).toBe(pos.count);
      expect(pos.array.every(Number.isFinite)).toBe(true);
    }
  });

  it('keeps cars inside the footprint the traffic logic assumes', () => {
    for (const style of [0, 1, 2] as const) {
      const s = size(props.carGeometry('#ef4444', style).body);
      expect(s.x).toBeLessThanOrEqual(0.98);
      expect(s.z).toBeLessThanOrEqual(0.5);
    }
  });
});
