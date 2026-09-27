import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createStructure } from './house.js';
import { M } from './medidas.js';

// ---------------------------------------------------------------------------
// 1. Scene: the container for everything we render.
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);   // sky blue
scene.fog = new THREE.Fog(0x87ceeb, 60, 220);   // depth haze

// ---------------------------------------------------------------------------
// 2. Camera: perspective mimics how the human eye sees depth.
// ---------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  60,                                           // FOV (degrees)
  window.innerWidth / window.innerHeight,      // aspect ratio
  0.1,                                          // near clipping plane
  500                                           // far clipping plane
);
camera.position.set(22, 13, 24);                // pulled back for the longer structure
camera.lookAt(4.75, 2, 0);                      // look at the centroid of the 9.50 m structure

// ---------------------------------------------------------------------------
// 3. Renderer: WebGL under the hood. Shadows on for realism.
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ---------------------------------------------------------------------------
// 3b. Label renderer (CSS2D): dimension annotations floating in 3D space.
// ---------------------------------------------------------------------------
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position      = 'absolute';
labelRenderer.domElement.style.top           = '0';
labelRenderer.domElement.style.left          = '0';
labelRenderer.domElement.style.pointerEvents = 'none';   // don't block orbit drag
labelRenderer.domElement.style.zIndex        = '10';
document.body.appendChild(labelRenderer.domElement);

// ---------------------------------------------------------------------------
// 3c. Tile counter panel (always-visible HUD box).
// ---------------------------------------------------------------------------
const numTejasPorLado = 14;          // mirrors the constant in house.js
const totalTejas      = numTejasPorLado * 2;
const tileCounter = document.createElement('div');
tileCounter.style.cssText = `
  position: absolute;
  bottom: 18px;
  left: 18px;
  padding: 14px 18px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  border: 1px solid rgba(255, 235, 59, 0.55);
  border-radius: 6px;
  font: 600 12px system-ui, sans-serif;
  z-index: 11;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
`;
tileCounter.innerHTML = `
  <div style="font-size: 10px; letter-spacing: 1px; opacity: 0.65; text-transform: uppercase;">
    Tejas instaladas
  </div>
  <div style="font-size: 30px; color: #ffeb3b; line-height: 1.1; margin-top: 2px;">
    ${totalTejas}
  </div>
  <div style="font-size: 10px; opacity: 0.6; margin-top: 2px;">
    ${numTejasPorLado} por faldón × 2 faldones
  </div>
`;
document.body.appendChild(tileCounter);

// ---------------------------------------------------------------------------
// 3d. Structural-inventory panel — sits to the right of the tile counter.
// ---------------------------------------------------------------------------
const numColumnasTotal = M.columnasPorLadoLargo * 2 + M.numColumnasCentrales;
const numCerchasTotal   = M.numCerchas;
const numPares           = numCerchasTotal * 2;
const numTirantes        = numCerchasTotal * 1;
const numPendolones      = numCerchasTotal * 1;
const numDiagonales      = numCerchasTotal * 2;
const numVigasSoleras    = 2;
const numVigA            = 3;                                  // 1 caballete + 2 aleros
const numCostanerasTotal = M.numCostaneras;

const structPanel = document.createElement('div');
structPanel.style.cssText = `
  position: absolute;
  bottom: 18px;
  left: 200px;
  padding: 12px 18px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  border: 1px solid rgba(255, 235, 59, 0.55);
  border-radius: 6px;
  font: 600 11px system-ui, sans-serif;
  z-index: 11;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  min-width: 240px;
`;
structPanel.innerHTML = `
  <div style="font-size: 10px; letter-spacing: 1px; opacity: 0.65; text-transform: uppercase; margin-bottom: 6px;">
    Inventario estructural
  </div>
  <div style="display: grid; grid-template-columns: 1fr auto; gap: 3px 14px; font-size: 11px;">
    <span style="opacity: 0.95;">Columnas (${M.columnasPorLadoLargo * 2} perimetrales + ${M.numColumnasCentrales} centrales)</span>
    <span style="color: #ffeb3b; font-weight: 700; text-align: right;">${numColumnasTotal}</span>

    <span style="opacity: 0.95;">Cerchas (varillones)</span>
    <span style="color: #ffeb3b; font-weight: 700; text-align: right;">${numCerchasTotal}</span>

    <span style="padding-left: 12px; opacity: 0.7;">· Pares (top chords)</span>
    <span style="opacity: 0.7; text-align: right;">${numPares}</span>
    <span style="padding-left: 12px; opacity: 0.7;">· Tirantes (bottom)</span>
    <span style="opacity: 0.7; text-align: right;">${numTirantes}</span>
    <span style="padding-left: 12px; opacity: 0.7;">· Pendolones (king post)</span>
    <span style="opacity: 0.7; text-align: right;">${numPendolones}</span>
    <span style="padding-left: 12px; opacity: 0.7;">· Diagonales (Howe)</span>
    <span style="opacity: 0.7; text-align: right;">${numDiagonales}</span>

    <span style="opacity: 0.95;">Vigas soleras (wall plates)</span>
    <span style="color: #ffeb3b; font-weight: 700; text-align: right;">${numVigasSoleras}</span>

    <span style="opacity: 0.95;">VIG-A (1 caballete + 2 aleros)</span>
    <span style="color: #ffeb3b; font-weight: 700; text-align: right;">${numVigA}</span>

    <span style="opacity: 0.95;">Costaneras</span>
    <span style="color: #ffeb3b; font-weight: 700; text-align: right;">${numCostanerasTotal}</span>
  </div>
`;
document.body.appendChild(structPanel);

