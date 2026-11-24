import * as THREE from 'three';

function ensureValidNormals<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Hollow ceramic prep bowl with rounded lip and recessed interior (Pizzeria & Kitchen).
 * Origin at y = 0.
 */
export function createPrepBowlGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.115, 0.0),
    new THREE.Vector2(0.145, 0.02),
    new THREE.Vector2(0.185, 0.068),
    new THREE.Vector2(0.202, 0.118),
    new THREE.Vector2(0.206, 0.132),
    new THREE.Vector2(0.19, 0.136),
    new THREE.Vector2(0.182, 0.118),
    new THREE.Vector2(0.162, 0.068),
    new THREE.Vector2(0.12, 0.026),
    new THREE.Vector2(0.0, 0.02),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28));
}

/**
 * Sculpted amber apothecary / medicine bottle with rounded shoulder & neck collar.
 * Origin at y = 0.
 */
export function createMedicineBottleGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.088, 0.0),
    new THREE.Vector2(0.098, 0.016),
    new THREE.Vector2(0.098, 0.165),
    new THREE.Vector2(0.092, 0.195),
    new THREE.Vector2(0.056, 0.228),
    new THREE.Vector2(0.052, 0.258),
    new THREE.Vector2(0.058, 0.268),
    new THREE.Vector2(0.048, 0.27),
    new THREE.Vector2(0.044, 0.245),
    new THREE.Vector2(0.0, 0.245),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28));
}

/**
 * Sculpted organic apple with subtle top stem dimple and bottom calyx indent.
 * Origin at y = 0.
 */
export function createAppleGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.012),
    new THREE.Vector2(0.032, 0.002),
    new THREE.Vector2(0.064, 0.022),
    new THREE.Vector2(0.086, 0.062),
    new THREE.Vector2(0.09, 0.108),
    new THREE.Vector2(0.078, 0.146),
    new THREE.Vector2(0.052, 0.166),
    new THREE.Vector2(0.022, 0.162),
    new THREE.Vector2(0.0, 0.148),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 24));
}

/**
 * Sculpted stone fountain basin bowl with thick carved rim (Plaza).
 * Origin at y = 0.
 */
export function createFountainBasinGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.14, 0.0),
    new THREE.Vector2(0.24, 0.04),
    new THREE.Vector2(0.38, 0.12),
    new THREE.Vector2(0.42, 0.18),
    new THREE.Vector2(0.39, 0.19),
    new THREE.Vector2(0.34, 0.13),
    new THREE.Vector2(0.18, 0.07),
    new THREE.Vector2(0.0, 0.06),
  ];
  return ensureValidNormals(new THREE.LatheGeometry(points, 28));
}

/**
 * Triangular layered cake wedge (Café Cycle 2).
 * Origin sits on bottom center so it rests cleanly on a plate.
 */
export function createCakeWedgeGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.085, -0.065);
  shape.lineTo(0.095, 0.0);
  shape.lineTo(-0.085, 0.065);
  shape.quadraticCurveTo(-0.105, 0.0, -0.085, -0.065);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.092,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 3,
    curveSegments: 12,
  });
  // Rotate so extrusion depth runs along +Y (vertical height)
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.008, 0);
  return ensureValidNormals(geo);
}

/**
 * Organic pointed basil / fruit leaf (Pizzeria & Market).
 */
export function createOrganicLeafGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.03);
  shape.bezierCurveTo(0.022, -0.015, 0.024, 0.015, 0, 0.036);
  shape.bezierCurveTo(-0.024, 0.015, -0.022, -0.015, 0, -0.03);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2);
  return ensureValidNormals(geo);
}

/**
 * Arched brick pizza oven front facade with recessed semicircular fire opening.
 */
export function createOvenArchFrameGeometry(): THREE.ExtrudeGeometry {
  const outer = new THREE.Shape();
  outer.moveTo(-0.98, 0);
  outer.lineTo(0.98, 0);
  outer.lineTo(0.98, 0.62);
  outer.absarc(0, 0.62, 0.98, 0, Math.PI, false);
  outer.lineTo(-0.98, 0);

  const hole = new THREE.Path();
  hole.moveTo(-0.46, 0.08);
  hole.lineTo(0.46, 0.08);
  hole.lineTo(0.46, 0.36);
  hole.absarc(0, 0.36, 0.46, 0, Math.PI, false);
  hole.lineTo(-0.46, 0.08);
  outer.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 24,
  });
  return ensureValidNormals(geo);
}

/**
 * Classic wooden metronome pyramid body (Plaza diegetic rhythm prop).
 */
export function createMetronomeBodyGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.085, 0);
  shape.lineTo(0.085, 0);
  shape.lineTo(0.045, 0.24);
  shape.lineTo(-0.045, 0.24);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.095,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  geo.translate(0, 0, -0.0475);
  return ensureValidNormals(geo);
}

export interface WorldGeometrySet {
  prepBowl: THREE.LatheGeometry;
  medicineBottle: THREE.LatheGeometry;
  apple: THREE.LatheGeometry;
  fountainBasin: THREE.LatheGeometry;
  cakeWedge: THREE.ExtrudeGeometry;
  organicLeaf: THREE.ExtrudeGeometry;
  ovenArchFrame: THREE.ExtrudeGeometry;
  metronomeBody: THREE.ExtrudeGeometry;
}

let cachedWorldGeometries: WorldGeometrySet | null = null;

export function getWorldGeometries(): WorldGeometrySet {
  if (!cachedWorldGeometries) {
    cachedWorldGeometries = {
      prepBowl: createPrepBowlGeometry(),
      medicineBottle: createMedicineBottleGeometry(),
      apple: createAppleGeometry(),
      fountainBasin: createFountainBasinGeometry(),
      cakeWedge: createCakeWedgeGeometry(),
      organicLeaf: createOrganicLeafGeometry(),
      ovenArchFrame: createOvenArchFrameGeometry(),
      metronomeBody: createMetronomeBodyGeometry(),
    };
  }
  return cachedWorldGeometries;
}
