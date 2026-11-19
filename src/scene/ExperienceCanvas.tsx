import { useLayoutEffect, useRef, type ComponentRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
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
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const desiredPosRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].position));
  const desiredTargetRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].target));
  const targetRef = useRef(new THREE.Vector3(...CAMERA_ANCHORS[anchorId].target));
  const isTransitioningRef = useRef(true);

  useLayoutEffect(() => {
    const pose = CAMERA_ANCHORS[anchorId];
    desiredPosRef.current.set(pose.position[0], pose.position[1], pose.position[2]);
    desiredTargetRef.current.set(pose.target[0], pose.target[1], pose.target[2]);
    isTransitioningRef.current = true;
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [anchorId, orbitEnabled]);

  useFrame((_, delta) => {
    if (!orbitEnabled || isTransitioningRef.current) {
      const dt = Math.min(delta, 0.05);
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosRef.current.x, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosRef.current.y, 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosRef.current.z, 5, dt);

      targetRef.current.x = THREE.MathUtils.damp(targetRef.current.x, desiredTargetRef.current.x, 6, dt);
      targetRef.current.y = THREE.MathUtils.damp(targetRef.current.y, desiredTargetRef.current.y, 6, dt);
      targetRef.current.z = THREE.MathUtils.damp(targetRef.current.z, desiredTargetRef.current.z, 6, dt);

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
      enablePan={false}
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

  const bgColor = isConstellation ? '#0a1024' : '#f3e5cf';

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{ position: [5.4, 4.6, 6.2], fov: 42 }}
    >
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, isConstellation ? 14 : 8.2, isConstellation ? 34 : 20]} />

      {/* Studio & warm café IBL reflections (no external HDR download required) */}
      <Environment resolution={256} frames={1} environmentIntensity={isConstellation ? 0.55 : 0.72}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fff4de"
          position={[0, 5, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="circle"
          intensity={1.8}
          color="#ffe0b2"
          position={[4, 2.5, 3]}
          scale={3.5}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#dbeafe"
          position={[-5, 2.5, -2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#9c6644"
          position={[0, -3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
      </Environment>

      {/* Warm sky-to-wood bounce lighting */}
      <hemisphereLight
        args={[
          isConstellation ? '#93c5fd' : '#fff6e6',
          isConstellation ? '#1e1b4b' : '#8b5e3c',
          isConstellation ? 0.5 : 0.85,
        ]}
      />

      {/* Key sunlight with wide shadow frustum and acne-free bias */}
      <directionalLight
        position={[4.2, 6.4, 4.6]}
        intensity={isConstellation ? 0.8 : 1.55}
        color="#ffe9c7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-normalBias={0.025}
        shadow-bias={-0.0002}
        shadow-radius={3}
      />

      {/* Subtle cool rim light separating characters & glazed ceramics from the warm wall */}
      <directionalLight
        position={[-4.5, 3.2, -3.2]}
        intensity={isConstellation ? 0.65 : 0.42}
        color={isConstellation ? '#c4b5fd' : '#dbeafe'}
      />

      {/* Warm overhead café pendant fill light */}
      {isLesson && (
        <pointLight
          position={[0, 2.15, 0.25]}
          intensity={2.6}
          distance={6}
          decay={2}
          color="#ffd08a"
        />
      )}

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