function makeLabel(text, x, y, z) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.cssText = `
    color: #fff;
    font: 600 12px system-ui, sans-serif;
    padding: 3px 8px;
    background: rgba(0, 0, 0, 0.72);
    border-radius: 4px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    white-space: nowrap;
    user-select: none;
  `;
  const obj = new CSS2DObject(div);
  obj.position.set(x, y, z);
  return obj;
}

/**
 * Architectural-style dimension annotation:
 *   dashed line between two 3D points, perpendicular tick marks at each end,
 *   and a yellow label at the midpoint showing the measured distance.
 */
function makeDimension(fromVec, toVec, labelText) {
  const group = new THREE.Group();

  // Dashed line
  const lineGeo = new THREE.BufferGeometry().setFromPoints([fromVec, toVec]);
  const lineMat = new THREE.LineDashedMaterial({
    color: 0xffeb3b,
    dashSize: 0.08,
    gapSize: 0.05,
    transparent: true,
    opacity: 0.95,
  });
  const line = new THREE.Line(lineGeo, lineMat);
  line.computeLineDistances();
  group.add(line);

  // Perpendicular tick marks at both endpoints (in the horizontal plane)
  const tickLen = 0.18;
  const dir   = toVec.clone().sub(fromVec).normalize();
  // For vertical lines, the horizontal-plane perpendicular is the world X axis
  // (the standard (-dir.z, 0, dir.x) formula collapses to (0, 0, 0) for purely
  // vertical vectors, so handle that case explicitly).
  let perp;
  if (Math.abs(dir.y) > 0.99) {
    perp = new THREE.Vector3(1, 0, 0);
  } else {
    perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  }
  const tickMat = new THREE.LineBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.95 });

  for (const pt of [fromVec, toVec]) {
    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      pt.clone().add(perp.clone().multiplyScalar( tickLen)),
      pt.clone().add(perp.clone().multiplyScalar(-tickLen)),
    ]);
    group.add(new THREE.Line(tickGeo, tickMat));
  }

  // Midpoint label
  const mid = fromVec.clone().add(toVec).multiplyScalar(0.5);
  const labelDiv = document.createElement('div');
  labelDiv.textContent = labelText;
  labelDiv.style.cssText = `
    color: #ffeb3b;
    font: 700 12px system-ui, sans-serif;
    padding: 3px 8px;
    background: rgba(0, 0, 0, 0.88);
    border: 1px solid rgba(255, 235, 59, 0.7);
    border-radius: 3px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    white-space: nowrap;
    user-select: none;
  `;
  const label = new CSS2DObject(labelDiv);
  label.position.copy(mid);
  group.add(label);

  return group;
}

// ---------------------------------------------------------------------------
// 4. Lights: ambient fills shadows, directional acts like the sun.
// ---------------------------------------------------------------------------
const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(30, 45, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.0005;
scene.add(sun);

// ---------------------------------------------------------------------------
// 5. Ground + grid helper for spatial reference while building.
// ---------------------------------------------------------------------------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(200, 100, 0x000000, 0x000000);
grid.material.opacity = 0.12;
grid.material.transparent = true;
scene.add(grid);

// ---------------------------------------------------------------------------
// 6. House: the actual structure. Defined in house.js for separation.
// ---------------------------------------------------------------------------
const house = createStructure();
scene.add(house);

// ---------------------------------------------------------------------------
// 7. Controls: mouse-driven camera navigation (rotate / pan / zoom).
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 2, 0);                   // look at the middle of the house
controls.minDistance = 5;
controls.maxDistance = 80;
controls.maxPolarAngle = Math.PI / 2 - 0.02;     // stop just above the ground
controls.update();

// ---------------------------------------------------------------------------
// 7b. Dimension labels: floating annotations in 3D space.
// ---------------------------------------------------------------------------
scene.add(makeLabel(`Alero eave:  ${M.alero.toFixed(2)} m`,  M.medioLargo, 0.4,  M.zAleroExt + 0.6));

