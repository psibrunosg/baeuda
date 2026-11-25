import { memo, useMemo, useState, type MutableRefObject } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { AvatarStyle, SpeechKey, WorldMapId } from '../../domain/types';
import { getCafeTextures } from '../cafeTextures';
import { PortalTrigger } from '../PortalTrigger';
import { WorldMapBase } from '../WorldMapBase';
import { lotBox, WORLD_MAP_REGISTRY, type Aabb, type AvatarPose } from '../worldNavigation';

export interface FarmBiomeMapProps {
  visible: boolean;
  timeOfDay?: 'day' | 'night';
  weather?: 'sunny' | 'rainy';
  avatarStyle?: AvatarStyle;
  avatarPoseRef?: MutableRefObject<AvatarPose>;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  onExploreObject?: (key: SpeechKey) => void;
  onInspectCuriosity?: (curiosityId: string) => void;
  onTravelToMap: (target: WorldMapId, spawn?: AvatarPose) => void;
}

const FARM_OBSTACLES: readonly Aabb[] = [
  lotBox(-6.5, -4.6, 2.3, 1.75), // Red Barn
  lotBox(-7.4, 4.4, 2.2, 1.65),  // Farm Pond
  lotBox(3.6, 4.0, 1.25, 0.9),   // Red Tractor
  lotBox(-1.6, -4.2, 1.0, 0.8),  // Cow Pasture
  lotBox(-2.2, 3.8, 0.95, 0.75), // Horse
];

