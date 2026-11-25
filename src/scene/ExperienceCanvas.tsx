import { lazy, memo, Suspense, useEffect, useLayoutEffect, useRef, useState, type ComponentRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { HintMode, LessonPhase } from '../domain/lessonEngine';
import type {
  AvatarStyle,
  CafeCycleId,
  CameraAnchorId,
  ConceptId,
  LeoAnimation,
  LocationId,
  LocationStatus,
  PropName,
  SpeechKey,
  WorldMapId,
} from '../domain/types';
import type { SpeechClockRef } from '../services/audioPlayer';
import { CAMERA_ANCHORS, type AssetMode } from './contracts';
import { AtmosphericSky } from './AtmosphericSky';
import { CafeDynamicSession } from './CafeDynamicSession';
import { CafeScene } from './CafeScene';
import { LeoBarista } from './LeoBarista';
import { MarketScene, type MarketStage } from './MarketScene';
import { NeighborhoodMap } from './NeighborhoodMap';
import { PharmacyScene } from './PharmacyScene';
import { PizzeriaScene } from './PizzeriaScene';
import { PlazaScene, type PlazaStage } from './PlazaScene';
import {
  WORLD_MAP_REGISTRY,
  type AvatarPose,
  type ShadowFrustumSpec,
} from './worldNavigation';

const InteriorHouseLeo = lazy(() => import('./maps/InteriorHouseLeo'));
const FarmBiomeMap = lazy(() => import('./maps/FarmBiomeMap'));

export type ActiveView = 'map' | 'lesson' | 'cafe_cycle' | 'market' | 'plaza' | 'pizzeria' | 'pharmacy' | 'badges';
export type CameraMode = 'fixed_2_5d' | 'overview';

export interface ExperienceCanvasProps {
  activeView: ActiveView;
  currentMapId?: WorldMapId;
  cameraSnapSeq?: number;
  cameraMode?: CameraMode;
  avatarStyle?: AvatarStyle;
  teleportRequest?: { x: number; z: number; yaw: number; seq: number } | null;
  assetMode: AssetMode;
  cameraAnchor: CameraAnchorId;
  cafeStatus: LocationStatus;
  locations?: Record<LocationId, LocationStatus>;
  timeOfDay?: 'day' | 'night';
  weather?: 'sunny' | 'rainy';
  phase: LessonPhase;
  leoAnim: LeoAnimation;
  speechRef: SpeechClockRef;
  highlightedProp: PropName | null;
  hintMode: HintMode;
  customerMood: 'cold' | 'warm' | null;
  activePourLiquid: 'coffee' | 'water' | null;
  pourProgressRef: MutableRefObject<number>;
  isPouringRef: MutableRefObject<boolean>;
  mysteryBoxVisible: boolean;
  streetDiscoveries?: readonly string[];
  activeQuestPosition?: { x: number; z: number; yaw: number } | null;
  activeCafeCycle?: Exclude<CafeCycleId, 'cafe_c1_drinks'>;
  marketStage?: MarketStage;
  plazaStage?: PlazaStage;
  onEnterCafe: () => void;
  onCompleteCafeCycle?: (cycleId: CafeCycleId, concepts: readonly ConceptId[]) => void;
  onEnterMarket?: () => void;
  onEnterPlaza?: () => void;
  onEnterPizzeria?: () => void;
  onCompletePizzeria?: () => void;
  onEnterPharmacy?: () => void;
  onCompletePharmacy?: () => void;
  onTravelToMap?: (target: WorldMapId, spawn?: AvatarPose) => void;
  onOpenWardrobe?: () => void;
  onMarketStageChange?: (stage: MarketStage) => void;
  onCompleteMarket?: () => void;
  onPlazaStageChange?: (stage: PlazaStage) => void;
  onCompletePlaza?: () => void;
  onExploreObject?: (key: SpeechKey) => void;
  onInspectCuriosity?: (curiosityId: string) => void;
  onMapBlockedBump?: () => void;
  onPropTap: (prop: PropName) => void;
  onPourStart: () => void;
  onPourEnd: () => void;
}

function CameraRig({
  anchorId,
  orbitEnabled,
  isMapView,
  cameraMode,
  cameraOffset,
  cameraTargetOffset,
  cameraSnapSeq,
  avatarPoseRef,
}: {
  anchorId: CameraAnchorId;
  orbitEnabled: boolean;
  isMapView: boolean;
  cameraMode: CameraMode;
  cameraOffset: readonly [number, number, number];
  cameraTargetOffset: readonly [number, number, number];
  cameraSnapSeq: number;
  avatarPoseRef: MutableRefObject<AvatarPose>;
}) {
  const { camera, size } = useThree();
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const desiredPosRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].position));
  const desiredTargetRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].target));
  const targetRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].target));
  const isTransitioningRef = useRef(true);
  const lastSnapSeqRef = useRef(cameraSnapSeq);

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    if (camera instanceof THREE.PerspectiveCamera) {
      const is25dMap = isMapView && cameraMode === 'fixed_2_5d';
      const baseFov = is25dMap ? 27 : 42;
      const responsiveFov = aspect < 1 ? Math.min(is25dMap ? 42 : 62, Math.round(baseFov / Math.pow(aspect, 0.45))) : baseFov;
      if (camera.fov !== responsiveFov) {
        camera.fov = responsiveFov;
        camera.updateProjectionMatrix();
      }
    }
    const pose = CAMERA_ANCHORS[anchorId];
    // Pull interior counter cameras back gently on portrait screens so outer counter props never crop
    const wide = anchorId === 'cam_servico' || anchorId === 'cam_salao'; // must keep the guests in frame
    const portraitZPullback = !isMapView && aspect < 1 ? (1 - aspect) * (wide ? 5.6 : 1.45) : 0;
    desiredPosRef.current.set(pose.position[0], pose.position[1], pose.position[2] + portraitZPullback);
    desiredTargetRef.current.set(pose.target[0], pose.target[1], pose.target[2]);
    isTransitioningRef.current = true;
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [anchorId, camera, isMapView, orbitEnabled, cameraMode, size.height, size.width]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (isMapView && cameraMode === 'fixed_2_5d') {
      if (controlsRef.current) controlsRef.current.enabled = false;
      const p = avatarPoseRef.current;
      // Fixed 3/4 oblique 2.5D camera driven by active WorldMapConfig
      desiredPosRef.current.set(
        p.x + cameraOffset[0],
        cameraOffset[1],
        p.z + cameraOffset[2],
      );
      desiredTargetRef.current.set(
        p.x + cameraTargetOffset[0],
        cameraTargetOffset[1],
        p.z + cameraTargetOffset[2],
      );
      if (lastSnapSeqRef.current !== cameraSnapSeq) {
        lastSnapSeqRef.current = cameraSnapSeq;
        camera.position.copy(desiredPosRef.current);
        targetRef.current.copy(desiredTargetRef.current);
      } else {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosRef.current.x, 7, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosRef.current.y, 7, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosRef.current.z, 7, dt);
        targetRef.current.x = THREE.MathUtils.damp(targetRef.current.x, desiredTargetRef.current.x, 8, dt);
        targetRef.current.y = THREE.MathUtils.damp(targetRef.current.y, desiredTargetRef.current.y, 8, dt);
        targetRef.current.z = THREE.MathUtils.damp(targetRef.current.z, desiredTargetRef.current.z, 8, dt);
      }
      camera.lookAt(targetRef.current);
      return;
    }

    if (!orbitEnabled || isTransitioningRef.current) {
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosRef.current.x, 6.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosRef.current.y, 6.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosRef.current.z, 6.5, dt);

      targetRef.current.x = THREE.MathUtils.damp(targetRef.current.x, desiredTargetRef.current.x, 7.5, dt);
      targetRef.current.y = THREE.MathUtils.damp(targetRef.current.y, desiredTargetRef.current.y, 7.5, dt);
      targetRef.current.z = THREE.MathUtils.damp(targetRef.current.z, desiredTargetRef.current.z, 7.5, dt);

      camera.lookAt(targetRef.current);

      if (
        orbitEnabled &&
        camera.position.distanceTo(desiredPosRef.current) < 0.08 &&
        targetRef.current.distanceTo(desiredTargetRef.current) < 0.08
      ) {
        isTransitioningRef.current = false;
        if (controlsRef.current) {
          controlsRef.current.target.copy(desiredTargetRef.current);
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      minDistance={6}
      maxDistance={42}
      maxPolarAngle={Math.PI * 0.45}
    />
  );
}

