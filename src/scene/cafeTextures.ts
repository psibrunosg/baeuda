import * as THREE from 'three';

/**
 * Deterministic PRNG so procedural PBR textures are identical every load
 * and never flicker or allocate differently between renders.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return { canvas, ctx };
}

function toTexture(
  canvas: HTMLCanvasElement,
  options: { color: boolean; repeatX?: number; repeatY?: number },
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = options.color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (options.repeatX !== undefined || options.repeatY !== undefined) {
    tex.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1);
  }
  tex.needsUpdate = true;
  return tex;
}

export interface PbrTextureBundle {
  woodCounterColor: THREE.CanvasTexture | null;
  woodCounterBump: THREE.CanvasTexture | null;
  woodCounterRoughness: THREE.CanvasTexture | null;
  plasterColor: THREE.CanvasTexture | null;
  plasterBump: THREE.CanvasTexture | null;
  clayBump: THREE.CanvasTexture | null;
  clayRoughness: THREE.CanvasTexture | null;
  terracottaColor: THREE.CanvasTexture | null;
  terracottaBump: THREE.CanvasTexture | null;
  cobblestoneColor: THREE.CanvasTexture | null;
  cobblestoneBump: THREE.CanvasTexture | null;
  woodCrateColor: THREE.CanvasTexture | null;
  woodCrateBump: THREE.CanvasTexture | null;
  latteArtColor: THREE.CanvasTexture | null;
  floorPlankColor: THREE.CanvasTexture | null;
  floorPlankBump: THREE.CanvasTexture | null;
  tileColor: THREE.CanvasTexture | null;
  tileBump: THREE.CanvasTexture | null;
  sunbeamAlpha: THREE.CanvasTexture | null;
}

function createWoodCounterMaps(): {
  color: THREE.CanvasTexture | null;
  bump: THREE.CanvasTexture | null;
  roughness: THREE.CanvasTexture | null;
} {
  const size = 256;
  const colorBuf = makeCanvas(size, size);
  const bumpBuf = makeCanvas(size, size);
  const roughBuf = makeCanvas(size, size);
  if (!colorBuf || !bumpBuf || !roughBuf) {
    return { color: null, bump: null, roughness: null };
  }

  const rand = mulberry32(101);
  const { ctx: c } = colorBuf;
  const { ctx: b } = bumpBuf;
  const { ctx: r } = roughBuf;

  c.fillStyle = '#b47b4e';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);
  r.fillStyle = '#a8a8a8';
  r.fillRect(0, 0, size, size);

  // Subtle horizontal oak planks + organic wavy wood fibers
  const plankCount = 4;
  const plankH = size / plankCount;
  for (let p = 0; p < plankCount; p++) {
    const y0 = p * plankH;
    const toneShift = Math.round((rand() - 0.5) * 18);
    c.fillStyle = `rgb(${178 + toneShift}, ${122 + Math.round(toneShift * 0.7)}, ${76 + Math.round(toneShift * 0.5)})`;
    c.fillRect(0, y0, size, plankH);

    // Fine seamlessly periodic wood grain lines (exact integer cycles across 0..size)
    for (let i = 0; i < 34; i++) {
      const gy = y0 + rand() * plankH;
      const dark = rand() > 0.4;
      const amp = 1.4 + rand() * 3.0;
      const cycles = 1 + (i % 2);
      const freq = (cycles * Math.PI * 2) / size;
      const phase = rand() * Math.PI * 2;
      const startY = gy + Math.sin(phase) * amp;

      c.strokeStyle = dark ? 'rgba(84, 46, 22, 0.2)' : 'rgba(226, 178, 130, 0.16)';
      c.lineWidth = 0.8 + rand() * 1.6;
      c.beginPath();
      c.moveTo(0, startY);
      for (let x = 8; x <= size; x += 8) {
        c.lineTo(x, gy + Math.sin(x * freq + phase) * amp);
      }
      c.stroke();

      b.strokeStyle = dark ? 'rgba(92,92,92,0.42)' : 'rgba(164,164,164,0.32)';
      b.lineWidth = 1.1;
      b.beginPath();
      b.moveTo(0, startY);
      for (let x = 8; x <= size; x += 8) {
        b.lineTo(x, gy + Math.sin(x * freq + phase) * amp);
      }
      b.stroke();

      r.strokeStyle = dark ? 'rgba(195,195,195,0.38)' : 'rgba(142,142,142,0.32)';
      r.lineWidth = 1.3;
      r.beginPath();
      r.moveTo(0, startY);
      for (let x = 8; x <= size; x += 8) {
        r.lineTo(x, gy + Math.sin(x * freq + phase) * amp);
      }
      r.stroke();
    }

    // Soft bevel seam between horizontal planks
    c.fillStyle = 'rgba(65, 34, 16, 0.24)';
    c.fillRect(0, y0, size, 2);
    b.fillStyle = '#484848';
    b.fillRect(0, y0, size, 2);
    r.fillStyle = '#dcdcdc';
    r.fillRect(0, y0, size, 2);
  }

  return {
    color: toTexture(colorBuf.canvas, { color: true, repeatX: 1, repeatY: 1 }),
    bump: toTexture(bumpBuf.canvas, { color: false, repeatX: 1, repeatY: 1 }),
    roughness: toTexture(roughBuf.canvas, { color: false, repeatX: 1, repeatY: 1 }),
  };
}

/**
 * Claybound-inspired tactile clay / artisanal ceramic micro-relief bump + roughness map.
 * Gives stylized matte surfaces subtle handmade warmth instead of smooth plastic.
 */
