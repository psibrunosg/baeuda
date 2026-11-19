import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { LeoAnimation, VisemeId } from '../domain/types';
import { resolveActiveViseme, type SpeechClockRef } from '../services/audioPlayer';
import type { AssetMode } from './contracts';
import { ModelErrorBoundary } from './ModelErrorBoundary';

const VISEMES: readonly VisemeId[] = [
  'viseme_aa',
  'viseme_ee',
  'viseme_oo',
  'viseme_fv',
  'viseme_mbp',
];
const IDLE_CLIP: LeoAnimation = 'idle_breathe';

export interface LeoBaristaProps {
  assetMode: AssetMode;
  animation: LeoAnimation;
  speechRef: SpeechClockRef;
  position?: [number, number, number];
  visible?: boolean;
}

function LeoGlb({
  animation,
  speechRef,
  position = [0, 0, -0.72],
}: Omit<LeoBaristaProps, 'assetMode' | 'visible'>) {
  const groupRef = useRef<THREE.Group>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const { scene, animations } = useGLTF('/models/leo_barista.glb');
  const { actions, mixer } = useAnimations(animations, groupRef);

  const faceMesh = useMemo<THREE.Mesh | null>(() => {
    let found: THREE.Mesh | null = null;
    scene.traverse((obj) => {
      if (
        !found &&
        obj instanceof THREE.Mesh &&
        obj.morphTargetDictionary &&
        obj.morphTargetInfluences
      ) {
        found = obj;
      }
    });
    return found;
  }, [scene]);

  useEffect(() => {
    const next = actions[animation] || actions[IDLE_CLIP];
    if (!next || next === activeActionRef.current) return;

    const prev = activeActionRef.current;
    const isOneShot = animation !== IDLE_CLIP;

    next.reset();
    next.setLoop(isOneShot ? THREE.LoopOnce : THREE.LoopRepeat, isOneShot ? 1 : Infinity);
    next.clampWhenFinished = isOneShot;
    next.fadeIn(0.25).play();
    prev?.fadeOut(0.25);
    activeActionRef.current = next;

    if (!isOneShot) return;

    const onFinished = (e: { action: THREE.AnimationAction }) => {
      if (e.action !== next || !actions[IDLE_CLIP]) return;
      actions[IDLE_CLIP].reset().fadeIn(0.3).play();
      next.fadeOut(0.3);
      activeActionRef.current = actions[IDLE_CLIP];
    };

    mixer.addEventListener('finished', onFinished);
    return () => {
      mixer.removeEventListener('finished', onFinished);
    };
  }, [animation, actions, mixer]);

  useFrame((state, delta) => {
    if (!faceMesh || !faceMesh.morphTargetDictionary || !faceMesh.morphTargetInfluences) return;
    const dt = Math.min(delta, 0.05);
    const dict = faceMesh.morphTargetDictionary;
    const influences = faceMesh.morphTargetInfluences;

    const activeViseme = speechRef.isPlaying()
      ? resolveActiveViseme(speechRef.cues, speechRef.getCurrentTime())
      : null;

    for (const viseme of VISEMES) {
      const idx = dict[viseme];
      if (idx === undefined) continue;
      const target = viseme === activeViseme ? 0.85 : 0;
      influences[idx] = THREE.MathUtils.damp(influences[idx], target, 18, dt);
    }

    if ('blink' in dict) {
      const cycle = state.clock.elapsedTime % 3.5;
      const blinkTarget = cycle > 3.35 ? 1 : 0;
      influences[dict.blink] = THREE.MathUtils.damp(influences[dict.blink], blinkTarget, 24, dt);
    }
  });

  return <primitive ref={groupRef} object={scene} position={position} />;
}

