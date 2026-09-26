import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStructure } from './house.js';

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
camera.position.set(20, 12, 22);                // pulled back to fit the longer structure
camera.lookAt(4.65, 2, 0);                      // look at the centroid of the 9.30m structure

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
// 8. Resize handling: keep the canvas in sync with the window.
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// 9. Animation loop: the heartbeat of any 3D scene.
// ---------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();                            // required for damping
  renderer.render(scene, camera);
}
animate();