function createClayTactileMaps(): {
  bump: THREE.CanvasTexture | null;
  roughness: THREE.CanvasTexture | null;
} {
  const size = 256;
  const bumpBuf = makeCanvas(size, size);
  const roughBuf = makeCanvas(size, size);
  if (!bumpBuf || !roughBuf) return { bump: null, roughness: null };

  const rand = mulberry32(202);
  const { ctx: b } = bumpBuf;
  const { ctx: r } = roughBuf;

  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);
  r.fillStyle = '#c8c8c8';
  r.fillRect(0, 0, size, size);

  // Soft broad hand-sculpted thumb depressions
  for (let i = 0; i < 140; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rad = 8 + rand() * 20;
    const bright = rand() > 0.5;
    const grad = b.createRadialGradient(x, y, 1, x, y, rad);
    grad.addColorStop(0, bright ? 'rgba(162,162,162,0.16)' : 'rgba(94,94,94,0.16)');
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    b.fillStyle = grad;
    b.beginPath();
    b.arc(x, y, rad, 0, Math.PI * 2);
    b.fill();

    r.fillStyle = bright ? 'rgba(182,182,182,0.12)' : 'rgba(222,222,222,0.12)';
    r.beginPath();
    r.arc(x, y, rad * 0.9, 0, Math.PI * 2);
    r.fill();
  }

  // Fine artisanal ceramic/clay micro-speckle
  for (let i = 0; i < 1200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const v = 105 + Math.floor(rand() * 48);
    b.fillStyle = `rgba(${v},${v},${v},0.35)`;
    b.fillRect(x, y, 2, 2);
  }

  return {
    bump: toTexture(bumpBuf.canvas, { color: false, repeatX: 2, repeatY: 2 }),
    roughness: toTexture(roughBuf.canvas, { color: false, repeatX: 2, repeatY: 2 }),
  };
}

function createPlasterWallMaps(): {
  color: THREE.CanvasTexture | null;
  bump: THREE.CanvasTexture | null;
} {
  const size = 256;
  const colorBuf = makeCanvas(size, size);
  const bumpBuf = makeCanvas(size, size);
  if (!colorBuf || !bumpBuf) return { color: null, bump: null };

  const rand = mulberry32(303);
  const { ctx: c } = colorBuf;
  const { ctx: b } = bumpBuf;

  c.fillStyle = '#f4e7d4';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);

  // Soft lime-wash clouds
  for (let i = 0; i < 160; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rad = 14 + rand() * 34;
    const warm = rand() > 0.5;
    const grad = c.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, warm ? 'rgba(232, 206, 174, 0.15)' : 'rgba(255, 249, 238, 0.16)');
    grad.addColorStop(1, 'rgba(244, 231, 212, 0)');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(x, y, rad, 0, Math.PI * 2);
    c.fill();

    const bv = warm ? 112 : 146;
    b.fillStyle = `rgba(${bv},${bv},${bv},0.16)`;
    b.beginPath();
    b.arc(x, y, rad * 0.65, 0, Math.PI * 2);
    b.fill();
  }

  // Subtle horizontal ceramic tile backsplash hint in lower third
  for (let i = 0; i < 700; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const v = 115 + Math.floor(rand() * 30);
    b.fillStyle = `rgba(${v},${v},${v},0.3)`;
    b.fillRect(x, y, 1.5, 1.5);
  }

  return {
    color: toTexture(colorBuf.canvas, { color: true, repeatX: 3, repeatY: 2 }),
    bump: toTexture(bumpBuf.canvas, { color: false, repeatX: 3, repeatY: 2 }),
  };
}

