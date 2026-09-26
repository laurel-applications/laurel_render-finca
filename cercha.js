import * as THREE from 'three';
import { M } from './medidas.js';

// ---------------------------------------------------------------------------
//  Shared materials (one instance each, reused across all trusses).
// ---------------------------------------------------------------------------
const woodMat = new THREE.MeshStandardMaterial({
  color:    0x8b5a2b,    // warm hardwood brown
  roughness: 0.85,
});
const diagMat = new THREE.MeshStandardMaterial({
  color:    0x6f4423,    // slightly darker — distinguishes diagonals from par
  roughness: 0.9,
});

/**
 * Build a sloped beam (par / diagonal) from `from` to `to`.
 * The geometry's local X-axis is the beam length — we orient it via quaternion.
 */
function makeBeam(geometry, from, to, mat = woodMat) {
  const beam = new THREE.Mesh(geometry, mat);
  beam.position.copy(from.clone().add(to).multiplyScalar(0.5));
  const dir = to.clone().sub(from).normalize();
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
  beam.castShadow = true;
  beam.receiveShadow = true;
  return beam;
}

/**
 * King-post truss (cercha pendolón) positioned at `posX` along the length.
 * Geometry in the YZ plane:
 *   - 2 par  (top chords, one each side, 10×20cm)
 *   - 1 tirante (bottom chord across the width, 10×20cm)
 *   - 1 pendolón (vertical center post)
 *   - 2 diagonales Howe (one from each wall corner up to apex)
 *
 * Returns a THREE.Group ready to be added to the parent structure.
 */
export function createCercha(posX) {
  const grupo = new THREE.Group();
  grupo.name = `Cercha-${posX.toFixed(2)}`;

  const w       = M.medioAncho;
  const yWall   = M.altoAlero;
  const yApex   = M.altoCumbrera;
  const yEave   = M.yAleroExt;          // height of the par at the eave end
  const zEave   = w + M.alero;          // eave tip — beyond the wall by alero

  // Par spans from eave tip → apex (continuous beam, includes the eaves).
  const parLen  = Math.sqrt(zEave * zEave + (yApex - yEave) ** 2);

  const apex    = new THREE.Vector3(0, yApex,  0);
  const eaveL   = new THREE.Vector3(0, yEave, -zEave);
  const eaveR   = new THREE.Vector3(0, yEave,  zEave);
  const wallL   = new THREE.Vector3(0, yWall, -w);    // intermediate ref
  const wallR   = new THREE.Vector3(0, yWall,  w);    // intermediate ref

  // --- Par (top chords) — now continuous from eave tip to apex ------------
  // Cross-section: 10cm (Y, vertical thickness) × 20cm (Z, perpendicular to plane).
  const parGeo = new THREE.BoxGeometry(parLen, M.vigSecA, M.vigSecH);
  grupo.add(makeBeam(parGeo, eaveL, apex));
  grupo.add(makeBeam(parGeo, eaveR, apex));

  // --- Tirante (bottom chord) ---------------------------------------------
  // Runs along Z (the width). X=10cm, Y=20cm vertical, Z=ancho.
  const tirante = new THREE.Mesh(
    new THREE.BoxGeometry(M.vigSecA, M.vigSecH, M.ancho),
    woodMat
  );
  tirante.position.set(0, yWall, 0);
  tirante.castShadow = tirante.receiveShadow = true;
  grupo.add(tirante);

  // --- Pendolón (vertical center post) ------------------------------------
  const pendLen = yApex - yWall;
  const pendolon = new THREE.Mesh(
    new THREE.BoxGeometry(M.vigSecA, pendLen, M.vigSecA),
    woodMat
  );
  pendolon.position.set(0, yWall + pendLen / 2, 0);
  pendolon.castShadow = pendolon.receiveShadow = true;
  grupo.add(pendolon);

  // --- Diagonales (Howe-style) --------------------------------------------
  // Slightly smaller cross-section so they're visually distinct from the par.
  // Run from the wall corners up to the apex (same length as the par).
  const diagGeo = new THREE.BoxGeometry(parLen, M.vigSecA * 0.7, M.vigSecA * 0.7);
  grupo.add(makeBeam(diagGeo, wallL, apex, diagMat));
  grupo.add(makeBeam(diagGeo, wallR, apex, diagMat));

  // Place the whole truss along the length axis.
  grupo.position.x = posX;

  return grupo;
}
