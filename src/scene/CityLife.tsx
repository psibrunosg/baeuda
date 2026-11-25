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
  type Car,
  type Plant,
  type Vec,
  type Walker,
} from './cityLifeLogic';
import { BlobShadow, toyMaterial } from './toyKit';
import {
  PET_TAIL_PIVOT,
  birdBodyGeometry,
  birdWingGeometry,
  bushGeometry,
  carGeometry,
  flowerCenterGeometry,
  flowerHeadGeometry,
  flowerStemGeometry,
  petGeometry,
  trafficPoleGeometry,
  type CarStyle,
  type PetKind,
} from './toyProps';
import { cityBrains, critterStep, driveShare, mayCross, type CritterState } from './cityBrains';
import type { Aabb, AvatarPose } from './worldNavigation';

const N_CARS = 14;

/** Nearest moving car within the street band, as a hazard for animals. */
function nearestCar(cars: readonly Car[], x: number, z: number): Vec | null {
  let best: Vec | null = null;
  let bd = 3;
  for (const c of cars) {
    if (!c.active) continue;
    const d = Math.hypot(c.x - x, c.z - z);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

// ------------------------------------------------------------------ flora

function PlantBatch({ plants, kind }: { plants: Plant[]; kind: 'flower' | 'bush' }) {
  const headRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const centerRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    plants.forEach((p, i) => {
      const h = kind === 'flower' ? 0.13 * p.scale : 0.2 * p.scale;
      d.position.set(p.x, 0.01 + h, p.z);
      d.rotation.y = i * 1.7;
      d.scale.set(p.scale, kind === 'bush' ? p.scale * 0.8 : p.scale, p.scale);
      d.updateMatrix();
      headRef.current?.setMatrixAt(i, d.matrix);
      headRef.current?.setColorAt(i, c.set(p.color));
      if (kind === 'flower') {
        centerRef.current?.setMatrixAt(i, d.matrix);
        d.position.set(p.x, 0.01 + h / 2, p.z);
        d.scale.set(1, p.scale, 1);
        d.updateMatrix();
        stemRef.current?.setMatrixAt(i, d.matrix);
      }
    });
    for (const m of [headRef.current, stemRef.current, centerRef.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [plants, kind]);
  const n = plants.length;
  return (
    <>
      <instancedMesh
        ref={headRef}
        args={[kind === 'bush' ? bushGeometry() : flowerHeadGeometry(), toyMaterial(), n]}
        castShadow={kind === 'bush'}
      />
      {kind === 'flower' && (
        <>
          <instancedMesh ref={stemRef} args={[flowerStemGeometry(), toyMaterial(), n]} />
          <instancedMesh ref={centerRef} args={[flowerCenterGeometry(), toyMaterial(), n]} />
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ traffic

const CAR_COLORS = ['#ef4444', '#3b82f6', '#facc15', '#10b981', '#f97316', '#a855f7', '#e5e7eb', '#14b8a6', '#ec4899', '#6366f1'];

function CarMesh({ color, style }: { color: string; style: CarStyle }) {
  const car = carGeometry(color, style);
  return (
    <group>
      <BlobShadow size={[1.2, 0.7]} y={-0.025} />
      {/* lowered so the tyres meet the road */}
      <mesh geometry={car.body} material={toyMaterial('gloss')} position-y={-0.028} castShadow />
      <mesh geometry={car.lights} material={toyMaterial('glow')} position-y={-0.028} />
    </group>
  );
}

function Traffic({ cars, people, avatarPoseRef }: { cars: Car[]; people: Vec[]; avatarPoseRef?: MutableRefObject<AvatarPose> }) {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const greenRef = useRef<THREE.MeshStandardMaterial>(null);
  const pedRef = useRef<THREE.MeshStandardMaterial>(null);
  const rand = useMemo(() => mulberry32(77), []);
  const brains = useMemo(cityBrains, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const green = carsHaveGreen(state.clock.elapsedTime);
    // last slot of `people` is the player, so cars also yield to them
    const me = people[people.length - 1];
    if (avatarPoseRef) {
      me.x = avatarPoseRef.current.x;
      me.z = avatarPoseRef.current.z;
    }
    stepCars(cars, dt, { green, people, rand, driver: (g, v) => driveShare(brains.driver, g, v) });
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
          <CarMesh color={CAR_COLORS[i % CAR_COLORS.length]} style={(i % 3) as CarStyle} />
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
          <mesh geometry={trafficPoleGeometry()} material={toyMaterial()} castShadow />
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

function Pet({ kind, size }: { kind: PetKind; size: number }) {
  const tail = useRef<THREE.Mesh>(null);
  const pet = petGeometry(kind);
  useFrame((state) => {
    if (!tail.current) return;
    const t = state.clock.elapsedTime;
    tail.current.rotation.x = kind === 'dog' ? Math.sin(t * 9) * 0.5 : Math.sin(t * 2.4) * 0.28;
  });
  return (
    <group scale={size}>
      <BlobShadow size={[0.66, 0.4]} />
      <mesh geometry={pet.body} material={toyMaterial()} castShadow />
      <mesh ref={tail} geometry={pet.tail} material={toyMaterial()} position={[...PET_TAIL_PIVOT]} castShadow />
    </group>
  );
}

function Birds() {
  const brains = useMemo(cityBrains, []);
  const flock = useMemo<CritterState[]>(() => Array.from({ length: 6 }, (_, i) => ({ x: -2 + i, z: -5, th: i })), []);
  const refs = useRef<Array<THREE.Group | null>>([]);
  const wings = useRef<Array<THREE.Mesh | null>>([]);
  const N = 6;
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < N; i++) {
      const g = refs.current[i];
      if (!g) continue;
      // each bird's neural net chases its orbit slot and sidesteps its nearest flock-mate
      const a = t * (0.35 + i * 0.03) + i * 1.9;
      const r = 5 + (i % 3) * 2.2;
      const b = flock[i];
      let mate: Vec | null = null;
      let md = 3;
      for (let j = 0; j < N; j++) {
        const d = j === i ? Infinity : Math.hypot(flock[j].x - b.x, flock[j].z - b.z);
        if (d < md) {
          md = d;
          mate = flock[j];
        }
      }
      critterStep(brains.critter, b, { x: -2 + Math.cos(a) * r, z: -5 + Math.sin(a) * r * 0.7 }, mate, 4.5, dt);
      g.position.set(b.x, 3.4 + Math.sin(t * 0.7 + i) * 0.3 + (i % 2) * 0.5, b.z);
      g.rotation.y = -b.th;
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
          <mesh geometry={birdBodyGeometry(i % 2 ? '#f5f1e8' : '#8fa3bd')} material={toyMaterial()} />
          {([1, -1] as const).map((s, k) => (
            <mesh
              key={s}
              ref={(el) => {
                wings.current[i * 2 + k] = el;
              }}
              geometry={birdWingGeometry(s)}
              material={toyMaterial()}
              position={[0, 0.025, s * 0.03]}
            />
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
  const brains = useMemo(cityBrains, []);
  const pets = useMemo(
    () => ({
      dog: { x: -4, z: -2, th: 0 } as CritterState,
      cat: { x: -3.4, z: -1.85, th: 0 } as CritterState,
      catGoal: { x: -3.4, z: -1.85, until: 0 },
      rand: mulberry32(404),
    }),
    [],
  );
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
        const mayGo = ci < 0 || (ci === SIGNALLED_CROSSING ? canStartCrossing(t) : mayCross(brains.crosser, cars, CROSSWALK_XS[ci]));
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
    // Dog: a learned steering net follows a spot behind its owner and shies away from cars
    const dog = dogRef.current;
    const owner = refs.current[0];
    if (dog && owner) {
      const ang = owner.rotation.y;
      const goal = { x: owner.position.x - Math.sin(ang) * 0.55 + Math.cos(ang) * 0.2, z: owner.position.z - Math.cos(ang) * 0.55 - Math.sin(ang) * 0.2 };
      const sp = critterStep(brains.critter, pets.dog, goal, nearestCar(cars, pets.dog.x, pets.dog.z), 1.6, dt);
      dog.position.set(pets.dog.x, 0.06 + Math.abs(Math.sin(t * 9)) * 0.02 * Math.min(1, sp), pets.dog.z);
      dog.rotation.y = -pets.dog.th;
    }
    // Cat: same net, wanders between kerb spots, and keeps clear of traffic
    const cat = catRef.current;
    if (cat) {
      const g = pets.catGoal;
      if (t > g.until) {
        g.x = -5 + pets.rand() * 3.4;
        g.z = -1.95 + pets.rand() * 0.25;
        g.until = t + 3 + pets.rand() * 5;
      }
      const sp = critterStep(brains.critter, pets.cat, g, nearestCar(cars, pets.cat.x, pets.cat.z), 0.9, dt);
      cat.position.set(pets.cat.x, 0.06 + Math.abs(Math.sin(t * 8)) * 0.01 * Math.min(1, sp), pets.cat.z);
      cat.rotation.y = -pets.cat.th;
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
          <BlobShadow size={[0.55, 0.46]} />
          <StylizedHumanoid {...s.look} blinkOffset={i * 1.3} scale={0.85} />
        </group>
      ))}
      <group ref={dogRef} position={[-4, 0.06, -2]}>
        <Pet kind="dog" size={0.9} />
      </group>
      <group ref={catRef}>
        <Pet kind="cat" size={0.65} />
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
