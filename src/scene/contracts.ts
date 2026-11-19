import type * as THREE from 'three';
import type { CameraAnchorId, PropName } from '../domain/types';

export type AssetMode = 'greybox' | 'glb';

export interface CameraPose {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

export const CAMERA_ANCHORS: Record<CameraAnchorId, CameraPose> = {
  cam_mapa: { position: [5.4, 4.6, 6.2], target: [0, 0.7, 0] },
  cam_balcao: { position: [0, 1.64, 2.38], target: [0, 1.24, -0.35] },
  cam_contraste: { position: [0, 1.62, 2.26], target: [-0.08, 1.18, -0.15] },
  cam_despejo: { position: [0.14, 1.66, 1.82], target: [0.04, 1.1, 0.08] },
  cam_caixa: { position: [0.35, 1.62, 2.05], target: [0.06, 1.14, 0.08] },
  cam_constelacao: { position: [0, 7.15, 5.45], target: [0, 6.85, 0] },
};

const VALID_PROPS = new Set<string>([
  'prop_cafe_door',
  'prop_cup_empty',
  'prop_cup_hot',
  'prop_jar_coffee',
  'prop_water_cold',
  'prop_iced_coffee',
  'prop_box_mystery',
]);

export function findPropName(object: THREE.Object3D | null): PropName | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name && current.name.startsWith('prop_') && VALID_PROPS.has(current.name)) {
      return current.name as PropName;
    }
    current = current.parent;
  }
  return null;
}
