import { memo, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useMapFrame as useFrame } from './mapVisibility';
import { StylizedHumanoid, type StylizedHumanoidProps } from './StylizedCharacters';
import {
  CROSSWALK_XS,
  NODE_X,
  NODE_Z,
  SIGNALLED_CROSSING,
  canStartCrossing,
  carsHaveGreen,
  chooseNext,
  crossingIndex,
  learn,
  makeCars,
  makeWalker,
  mulberry32,
  punishWaiting,
  scatterPlants,
  stepCars,
  zebraClear,
  type Car,
  type Plant,
  type Vec,
  type Walker,
} from './cityLifeLogic';
import type { Aabb, AvatarPose } from './worldNavigation';

const N_CARS = 14;

// ------------------------------------------------------------------ flora

function PlantBatch({ plants, kind }: { plants: Plant[]; kind: 'flower' | 'bush' }) {
  const headRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    plants.forEach((p, i) => {
      const h = kind === 'flower' ? 0.13 * p.scale : 0.2 * p.scale;
      d.position.set(p.x, 0.01 + h, p.z);
      d.scale.set(p.scale, kind === 'bush' ? p.scale * 0.8 : p.scale, p.scale);
      d.updateMatrix();
      headRef.current?.setMatrixAt(i, d.matrix);
      headRef.current?.setColorAt(i, c.set(p.color));
      if (kind === 'flower') {
        d.position.set(p.x, 0.01 + h / 2, p.z);
        d.scale.set(1, p.scale, 1);
        d.updateMatrix();
        stemRef.current?.setMatrixAt(i, d.matrix);
      }
    });
    for (const m of [headRef.current, stemRef.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [plants, kind]);
  const n = plants.length;
  return (
    <>
      <instancedMesh ref={headRef} args={[undefined, undefined, n]} castShadow={kind === 'bush'}>
        {kind === 'bush' ? <icosahedronGeometry args={[0.28, 1]} /> : <sphereGeometry args={[0.065, 8, 6]} />}
        <meshStandardMaterial color="#ffffff" roughness={0.85} flatShading={kind === 'bush'} />
      </instancedMesh>
      {kind === 'flower' && (
        <instancedMesh ref={stemRef} args={[undefined, undefined, n]}>
          <cylinderGeometry args={[0.012, 0.012, 0.13, 5]} />
          <meshStandardMaterial color="#4d7c4a" roughness={0.9} />
        </instancedMesh>
      )}
    </>
  );
}

// ------------------------------------------------------------------ traffic

const CAR_COLORS = ['#ef4444', '#3b82f6', '#facc15', '#10b981', '#f97316', '#a855f7', '#e5e7eb', '#14b8a6', '#ec4899', '#6366f1'];

function CarMesh({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[0.85, 0.16, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[-0.05, 0.27, 0]} castShadow>
        <boxGeometry args={[0.45, 0.14, 0.34]} />
        <meshStandardMaterial color="#cfe8f5" roughness={0.2} />
      </mesh>
      {[-0.28, 0.28].flatMap((wx) =>
        [-0.2, 0.2].map((wz) => (
          <mesh key={`${wx}${wz}`} position={[wx, 0.06, wz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.06, 10]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} />
          </mesh>
        )),
      )}
      <mesh position={[0.43, 0.14, 0.12]}>
        <boxGeometry args={[0.02, 0.05, 0.06]} />
        <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.43, 0.14, -0.12]}>
        <boxGeometry args={[0.02, 0.05, 0.06]} />
        <meshStandardMaterial color="#fff7d6" emissive="#fde68a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function Traffic({ cars, people, avatarPoseRef }: { cars: Car[]; people: Vec[]; avatarPoseRef?: MutableRefObject<AvatarPose> }) {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const greenRef = useRef<THREE.MeshStandardMaterial>(null);
  const pedRef = useRef<THREE.MeshStandardMaterial>(null);
  const rand = useMemo(() => mulberry32(77), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const green = carsHaveGreen(state.clock.elapsedTime);
    // last slot of `people` is the player, so cars also yield to them
    const me = people[people.length - 1];
    if (avatarPoseRef) {
      me.x = avatarPoseRef.current.x;
      me.z = avatarPoseRef.current.z;
    }
    stepCars(cars, dt, { green, people, rand });
    for (let i = 0; i < cars.length; i++) {
      const g = refs.current[i];
      if (!g) continue;
      const c = cars[i];
      g.visible = c.active;
      g.position.set(c.x, 0.07, c.z);
      g.rotation.y = c.yaw;
    }
    if (redRef.current) redRef.current.emissiveIntensity = green ? 0.05 : 1.6;
    if (greenRef.current) greenRef.current.emissiveIntensity = green ? 1.6 : 0.05;
    if (pedRef.current) pedRef.current.emissiveIntensity = green ? 0.05 : 1.4;
  });

  return (
    <group name="Traffic">
      {cars.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <CarMesh color={CAR_COLORS[i % CAR_COLORS.length]} />
        </group>
      ))}
      {/* Two extra zebras (x=0 already exists); x=0 is the signalled one */}
      {CROSSWALK_XS.filter((x) => x !== 0).flatMap((cx) =>
        [-0.45, -0.15, 0.15, 0.45].map((dx) => (
          <mesh key={`${cx}${dx}`} position={[cx + dx, 0.042, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.16, 1.35]} />
            <meshStandardMaterial color="#f5ebd8" roughness={0.85} />
          </mesh>
        )),
      )}
      {/* Traffic light on the north kerb, pedestrian lamp faces the sidewalk */}
      {[
        [-1.35, -1.72, 0],
        [1.35, 0.78, Math.PI],
      ].map(([x, z, ry], i) => (
        <group key={i} position={[x, 0.05, z]} rotation={[0, ry, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 1.0, 8]} />
            <meshStandardMaterial color="#374151" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.08, 0]} castShadow>
            <boxGeometry args={[0.16, 0.38, 0.14]} />
            <meshStandardMaterial color="#1f2937" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.17, 0.075]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial ref={i === 0 ? redRef : undefined} color="#7f1d1d" emissive="#ef4444" emissiveIntensity={0.05} />
          </mesh>
          <mesh position={[0, 1.0, 0.075]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial ref={i === 0 ? greenRef : undefined} color="#14532d" emissive="#22c55e" emissiveIntensity={1.6} />
          </mesh>
          {/* Pedestrian "walk" lamp, lit while cars wait */}
          <mesh position={[0.1, 0.78, 0]}>
            <boxGeometry args={[0.07, 0.07, 0.05]} />
            <meshStandardMaterial ref={i === 0 ? pedRef : undefined} color="#0c4a6e" emissive="#38bdf8" emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------ pets

function Pet({ fur, size, ears }: { fur: string; size: number; ears: 'floppy' | 'pointy' }) {
  return (
    <group scale={size}>
      <mesh position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.1, 0.22, 6, 10]} />
        <meshStandardMaterial color={fur} roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.27, 0]} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color={fur} roughness={0.9} />
      </mesh>
      {[-0.06, 0.06].map((z) => (
        <mesh key={z} position={[0.21, ears === 'floppy' ? 0.31 : 0.37, z]} rotation={[z > 0 ? 0.3 : -0.3, 0, 0]}>
          {ears === 'floppy' ? <sphereGeometry args={[0.04, 6, 6]} /> : <coneGeometry args={[0.035, 0.07, 4]} />}
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0.31, 0.26, 0]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      {[
        [0.12, 0.07],
        [0.12, -0.07],
        [-0.12, 0.07],
        [-0.12, -0.07],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.06, z]}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 6]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[-0.25, 0.25, 0]} rotation={[0, 0, 0.9]}>
        <capsuleGeometry args={[0.025, 0.14, 4, 6]} />
        <meshStandardMaterial color={fur} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Birds() {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const wings = useRef<Array<THREE.Mesh | null>>([]);
  const N = 6;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const g = refs.current[i];
      if (!g) continue;
      const a = t * (0.35 + i * 0.03) + i * 1.9;
      const r = 5 + (i % 3) * 2.2;
      g.position.set(-2 + Math.cos(a) * r, 3.4 + Math.sin(t * 0.7 + i) * 0.3 + (i % 2) * 0.5, -5 + Math.sin(a) * r * 0.7);
      g.rotation.y = -a - Math.PI / 2;
      const flap = Math.sin(t * 14 + i) * 0.7;
      const l = wings.current[i * 2];
      const rr = wings.current[i * 2 + 1];
      if (l) l.rotation.x = flap;
      if (rr) rr.rotation.x = -flap;
    }
  });
  return (
    <group name="Birds">
      {Array.from({ length: N }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh scale={[1.5, 0.8, 0.8]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color={i % 2 ? '#f5f5f4' : '#94a3b8'} roughness={0.8} />
          </mesh>
          {[1, -1].map((s, k) => (
            <mesh
              key={s}
              ref={(el) => {
                wings.current[i * 2 + k] = el;
              }}
              position={[0, 0.01, s * 0.07]}
              scale={[1, 0.15, 1.8]}
            >
              <sphereGeometry args={[0.05, 6, 4]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------ walkers

interface WalkerSpec {
  start: number;
  taste: number[];
  look: StylizedHumanoidProps;
  speed: number;
}

const taste = (loved: number[]) => NODE_X.map((_, i) => (loved.includes(i) ? 1 : 0.1));
const WALKERS: WalkerSpec[] = [
  { start: 1, taste: taste([3, 8]), speed: 0.9, look: { shirtColor: '#2563eb', hat: 'cap', hatColor: '#facc15' } },
  { start: 6, taste: taste([0, 5]), speed: 0.75, look: { shirtColor: '#db2777', hat: 'sunhat', hatColor: '#fde68a', skinColor: '#c68642' } },
  { start: 3, taste: taste([2, 7]), speed: 1.0, look: { shirtColor: '#16a34a', glasses: true, hairColor: '#78350f' } },
  { start: 8, taste: taste([4, 9]), speed: 0.85, look: { shirtColor: '#7c3aed', hat: 'beret', hatColor: '#be123c', skinColor: '#8d5524' } },
];

interface Motion {
  w: Walker;
  rand: () => number;
  target: number;
  fx: number;
  fz: number;
  tx: number;
  tz: number;
  p: number;
  moving: boolean;
}

function Pedestrians({ cars, people }: { cars: Car[]; people: Vec[] }) {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const dogRef = useRef<THREE.Group>(null);
  const catRef = useRef<THREE.Group>(null);
  const state = useMemo<Motion[]>(
    () =>
      WALKERS.map((s, i) => ({
        w: makeWalker(s.start, s.taste),
        rand: mulberry32(100 + i),
        target: s.start,
        fx: NODE_X[s.start],
        fz: NODE_Z[s.start],
        tx: NODE_X[s.start],
        tz: NODE_Z[s.start],
        p: 1,
        moving: false,
      })),
    [],
  );

  useFrame((fs, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = fs.clock.elapsedTime;
    for (let i = 0; i < state.length; i++) {
      const m = state[i];
      const g = refs.current[i];
      if (!g) continue;
      if (!m.moving) {
        const next = chooseNext(m.w, m.rand);
        const ci = crossingIndex(m.w.node, next);
        // signalled zebra: wait for the red phase; plain zebras: wait for a gap in traffic
        const mayGo = ci < 0 || (ci === SIGNALLED_CROSSING ? canStartCrossing(t) : zebraClear(cars, CROSSWALK_XS[ci]));
        if (!mayGo) {
          punishWaiting(m.w, next, dt);
        } else {
          m.target = next;
          m.fx = NODE_X[m.w.node];
          m.fz = NODE_Z[m.w.node];
          m.tx = NODE_X[next];
          m.tz = NODE_Z[next];
          m.p = 0;
          m.moving = true;
        }
      } else {
        const len = Math.hypot(m.tx - m.fx, m.tz - m.fz);
        m.p = Math.min(1, m.p + (WALKERS[i].speed * dt) / len);
        if (m.p >= 1) {
          learn(m.w, m.target, m.rand);
          m.moving = false;
        }
      }
      const x = m.fx + (m.tx - m.fx) * m.p;
      const z = m.fz + (m.tz - m.fz) * m.p;
      people[i].x = x;
      people[i].z = z;
      g.position.set(x, 0.06 + (m.moving ? Math.abs(Math.sin(t * 7 + i)) * 0.025 : 0), z);
      if (m.moving) g.rotation.y = Math.atan2(m.tx - m.fx, m.tz - m.fz);
    }
    // Dog trails the first walker
    const dog = dogRef.current;
    const owner = refs.current[0];
    if (dog && owner) {
      const ang = owner.rotation.y;
      const gx = owner.position.x - Math.sin(ang) * 0.55 + Math.cos(ang) * 0.2;
      const gz = owner.position.z - Math.cos(ang) * 0.55 - Math.sin(ang) * 0.2;
      const dx = gx - dog.position.x;
      const dz = gz - dog.position.z;
      dog.position.x += dx * Math.min(1, dt * 3);
      dog.position.z += dz * Math.min(1, dt * 3);
      dog.position.y = 0.06 + Math.abs(Math.sin(t * 9)) * 0.02 * Math.min(1, Math.hypot(dx, dz) * 4);
      if (Math.hypot(dx, dz) > 0.02) dog.rotation.y = Math.atan2(-dz, dx);
    }
    // Cat strolls the café-side kerb
    const cat = catRef.current;
    if (cat) {
      const a = t * 0.18;
      cat.position.set(-3.4 + Math.sin(a) * 1.6, 0.06, -1.85);
      cat.rotation.y = Math.cos(a) > 0 ? 0 : Math.PI;
    }
  });

  return (
    <group name="Pedestrians_And_Pets">
      {WALKERS.map((s, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <StylizedHumanoid {...s.look} blinkOffset={i * 1.3} scale={0.85} />
        </group>
      ))}
      <group ref={dogRef} position={[-4, 0.06, -2]}>
        <Pet fur="#b8844f" size={0.9} ears="floppy" />
      </group>
      <group ref={catRef}>
        <Pet fur="#57534e" size={0.65} ears="pointy" />
      </group>
      <Birds />
    </group>
  );
}

// ------------------------------------------------------------------ public

export const CityLife = memo(function CityLife({
  obstacles,
  avatarPoseRef,
}: {
  obstacles: readonly Aabb[];
  avatarPoseRef?: MutableRefObject<AvatarPose>;
}) {
  const flowers = useMemo(() => scatterPlants('flower', 160, 11, obstacles), [obstacles]);
  const bushes = useMemo(() => scatterPlants('bush', 46, 23, obstacles), [obstacles]);
  const cars = useMemo(() => makeCars(N_CARS), []);
  // one entry per walker + the player (last), shared so cars can yield to everyone
  const people = useMemo<Vec[]>(() => Array.from({ length: WALKERS.length + 1 }, () => ({ x: 99, z: 99 })), []);
  return (
    <group name="City_Life">
      <PlantBatch plants={flowers} kind="flower" />
      <PlantBatch plants={bushes} kind="bush" />
      <Traffic cars={cars} people={people} avatarPoseRef={avatarPoseRef} />
      <Pedestrians cars={cars} people={people} />
    </group>
  );
});
