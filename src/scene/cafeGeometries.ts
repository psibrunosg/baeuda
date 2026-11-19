import * as THREE from 'three';

function ensureValidNormals(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Curved artisanal ceramic mug with thick rim and hollow interior.
 * Origin sits cleanly at y = 0 (base rests flush on counter / saucer).
 */
export function createMugGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.068, 0.0),
    new THREE.Vector2(0.074, 0.012),
    new THREE.Vector2(0.088, 0.055),
    new THREE.Vector2(0.095, 0.12),
    new THREE.Vector2(0.098, 0.162),
    new THREE.Vector2(0.094, 0.172),
    new THREE.Vector2(0.084, 0.172),
    new THREE.Vector2(0.081, 0.158),
    new THREE.Vector2(0.075, 0.045),
    new THREE.Vector2(0.062, 0.018),
    new THREE.Vector2(0.0, 0.018),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28)) as THREE.LatheGeometry;
}

/**
 * Curved ergonomic mug handle sweeping smoothly from upper rim to lower belly.
 */
export function createMugHandleGeometry(): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.088, 0.142, 0),
    new THREE.Vector3(0.132, 0.138, 0),
    new THREE.Vector3(0.142, 0.092, 0),
    new THREE.Vector3(0.124, 0.052, 0),
    new THREE.Vector3(0.082, 0.048, 0),
  ]);
  return new THREE.TubeGeometry(curve, 20, 0.013, 10, false);
}

/**
 * Shallow ceramic saucer with gently raised rim. Origin at y = 0.
 */
export function createSaucerGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.072, 0.0),
    new THREE.Vector2(0.122, 0.014),
    new THREE.Vector2(0.142, 0.028),
    new THREE.Vector2(0.138, 0.034),
    new THREE.Vector2(0.074, 0.014),
    new THREE.Vector2(0.0, 0.012),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28)) as THREE.LatheGeometry;
}

/**
 * Bulbous pour-over coffee carafe / server with pinched neck and pouring flare.
 */
export function createCarafeGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.096, 0.0),
    new THREE.Vector2(0.118, 0.025),
    new THREE.Vector2(0.124, 0.085),
    new THREE.Vector2(0.104, 0.155),
    new THREE.Vector2(0.072, 0.21),
    new THREE.Vector2(0.076, 0.245),
    new THREE.Vector2(0.088, 0.268),
    new THREE.Vector2(0.078, 0.272),
    new THREE.Vector2(0.064, 0.238),
    new THREE.Vector2(0.06, 0.205),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28)) as THREE.LatheGeometry;
}

/**
 * Curved side handle for the coffee carafe.
 */
export function createCarafeHandleGeometry(): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.072, 0.228, 0),
    new THREE.Vector3(0.145, 0.215, 0),
    new THREE.Vector3(0.165, 0.135, 0),
    new THREE.Vector3(0.145, 0.062, 0),
    new THREE.Vector3(0.112, 0.048, 0),
  ]);
  return new THREE.TubeGeometry(curve, 22, 0.014, 10, false);
}

/**
 * Sleek glass water carafe / bottle with soft shoulder taper and narrow neck.
 */
export function createWaterBottleGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.076, 0.0),
    new THREE.Vector2(0.084, 0.02),
    new THREE.Vector2(0.084, 0.165),
    new THREE.Vector2(0.074, 0.215),
    new THREE.Vector2(0.042, 0.258),
    new THREE.Vector2(0.04, 0.298),
    new THREE.Vector2(0.048, 0.312),
    new THREE.Vector2(0.042, 0.315),
    new THREE.Vector2(0.034, 0.295),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28)) as THREE.LatheGeometry;
}

/**
 * Gently flared glass tumbler for iced water & cold coffee.
 */
export function createTallGlassGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.068, 0.0),
    new THREE.Vector2(0.074, 0.016),
    new THREE.Vector2(0.088, 0.22),
    new THREE.Vector2(0.092, 0.246),
    new THREE.Vector2(0.086, 0.25),
    new THREE.Vector2(0.081, 0.238),
    new THREE.Vector2(0.068, 0.028),
    new THREE.Vector2(0.0, 0.024),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28)) as THREE.LatheGeometry;
}

/**
 * Mid-century domed copper pendant lamp shade hanging above the café counter.
 */
export function createPendantShadeGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.026, 0.24),
    new THREE.Vector2(0.048, 0.21),
    new THREE.Vector2(0.115, 0.155),
    new THREE.Vector2(0.185, 0.075),
    new THREE.Vector2(0.225, 0.008),
    new THREE.Vector2(0.216, 0.0),
    new THREE.Vector2(0.175, 0.07),
    new THREE.Vector2(0.105, 0.148),
    new THREE.Vector2(0.024, 0.22),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28)) as THREE.LatheGeometry;
}

/**
 * Smooth sculpted 3D droplet for the Constellation 'water' star miniature.
 */
export function createDropletGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, -0.14),
    new THREE.Vector2(0.055, -0.132),
    new THREE.Vector2(0.095, -0.085),
    new THREE.Vector2(0.096, -0.02),
    new THREE.Vector2(0.068, 0.055),
    new THREE.Vector2(0.028, 0.125),
    new THREE.Vector2(0.0, 0.175),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 22)) as THREE.LatheGeometry;
}

/**
 * Cozy stylized flame silhouette for the Constellation 'hot' star miniature.
 */
export function createFlameGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, -0.13),
    new THREE.Vector2(0.065, -0.118),
    new THREE.Vector2(0.105, -0.055),
    new THREE.Vector2(0.092, 0.025),
    new THREE.Vector2(0.052, 0.098),
    new THREE.Vector2(0.022, 0.15),
    new THREE.Vector2(0.0, 0.185),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 20)) as THREE.LatheGeometry;
}

export interface CafeGeometrySet {
  mug: THREE.LatheGeometry;
  mugHandle: THREE.TubeGeometry;
  saucer: THREE.LatheGeometry;
  carafe: THREE.LatheGeometry;
  carafeHandle: THREE.TubeGeometry;
  waterBottle: THREE.LatheGeometry;
  tallGlass: THREE.LatheGeometry;
  pendantShade: THREE.LatheGeometry;
  droplet: THREE.LatheGeometry;
  flame: THREE.LatheGeometry;
}

let cachedGeometries: CafeGeometrySet | null = null;

export function getCafeGeometries(): CafeGeometrySet {
  if (!cachedGeometries) {
    cachedGeometries = {
      mug: createMugGeometry(),
      mugHandle: createMugHandleGeometry(),
      saucer: createSaucerGeometry(),
      carafe: createCarafeGeometry(),
      carafeHandle: createCarafeHandleGeometry(),
      waterBottle: createWaterBottleGeometry(),
      tallGlass: createTallGlassGeometry(),
      pendantShade: createPendantShadeGeometry(),
      droplet: createDropletGeometry(),
      flame: createFlameGeometry(),
    };
  }
  return cachedGeometries;
}
