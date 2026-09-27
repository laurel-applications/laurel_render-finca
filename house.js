import * as THREE from 'three';
import { M, getColumnPositions } from './medidas.js';
import { createCercha } from './cercha.js';

// ---------------------------------------------------------------------------
//  Shared materials.
// ---------------------------------------------------------------------------
const woodMat = new THREE.MeshStandardMaterial({
  color:    0x8b5a2b,
  roughness: 0.85,
});
const tejaMat = new THREE.MeshStandardMaterial({
  color:    0x8a8a8a,    // galvanized zinc gray
  roughness: 0.55,        // slightly reflective (metal)
  metalness: 0.25,
  side:     THREE.DoubleSide,  // safe regardless of basis orientation
});

// ---------------------------------------------------------------------------
//  Piece factories.
// ---------------------------------------------------------------------------

/**
 * Hardwood column of the given `height`.  Perimeter columns go up to the wall
 * plate (altoAlero); central columns run the full height to the ridge.
 */
function createColumna(height) {
  const col = new THREE.Mesh(
    new THREE.BoxGeometry(M.colSec, height, M.colSec),
    woodMat
  );
  col.castShadow = col.receiveShadow = true;
  return col;
}

/** Long wall plate (viga solera de amarre) running the full length. */
function createSoleraLong() {
  const s = new THREE.Mesh(
    new THREE.BoxGeometry(M.largo, M.vigSecH, M.vigSecA),
    woodMat
  );
  s.castShadow = s.receiveShadow = true;
  return s;
}

/** Longitudinal VIG-A beam (caballete or alero) — runs the full length + eaves. */
function createVigaLongitudinal(yPos, zPos) {
  const v = new THREE.Mesh(
    new THREE.BoxGeometry(M.largo + 2 * M.alero, M.vigSecA, M.vigSecH),
    woodMat
  );
  v.position.set(M.medioLargo, yPos, zPos);
  v.castShadow = v.receiveShadow = true;
  return v;
}

/**
 * Costanera (roof batten) sitting on top of the trusses at horizontal offset zOffset.
 * The costanera is horizontal; its Y follows the roof slope.
 */
function createCostanera(zOffset) {
  const yPendiente = M.altoCumbrera - Math.abs(zOffset) * M.pendiente;
  const yCenter    = yPendiente + M.vigSecA / 2 + M.cosSecH / 2;

  const c = new THREE.Mesh(
    new THREE.BoxGeometry(M.largo + 2 * M.alero, M.cosSecH, M.cosSecA),
    woodMat
  );
  c.position.set(M.medioLargo, yCenter, zOffset);
  c.castShadow = c.receiveShadow = true;
  return c;
}

/**
 * Corrugated zinc roof sheet (teja de zinc ondulada).
 *
 * One PlaneGeometry that spans from the ridge (z=0) to the eave (z=±zAleroExt).
 * Vertices are displaced along the local normal with a sine wave to produce
 * the corrugation profile — the wave crests run along the slope, parallel to
 * the costaneras that support them.
 */
function createTeja(x, side) {
  // Real tile specs from medidas.js (per the roof diagram).
  const tileW     = M.tejaAncho;       // 0.80 m total width
  const waves     = M.tejaOndas;       // 8 corrugations
  const amplitude = M.tejaAmplitud;    // 1.8 cm wave height
  const tileLen   = M.tejaLargo;       // 3.65 m total length along the slope

  // The tile spans from the eave (alero past the wall) to the apex.
  // With M.alero = 0.28, the truss par end and the tile eave end coincide.
  const ridgeY = M.altoCumbrera;
  const zEaveTeja = side * (M.medioAncho + M.alero);
  const yEaveTeja = ridgeY - Math.abs(zEaveTeja) * M.pendiente;
  const midY   = (ridgeY + yEaveTeja) / 2;
  const midZ   = zEaveTeja / 2;

  // Slope angle and basis vectors.
  const slopeAngle = Math.atan2(ridgeY - yEaveTeja, Math.abs(zEaveTeja));
  const slopeDir = new THREE.Vector3(0,  Math.sin(slopeAngle), -side * Math.cos(slopeAngle));
  const perpDir  = new THREE.Vector3(0,  Math.cos(slopeAngle),  side * Math.sin(slopeAngle));

  // Plane geometry sized from the real specs.
  const geo = new THREE.PlaneGeometry(tileW, tileLen, 48, 6);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const wave = amplitude * Math.sin((lx / tileW) * waves * 2 * Math.PI);
    pos.setZ(i, wave);                      // displace along local normal (becomes perpDir)
  }
  geo.computeVertexNormals();

  const tile = new THREE.Mesh(geo, tejaMat);

  // Sit the sheet ON TOP of the costaneras with a small clearance buffer.
  // Costanera vertical top = slope + vigSecA/2 + cosSecH/2 + cosSecH/2 = slope + 0.15.
  // Convert to perpendicular distance, add one amplitude (so the wave valleys
  // sit at the costanera top), plus a 4 cm clearance buffer.
  // Ridge overlap: the front slope (side=+1) tiles sit on top, the back slope
  // (side=-1) tiles drop by `sideDrop` perpendicular so the front tiles cover
  // the back ones at the cumbrera and shed water down to the back side.
  const costaneraTopVert = M.vigSecA / 2 + M.cosSecH;       // 0.05 + 0.10 = 0.15
  const costaneraTopPerp = costaneraTopVert / Math.cos(slopeAngle);
  const clearance       = 0.03;                              // 3 cm gap above the costaneras
  const sideDrop        = 0.04;                              // back slope drops 4 cm (perpendicular)
  const offsetBase = costaneraTopPerp + amplitude + clearance;
  const offset = side > 0 ? offsetBase : offsetBase - sideDrop;
  tile.position.set(
    x,
    midY + perpDir.y * offset,
    midZ + perpDir.z * offset,
  );

  // Orient via basis matrix.  Tricky bit: for side=-1 (back slope), the natural
  // (xAxis, slopeDir, perpDir) triple is LEFT-HANDED — xAxis × slopeDir = -perpDir.
  // setFromRotationMatrix on a reflection matrix produces wrong rotations,
  // which is what made the back slope look "vertical".  Fix: use the downhill
  // direction for side=-1 so the basis is right-handed.  The plane is symmetric
  // in its local Y so this is invisible from the outside.
  const yAxis = side > 0 ? slopeDir : slopeDir.clone().negate();
  tile.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      new THREE.Vector3(1, 0, 0),
      yAxis,
      perpDir,
    )
  );

  tile.castShadow = tile.receiveShadow = true;
  return tile;
}

