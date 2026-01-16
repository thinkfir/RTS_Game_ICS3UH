// RTS prototype using Three.js and anime.js. Undergrad-friendly, commented.
// Uses CDN globals (THREE, anime) provided in index.html.

// ---- Basic scene setup ----
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9c8df');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 35, 45);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(25, 35, 15);
scene.add(dir);

// Ground with mild variation
const groundGeo = new THREE.PlaneGeometry(160, 160, 1, 1);
const groundMat = new THREE.MeshStandardMaterial({ color: '#7da67d', roughness: 0.9, metalness: 0.0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---- Game state ----
const resources = { food: 200, wood: 200, gold: 150, pop: 3, popCap: 10 };
const HUD = {
  food: document.getElementById('food'),
  wood: document.getElementById('wood'),
  gold: document.getElementById('gold'),
  pop: document.getElementById('pop'),
  selectionDetails: document.getElementById('selection-details'),
};

const units = []; // villagers only for now
const buildings = []; // TC only
const resourcesNodes = []; // trees, bushes, mines
let selected = null;
let gatherTargetIndex = 0; // cycles between resource types

// ---- Helpers ----
function updateHUD() {
  HUD.food.textContent = Math.floor(resources.food);
  HUD.wood.textContent = Math.floor(resources.wood);
  HUD.gold.textContent = Math.floor(resources.gold);
  HUD.pop.textContent = `${units.length}/${resources.popCap}`;
}

function makeMarker(color = '#fff') {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function makeResourceNode(type, position) {
  const colorMap = { food: '#6bbf59', wood: '#8b5a2b', gold: '#d4af37' };
  const size = 2.3;
  const geo = new THREE.CylinderGeometry(size, size, 2, 8);
  const mat = new THREE.MeshStandardMaterial({ color: colorMap[type] || '#888' });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.userData = { type };
  scene.add(mesh);
  resourcesNodes.push(mesh);
}

function spawnUnit(kind, position) {
  const colorMap = {
    villager: '#d9e4ff',
    spearman: '#4da6ff',
    archer: '#ff6f61',
    horse: '#8f6af8',
  };
  const mesh = makeMarker(colorMap[kind] || '#fff');
  mesh.scale.set(1, 1.5, 1);
  mesh.position.copy(position.clone());
  mesh.userData = {
    kind,
    hp: 50,
    target: null,
    task: 'idle',
    gatherType: null,
    cooldown: 0,
  };
  scene.add(mesh);
  units.push(mesh);
  updateHUD();
  return mesh;
}

function spawnBuilding(kind, position) {
  const colorMap = { tc: '#f1c40f' };
  const geo = new THREE.BoxGeometry(8, 4.5, 8);
  const mat = new THREE.MeshStandardMaterial({ color: colorMap[kind] || '#ccc' });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.userData = { kind };
  scene.add(mesh);
  buildings.push(mesh);
  return mesh;
}

function animateMove(mesh, targetPos, duration = 1200) {
  const start = mesh.position.clone();
  anime({
    targets: { t: 0 },
    t: 1,
    duration,
    easing: 'easeInOutSine',
    update: anim => {
      mesh.position.lerpVectors(start, targetPos, anim.animations[0].currentValue);
    },
  });
}

function pickNearbyResource(type, fromPos) {
  const candidates = resourcesNodes.filter(n => n.userData.type === type);
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestDist = fromPos.distanceTo(best.position);
  for (let i = 1; i < candidates.length; i++) {
    const d = fromPos.distanceTo(candidates[i].position);
    if (d < bestDist) { best = candidates[i]; bestDist = d; }
  }
  return best;
}

// ---- Initialization ----
const tc = spawnBuilding('tc', new THREE.Vector3(0, 2, 0));

spawnUnit('villager', new THREE.Vector3(3, 0.5, 3));
spawnUnit('villager', new THREE.Vector3(-3, 0.5, 3));
spawnUnit('villager', new THREE.Vector3(0, 0.5, -3));

// Resource nodes scatter
makeResourceNode('food', new THREE.Vector3(10, 1, 12));
makeResourceNode('food', new THREE.Vector3(-12, 1, 10));
makeResourceNode('wood', new THREE.Vector3(-18, 1, -10));
makeResourceNode('wood', new THREE.Vector3(18, 1, -12));
makeResourceNode('gold', new THREE.Vector3(5, 1, -15));
makeResourceNode('gold', new THREE.Vector3(-10, 1, -18));

updateHUD();

// ---- Selection ----
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...units, ...buildings]);
  if (intersects.length > 0) {
    selected = intersects[0].object;
    showSelection(selected);
  } else {
    selected = null;
    HUD.selectionDetails.textContent = 'None';
  }
}
window.addEventListener('click', onClick);