export const FarmBiomeMap = memo(function FarmBiomeMap({
  visible,
  timeOfDay = 'day',
  weather = 'sunny',
  avatarStyle,
  avatarPoseRef,
  teleportRequest,
  onExploreObject,
  onInspectCuriosity,
  onTravelToMap,
}: FarmBiomeMapProps) {
  const textures = useMemo(() => getCafeTextures(), []);
  // 0 = soil, 1 = watered sprout, 2 = ripe harvestable crop
  const [cropStages, setCropStages] = useState<number[]>([0, 1, 0, 1, 0, 2]);
  const config = WORLD_MAP_REGISTRY.farm;

  const setPointer = () => {
    document.body.style.cursor = 'pointer';
  };
  const clearPointer = () => {
    document.body.style.cursor = 'auto';
  };

  return (
    <WorldMapBase
      config={config}
      obstacles={FARM_OBSTACLES}
      visible={visible}
      weather={weather}
      avatarStyle={avatarStyle}
      avatarPoseRef={avatarPoseRef}
      teleportRequest={teleportRequest}
      walkSpeed={3.2}
      onExploreObject={onExploreObject}
    >
      {({ onGroundWalkClick, onTriggerExplore }) => (
        <group name="Biome_Sunny_Farm">
          {/* Lush Rolling Farmland Plateau */}
          <mesh position={[0, -0.34, 0]} receiveShadow>
            <boxGeometry args={[26.4, 0.48, 20.4]} />
            <meshStandardMaterial color="#8f653f" bumpMap={textures.clayBump} bumpScale={0.015} roughness={0.95} />
          </mesh>
          <mesh position={[0, -0.05, 0]} receiveShadow onClick={onGroundWalkClick}>
            <boxGeometry args={[26.0, 0.12, 20.0]} />
            <meshStandardMaterial color="#9ec17a" bumpMap={textures.clayBump} bumpScale={0.012} roughness={0.94} />
          </mesh>

          {/* Warm Dirt Road from East Town Gate into Farmyard */}
          <mesh position={[2.8, 0.02, 0.2]} receiveShadow onClick={onGroundWalkClick}>
            <boxGeometry args={[18.8, 0.04, 2.2]} />
            <meshStandardMaterial color="#d2b48c" roughness={0.95} />
          </mesh>

          {/* ===== RED BARN (NORTHWEST) ===== */}
          <group
            position={[-6.5, 0.06, -4.6]}
            onClick={(e) => {
              e.stopPropagation();
              onTriggerExplore('farm_barn', [-6.5, 0.08, -2.5]);
            }}
            onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
            onPointerOut={clearPointer}
          >
            <RoundedBox args={[4.1, 2.4, 3.0]} radius={0.06} smoothness={2} position={[0, 1.2, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#b91c1c" bumpMap={textures.woodCrateBump} bumpScale={0.014} roughness={0.86} />
            </RoundedBox>
            {/* Gambrel Roof */}
            <RoundedBox args={[4.4, 0.34, 3.3]} radius={0.06} smoothness={2} position={[0, 2.52, 0]} castShadow>
              <meshStandardMaterial color="#5a3827" roughness={0.86} />
            </RoundedBox>
            <RoundedBox args={[3.4, 0.45, 2.6]} radius={0.06} smoothness={2} position={[0, 2.86, 0]} castShadow>
              <meshStandardMaterial color="#6b4226" roughness={0.86} />
            </RoundedBox>
            {/* White X-Trim Barn Doors facing South (+Z) */}
            <RoundedBox args={[1.45, 1.55, 0.1]} radius={0.03} smoothness={2} position={[0, 0.82, 1.52]} castShadow>
              <meshStandardMaterial color="#991b1b" roughness={0.82} />
            </RoundedBox>
            <mesh position={[0, 0.82, 1.59]} rotation={[0, 0, 0.78]}>
              <boxGeometry args={[0.1, 1.75, 0.04]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.82, 1.59]} rotation={[0, 0, -0.78]}>
              <boxGeometry args={[0.1, 1.75, 0.04]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.8} />
            </mesh>
            {/* Hayloft window */}
            <mesh position={[0, 1.95, 1.52]}>
              <planeGeometry args={[0.7, 0.55]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f59e0b"
                emissiveIntensity={timeOfDay === 'night' ? 1.5 : 0.4}
              />
            </mesh>
          </group>

          {/* ===== INTERACTIVE ANIMALS ===== */}
          {/* Spotted Friendly Cow (curiosity: farm_cow) */}
          <group
            position={[-1.6, 0.06, -4.2]}
            onClick={(e) => {
              e.stopPropagation();
              onInspectCuriosity?.('farm_cow');
              onTriggerExplore('farm_cow', [-1.6, 0.08, -3.1]);
            }}
            onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
            onPointerOut={clearPointer}
          >
            <RoundedBox args={[1.15, 0.65, 0.65]} radius={0.14} smoothness={2} position={[0, 0.62, 0]} castShadow>
              <meshStandardMaterial color="#fffbeb" roughness={0.88} />
            </RoundedBox>
            <RoundedBox args={[0.42, 0.42, 0.44]} radius={0.1} smoothness={2} position={[0.62, 0.82, 0]} castShadow>
              <meshStandardMaterial color="#fffbeb" roughness={0.88} />
            </RoundedBox>
            <RoundedBox args={[0.18, 0.22, 0.34]} radius={0.06} smoothness={2} position={[0.84, 0.72, 0]}>
              <meshStandardMaterial color="#fbcfe8" roughness={0.85} />
            </RoundedBox>
            {/* Black spots */}
            <mesh position={[-0.1, 0.72, 0.32]}>
              <sphereGeometry args={[0.16, 10, 10]} />
              <meshStandardMaterial color="#1f2937" roughness={0.9} />
            </mesh>
            {[[-0.36, 0.24, 0.2], [0.36, 0.24, 0.2], [-0.36, 0.24, -0.2], [0.36, 0.24, -0.2]].map(([lx, ly, lz], i) => (
              <mesh key={i} position={[lx, ly, lz]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.48, 8]} />
                <meshStandardMaterial color="#1f2937" roughness={0.9} />
              </mesh>
            ))}
          </group>

          {/* Two Chickens near the Barn (curiosity: farm_chicken) */}
          <group
            position={[-4.2, 0.06, -1.8]}
            onClick={(e) => {
              e.stopPropagation();
              onInspectCuriosity?.('farm_chicken');
              onTriggerExplore('farm_chicken', [-4.2, 0.08, -1.2]);
            }}
            onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
            onPointerOut={clearPointer}
          >
            {[[-0.32, 0], [0.38, 0.25]].map(([cx, cz], i) => (
              <group key={i} position={[cx, 0, cz]} rotation={[0, i === 0 ? 0.5 : -0.8, 0]}>
                <mesh position={[0, 0.22, 0]} castShadow>
                  <sphereGeometry args={[0.2, 12, 12]} />
                  <meshStandardMaterial color={i === 0 ? '#ffffff' : '#fef3c7'} roughness={0.85} />
                </mesh>
                <mesh position={[0.14, 0.38, 0]} castShadow>
                  <sphereGeometry args={[0.11, 10, 10]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.85} />
                </mesh>
                <mesh position={[0.24, 0.37, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <coneGeometry args={[0.045, 0.1, 8]} />
                  <meshStandardMaterial color="#f59e0b" roughness={0.6} />
                </mesh>
                <mesh position={[0.14, 0.49, 0]}>
                  <sphereGeometry args={[0.045, 8, 8]} />
                  <meshStandardMaterial color="#dc2626" roughness={0.6} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Tall Brown Horse (curiosity: farm_horse) */}
          <group
            position={[-2.2, 0.06, 3.8]}
            rotation={[0, 0.35, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onInspectCuriosity?.('farm_horse');
              onTriggerExplore('farm_horse', [-2.2, 0.08, 4.9]);
            }}
            onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
            onPointerOut={clearPointer}
          >
            <RoundedBox args={[1.25, 0.62, 0.56]} radius={0.14} smoothness={2} position={[0, 0.78, 0]} castShadow>
              <meshStandardMaterial color="#8b5a3c" roughness={0.85} />
            </RoundedBox>
            <RoundedBox args={[0.34, 0.62, 0.34]} radius={0.08} smoothness={2} position={[0.56, 1.15, 0]} rotation={[0, 0, -0.25]} castShadow>
              <meshStandardMaterial color="#7a4e32" roughness={0.85} />
            </RoundedBox>
            <RoundedBox args={[0.48, 0.28, 0.3]} radius={0.08} smoothness={2} position={[0.78, 1.32, 0]} castShadow>
              <meshStandardMaterial color="#8b5a3c" roughness={0.85} />
            </RoundedBox>
            {[[-0.4, 0.34, 0.18], [0.4, 0.34, 0.18], [-0.4, 0.34, -0.18], [0.4, 0.34, -0.18]].map(([lx, ly, lz], i) => (
              <mesh key={i} position={[lx, ly, lz]} castShadow>
                <cylinderGeometry args={[0.06, 0.055, 0.68, 8]} />
                <meshStandardMaterial color="#5a3827" roughness={0.9} />
              </mesh>
            ))}
          </group>

          {/* ===== INTERACTIVE 6-PLOT VEGETABLE GARDEN (NORTHEAST) ===== */}
          <group position={[4.2, 0.04, -3.8]}>
            {[
              [-1.8, -1.0], [0, -1.0], [1.8, -1.0],
              [-1.8, 0.8], [0, 0.8], [1.8, 0.8],
            ].map(([px, pz], idx) => {
              const stage = cropStages[idx];
              return (
                <group
                  key={idx}
                  position={[px, 0, pz]}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStage = (stage + 1) % 3;
                    setCropStages((prev) => prev.map((v, i) => (i === idx ? nextStage : v)));
                    onTriggerExplore(
                      nextStage === 2 ? 'farm_harvest' : 'farm_water_crop',
                      [4.2 + px, 0.08, -3.8 + pz + 0.9],
                    );
                  }}
                  onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
                  onPointerOut={clearPointer}
                >
                  <RoundedBox args={[1.45, 0.16, 1.15]} radius={0.04} smoothness={2} position={[0, 0.08, 0]} receiveShadow castShadow>
                    <meshStandardMaterial color={stage > 0 ? '#5c3d2e' : '#7c5338'} roughness={0.95} />
                  </RoundedBox>
                  {stage >= 1 && (
                    <group position={[0, 0.24, 0]}>
                      {[-0.36, 0, 0.36].map((cx, ci) => (
                        <group key={ci} position={[cx, 0, 0]}>
                          <mesh position={[0, stage === 2 ? 0.22 : 0.06, 0]} castShadow>
                            <cylinderGeometry args={[0.06, 0.09, stage === 2 ? 0.44 : 0.16, 8]} />
                            <meshStandardMaterial color="#16a34a" roughness={0.8} />
                          </mesh>
                          {stage === 2 && (
                            <mesh position={[0, 0.44, 0]} castShadow>
                              <sphereGeometry args={[0.11, 10, 10]} />
                              <meshStandardMaterial color={idx % 2 === 0 ? '#facc15' : '#f97316'} roughness={0.55} />
                            </mesh>
                          )}
                        </group>
                      ))}
                    </group>
                  )}
                </group>
              );
            })}
          </group>

          {/* ===== RED VINTAGE TRACTOR (SOUTHEAST) ===== */}
          <group
            position={[3.6, 0.06, 4.0]}
            onClick={(e) => {
              e.stopPropagation();
              onInspectCuriosity?.('farm_tractor');
              onTriggerExplore('farm_tractor', [3.6, 0.08, 5.1]);
            }}
            onPointerOver={(e) => { e.stopPropagation(); setPointer(); }}
            onPointerOut={clearPointer}
          >
            <RoundedBox args={[1.5, 0.62, 0.88]} radius={0.08} smoothness={2} position={[0, 0.56, 0]} castShadow>
              <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.2} />
            </RoundedBox>
            <RoundedBox args={[0.68, 0.68, 0.78]} radius={0.06} smoothness={2} position={[-0.36, 1.08, 0]} castShadow>
              <meshStandardMaterial color="#fef3c7" roughness={0.4} />
            </RoundedBox>
            {/* Big rear wheels */}
            {[-0.5, 0.5].map((wz, i) => (
              <mesh key={i} position={[-0.36, 0.38, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.36, 0.36, 0.18, 16]} />
                <meshStandardMaterial color="#1f2937" roughness={0.85} />
              </mesh>
            ))}
            {/* Front wheels */}
            {[-0.44, 0.44].map((wz, i) => (
              <mesh key={i} position={[0.52, 0.22, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.14, 14]} />
                <meshStandardMaterial color="#1f2937" roughness={0.85} />
              </mesh>
            ))}
          </group>

          {/* ===== FARM POND (SOUTHWEST) ===== */}
          <group position={[-7.4, 0.02, 4.4]}>
            <mesh scale={[1.3, 1, 0.95]} receiveShadow>
              <cylinderGeometry args={[1.7, 1.8, 0.08, 22]} />
              <meshStandardMaterial color="#d6cab6" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.05, 0]} scale={[1.22, 1, 0.88]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.6, 22]} />
              <meshPhysicalMaterial color="#38bdf8" roughness={0.12} clearcoat={0.9} />
            </mesh>
          </group>

          {/* ===== EAST GATE PORTAL BACK TO BAEUDA TOWN ===== */}
          <group position={[10.8, 0.06, 0.2]}>
            {[-1.2, 1.2].map((pz, i) => (
              <mesh key={i} position={[0.2, 0.55, pz]} castShadow>
                <boxGeometry args={[0.16, 1.1, 0.16]} />
                <meshStandardMaterial color="#7a4e32" roughness={0.88} />
              </mesh>
            ))}
          </group>
          <PortalTrigger
            position={[10.8, 0.04, 0.2]}
            color="#38bdf8"
            radius={0.58}
            avatarPoseRef={avatarPoseRef}
            enableProximity
            proximityRadius={0.82}
            onEnter={() =>
              onTravelToMap('town', { x: -16.4, y: 0.06, z: -0.5, yaw: Math.PI / 2 })
            }
          />
        </group>
      )}
    </WorldMapBase>
  );
});

export default FarmBiomeMap;