// ---------------------------------------------------------------------------
//  Main assembly — composes the full Casa Bareque skeleton.
// ---------------------------------------------------------------------------
export function createStructure() {
  const estructura = new THREE.Group();
  estructura.name = 'Casa-Bareque';

  const colPos = getColumnPositions();

  // ---- 1. Columnas (12 total: 8 perimeter + 4 central) -------------------
  // Perimeter columns: 1.95m, sit on top of the wall plates.
  // Central columns:   2.85m, run from floor up to the ridge and support
  //                    the central VIG-A beam.
  // No concrete dados — columns rest directly on the ground (per spec).
  for (const col of colPos) {
    const h = col.type === 'central' ? M.altoCumbrera : M.altoAlero;
    const c = createColumna(h);
    c.position.set(col.x, h / 2, col.z);
    estructura.add(c);
  }

  // ---- 2. Vigas soleras de amarre (wall plates) on both long sides -------
  const soleraF = createSoleraLong();
  soleraF.position.set(M.medioLargo, M.altoAlero, M.medioAncho);
  estructura.add(soleraF);

  const soleraB = createSoleraLong();
  soleraB.position.set(M.medioLargo, M.altoAlero, -M.medioAncho);
  estructura.add(soleraB);

  // ---- 3. Cerchas (king-post trusses) ------------------------------------
  // The cercha factory now extends the par out to the eaves, so VIG-A at the
  // eave line has a real support point along its length.
  const cerchaSpacing = M.largo / (M.numCerchas - 1);
  for (let i = 0; i < M.numCerchas; i++) {
    estructura.add(createCercha(i * cerchaSpacing));
  }

  // ---- 4. VIG-A longitudinales (3 vigas de carga continuas) -------------
  // Central (caballete) at the apex; 2 extremas at the eave lines.
  // The eave VIG-A sit on top of the extended pars (one par-thickness + half a
  // VIG-A above the eave-tip height).
  estructura.add(createVigaLongitudinal(M.altoCumbrera + M.vigSecA / 2, 0));
  estructura.add(createVigaLongitudinal(M.yAleroExt + M.vigSecA,  M.zAleroExt));
  estructura.add(createVigaLongitudinal(M.yAleroExt + M.vigSecA, -M.zAleroExt));

  // ---- 5. Costaneras (roof battens) — numCostaneras evenly distributed ----
  // Goes from -zAleroExt (front eave) to +zAleroExt (back eave) across the
  // full roof width.  Each costanera spans the whole length + eaves.
  const nCos = M.numCostaneras;
  for (let i = 0; i < nCos; i++) {
    const t  = nCos === 1 ? 0.5 : i / (nCos - 1);   // 0..1
    const z  = -M.zAleroExt + t * (2 * M.zAleroExt);
    estructura.add(createCostanera(z));
  }

  // ---- 6. Tejas (roof tiles) — 14 per slope, 28 total --------------------
  // Tiles extend tejaAleroGable past each gable end (X=0 and X=largo) so the
  // truss par at the first/last cercha is covered.  Step between centres is
  // (largo + 2·aleroGable − tejaAncho) / (n−1) — with 14 tiles on a 7.30 m
  // roof the math forces a larger lateral overlap (~0.28 m).
  const numTejas = 14;
  const tileStep = (M.largo + 2 * M.tejaAleroGable - M.tejaAncho) / (numTejas - 1);
  const firstTileCenter = -M.tejaAleroGable + M.tejaAncho / 2;
  for (let i = 0; i < numTejas; i++) {
    const xc = firstTileCenter + i * tileStep;
    estructura.add(createTeja(xc, +1));        // front slope (z = +)
    estructura.add(createTeja(xc, -1));        // back slope (z = -)
  }

  return estructura;
}
