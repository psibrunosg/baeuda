import { useEffect, useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
import type { TapSpot } from '../familyHomeLayout';
import { useMapFrame } from '../mapVisibility';

/** A clickable interior object: generous invisible hit box plus a short wobble after a wrong tap. */
export function Target<Id extends string>({
  id,
  at,
  hit,
  shake,
  onTap,
  children,
}: TapSpot & {
  id: Id;
  shake: number;
  onTap: (id: Id) => void;
  children?: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const shakeRef = useRef(0);
  useEffect(() => {
    if (shake) shakeRef.current = 1;
  }, [shake]);
  useMapFrame((_, delta) => {
    if (!ref.current) return;
    shakeRef.current = Math.max(0, shakeRef.current - Math.min(delta, 0.05) * 1.8);
    ref.current.rotation.z = Math.sin(shakeRef.current * Math.PI * 6) * 0.18 * shakeRef.current;
  });

  return (
    <group
      position={at}
      onClick={(e) => {
        e.stopPropagation();
        onTap(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, hit[1] / 2, 0]}>
        <boxGeometry args={hit} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={ref}>{children}</group>
    </group>
  );
}