function LeoGreybox({
  animation,
  speechRef,
  position = [0, 0, -0.72],
}: Omit<LeoBaristaProps, 'assetMode' | 'visible'>) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const browRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Gentle idle breathing
    if (rootRef.current) {
      const shiverX = animation === 'shiver_cold' ? Math.sin(t * 28) * 0.015 : 0;
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, position[0] + shiverX, 16, dt);
      rootRef.current.position.y = position[1] + Math.sin(t * 2.1) * 0.012;
    }

    // Head pose by animation
    if (headRef.current) {
      const nodX =
        animation === 'nod_thanks'
          ? Math.sin(t * 7) * 0.14
          : animation === 'blow_hot'
            ? 0.18
            : 0;
      const tiltZ =
        animation === 'surprised_happy'
          ? 0.12
          : animation === 'present_left'
            ? -0.08
            : animation === 'present_right'
              ? 0.08
              : 0;
      headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, nodX, 10, dt);
      headRef.current.rotation.z = THREE.MathUtils.damp(headRef.current.rotation.z, tiltZ, 8, dt);
    }

    // Arm poses matching Blender NLA tracks
    if (rightArmRef.current) {
      let targetRotX = 0.08;
      let targetRotZ = -0.18;
      if (animation === 'wave_hi' || animation === 'farewell_box') {
        targetRotX = -0.45;
        targetRotZ = -2.35 + Math.sin(t * 7.5) * 0.32;
      } else if (animation === 'ask_palm') {
        targetRotX = -0.85;
        targetRotZ = -0.25;
      } else if (animation === 'present_right') {
        targetRotX = -0.65;
        targetRotZ = -0.55;
      } else if (animation === 'surprised_happy') {
        targetRotX = -0.8;
        targetRotZ = -1.6;
      }
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(rightArmRef.current.rotation.x, targetRotX, 9, dt);
      rightArmRef.current.rotation.z = THREE.MathUtils.damp(rightArmRef.current.rotation.z, targetRotZ, 9, dt);
    }

    if (leftArmRef.current) {
      let targetRotX = 0.08;
      let targetRotZ = 0.18;
      if (animation === 'present_left') {
        targetRotX = -0.65;
        targetRotZ = 0.55;
      } else if (animation === 'surprised_happy') {
        targetRotX = -0.8;
        targetRotZ = 1.6;
      } else if (animation === 'blow_hot') {
        targetRotX = -0.72;
        targetRotZ = 0.35;
      }
      leftArmRef.current.rotation.x = THREE.MathUtils.damp(leftArmRef.current.rotation.x, targetRotX, 9, dt);
      leftArmRef.current.rotation.z = THREE.MathUtils.damp(leftArmRef.current.rotation.z, targetRotZ, 9, dt);
    }

    // Automatic blink every ~3.5s
    const cycle = t % 3.5;
    const eyeScaleY = cycle > 3.35 ? 0.12 : 1;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.damp(leftEyeRef.current.scale.y, eyeScaleY, 24, dt);
      rightEyeRef.current.scale.y = THREE.MathUtils.damp(rightEyeRef.current.scale.y, eyeScaleY, 24, dt);
    }

    // Eyebrows lift on surprise/curiosity
    if (browRef.current) {
      const targetY = animation === 'surprised_happy' || animation === 'ask_palm' ? 0.085 : 0.068;
      browRef.current.position.y = THREE.MathUtils.damp(browRef.current.position.y, targetY, 12, dt);
    }

    // Lip-sync driven by speechRef visemes (zero React re-renders)
    if (mouthRef.current) {
      const viseme = speechRef.isPlaying()
        ? resolveActiveViseme(speechRef.cues, speechRef.getCurrentTime())
        : null;

      let scaleX = 1.0;
      let scaleY = 0.25;
      if (viseme === 'viseme_aa') {
        scaleX = 1.1;
        scaleY = 1.25;
      } else if (viseme === 'viseme_ee') {
        scaleX = 1.45;
        scaleY = 0.55;
      } else if (viseme === 'viseme_oo') {
        scaleX = 0.65;
        scaleY = 1.15;
      } else if (viseme === 'viseme_fv') {
        scaleX = 1.15;
        scaleY = 0.42;
      } else if (viseme === 'viseme_mbp') {
        scaleX = 0.9;
        scaleY = 0.18;
      } else if (animation === 'nod_thanks' || animation === 'surprised_happy') {
        scaleX = 1.3;
        scaleY = 0.4;
      }

      mouthRef.current.scale.x = THREE.MathUtils.damp(mouthRef.current.scale.x, scaleX, 18, dt);
      mouthRef.current.scale.y = THREE.MathUtils.damp(mouthRef.current.scale.y, scaleY, 18, dt);
    }
  });

  return (
    <group ref={rootRef} name="Leo_Barista_Greybox" position={position}>
      {/* Torso + Olive Barista Apron */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.38, 8, 16]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.02, 0.16]} castShadow>
        <boxGeometry args={[0.34, 0.44, 0.14]} />
        <meshStandardMaterial color="#3d6b59" roughness={0.85} />
      </mesh>

      {/* Head + Face */}
      <group ref={headRef} position={[0, 1.52, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
        </mesh>
        {/* Cozy low-poly hair cap */}
        <mesh position={[0, 0.08, -0.02]} castShadow>
          <sphereGeometry args={[0.205, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#4a3122" roughness={0.88} />
        </mesh>
        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.068, 0.02, 0.18]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshStandardMaterial color="#1f2937" roughness={0.2} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.068, 0.02, 0.18]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshStandardMaterial color="#1f2937" roughness={0.2} />
        </mesh>
        {/* Eyebrows */}
        <group ref={browRef} position={[0, 0.068, 0.185]}>
          <mesh position={[-0.068, 0, 0]}>
            <boxGeometry args={[0.055, 0.014, 0.012]} />
            <meshStandardMaterial color="#4a3122" />
          </mesh>
          <mesh position={[0.068, 0, 0]}>
            <boxGeometry args={[0.055, 0.014, 0.012]} />
            <meshStandardMaterial color="#4a3122" />
          </mesh>
        </group>
        {/* Lip-sync mouth */}
        <mesh ref={mouthRef} position={[0, -0.075, 0.186]}>
          <boxGeometry args={[0.072, 0.05, 0.016]} />
          <meshStandardMaterial color="#7f2929" roughness={0.6} />
        </mesh>
      </group>

      {/* Left Arm (shoulder pivot) */}
      <group ref={leftArmRef} position={[-0.27, 1.24, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.28, 6, 12]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.062, 10, 10]} />
          <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
        </mesh>
      </group>

      {/* Right Arm (shoulder pivot) */}
      <group ref={rightArmRef} position={[0.27, 1.24, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.28, 6, 12]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <sphereGeometry args={[0.062, 10, 10]} />
          <meshStandardMaterial color="#f2c6a0" roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}

export function LeoBarista(props: LeoBaristaProps) {
  const { assetMode, visible = true, ...leoProps } = props;
  if (!visible) return null;

  const greybox = <LeoGreybox {...leoProps} />;
  if (assetMode === 'glb') {
    return (
      <ModelErrorBoundary fallback={greybox}>
        <Suspense fallback={greybox}>
          <LeoGlb {...leoProps} />
        </Suspense>
      </ModelErrorBoundary>
    );
  }

  return greybox;
}
