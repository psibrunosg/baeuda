import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { LeoAnimation, VisemeId } from '../domain/types';
import { resolveActiveViseme, type SpeechClockRef } from '../services/audioPlayer';
import { getCafeTextures } from './cafeTextures';
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
        obj.morphTargetInfluences &&
        ('viseme_aa' in obj.morphTargetDictionary || 'blink' in obj.morphTargetDictionary)
      ) {
        found = obj;
      }
    });
    if (!found) {
      scene.traverse((obj) => {
        if (!found && obj instanceof THREE.Mesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
          found = obj;
        }
      });
    }
    return found;
  }, [scene]);

  useEffect(() => {
    const next = actions[animation] || actions[IDLE_CLIP];
    if (!next || next === activeActionRef.current) return;

    const prev = activeActionRef.current;
    const isOneShot = next !== actions[IDLE_CLIP] && animation !== IDLE_CLIP;

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
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const browRef = useRef<THREE.Group>(null);

  const textures = useMemo(() => getCafeTextures(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Gentle idle breathing + subtle shiver when demonstrating cold
    if (rootRef.current) {
      const shiverX = animation === 'shiver_cold' ? Math.sin(t * 28) * 0.015 : 0;
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, shiverX, 16, dt);
      rootRef.current.position.y = Math.sin(t * 2.1) * 0.014;
      rootRef.current.rotation.y = THREE.MathUtils.damp(
        rootRef.current.rotation.y,
        animation === 'present_left' ? -0.1 : animation === 'present_right' ? 0.1 : 0,
        6,
        dt,
      );
    }

    // Expressive head tilt & nod
    if (headRef.current) {
      const nodX =
        animation === 'nod_thanks'
          ? Math.sin(t * 7) * 0.13
          : animation === 'blow_hot'
            ? 0.17
            : Math.sin(t * 1.1) * 0.02;
      const tiltZ =
        animation === 'surprised_happy'
          ? 0.12
          : animation === 'present_left'
            ? -0.09
            : animation === 'present_right'
              ? 0.09
              : animation === 'wave_hi' || animation === 'farewell_box'
                ? 0.06
                : 0;
      headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, nodX, 10, dt);
      headRef.current.rotation.z = THREE.MathUtils.damp(headRef.current.rotation.z, tiltZ, 8, dt);
    }

    // Articulated arm poses matching Blender NLA tracks
    if (rightArmRef.current) {
      let targetRotX = 0.08;
      let targetRotZ = -0.18;
      if (animation === 'wave_hi' || animation === 'farewell_box') {
        targetRotX = -0.45;
        targetRotZ = -2.35 + Math.sin(t * 7.5) * 0.32;
      } else if (animation === 'ask_palm') {
        targetRotX = -0.88;
        targetRotZ = -0.24;
      } else if (animation === 'present_right') {
        targetRotX = -0.68;
        targetRotZ = -0.52;
      } else if (animation === 'surprised_happy') {
        targetRotX = -0.82;
        targetRotZ = -1.55;
      }
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(rightArmRef.current.rotation.x, targetRotX, 9, dt);
      rightArmRef.current.rotation.z = THREE.MathUtils.damp(rightArmRef.current.rotation.z, targetRotZ, 9, dt);
    }

    if (leftArmRef.current) {
      let targetRotX = 0.08;
      let targetRotZ = 0.18;
      if (animation === 'present_left') {
        targetRotX = -0.68;
        targetRotZ = 0.52;
      } else if (animation === 'surprised_happy') {
        targetRotX = -0.82;
        targetRotZ = 1.55;
      } else if (animation === 'blow_hot') {
        targetRotX = -0.74;
        targetRotZ = 0.36;
      }
      leftArmRef.current.rotation.x = THREE.MathUtils.damp(leftArmRef.current.rotation.x, targetRotX, 9, dt);
      leftArmRef.current.rotation.z = THREE.MathUtils.damp(leftArmRef.current.rotation.z, targetRotZ, 9, dt);
    }

    // Automatic blink every ~3.5s
    const cycle = t % 3.5;
    const eyeScaleY = cycle > 3.35 ? 0.1 : 1;
    if (leftEyeGroupRef.current && rightEyeGroupRef.current) {
      leftEyeGroupRef.current.scale.y = THREE.MathUtils.damp(leftEyeGroupRef.current.scale.y, eyeScaleY, 24, dt);
      rightEyeGroupRef.current.scale.y = THREE.MathUtils.damp(rightEyeGroupRef.current.scale.y, eyeScaleY, 24, dt);
    }

    // Eyebrows lift on surprise / curiosity
    if (browRef.current) {
      const targetOffsetY = animation === 'surprised_happy' || animation === 'ask_palm' ? 0.02 : 0;
      browRef.current.position.y = THREE.MathUtils.damp(browRef.current.position.y, targetOffsetY, 12, dt);
    }

    // Lip-sync driven by speechRef visemes (zero React re-renders)
    if (mouthRef.current) {
      const viseme = speechRef.isPlaying()
        ? resolveActiveViseme(speechRef.cues, speechRef.getCurrentTime())
        : null;

      let scaleX = 1.0;
      let scaleY = 0.28;
      if (viseme === 'viseme_aa') {
        scaleX = 1.08;
        scaleY = 1.28;
      } else if (viseme === 'viseme_ee') {
        scaleX = 1.48;
        scaleY = 0.58;
      } else if (viseme === 'viseme_oo') {
        scaleX = 0.65;
        scaleY = 1.18;
      } else if (viseme === 'viseme_fv') {
        scaleX = 1.15;
        scaleY = 0.44;
      } else if (viseme === 'viseme_mbp') {
        scaleX = 0.92;
        scaleY = 0.2;
      } else if (animation === 'nod_thanks' || animation === 'surprised_happy' || animation === 'wave_hi') {
        scaleX = 1.32;
        scaleY = 0.45;
      }

      mouthRef.current.scale.x = THREE.MathUtils.damp(mouthRef.current.scale.x, scaleX, 18, dt);
      mouthRef.current.scale.y = THREE.MathUtils.damp(mouthRef.current.scale.y, scaleY, 18, dt);
    }
  });

  return (
    <group name="Leo_Barista_Greybox" position={position}>
      <group ref={rootRef}>
        {/* Neck */}
        <mesh position={[0, 1.32, 0]} castShadow>
          <cylinderGeometry args={[0.078, 0.088, 0.14, 16]} />
          <meshStandardMaterial
            color="#f1c29b"
            bumpMap={textures.clayBump}
            bumpScale={0.004}
            roughness={0.82}
          />
        </mesh>

        {/* Cream Cotton Shirt Torso + Collar */}
        <mesh position={[0, 1.03, 0]} castShadow>
          <capsuleGeometry args={[0.215, 0.36, 10, 18]} />
          <meshStandardMaterial
            color="#f7ead6"
            bumpMap={textures.clayBump}
            bumpScale={0.006}
            roughnessMap={textures.clayRoughness}
            roughness={0.92}
          />
        </mesh>
        <mesh position={[0, 1.26, 0.02]} rotation={[0.12, 0, 0]} castShadow>
          <torusGeometry args={[0.102, 0.024, 10, 20]} />
          <meshStandardMaterial color="#fbf4e8" roughness={0.9} />
        </mesh>

        {/* Olive Barista Linen Apron (bib, skirt, straps, brass studs, pocket + wooden spoon) */}
        <RoundedBox args={[0.31, 0.44, 0.14]} radius={0.035} smoothness={4} position={[0, 1.01, 0.15]} castShadow>
          <meshStandardMaterial
            color="#355f4e"
            bumpMap={textures.clayBump}
            bumpScale={0.008}
            roughnessMap={textures.clayRoughness}
            roughness={0.95}
          />
        </RoundedBox>
        {/* Apron neck/shoulder straps */}
        <mesh position={[-0.1, 1.24, 0.12]} rotation={[0.15, 0, -0.08]} castShadow>
          <boxGeometry args={[0.036, 0.14, 0.025]} />
          <meshStandardMaterial color="#2b4f41" roughness={0.92} />
        </mesh>
        <mesh position={[0.1, 1.24, 0.12]} rotation={[0.15, 0, 0.08]} castShadow>
          <boxGeometry args={[0.036, 0.14, 0.025]} />
          <meshStandardMaterial color="#2b4f41" roughness={0.92} />
        </mesh>
        {/* Brass apron studs */}
        <mesh position={[-0.1, 1.18, 0.222]}>
          <sphereGeometry args={[0.013, 10, 10]} />
          <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0.1, 1.18, 0.222]}>
          <sphereGeometry args={[0.013, 10, 10]} />
          <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Front apron pocket + little wooden tasting spoon */}
        <RoundedBox args={[0.19, 0.11, 0.028]} radius={0.012} smoothness={3} position={[0, 0.94, 0.22]} castShadow>
          <meshStandardMaterial color="#2c5042" roughness={0.95} />
        </RoundedBox>
        <mesh position={[0.055, 1.01, 0.225]} rotation={[0, 0, -0.22]}>
          <capsuleGeometry args={[0.009, 0.075, 4, 8]} />
          <meshStandardMaterial color="#d4a373" roughness={0.75} />
        </mesh>

        {/* Expressive Tactile Head */}
        <group ref={headRef} position={[0, 1.54, 0]}>
          {/* Slightly sculpted oval head */}
          <mesh scale={[1.0, 1.04, 0.96]} castShadow>
            <sphereGeometry args={[0.205, 24, 24]} />
            <meshStandardMaterial
              color="#f3c6a0"
              bumpMap={textures.clayBump}
              bumpScale={0.0045}
              roughnessMap={textures.clayRoughness}
              roughness={0.82}
            />
          </mesh>

          {/* Ears */}
          <mesh position={[-0.2, -0.01, -0.01]} castShadow>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshStandardMaterial color="#eab890" roughness={0.84} />
          </mesh>
          <mesh position={[0.2, -0.01, -0.01]} castShadow>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshStandardMaterial color="#eab890" roughness={0.84} />
          </mesh>

          {/* Sculpted Cute Nose */}
          <mesh position={[0, -0.018, 0.2]} castShadow>
            <sphereGeometry args={[0.026, 12, 12]} />
            <meshStandardMaterial color="#e8b288" roughness={0.8} />
          </mesh>

          {/* Warm Soft Blush Cheeks */}
          <mesh position={[-0.112, -0.038, 0.162]} rotation={[0, -0.4, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color="#f29489" transparent opacity={0.45} roughness={0.9} />
          </mesh>
          <mesh position={[0.112, -0.038, 0.162]} rotation={[0, 0.4, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color="#f29489" transparent opacity={0.45} roughness={0.9} />
          </mesh>

          {/* Layered Sculpted Hair (Claybound clay-tuft silhouette) */}
          <group position={[0, 0.065, -0.015]}>
            <mesh castShadow>
              <sphereGeometry args={[0.214, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial
                color="#4b2e1e"
                bumpMap={textures.clayBump}
                bumpScale={0.008}
                roughness={0.88}
              />
            </mesh>
            {/* Front hair quiff tufts */}
            <mesh position={[-0.055, 0.145, 0.13]} rotation={[0.35, 0.15, 0.25]} castShadow>
              <capsuleGeometry args={[0.048, 0.075, 6, 12]} />
              <meshStandardMaterial color="#553523" bumpMap={textures.clayBump} bumpScale={0.007} roughness={0.88} />
            </mesh>
            <mesh position={[0.045, 0.155, 0.12]} rotation={[0.28, -0.18, -0.35]} castShadow>
              <capsuleGeometry args={[0.054, 0.085, 6, 12]} />
              <meshStandardMaterial color="#4b2e1e" bumpMap={textures.clayBump} bumpScale={0.007} roughness={0.88} />
            </mesh>
            <mesh position={[0.125, 0.095, 0.095]} rotation={[0.2, -0.3, -0.55]} castShadow>
              <capsuleGeometry args={[0.038, 0.06, 6, 10]} />
              <meshStandardMaterial color="#4b2e1e" roughness={0.88} />
            </mesh>
            {/* Back hair volume */}
            <mesh position={[0, -0.02, -0.065]} castShadow>
              <sphereGeometry args={[0.18, 16, 14]} />
              <meshStandardMaterial color="#42281a" roughness={0.9} />
            </mesh>
          </group>

          {/* Expressive Eyes with Glossy Specular Catchlights */}
          <group ref={leftEyeGroupRef} position={[-0.072, 0.024, 0.178]}>
            <mesh>
              <sphereGeometry args={[0.027, 14, 14]} />
              <meshStandardMaterial color="#1c1917" roughness={0.12} metalness={0.05} />
            </mesh>
            <mesh position={[0.009, 0.01, 0.022]}>
              <sphereGeometry args={[0.0085, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
          <group ref={rightEyeGroupRef} position={[0.072, 0.024, 0.178]}>
            <mesh>
              <sphereGeometry args={[0.027, 14, 14]} />
              <meshStandardMaterial color="#1c1917" roughness={0.12} metalness={0.05} />
            </mesh>
            <mesh position={[0.009, 0.01, 0.022]}>
              <sphereGeometry args={[0.0085, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Rounded Eyebrows */}
          <group position={[0, 0.078, 0.184]}>
            <group ref={browRef}>
              <mesh position={[-0.072, 0, 0]} rotation={[0, 0, 0.1]}>
                <capsuleGeometry args={[0.009, 0.04, 4, 8]} />
                <meshStandardMaterial color="#4b2e1e" roughness={0.9} />
              </mesh>
              <mesh position={[0.072, 0, 0]} rotation={[0, 0, -0.1]}>
                <capsuleGeometry args={[0.009, 0.04, 4, 8]} />
                <meshStandardMaterial color="#4b2e1e" roughness={0.9} />
              </mesh>
            </group>
          </group>

          {/* Lip-Sync Mouth */}
          <mesh ref={mouthRef} position={[0, -0.078, 0.184]}>
            <capsuleGeometry args={[0.022, 0.032, 6, 12]} />
            <meshStandardMaterial color="#8c2d2d" roughness={0.55} />
          </mesh>
        </group>

        {/* Left Arm (seamless shoulder cap + rolled sleeve + forearm + hand with thumb nub) */}
        <group ref={leftArmRef} position={[-0.222, 1.215, 0]}>
          <mesh position={[0, 0.005, 0]} castShadow>
            <sphereGeometry args={[0.078, 14, 14]} />
            <meshStandardMaterial color="#f7ead6" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.085, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.14, 8, 14]} />
            <meshStandardMaterial color="#f7ead6" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.16, 8, 12]} />
            <meshStandardMaterial color="#f2c49e" roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.36, 0.01]} castShadow>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#f2c49e" roughness={0.82} />
          </mesh>
          <mesh position={[0.044, -0.34, 0.03]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#f2c49e" roughness={0.82} />
          </mesh>
        </group>

        {/* Right Arm (seamless shoulder cap + rolled sleeve + forearm + hand with thumb nub) */}
        <group ref={rightArmRef} position={[0.222, 1.215, 0]}>
          <mesh position={[0, 0.005, 0]} castShadow>
            <sphereGeometry args={[0.078, 14, 14]} />
            <meshStandardMaterial color="#f7ead6" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.085, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.14, 8, 14]} />
            <meshStandardMaterial color="#f7ead6" bumpMap={textures.clayBump} bumpScale={0.005} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.16, 8, 12]} />
            <meshStandardMaterial color="#f2c49e" roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.36, 0.01]} castShadow>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#f2c49e" roughness={0.82} />
          </mesh>
          <mesh position={[-0.044, -0.34, 0.03]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#f2c49e" roughness={0.82} />
          </mesh>
        </group>
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
