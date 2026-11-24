import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AtmosphericSkyProps {
  isNight: boolean;
  isRainy: boolean;
  visible: boolean;
}

const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uBottomColor;
  varying vec3 vWorldPos;

  void main() {
    vec3 dir = normalize(vWorldPos);
    float h = dir.y;
    vec3 col = h >= 0.0
      ? mix(uHorizonColor, uTopColor, pow(clamp(h, 0.0, 1.0), 0.58))
      : mix(uHorizonColor, uBottomColor, pow(clamp(-h, 0.0, 1.0), 0.7));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function AtmosphericSky({ isNight, isRainy, visible }: AtmosphericSkyProps) {
  const starsRef = useRef<THREE.Points>(null);
  const ambientRef = useRef<THREE.Points>(null);

  const uniforms = useMemo(
    () => ({
      uTopColor: { value: new THREE.Color('#7bc5f0') },
      uHorizonColor: { value: new THREE.Color('#fce7c8') },
      uBottomColor: { value: new THREE.Color('#d6b993') },
    }),
    [],
  );

  // Deterministic starfield dome for night scenes
  const starGeo = useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(0.2 + rand() * 0.78);
      const r = 38;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Soft floating petals (sunny day) or glowing fireflies (night) along the street
  const ambientGeo = useMemo(() => {
    const count = 36;
    const positions = new Float32Array(count * 3);
    let seed = 4242;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 20;
      positions[i * 3 + 1] = 0.7 + rand() * 3.2;
      positions[i * 3 + 2] = -2.2 + rand() * 7.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!visible) return;
    const topTarget = isNight
      ? isRainy
        ? '#0b132b'
        : '#0f1b3d'
      : isRainy
        ? '#647d96'
        : '#6db9ec';
    const horizonTarget = isNight
      ? isRainy
        ? '#1c2541'
        : '#273c6e'
      : isRainy
        ? '#b8c8d8'
        : '#fce7c8';
    const bottomTarget = isNight ? '#111827' : isRainy ? '#8ea3b8' : '#dfc7a5';

    uniforms.uTopColor.value.set(topTarget);
    uniforms.uHorizonColor.value.set(horizonTarget);
    uniforms.uBottomColor.value.set(bottomTarget);

    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.008;
    }
    if (ambientRef.current && !isRainy) {
      const t = state.clock.elapsedTime;
      ambientRef.current.position.y = Math.sin(t * 0.9) * 0.14;
      ambientRef.current.position.x = Math.cos(t * 0.45) * 0.22;
    }
  });

  if (!visible) return null;

  return (
    <group name="Atmospheric_Sky_Dome">
      {/* Smooth vertical atmospheric gradient dome */}
      <mesh renderOrder={-10}>
        <sphereGeometry args={[46, 32, 20]} />
        <shaderMaterial
          vertexShader={SKY_VERTEX_SHADER}
          fragmentShader={SKY_FRAGMENT_SHADER}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Warm Glowing Sun (sunny daytime) */}
      {!isNight && !isRainy && (
        <group position={[14, 15, -26]}>
          <mesh>
            <sphereGeometry args={[2.1, 20, 20]} />
            <meshBasicMaterial color="#fffbeb" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[3.2, 20, 20]} />
            <meshBasicMaterial color="#fde68a" transparent opacity={0.28} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* Luminous Moon + Twinkling Stars (nighttime) */}
      {isNight && (
        <>
          <group position={[-12, 16, -26]}>
            <mesh>
              <sphereGeometry args={[1.65, 20, 20]} />
              <meshBasicMaterial color="#fef9c3" toneMapped={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[2.5, 20, 20]} />
              <meshBasicMaterial color="#93c5fd" transparent opacity={0.22} depthWrite={false} />
            </mesh>
          </group>
          <points ref={starsRef} geometry={starGeo}>
            <pointsMaterial
              color="#fef9c3"
              size={0.28}
              sizeAttenuation
              transparent
              opacity={isRainy ? 0.3 : 0.85}
              depthWrite={false}
            />
          </points>
        </>
      )}

      {/* Living ambient street particles: soft blossom petals by day, warm fireflies at night */}
      {!isRainy && (
        <points ref={ambientRef} geometry={ambientGeo}>
          <pointsMaterial
            color={isNight ? '#fde047' : '#fbcfe8'}
            size={isNight ? 0.14 : 0.11}
            sizeAttenuation
            transparent
            opacity={isNight ? 0.88 : 0.62}
            toneMapped={!isNight}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