function DynamicKeyLight({
  isMap,
  isExteriorMap,
  cameraMode,
  avatarPoseRef,
  shadowFrustum,
  isNight,
  isRainy,
}: {
  isMap: boolean;
  isExteriorMap: boolean;
  cameraMode: CameraMode;
  avatarPoseRef: MutableRefObject<AvatarPose>;
  shadowFrustum: ShadowFrustumSpec;
  isNight: boolean;
  isRainy: boolean;
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const followAvatar = isMap && isExteriorMap && cameraMode === 'fixed_2_5d';

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    const cam = light.shadow.camera;
    if (followAvatar) {
      // Tight 19x19 frustum centered on the walking avatar (~4x sharper shadows in 2.5D mode)
      cam.left = -9.5;
      cam.right = 9.5;
      cam.top = 9.5;
      cam.bottom = -9.5;
      cam.far = 36;
    } else if (isMap) {
      cam.left = shadowFrustum.left;
      cam.right = shadowFrustum.right;
      cam.top = shadowFrustum.top;
      cam.bottom = shadowFrustum.bottom;
      cam.far = shadowFrustum.far;
      light.position.set(8.5, 14.0, 9.5);
      light.target.position.set(0, 0, 0);
      light.target.updateMatrixWorld();
    } else {
      // Tight frustum for counter scenes: ~5x sharper shadows without extra GPU cost
      cam.left = -2.6;
      cam.right = 2.6;
      cam.top = 2.6;
      cam.bottom = -1.5;
      cam.far = 12;
      light.position.set(8.5, 14.0, 9.5);
      light.target.position.set(0, 0, 0);
      light.target.updateMatrixWorld();
    }
    cam.updateProjectionMatrix();
  }, [isMap, followAvatar, shadowFrustum]);

  useFrame(() => {
    const light = lightRef.current;
    if (!light || !followAvatar) return;
    // Snap to shadow texel grid (19 / 2048) to prevent shadow-edge shimmer while walking
    const texel = 19 / 2048;
    const sx = Math.round(avatarPoseRef.current.x / texel) * texel;
    const sz = Math.round(avatarPoseRef.current.z / texel) * texel;
    light.position.set(sx + 8.5, 14.0, sz + 9.5);
    light.target.position.set(sx, 0, sz);
    light.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[8.5, 14.0, 9.5]}
      intensity={isNight ? 0.52 : isRainy ? 0.88 : 1.55}
      color={isNight ? '#bfd7ff' : isRainy ? '#dbeafe' : '#ffe9c7'}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-22}
      shadow-camera-right={22}
      shadow-camera-top={18}
      shadow-camera-bottom={-18}
      shadow-camera-near={0.5}
      shadow-camera-far={48}
      shadow-normalBias={0.03}
      shadow-bias={-0.0002}
      shadow-radius={3}
    />
  );
}