function showSelection(obj) {
  const kind = obj.userData.kind;
  if (!kind) {
    HUD.selectionDetails.textContent = 'Building';
    return;
  }
  const task = obj.userData.task;
  const gather = obj.userData.gatherType ? ` | gathering: ${obj.userData.gatherType}` : '';
  HUD.selectionDetails.textContent = `${kind} (${task || 'idle'})${gather}`;
}

// ---- Assignment ----
document.getElementById('assign-gather').addEventListener('click', () => {
  if (!selected || selected.userData.kind !== 'villager') return;
  const kinds = ['food', 'wood', 'gold'];
  const targetType = kinds[gatherTargetIndex % kinds.length];
  gatherTargetIndex++;
  const targetNode = pickNearbyResource(targetType, selected.position);
  if (!targetNode) return;
  selected.userData.task = 'gather';
  selected.userData.gatherType = targetType;
  selected.userData.target = targetNode;
  animateMove(selected, targetNode.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 1000);
  showSelection(selected);
});

// ---- Production buttons removed (prototype has only starting units) ----

// ---- Game loop ----
const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const dt = clock.getDelta();

  // Villager gathering
  units.forEach(u => {
    const data = u.userData;
    if (data.kind === 'villager' && data.task === 'gather' && data.target) {
      const dist = u.position.distanceTo(data.target.position);
      if (dist > 1.8) {
        const dir = data.target.position.clone().sub(u.position).normalize();
        u.position.add(dir.multiplyScalar(dt * 6));
      } else {
        const rate = 8 * dt; // per second
        resources[data.gatherType] += rate;
      }
    }
  });

  updateHUD();
  renderer.render(scene, camera);
  drawMinimap();
}
requestAnimationFrame(tick);

// ---- Minimap ----
const minimapCanvas = document.getElementById('minimap-canvas');
const miniCtx = minimapCanvas.getContext('2d');
const mapSize = 120;
function worldToMini(vec3) {
  return {
    x: (vec3.x / mapSize) * minimapCanvas.width + minimapCanvas.width / 2,
    y: (vec3.z / mapSize) * minimapCanvas.height + minimapCanvas.height / 2,
  };
}
function drawMinimap() {
  miniCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  miniCtx.fillStyle = '#0b1a2f';
  miniCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

  // draw resources
  resourcesNodes.forEach(n => {
    const p = worldToMini(n.position);
    const type = n.userData.type;
    miniCtx.fillStyle = type === 'food' ? '#6bbf59' : type === 'wood' ? '#8b5a2b' : '#d4af37';
    miniCtx.fillRect(p.x - 3, p.y - 3, 6, 6);
  });

  // draw buildings
  buildings.forEach(b => {
    const p = worldToMini(b.position);
    miniCtx.fillStyle = '#f1c40f';
    miniCtx.fillRect(p.x - 4, p.y - 4, 8, 8);
  });

  // draw units
  units.forEach(u => {
    const p = worldToMini(u.position);
    const k = u.userData.kind;
    miniCtx.fillStyle = k === 'villager' ? '#d9e4ff' : k === 'spearman' ? '#4da6ff' : k === 'archer' ? '#ff6f61' : '#8f6af8';
    miniCtx.beginPath();
    miniCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    miniCtx.fill();
  });
}

drawMinimap();

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Simple counter logic note ----
// Archers > Spearmen, Horsemen > Archers, Spearmen > Horsemen.
// Not used in combat here; placeholder for UI reference.

// ---- UI animation example ----
anime({
  targets: '#hud', translateY: [-80, 0], duration: 800, easing: 'easeOutExpo'
});
anime({
  targets: '#selection', translateY: [80, 0], duration: 800, easing: 'easeOutExpo', delay: 100
});
anime({
  targets: '#minimap', translateY: [80, 0], duration: 800, easing: 'easeOutExpo', delay: 120
});
