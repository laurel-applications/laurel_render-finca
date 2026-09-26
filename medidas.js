// ============================================================================
//  medidas.js — Single source of truth for every dimension in the structure.
//  All units are METERS unless otherwise noted.
//
//  Coordinate convention (used across the whole project):
//    X  = largo del edificio (9.30m)
//    Y  = altura (up)
//    Z  = ancho del edificio (6.50m)
//
//  Tweak these numbers and the whole structure reshapes consistently.
// ============================================================================

export const M = Object.freeze({
  // --- Overall envelope ----------------------------------------------------
  largo:        9.30,   // X — long axis
  ancho:        6.50,   // Z — short axis (roof span)
  altoAlero:    1.95,   // Y — wall / eave height
  altoCumbrera: 2.85,   // Y — ridge height
  alero:        0.50,   // eaves overhang on the long sides (each side)

  // --- Piece cross-sections (width × thickness) ----------------------------
  // All structural wood pieces share 10×20cm; costaneras are thinner.
  colSec:  0.15,        // main columns 15×15 cm (maderas duras)
  vigSecA: 0.10,        // beam width  (10 cm) — perpendicular to length
  vigSecH: 0.20,        // beam height (20 cm) — vertical
  cosSecA: 0.05,        // costanera width  (5 cm)
  cosSecH: 0.10,        // costanera height (10 cm)

  // --- Footing (dado de cimentación aislada) -------------------------------
  // (kept for reference; currently NOT rendered — user removed them)
  dadoA: 0.40,
  dadoH: 0.60,

  // --- Counts & spacing ----------------------------------------------------
  columnasPorLadoLargo: 4,  // 2 corners + 2 intermediates per long side
  numColumnasCentrales: 4,  // center support columns along the ridge (Z=0)
  numCerchas:           6,  // trusses along the length
  numCostaneras:        5,  // roof battens distributed across the slope

  // --- Derived helpers -----------------------------------------------------
  get medioLargo() { return this.largo / 2; },
  get medioAncho() { return this.ancho / 2; },
  get pendiente()  { return (this.altoCumbrera - this.altoAlero) / this.medioAncho; },
  get zAleroExt()  { return this.medioAncho + this.alero; },
  get yAleroExt()  { return this.altoAlero - this.alero * this.pendiente; },
});

// X-positions of the 8 central support columns along the ridge (Z=0).
// Spaced every 1.33m, matching the original plano's 8 VIG-B.
export function getCentralColumnXs() {
  const n = M.numColumnasCentrales;
  const step = M.largo / (n - 1);
  return Array.from({ length: n }, (_, i) => i * step);
}

// All column positions in plan.
// Returns array of { x, z, type } where type is 'perimeter' | 'central'.
export function getColumnPositions() {
  const cols = [];

  // Perimeter: 4 per long side (2 corners + 2 intermediates).
  const nPerim = M.columnasPorLadoLargo;
  const stepPerim = M.largo / (nPerim - 1);
  for (let i = 0; i < nPerim; i++) {
    const x = i * stepPerim;
    cols.push({ x, z: -M.medioAncho, type: 'perimeter' });
    cols.push({ x, z:  M.medioAncho, type: 'perimeter' });
  }

  // Central: 8 along the ridge line, supporting VIG-A central.
  for (const x of getCentralColumnXs()) {
    cols.push({ x, z: 0, type: 'central' });
  }

  return cols;
}