// (8) Vertical building dimensions (cumbrera + alero) on the right side.
//     Two vertical lines, offset in Z so the labels don't overlap.
scene.add(makeDimension(
  new THREE.Vector3(M.largo + 1.1, 0,              +0.35),
  new THREE.Vector3(M.largo + 1.1, M.altoCumbrera, +0.35),
  `Cumbrera: ${M.altoCumbrera.toFixed(2)} m`,
));
scene.add(makeDimension(
  new THREE.Vector3(M.largo + 1.1, 0,              -0.35),
  new THREE.Vector3(M.largo + 1.1, M.altoAlero,    -0.35),
  `Alero: ${M.altoAlero.toFixed(2)} m`,
));

// (9) Cross-section labels — show the actual size of each piece type.
//     Place each label just outside the piece it describes.
scene.add(makeLabel(
  `Columna ${(M.colSec * 100).toFixed(0)}×${(M.colSec * 100).toFixed(0)} cm`,
  -0.55, M.altoAlero * 0.55, M.medioAncho + 0.05,
));
scene.add(makeLabel(
  `Viga ${(M.vigSecA * 100).toFixed(0)}×${(M.vigSecH * 100).toFixed(0)} cm`,
  M.medioLargo, M.altoAlero + 0.18, M.medioAncho + 0.45,
));
scene.add(makeLabel(
  `Costanera ${(M.cosSecA * 100).toFixed(0)}×${(M.cosSecH * 100).toFixed(0)} cm`,
  M.medioLargo, 1.55,  M.zAleroExt * 0.55,
));

// ---------------------------------------------------------------------------
// 7c. Architectural dimension lines (dashed lines + ticks + midpoint label).
// ---------------------------------------------------------------------------
const colStepX = M.largo / (M.columnasPorLadoLargo - 1);   // 2.43 m

// (1) Column spacing along the long axis — between columns 0 and 1 on the back side
scene.add(makeDimension(
  new THREE.Vector3(0,            0.30, -M.zAleroExt - 0.55),
  new THREE.Vector3(colStepX,    0.30, -M.zAleroExt - 0.55),
  `${colStepX.toFixed(2)} m entre columnas`,
));

// (2) Distance from a central column to the perimeter (Z direction)
scene.add(makeDimension(
  new THREE.Vector3(M.medioLargo, 0.30,  0),
  new THREE.Vector3(M.medioLargo, 0.30,  M.medioAncho),
  `${M.medioAncho.toFixed(2)} m centro → lateral`,
));

// (3) Width of one roof tile (X axis, at the eave tip, front side)
const tileEaveY   = M.yAleroExt + 0.05;
const firstTileCx = -M.tejaAleroGable + M.tejaAncho / 2;   // = 0.30 m
const tileStep    = (M.largo + 2 * M.tejaAleroGable - M.tejaAncho) / (14 - 1);
scene.add(makeDimension(
  new THREE.Vector3(firstTileCx - M.tejaAncho / 2, tileEaveY, M.zAleroExt + 0.45),
  new THREE.Vector3(firstTileCx + M.tejaAncho / 2, tileEaveY, M.zAleroExt + 0.45),
  `${M.tejaAncho.toFixed(2)} m ancho de teja`,
));

// (4) Length of one roof tile (along the slope, offset above the tile)
const slopeAng   = Math.atan2(M.altoCumbrera - M.yAleroExt, M.zAleroExt);
const perpOffset = 0.45;
const perpV      = new THREE.Vector3(0, Math.cos(slopeAng), Math.sin(slopeAng)).multiplyScalar(perpOffset);
const eavePt     = new THREE.Vector3(firstTileCx, M.yAleroExt, M.zAleroExt).add(perpV);
const apexPt     = new THREE.Vector3(firstTileCx, M.altoCumbrera, 0).add(perpV);
scene.add(makeDimension(
  eavePt,
  apexPt,
  `${M.tejaLargo.toFixed(2)} m largo de teja`,
));

// (5) Lateral overlap between two adjacent tiles (front side, between tile 0 and tile 1)
const overlapLen = M.tejaAncho - tileStep;
scene.add(makeDimension(
  new THREE.Vector3(firstTileCx + M.tejaAncho / 2 - overlapLen, tileEaveY, M.zAleroExt + 0.85),
  new THREE.Vector3(firstTileCx + M.tejaAncho / 2,            tileEaveY, M.zAleroExt + 0.85),
  `${overlapLen.toFixed(2)} m traslapo`,
));

// (6) Overall building dimensions (architectural dashed lines + ticks + label)
scene.add(makeDimension(
  new THREE.Vector3(0,     0.15, M.medioAncho + 0.85),
  new THREE.Vector3(M.largo, 0.15, M.medioAncho + 0.85),
  `Largo: ${M.largo.toFixed(2)} m`,
));
scene.add(makeDimension(
  new THREE.Vector3(-1.1, 0.15, -M.medioAncho),
  new THREE.Vector3(-1.1, 0.15,  M.medioAncho),
  `Ancho: ${M.ancho.toFixed(2)} m`,
));

// ---------------------------------------------------------------------------
// 8. Resize handling: keep the canvas in sync with the window.
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// 9. Animation loop: the heartbeat of any 3D scene.
// ---------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();                            // required for damping
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();