function createTerracottaMaps(): {
  color: THREE.CanvasTexture | null;
  bump: THREE.CanvasTexture | null;
} {
  const size = 256;
  const colorBuf = makeCanvas(size, size);
  const bumpBuf = makeCanvas(size, size);
  if (!colorBuf || !bumpBuf) return { color: null, bump: null };

  const rand = mulberry32(404);
  const { ctx: c } = colorBuf;
  const { ctx: b } = bumpBuf;

  c.fillStyle = '#d97658';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);

  // Subtle sun-baked stucco clouds (soft gradients, no harsh spots)
  for (let i = 0; i < 140; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rad = 18 + rand() * 36;
    const warm = rand() > 0.45;
    const grad = c.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, warm ? 'rgba(196, 86, 56, 0.09)' : 'rgba(248, 178, 144, 0.1)');
    grad.addColorStop(1, 'rgba(217, 118, 88, 0)');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(x, y, rad, 0, Math.PI * 2);
    c.fill();

    const bv = warm ? 114 : 142;
    b.fillStyle = `rgba(${bv},${bv},${bv},0.12)`;
    b.beginPath();
    b.arc(x, y, rad * 0.6, 0, Math.PI * 2);
    b.fill();
  }

  return {
    color: toTexture(colorBuf.canvas, { color: true, repeatX: 2, repeatY: 2 }),
    bump: toTexture(bumpBuf.canvas, { color: false, repeatX: 2, repeatY: 2 }),
  };
}

function createCobblestoneMaps(): {
  color: THREE.CanvasTexture | null;
  bump: THREE.CanvasTexture | null;
} {
  const size = 256;
  const colorBuf = makeCanvas(size, size);
  const bumpBuf = makeCanvas(size, size);
  if (!colorBuf || !bumpBuf) return { color: null, bump: null };

  const rand = mulberry32(505);
  const { ctx: c } = colorBuf;
  const { ctx: b } = bumpBuf;

  // Warm mortar groove base
  c.fillStyle = '#8b8072';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#3c3c3c';
  b.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 6;
  const rowH = size / rows;
  const colW = size / cols;

  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * (colW * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * colW + offset + 2.5;
      const y = row * rowH + 2.5;
      const w = colW - 5;
      const h = rowH - 5;
      const shift = Math.round((rand() - 0.5) * 26);

      c.fillStyle = `rgb(${182 + shift}, ${172 + shift}, ${156 + shift})`;
      c.beginPath();
      c.roundRect(x, y, w, h, 5);
      c.fill();

      const bv = 175 + Math.round((rand() - 0.5) * 35);
      b.fillStyle = `rgb(${bv},${bv},${bv})`;
      b.beginPath();
      b.roundRect(x, y, w, h, 5);
      b.fill();
    }
  }

  return {
    color: toTexture(colorBuf.canvas, { color: true, repeatX: 6, repeatY: 1 }),
    bump: toTexture(bumpBuf.canvas, { color: false, repeatX: 6, repeatY: 1 }),
  };
}

