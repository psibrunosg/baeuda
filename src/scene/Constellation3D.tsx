import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { LESSON1_CONCEPTS, LESSON1_EDGES } from '../domain/constellation';
import type { AcquisitionStage, ConceptId, ConceptNode } from '../domain/types';
import { CONCEPT_VISUALS } from '../content/lesson1Cafe';

const CONSTELLATION_Y = 6.4;

interface Constellation3DProps {
  nodes: Partial<Record<ConceptId, ConceptNode>>;
  selectedConcept: ConceptId | null;
  launchingOrbs: boolean;
  visible: boolean;
  onSelectConcept: (id: ConceptId) => void;
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
  const meta = CONCEPT_VISUALS[conceptId];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const offset = meta.position3D[0] * 1.7 + meta.position3D[1];
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.5 + offset) * 0.06;
      groupRef.current.rotation.y = t * (stage === 'voice' ? 0.9 : 0.4);
    }
    if (auraRef.current && stage === 'voice') {
      const pulse = 1.15 + Math.sin(t * 3.4 + offset) * 0.16;
      auraRef.current.scale.setScalar(pulse);
    }
  });

  const radius = stage === 'seed' ? 0.14 : stage === 'root' ? 0.19 : 0.23;

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
        {stage === 'voice' ? (
          <mesh>
            <octahedronGeometry args={[radius, 0]} />
            <meshStandardMaterial
              color={meta.color}
              emissive={meta.color}
              emissiveIntensity={selected ? 1.4 : 0.95}
              roughness={0.18}
            />
          </mesh>
        ) : (
          <mesh>
            <sphereGeometry args={[radius, 18, 18]} />
            <meshStandardMaterial
              color={meta.color}
              emissive={meta.color}
              emissiveIntensity={stage === 'root' ? 0.65 : 0.35}
              transparent={stage === 'seed'}
              opacity={stage === 'seed' ? 0.82 : 1}
              roughness={0.3}
            />
          </mesh>
        )}

        {/* Stage halo */}
        <mesh ref={auraRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.05, radius + (stage === 'seed' ? 0.075 : 0.1), 28]} />
          <meshBasicMaterial
            color={selected ? '#fef08a' : meta.color}
            transparent
            opacity={stage === 'seed' ? 0.45 : 0.72}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

function FlyingOrbs({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);

  useLayoutEffect(() => {
    progressRef.current = 0;
    if (!active || !groupRef.current) return;
    groupRef.current.children.forEach((child, idx) => {
      const startX = (idx - 2.5) * 0.25;
      child.position.set(startX, 1.1, 0.1);
      child.visible = true;
    });
  }, [active]);

  useFrame((_, delta) => {
    if (!active || !groupRef.current) {
      progressRef.current = 0;
      return;
    }
    const dt = Math.min(delta, 0.05);
    progressRef.current = Math.min(1, progressRef.current + dt * 0.65);
    const p = progressRef.current;
    const ease = 1 - Math.pow(1 - p, 3);

    groupRef.current.children.forEach((child, idx) => {
      const concept = LESSON1_CONCEPTS[idx];
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
      {LESSON1_CONCEPTS.map((id) => (
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
          {/* Ambient starfield backdrop */}
          <mesh position={[0, 0.4, -2.8]}>
            <planeGeometry args={[14, 10]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.92} />
          </mesh>

          {/* Semantic & Contrast Edges */}
          {LESSON1_EDGES.map((edge) => {
            if (!nodes[edge.from] || !nodes[edge.to]) return null;
            const p1 = CONCEPT_VISUALS[edge.from].position3D;
            const p2 = CONCEPT_VISUALS[edge.to].position3D;
            const isContrast = edge.kind === 'contrast';

            return (
              <group key={`${edge.from}-${edge.to}`}>
                <Line
                  points={[
                    [p1[0], p1[1], p1[2]],
                    [p2[0], p2[1], p2[2]],
                  ]}
                  color={isContrast ? '#fbbf24' : '#94a3b8'}
                  lineWidth={isContrast ? 2.2 : 1.2}
                  dashed={isContrast}
                  dashSize={0.14}
                  gapSize={0.09}
                  transparent
                  opacity={isContrast ? 0.9 : 0.45}
                />
                {isContrast && (
                  <Line
                    points={[
                      [p1[0], p1[1] + 0.05, p1[2]],
                      [p2[0], p2[1] + 0.05, p2[2]],
                    ]}
                    color="#38bdf8"
                    lineWidth={1.6}
                    dashed
                    dashSize={0.14}
                    gapSize={0.09}
                    transparent
                    opacity={0.75}
                  />
                )}
              </group>
            );
          })}

          {/* Lit Concept Stars */}
          {LESSON1_CONCEPTS.map((id) => {
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
