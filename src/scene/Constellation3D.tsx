import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { ALL_CONCEPTS, ALL_CONSTELLATION_EDGES } from '../domain/constellation';
import type { AcquisitionStage, ConceptId, ConceptNode } from '../domain/types';
import { CONCEPT_VISUALS } from '../content/lesson1Cafe';
import { getCafeGeometries } from './cafeGeometries';

const CONSTELLATION_Y = 6.4;
const AMBIENT_STAR_COUNT = 110;
const STAR_PALETTE = ['#f8fafc', '#bae6fd', '#fef08a', '#e0e7ff'] as const;

interface ConstellationEdgeSegment {
  key: string;
  from: ConceptId;
  to: ConceptId;
  isContrast: boolean;
  primaryPoints: [[number, number, number], [number, number, number]];
  secondaryPoints?: [[number, number, number], [number, number, number]];
}

const ALL_EDGE_SEGMENTS: readonly ConstellationEdgeSegment[] = ALL_CONSTELLATION_EDGES.map((edge) => {
  const p1 = CONCEPT_VISUALS[edge.from].position3D;
  const p2 = CONCEPT_VISUALS[edge.to].position3D;
  const isContrast = edge.kind === 'contrast';
  return {
    key: `${edge.from}-${edge.to}`,
    from: edge.from,
    to: edge.to,
    isContrast,
    primaryPoints: [
      [p1[0], p1[1], p1[2]],
      [p2[0], p2[1], p2[2]],
    ],
    secondaryPoints: isContrast
      ? [
          [p1[0], p1[1] + 0.055, p1[2]],
          [p2[0], p2[1] + 0.055, p2[2]],
        ]
      : undefined,
  };
});

interface Constellation3DProps {
  nodes: Partial<Record<ConceptId, ConceptNode>>;
  selectedConcept: ConceptId | null;
  launchingOrbs: boolean;
  visible: boolean;
  onSelectConcept: (id: ConceptId) => void;
}

/**
 * Single draw-call InstancedMesh cosmic starfield giving depth behind the 6 concepts.
 */
function AmbientStarfield() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let seed = 4242;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < AMBIENT_STAR_COUNT; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 3.2 + rand() * 5.2;
      const y = (rand() - 0.5) * 5.6;
      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius - 1.2);
      dummy.scale.setScalar(0.45 + rand() * 0.95);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      color.set(STAR_PALETTE[Math.floor(rand() * STAR_PALETTE.length)]);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.025;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, AMBIENT_STAR_COUNT]}
      frustumCulled={false}
    >
      <octahedronGeometry args={[0.042, 0]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.82} />
    </instancedMesh>
  );
}

/**
 * Miniature 3D sculpture spinning inside each Constellation concept star.
 */
