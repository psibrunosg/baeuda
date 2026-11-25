import { memo, type MutableRefObject, type ReactNode } from 'react';
import type { AvatarStyle, SpeechKey } from '../domain/types';
import { PortalTrigger } from './PortalTrigger';
import { WorldMapBase } from './WorldMapBase';
import { lotBox, WORLD_MAP_REGISTRY, type Aabb, type AvatarPose } from './worldNavigation';

/** Furniture footprints inside the café (the counter blocks the staff side where Leo works). */
const CAFE_OBSTACLES: readonly Aabb[] = [
  lotBox(0, -0.5, 1.75, 1.05), // counter + staff area
  lotBox(-1.45, 1.25, 0.6, 0.85), // table 1 + guest chair
  lotBox(1.45, 1.45, 0.6, 0.85), // table 2 + guest chair
  lotBox(-0.8, 1.5, 0.25, 0.25), // spare chairs
  lotBox(0.8, 1.7, 0.25, 0.25),
  lotBox(2.4, -0.45, 0.5, 0.45), // reading armchair + guest
  lotBox(-3.0, 2.6, 0.32, 0.32), // plants
  lotBox(3.0, 2.7, 0.3, 0.3),
  lotBox(-3.0, -0.9, 0.3, 0.3),
];

interface CafeWalkRoomProps {
  visible: boolean;
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  onExploreObject?: (key: SpeechKey) => void;
  /** Leave through the front door back to the street. */
  onExit?: () => void;
  children: ReactNode;
}

/**
 * Same runtime as the town and Leo's house: 2.5D follow camera, a learner avatar you walk with
 * click or WASD, collisions with the furniture. The café scene and Leo are rendered inside it,
 * so every lesson and task happens in a room you move through, not a counter close-up.
 */
export const CafeWalkRoom = memo(function CafeWalkRoom({
  visible,
  avatarStyle,
  avatarPoseRef,
  onExploreObject,
  onExit,
  children,
}: CafeWalkRoomProps) {
  const config = WORLD_MAP_REGISTRY.interior_cafe;
  return (
    <WorldMapBase
      config={config}
      obstacles={CAFE_OBSTACLES}
      visible={visible}
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      walkSpeed={2.8}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick }) => (
        <group name="Cafe_Walk_Room">
          {/* invisible walk floor: tap anywhere on the boards to walk there */}
          <mesh position={[0, 0.02, 1.7]} rotation={[-Math.PI / 2, 0, 0]} onClick={onGroundWalkClick}>
            <planeGeometry args={[6.4, 6.6]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {children}

          {/* front doormat: step on it (or tap it) to go back out to the street */}
          <mesh position={[0, 0.03, 4.45]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.5, 0.5]} />
            <meshStandardMaterial color="#7c2d12" roughness={1} />
          </mesh>
          <PortalTrigger
            position={[0, 0.04, 4.45]}
            avatarPoseRef={avatarPoseRef}
            enableProximity
            onEnter={() => onExit?.()}
          />
        </group>
      )}
    </WorldMapBase>
  );
});
