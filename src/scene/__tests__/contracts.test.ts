import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CAMERA_ANCHORS, findPropName } from '../contracts';

describe('scene contracts', () => {
  it('walks up the Object3D parent chain to find a prop_* name', () => {
    const root = new THREE.Group();
    root.name = 'ENV_Static';

    const cupGroup = new THREE.Group();
    cupGroup.name = 'prop_cup_hot';

    const rimMesh = new THREE.Mesh();
    rimMesh.name = 'CeramicRim_Material001';

    cupGroup.add(rimMesh);
    root.add(cupGroup);

    expect(findPropName(rimMesh)).toBe('prop_cup_hot');
    expect(findPropName(root)).toBeNull();
  });

  it('defines position and target tuples for every camera anchor', () => {
    const keys = [
      'cam_mapa',
      'cam_balcao',
      'cam_contraste',
      'cam_despejo',
      'cam_caixa',
      'cam_constelacao',
    ] as const;

    for (const key of keys) {
      expect(CAMERA_ANCHORS[key].position).toHaveLength(3);
      expect(CAMERA_ANCHORS[key].target).toHaveLength(3);
    }
  });
});