function ConceptMiniature({
  conceptId,
  color,
  emissiveIntensity,
}: {
  conceptId: ConceptId;
  color: string;
  emissiveIntensity: number;
}) {
  const geos = useMemo(() => getCafeGeometries(), []);

  switch (conceptId) {
    case 'cup':
      return (
        <group position={[0, -0.095, 0]} scale={1.18}>
          <mesh geometry={geos.mug}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.22} />
          </mesh>
          <mesh geometry={geos.mugHandle}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.22} />
          </mesh>
        </group>
      );
    case 'coffee':
      return (
        <group scale={1.12}>
          {/* Sculpted glossy coffee bean */}
          <mesh scale={[0.82, 1.18, 0.65]}>
            <sphereGeometry args={[0.13, 18, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.082]} rotation={[0, 0, 0.14]}>
            <capsuleGeometry args={[0.012, 0.17, 4, 8]} />
            <meshStandardMaterial color="#3b1d0f" roughness={0.5} />
          </mesh>
        </group>
      );
    case 'water':
      return (
        <mesh geometry={geos.droplet} scale={1.18}>
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.08}
            clearcoat={1}
          />
        </mesh>
      );
    case 'hot':
      return (
        <group scale={1.15}>
          <mesh geometry={geos.flame}>
            <meshStandardMaterial color="#f97316" emissive="#fb923c" emissiveIntensity={emissiveIntensity + 0.35} roughness={0.2} />
          </mesh>
          <mesh geometry={geos.flame} scale={0.52} position={[0, -0.04, 0.03]}>
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      );
    case 'cold':
      return (
        <group scale={1.1}>
          {/* Faceted 3-axis crystalline snowflake */}
          <mesh>
            <octahedronGeometry args={[0.13, 0]} />
            <meshPhysicalMaterial
              color="#7dd3fc"
              emissive="#38bdf8"
              emissiveIntensity={emissiveIntensity + 0.25}
              roughness={0.1}
              clearcoat={1}
            />
          </mesh>
          {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot, idx) => (
            <mesh key={idx} rotation={[0, 0, rot]}>
              <boxGeometry args={[0.028, 0.3, 0.028]} />
              <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      );
    case 'pour':
      return (
        <group scale={1.15}>
          <mesh geometry={geos.carafe} position={[0.03, -0.05, 0]} rotation={[0, 0, 0.65]} scale={0.68}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.22} />
          </mesh>
          <mesh geometry={geos.droplet} position={[-0.08, -0.1, 0]} scale={0.42}>
            <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.9} />
          </mesh>
        </group>
      );
    case 'apple':
      return (
        <group scale={1.1}>
          <mesh>
            <sphereGeometry args={[0.125, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.22} />
          </mesh>
          <mesh position={[0.03, 0.13, 0]} rotation={[0, 0, -0.5]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );
    case 'bread':
      return (
        <mesh rotation={[0, 0.3, Math.PI / 2]} scale={1.05}>
          <capsuleGeometry args={[0.075, 0.14, 8, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.45} />
        </mesh>
      );
    case 'big':
      return (
        <mesh>
          <dodecahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.25} />
        </mesh>
      );
    case 'small':
      return (
        <mesh>
          <dodecahedronGeometry args={[0.085, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.25} />
        </mesh>
      );
    case 'bird':
      return (
        <group scale={1.1}>
          <mesh>
            <sphereGeometry args={[0.11, 14, 14]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.25} />
          </mesh>
          <mesh position={[0.11, 0.03, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.035, 0.08, 6]} />
            <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.5} />
          </mesh>
        </group>
      );
    case 'music':
      return (
        <group scale={1.1}>
          <mesh position={[-0.04, -0.05, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
          </mesh>
          <mesh position={[0.02, 0.05, 0]}>
            <boxGeometry args={[0.025, 0.2, 0.025]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
          </mesh>
          <mesh position={[0.07, 0.13, 0]} rotation={[0, 0, -0.35]}>
            <boxGeometry args={[0.1, 0.03, 0.025]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
          </mesh>
        </group>
      );
    case 'fast':
      return (
        <mesh rotation={[0, 0, -0.3]}>
          <octahedronGeometry args={[0.145, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity + 0.2} roughness={0.2} />
        </mesh>
      );
    case 'slow':
      return (
        <mesh>
          <torusGeometry args={[0.11, 0.038, 10, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.25} />
        </mesh>
      );
  }
}

function StarNode({
  conceptId,
  stage,
  selected,
  onSelect,
}: {
  conceptId: ConceptId;
  stage: AcquisitionStage;
  selected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const voiceOrbitRef = useRef<THREE.Mesh>(null);
  const meta = CONCEPT_VISUALS[conceptId];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const offset = meta.position3D[0] * 1.7 + meta.position3D[1];
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.5 + offset) * 0.06;
      groupRef.current.rotation.y = t * (stage === 'voice' ? 0.85 : 0.45);
    }
    if (auraRef.current && stage === 'voice') {
      const pulse = 1.12 + Math.sin(t * 3.4 + offset) * 0.14;
      auraRef.current.scale.setScalar(pulse);
    }
    if (voiceOrbitRef.current) {
      voiceOrbitRef.current.rotation.x = t * 0.9 + offset;
      voiceOrbitRef.current.rotation.z = t * 0.65;
    }
  });

  const radius = stage === 'seed' ? 0.22 : stage === 'root' ? 0.26 : 0.3;
  const emissiveIntensity = selected ? 1.05 : stage === 'voice' ? 0.72 : stage === 'root' ? 0.48 : 0.28;

  return (
    <group position={[meta.position3D[0], meta.position3D[1], meta.position3D[2]]}>
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Sculpted miniature concept icon */}
        <ConceptMiniature
          conceptId={conceptId}
          color={meta.color}
          emissiveIntensity={emissiveIntensity}
        />

        {/* Translucent glass star orb enclosing the miniature (also provides crisp click hit-target) */}
        <mesh>
          <sphereGeometry args={[radius, 20, 20]} />
          <meshPhysicalMaterial
            color={selected ? '#fef08a' : meta.color}
            transparent
            opacity={stage === 'seed' ? 0.18 : stage === 'root' ? 0.24 : 0.28}
            roughness={0.08}
            clearcoat={1}
            depthWrite={false}
          />
        </mesh>

        {/* Primary equatorial stage ring */}
        <mesh ref={auraRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.04, radius + (stage === 'seed' ? 0.065 : 0.09), 32]} />
          <meshBasicMaterial
            color={selected ? '#fef08a' : meta.color}
            transparent
            opacity={stage === 'seed' ? 0.45 : 0.78}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Secondary tilted orbital star ring for mastered 'voice' concepts */}
        {stage === 'voice' && (
          <mesh ref={voiceOrbitRef}>
            <torusGeometry args={[radius + 0.085, 0.008, 8, 36]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.75} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function FlyingOrbs({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);

  useLayoutEffect(() => {
    progressRef.current = 0;
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, idx) => {
      const startX = (idx - 2.5) * 0.25;
      child.position.set(startX, 1.1, 0.1);
      child.visible = active;
    });
  }, [active]);

  useFrame((_, delta) => {
    if (!active || !groupRef.current || progressRef.current >= 1) {
      return;
    }
    const dt = Math.min(delta, 0.05);
    progressRef.current = Math.min(1, progressRef.current + dt * 0.65);
    const p = progressRef.current;
    const ease = 1 - Math.pow(1 - p, 3);

    groupRef.current.children.forEach((child, idx) => {
      const concept = ALL_CONCEPTS[idx];
      const target = CONCEPT_VISUALS[concept].position3D;
      const startX = (idx - 2.5) * 0.25;
      child.position.set(
        THREE.MathUtils.lerp(startX, target[0], ease),
        THREE.MathUtils.lerp(1.1, CONSTELLATION_Y + target[1], ease),
        THREE.MathUtils.lerp(0.1, target[2], ease),
      );
      child.visible = p < 0.98;
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {ALL_CONCEPTS.map((id) => (
        <mesh key={id}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial color={CONCEPT_VISUALS[id].color} />
        </mesh>
      ))}
    </group>
  );
}

export function Constellation3D({
  nodes,
  selectedConcept,
  launchingOrbs,
  visible,
  onSelectConcept,
}: Constellation3DProps) {
  useEffect(() => {
    if (!visible) {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [visible]);

  return (
    <>
      <FlyingOrbs active={launchingOrbs} />
      {visible && (
        <group name="Constellation_3D" position={[0, CONSTELLATION_Y, 0]}>
          {/* Cosmic instanced background starfield */}
          <AmbientStarfield />

          {/* Semantic & Contrast Edges */}
          {ALL_EDGE_SEGMENTS.map((edge) => {
            if (!nodes[edge.from] || !nodes[edge.to]) return null;

            return (
              <group key={edge.key}>
                <Line
                  points={edge.primaryPoints}
                  color={edge.isContrast ? '#fbbf24' : '#94a3b8'}
                  lineWidth={edge.isContrast ? 2.2 : 1.25}
                  dashed={edge.isContrast}
                  dashSize={0.14}
                  gapSize={0.09}
                  transparent
                  opacity={edge.isContrast ? 0.92 : 0.45}
                />
                {edge.secondaryPoints && (
                  <Line
                    points={edge.secondaryPoints}
                    color="#38bdf8"
                    lineWidth={1.6}
                    dashed
                    dashSize={0.14}
                    gapSize={0.09}
                    transparent
                    opacity={0.78}
                  />
                )}
              </group>
            );
          })}

          {/* Lit Concept Stars with 3D sculpted miniatures */}
          {ALL_CONCEPTS.map((id) => {
            const node = nodes[id];
            if (!node) return null;
            return (
              <StarNode
                key={id}
                conceptId={id}
                stage={node.stage}
                selected={selectedConcept === id}
                onSelect={() => onSelectConcept(id)}
              />
            );
          })}
        </group>
      )}
    </>
  );
}
