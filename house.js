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

  return estructura;
}
