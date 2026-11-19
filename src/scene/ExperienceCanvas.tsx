import { useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { HintMode, LessonPhase } from '../domain/lessonEngine';
import type {
  CameraAnchorId,
  ConceptId,
  ConceptNode,
  LeoAnimation,
  LocationStatus,
  PropName,
} from '../domain/types';
import type { SpeechClockRef } from '../services/audioPlayer';
import { CAMERA_ANCHORS, type AssetMode } from './contracts';
import { CafeScene } from './CafeScene';
import { Constellation3D } from './Constellation3D';
import { LeoBarista } from './LeoBarista';
import { NeighborhoodMap } from './NeighborhoodMap';

export type ActiveView = 'map' | 'lesson' | 'constellation';

export interface ExperienceCanvasProps {
  activeView: ActiveView;
  assetMode: AssetMode;
  cameraAnchor: CameraAnchorId;
  cafeStatus: LocationStatus;
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
  orbsLaunching: boolean;
  constellationNodes: Partial<Record<ConceptId, ConceptNode>>;
  selectedConcept: ConceptId | null;
  onEnterCafe: () => void;
  onPropTap: (prop: PropName) => void;
  onPourStart: () => void;
  onPourEnd: () => void;
  onSelectConcept: (id: ConceptId) => void;
}

function CameraRig({
  anchorId,
  orbitEnabled,
}: {
  anchorId: CameraAnchorId;
  orbitEnabled: boolean;
}) {
  const { camera } = useThree();
  const desiredPosRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].position));
  const targetRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].target));
  const lastAnchorRef = useRef<CameraAnchorId>(anchorId);
  const isTransitioningRef = useRef(true);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pose = CAMERA_ANCHORS[anchorId];
    desiredPosRef.current.set(pose.position[0], pose.position[1], pose.position[2]);

    if (lastAnchorRef.current !== anchorId) {
      lastAnchorRef.current = anchorId;
      isTransitioningRef.current = true;
    }

    if (!orbitEnabled || isTransitioningRef.current) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosRef.current.x, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosRef.current.y, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosRef.current.z, 5, dt);
      if (orbitEnabled && camera.position.distanceTo(desiredPosRef.current) < 0.08) {
        isTransitioningRef.current = false;
      }
    }

    targetRef.current.x = THREE.MathUtils.damp(targetRef.current.x, pose.target[0], 6, dt);
    targetRef.current.y = THREE.MathUtils.damp(targetRef.current.y, pose.target[1], 6, dt);
    targetRef.current.z = THREE.MathUtils.damp(targetRef.current.z, pose.target[2], 6, dt);

    if (!orbitEnabled) {
      camera.lookAt(targetRef.current);
    }
  });

  if (!orbitEnabled) return null;

  const pose = CAMERA_ANCHORS[anchorId];
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      target={[pose.target[0], pose.target[1], pose.target[2]]}
      minDistance={2.8}
      maxDistance={9.5}
      maxPolarAngle={Math.PI * 0.48}
    />
  );
}

export function ExperienceCanvas(props: ExperienceCanvasProps) {
  const isConstellation = props.activeView === 'constellation';
  const isMap = props.activeView === 'map';
  const isLesson = props.activeView === 'lesson';

  const effectiveAnchor: CameraAnchorId = isConstellation
    ? 'cam_constelacao'
    : isMap
      ? 'cam_mapa'
      : props.cameraAnchor;

  const bgColor = isConstellation ? '#0b1120' : '#f4e7d3';

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{ position: [5.4, 4.6, 6.2], fov: 42 }}
    >
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 8.5, 22]} />

      <ambientLight intensity={isConstellation ? 0.65 : 0.9} color="#fff7ed" />
      <directionalLight
        position={[3.5, 5.5, 4]}
        intensity={isConstellation ? 0.9 : 1.35}
        color="#ffe8c2"
        castShadow
      />
      <pointLight position={[0, 2.3, 0.2]} intensity={0.8} color="#ffd180" />

      <CameraRig anchorId={effectiveAnchor} orbitEnabled={isMap || isConstellation} />

      <NeighborhoodMap
        cafeStatus={props.cafeStatus}
        visible={isMap}
        onEnterCafe={props.onEnterCafe}
      />

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
      />

      <LeoBarista
        assetMode={props.assetMode}
        animation={props.leoAnim}
        speechRef={props.speechRef}
        visible={isLesson}
      />

      <Constellation3D
        nodes={props.constellationNodes}
        selectedConcept={props.selectedConcept}
        launchingOrbs={props.orbsLaunching}
        visible={isConstellation}
        onSelectConcept={props.onSelectConcept}
      />
    </Canvas>
  );
}