function createWoodCrateMaps(): {
  color: THREE.CanvasTexture | null;
  bump: THREE.CanvasTexture | null;
} {
  const size = 256;
  const colorBuf = makeCanvas(size, size);
  const bumpBuf = makeCanvas(size, size);
  if (!colorBuf || !bumpBuf) return { color: null, bump: null };

  const rand = mulberry32(606);
  const { ctx: c } = colorBuf;
  const { ctx: b } = bumpBuf;

  c.fillStyle = '#d4a36e';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#909090';
  b.fillRect(0, 0, size, size);

  const slats = 4;
  const slatH = size / slats;
  for (let i = 0; i < slats; i++) {
    const y = i * slatH;
    const shift = Math.round((rand() - 0.5) * 16);
    c.fillStyle = `rgb(${214 + shift}, ${164 + shift}, ${110 + Math.round(shift * 0.7)})`;
    c.fillRect(0, y + 3, size, slatH - 6);
    c.fillStyle = 'rgba(102, 62, 28, 0.42)';
    c.fillRect(0, y, size, 3);
    b.fillStyle = '#404040';
    b.fillRect(0, y, size, 4);
  }

  // Framing border
  c.strokeStyle = '#9e6c3d';
  c.lineWidth = 14;
  c.strokeRect(7, 7, size - 14, size - 14);
  b.strokeStyle = '#d8d8d8';
  b.lineWidth = 14;
  b.strokeRect(7, 7, size - 14, size - 14);

  return {
    color: toTexture(colorBuf.canvas, { color: true }),
    bump: toTexture(bumpBuf.canvas, { color: false }),
  };
}

/**
 * Rich espresso crema disc with stylized cream rosetta/heart latte art.
 */
function createLatteArtMap(): THREE.CanvasTexture | null {
  const size = 256;
  const buf = makeCanvas(size, size);
  if (!buf) return null;

  const { ctx: c } = buf;
  const cx = size / 2;
  const cy = size / 2;

  const cremaGrad = c.createRadialGradient(cx, cy, 12, cx, cy, 126);
  cremaGrad.addColorStop(0, '#7c4523');
  cremaGrad.addColorStop(0.75, '#5b2e14');
  cremaGrad.addColorStop(1, '#3c1b0a');
  c.fillStyle = cremaGrad;
  c.fillRect(0, 0, size, size);

  // Stylized cream foam heart
  c.save();
  c.translate(cx, cy + 8);
  c.fillStyle = '#f9ebd8';
  c.beginPath();
  c.moveTo(0, 48);
  c.bezierCurveTo(-58, 12, -74, -46, -28, -56);
  c.bezierCurveTo(-6, -60, 0, -34, 0, -24);
  c.bezierCurveTo(0, -34, 6, -60, 28, -56);
  c.bezierCurveTo(74, -46, 58, 12, 0, 48);
  c.fill();

  // Inner warm espresso accent drop
  c.fillStyle = '#8b4e27';
  c.beginPath();
  c.moveTo(0, 20);
  c.bezierCurveTo(-24, 2, -28, -24, -10, -28);
  c.bezierCurveTo(-2, -30, 0, -18, 0, -14);
  c.bezierCurveTo(0, -18, 2, -30, 10, -28);
  c.bezierCurveTo(28, -24, 24, 2, 0, 20);
  c.fill();
  c.restore();

  return toTexture(buf.canvas, { color: true });
}

function createFloorPlankMaps(): {
  color: THREE.CanvasTexture | null;
  bump: THREE.CanvasTexture | null;
} {
  const size = 256;
  const colorBuf = makeCanvas(size, size);
  const bumpBuf = makeCanvas(size, size);
  if (!colorBuf || !bumpBuf) return { color: null, bump: null };

  const rand = mulberry32(707);
  const { ctx: c } = colorBuf;
  const { ctx: b } = bumpBuf;

  c.fillStyle = '#d7be9e';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#888888';
  b.fillRect(0, 0, size, size);

  const strips = 6;
  const stripH = size / strips;
  for (let i = 0; i < strips; i++) {
    const y = i * stripH;
    const shift = Math.round((rand() - 0.5) * 14);
    c.fillStyle = `rgb(${214 + shift}, ${190 + shift}, ${156 + shift})`;
    c.fillRect(0, y, size, stripH);
    c.fillStyle = 'rgba(110, 82, 54, 0.25)';
    c.fillRect(0, y, size, 2);
    b.fillStyle = '#484848';
    b.fillRect(0, y, size, 2);
  }

  return {
    color: toTexture(colorBuf.canvas, { color: true, repeatX: 4, repeatY: 4 }),
    bump: toTexture(bumpBuf.canvas, { color: false, repeatX: 4, repeatY: 4 }),
  };
}