export const ExperienceCanvas = memo(function ExperienceCanvas(props: ExperienceCanvasProps) {
  const currentMapId: WorldMapId = props.currentMapId ?? 'town';
  const mapConfig = WORLD_MAP_REGISTRY[currentMapId] ?? WORLD_MAP_REGISTRY.town;
  const avatarPoseRef = useRef<AvatarPose>({ ...mapConfig.defaultSpawn });
  const cameraMode: CameraMode = props.cameraMode ?? 'fixed_2_5d';
  const isBadges = props.activeView === 'badges';
  const isMap = props.activeView === 'map' || isBadges;
  const isLesson = props.activeView === 'lesson';
  const isCafeCycle = props.activeView === 'cafe_cycle';
  const inCafe = isLesson || isCafeCycle;
  // Open every café scene with a ~2.6 s establishing shot of the room, then dolly to the counter.
  // In the lesson the room is shown again after each served guest (personal choice, micro echo),
  // because the counter close-up keeps the guests out of frame.
  const introKey = !inCafe
    ? ''
    : isLesson
      ? props.phase === 'personal_choice' || props.phase === 'micro_echo'
        ? props.phase
        : 'lesson'
      : String(props.activeCafeCycle);
  const [salonIntro, setSalonIntro] = useState(true);
  useEffect(() => {
    if (!introKey) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSalonIntro(false);
      return;
    }
    setSalonIntro(true);
    const id = window.setTimeout(() => setSalonIntro(false), 2600);
    return () => window.clearTimeout(id);
  }, [introKey]);
  const isMarket = props.activeView === 'market';
  const isPlaza = props.activeView === 'plaza';
  const isPizzeria = props.activeView === 'pizzeria';
  const isPharmacy = props.activeView === 'pharmacy';
  const isExteriorMap = isMap && mapConfig.kind === 'exterior';
  const isInteriorMap = isMap && mapConfig.kind === 'interior';
  const isOutdoor = isExteriorMap || isMarket || isPlaza;
  const isNightOutdoor = isOutdoor && props.timeOfDay === 'night';
  const isRainyOutdoor = isOutdoor && props.weather === 'rainy';

  const effectiveAnchor: CameraAnchorId = isMap
    ? 'cam_mapa'
    : inCafe && salonIntro
      ? 'cam_salao'
      : isCafeCycle
        ? 'cam_servico'
        : isPizzeria || isPharmacy
          ? 'cam_balcao'
          : isMarket
            ? 'cam_mercado'
            : isPlaza
              ? 'cam_praca'
              : props.cameraAnchor;

  const bgColor = isInteriorMap && mapConfig.bgColor
    ? mapConfig.bgColor
    : isNightOutdoor
      ? isRainyOutdoor
        ? '#141d33'
        : '#1b2642'
      : isRainyOutdoor
        ? '#9eb4c8'
        : '#f3e5cf';

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{ position: [5.4, 4.6, 6.2], fov: 42 }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.04 }}
    >
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 34, 72]} />

      <AtmosphericSky
        isNight={isNightOutdoor}
        isRainy={isRainyOutdoor}
        visible={isExteriorMap || isMarket || isPlaza}
      />

      {/* Adaptive Studio / Night / Rain IBL reflections (re-baked once on weather/time change) */}
      <Environment
        key={`${isNightOutdoor ? 'night' : 'day'}-${isRainyOutdoor ? 'rain' : 'clear'}`}
        resolution={256}
        frames={1}
        environmentIntensity={isNightOutdoor ? 0.34 : isRainyOutdoor ? 0.56 : 0.72}
      >
        <Lightformer
          form="rect"
          intensity={isNightOutdoor ? 1.15 : isRainyOutdoor ? 1.65 : 2.4}
          color={isNightOutdoor ? '#60a5fa' : isRainyOutdoor ? '#dbeafe' : '#fff4de'}
          position={[0, 5, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="circle"
          intensity={isNightOutdoor ? 0.9 : isRainyOutdoor ? 1.0 : 1.8}
          color={isNightOutdoor ? '#93c5fd' : '#ffe0b2'}
          position={[4, 2.5, 3]}
          scale={3.5}
        />
        <Lightformer
          form="rect"
          intensity={isNightOutdoor ? 0.85 : 1.1}
          color={isNightOutdoor ? '#3b82f6' : '#dbeafe'}
          position={[-5, 2.5, -2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={isNightOutdoor ? 0.35 : 0.7}
          color={isNightOutdoor ? '#1e293b' : '#9c6644'}
          position={[0, -3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
      </Environment>

      {/* Warm sky-to-wood bounce lighting */}
      <hemisphereLight
        args={[
          isNightOutdoor ? '#93c5fd' : '#fff6e6',
          isNightOutdoor ? '#1e1b4b' : '#8b5e3c',
          isNightOutdoor ? 0.45 : 0.85,
        ]}
      />

      {/* Key sunlight / moonlight / overcast rain light with dynamic per-map / avatar-following shadow frustum */}
      <DynamicKeyLight
        isMap={isMap}
        isExteriorMap={isExteriorMap}
        cameraMode={cameraMode}
        avatarPoseRef={avatarPoseRef}
        shadowFrustum={mapConfig.shadowFrustum}
        isNight={isNightOutdoor}
        isRainy={isRainyOutdoor}
      />

      {/* Subtle cool rim light separating characters & glazed ceramics from the warm wall */}
      <directionalLight
        position={[-4.5, 3.2, -3.2]}
        intensity={0.42}
        color="#dbeafe"
      />

      {/* Warm overhead pendant fill light (kept mounted to prevent shader recompilation hitch) */}
      <pointLight
        position={[0, 2.4, 0.14]}
        intensity={
          isLesson || isCafeCycle || isPizzeria || isPharmacy
            ? 2.8
            : isInteriorMap
              ? 3.2
              : (isMarket || isPlaza) && isNightOutdoor
                ? 2.2
                : 0
        }
        distance={10}
        decay={2}
        color="#ffd08a"
      />

      <CameraRig
        anchorId={effectiveAnchor}
        orbitEnabled={props.activeView === 'map' && cameraMode === 'overview'}
        isMapView={isMap}
        cameraMode={cameraMode}
        cameraOffset={mapConfig.cameraOffset}
        cameraTargetOffset={mapConfig.cameraTargetOffset}
        cameraSnapSeq={props.cameraSnapSeq ?? 0}
        avatarPoseRef={avatarPoseRef}
      />

      {isMap && currentMapId === 'town' && (
        <NeighborhoodMap
          cafeStatus={props.cafeStatus}
          locations={props.locations}
          streetDiscoveries={props.streetDiscoveries}
          activeQuestPosition={props.activeQuestPosition}
          timeOfDay={props.timeOfDay}
          weather={props.weather}
          visible={isMap}
          avatarStyle={props.avatarStyle}
          avatarPoseRef={avatarPoseRef}
          teleportRequest={props.teleportRequest}
          onEnterCafe={props.onEnterCafe}
          onEnterMarket={props.onEnterMarket}
          onEnterPlaza={props.onEnterPlaza}
          onEnterPizzeria={props.onEnterPizzeria}
          onEnterPharmacy={props.onEnterPharmacy}
          onTravelToMap={props.onTravelToMap}
          onExploreObject={props.onExploreObject}
          onInspectCuriosity={props.onInspectCuriosity}
          onMapBlockedBump={props.onMapBlockedBump}
        />
      )}

      {isMap && currentMapId === 'interior_house_leo' && (
        <Suspense fallback={null}>
          <InteriorHouseLeo
            visible={isMap}
            timeOfDay={props.timeOfDay}
            avatarStyle={props.avatarStyle}
            avatarPoseRef={avatarPoseRef}
            teleportRequest={props.teleportRequest}
            onExploreObject={props.onExploreObject}
            onInspectCuriosity={props.onInspectCuriosity}
            onOpenWardrobe={props.onOpenWardrobe}
            onTravelToMap={props.onTravelToMap ?? (() => {})}
          />
        </Suspense>
      )}

      {isMap && currentMapId === 'farm' && (
        <Suspense fallback={null}>
          <FarmBiomeMap
            visible={isMap}
            timeOfDay={props.timeOfDay}
            weather={props.weather}
            avatarStyle={props.avatarStyle}
            avatarPoseRef={avatarPoseRef}
            teleportRequest={props.teleportRequest}
            onExploreObject={props.onExploreObject}
            onInspectCuriosity={props.onInspectCuriosity}
            onTravelToMap={props.onTravelToMap ?? (() => {})}
          />
        </Suspense>
      )}

      {isMarket && (
        <MarketScene
          visible={isMarket}
          stage={props.marketStage ?? 'explore'}
          onStageChange={props.onMarketStageChange ?? (() => {})}
          onPlayAudio={props.onExploreObject ?? (() => {})}
          onComplete={props.onCompleteMarket ?? (() => {})}
        />
      )}

      {isPlaza && (
        <PlazaScene
          visible={isPlaza}
          stage={props.plazaStage ?? 'explore'}
          onStageChange={props.onPlazaStageChange ?? (() => {})}
          onPlayAudio={props.onExploreObject ?? (() => {})}
          onComplete={props.onCompletePlaza ?? (() => {})}
        />
      )}

      {isPizzeria && (
        <PizzeriaScene
          visible={isPizzeria}
          onPlayAudio={props.onExploreObject ?? (() => {})}
          onComplete={props.onCompletePizzeria ?? (() => {})}
        />
      )}

      {isPharmacy && (
        <PharmacyScene
          visible={isPharmacy}
          onPlayAudio={props.onExploreObject ?? (() => {})}
          onComplete={props.onCompletePharmacy ?? (() => {})}
        />
      )}

      {isLesson && (
        <CafeScene
          assetMode={props.assetMode}
        phase={props.phase}
        highlightedProp={props.highlightedProp}
        hintMode={props.hintMode}
        customerMood={props.customerMood}
        activePourLiquid={props.activePourLiquid}
        pourProgressRef={props.pourProgressRef}
        isPouringRef={props.isPouringRef}
        mysteryBoxVisible={props.mysteryBoxVisible}
        visible={isLesson}
        onPropTap={props.onPropTap}
        onPourStart={props.onPourStart}
        onPourEnd={props.onPourEnd}
        onGuestTap={props.onExploreObject}
      />
      )}

      {isCafeCycle && (
        <CafeDynamicSession
          visible={isCafeCycle}
          cycleId={props.activeCafeCycle ?? 'cafe_c2_food'}
          onPlayAudio={props.onExploreObject ?? (() => {})}
          onCompleteCycle={props.onCompleteCafeCycle ?? (() => {})}
        />
      )}

      {(isLesson || isCafeCycle) && (
        <LeoBarista
          assetMode={props.assetMode}
          animation={isCafeCycle ? 'idle_breathe' : props.leoAnim}
          speechRef={props.speechRef}
          visible={isLesson || isCafeCycle}
        />
      )}

      {/* Selective Bloom on emissive windows, oven fire, pharmacy cross, lamps & sun/moon + WebGL2 MSAA */}
      <EffectComposer multisampling={4}>
        <Bloom
          mipmapBlur
          luminanceThreshold={1.08}
          intensity={0.42}
          radius={0.62}
        />
      </EffectComposer>
    </Canvas>
  );
});