/**
 * Warm ceramic subway-tile backsplash for the café barista wall.
 */
function createTileBacksplashMaps(): {
  color: THREE.CanvasTexture | null;
  bump: THREE.CanvasTexture | null;
} {
  const size = 256;
  const colorBuf = makeCanvas(size, size);
  const bumpBuf = makeCanvas(size, size);
  if (!colorBuf || !bumpBuf) return { color: null, bump: null };

  const rand = mulberry32(808);
  const { ctx: c } = colorBuf;
  const { ctx: b } = bumpBuf;

  // Warm cream grout
  c.fillStyle = '#d9ccb8';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#484848';
  b.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 4;
  const rowH = size / rows;
  const colW = size / cols;

  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * (colW * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * colW + offset + 2;
      const y = row * rowH + 2;
      const w = colW - 4;
      const h = rowH - 4;
      const shift = Math.round((rand() - 0.5) * 10);

      c.fillStyle = `rgb(${245 + shift}, ${236 + shift}, ${220 + shift})`;
      c.beginPath();
      c.roundRect(x, y, w, h, 3);
      c.fill();

      b.fillStyle = '#dedede';
      b.beginPath();
      b.roundRect(x, y, w, h, 3);
      b.fill();
    }
  }

  return {
    color: toTexture(colorBuf.canvas, { color: true, repeatX: 4, repeatY: 1 }),
    bump: toTexture(bumpBuf.canvas, { color: false, repeatX: 4, repeatY: 1 }),
  };
}

/**
 * Soft additive gradient texture for warm morning sunbeams streaming from the window.
 */
function createSunbeamMap(): THREE.CanvasTexture | null {
  const size = 128;
  const buf = makeCanvas(size, size);
  if (!buf) return null;

  const { ctx: c } = buf;
  const grad = c.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, 'rgba(255, 240, 195, 0.42)');
  grad.addColorStop(0.55, 'rgba(255, 234, 175, 0.16)');
  grad.addColorStop(1, 'rgba(255, 234, 175, 0.0)');
  c.fillStyle = grad;
  c.fillRect(0, 0, size, size);

  // Soft horizontal fade at left/right edges
  c.globalCompositeOperation = 'destination-in';
  const sideGrad = c.createLinearGradient(0, 0, size, 0);
  sideGrad.addColorStop(0, 'rgba(255,255,255,0)');
  sideGrad.addColorStop(0.25, 'rgba(255,255,255,1)');
  sideGrad.addColorStop(0.75, 'rgba(255,255,255,1)');
  sideGrad.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sideGrad;
  c.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(buf.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

let cachedTextures: PbrTextureBundle | null = null;

export function getCafeTextures(): PbrTextureBundle {
  if (!cachedTextures) {
    const wood = createWoodCounterMaps();
    const clay = createClayTactileMaps();
    const plaster = createPlasterWallMaps();
    const terracotta = createTerracottaMaps();
    const cobble = createCobblestoneMaps();
    const crate = createWoodCrateMaps();
    const floor = createFloorPlankMaps();
    const tile = createTileBacksplashMaps();

    cachedTextures = {
      woodCounterColor: wood.color,
      woodCounterBump: wood.bump,
      woodCounterRoughness: wood.roughness,
      plasterColor: plaster.color,
      plasterBump: plaster.bump,
      clayBump: clay.bump,
      clayRoughness: clay.roughness,
      terracottaColor: terracotta.color,
      terracottaBump: terracotta.bump,
      cobblestoneColor: cobble.color,
      cobblestoneBump: cobble.bump,
      woodCrateColor: crate.color,
      woodCrateBump: crate.bump,
      latteArtColor: createLatteArtMap(),
      floorPlankColor: floor.color,
      floorPlankBump: floor.bump,
      tileColor: tile.color,
      tileBump: tile.bump,
      sunbeamAlpha: createSunbeamMap(),
    };
  }
  return cachedTextures;
}
