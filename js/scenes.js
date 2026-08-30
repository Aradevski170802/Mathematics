import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLORS = {
  cyan: 0x2af7ff,
  magenta: 0xff3ee0,
  yellow: 0xf9ff3d,
  dim: 0x3a4a66,
};

function makeRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  return renderer;
}

function makeGlowSprite(color, size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const c = new THREE.Color(color);
  const cs = `rgba(${c.r * 255},${c.g * 255},${c.b * 255},`;
  g.addColorStop(0, cs + '1)');
  g.addColorStop(0.4, cs + '0.55)');
  g.addColorStop(1, cs + '0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function pointMesh(pos, color, radius = 0.09) {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(radius, 20, 20);
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  const glow = makeGlowSprite(color, radius * 9);
  group.add(glow);
  group.position.copy(pos);
  return group;
}

function labelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 40px Space Grotesk, sans-serif';
  ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.6, 0.3, 1);
  return sprite;
}

function baseScene(container, camPos = [3.2, 2.4, 4.2]) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(...camPos);
  const renderer = makeRenderer(container);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.PointLight(0x88e8ff, 1.4, 30);
  key.position.set(4, 5, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xff5fe0, 0.8, 30);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  const grid = new THREE.GridHelper(8, 16, 0x2a3a55, 0x1a2438);
  grid.position.y = -1.4;
  scene.add(grid);

  function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  new ResizeObserver(onResize).observe(container);

  return { scene, camera, renderer, controls, onResize, container };
}

/* Only run a render loop while its container is actually visible on screen —
   with multiple always-on WebGL contexts, off-screen rendering just burns GPU
   for nothing (and can starve the compositor on constrained hardware). */
function runWhenVisible(container, tick) {
  let visible = false;
  let running = false;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !running) start();
  }, { threshold: 0.01 });
  io.observe(container);

  function start() {
    running = true;
    loop();
  }
  function loop() {
    if (!visible) { running = false; return; }
    tick();
    requestAnimationFrame(loop);
  }
}

/* ============ HERO — ambient floating geometry ============ */
function initHeroScene() {
  const container = document.getElementById('heroScene');
  if (!container) return;
  const { scene, camera, renderer, controls } = baseScene(container, [4, 2.6, 5]);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  controls.enableZoom = false;

  const group = new THREE.Group();
  scene.add(group);

  const pts = [
    new THREE.Vector3(-1.4, 0.6, 0.3),
    new THREE.Vector3(1.2, 1.1, -0.4),
    new THREE.Vector3(0.3, -0.7, 1.1),
    new THREE.Vector3(-0.6, -0.2, -1.2),
  ];
  const colors = [COLORS.cyan, COLORS.magenta, COLORS.yellow, COLORS.cyan];
  pts.forEach((p, i) => group.add(pointMesh(p, colors[i], 0.1)));

  const lineMat = new THREE.LineBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.55 });
  const lineGeo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1]]);
  group.add(new THREE.Line(lineGeo, lineMat));

  const lineMat2 = new THREE.LineBasicMaterial({ color: COLORS.magenta, transparent: true, opacity: 0.45 });
  const lineGeo2 = new THREE.BufferGeometry().setFromPoints([pts[1], pts[2], pts[3], pts[1]]);
  group.add(new THREE.Line(lineGeo2, lineMat2));

  const planeGeo = new THREE.PlaneGeometry(2.6, 2.2, 1, 1);
  const planeMat = new THREE.MeshStandardMaterial({
    color: COLORS.yellow, transparent: true, opacity: 0.09, side: THREE.DoubleSide,
    emissive: COLORS.yellow, emissiveIntensity: 0.15,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.position.set(-0.2, 0.1, -0.3);
  plane.rotation.set(0.3, 0.5, 0.1);
  group.add(plane);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo), new THREE.LineBasicMaterial({ color: COLORS.yellow, transparent: true, opacity: 0.5 }));
  edges.position.copy(plane.position);
  edges.rotation.copy(plane.rotation);
  group.add(edges);

  runWhenVisible(container, () => {
    group.rotation.y += 0.0016;
    controls.update();
    renderer.render(scene, camera);
  });
}

/* ============ FOUNDATIONS — points / line / plane / intersection ============ */
function initFoundationsScene() {
  const container = document.getElementById('foundationsScene');
  if (!container) return;
  const { scene, camera, renderer, controls } = baseScene(container, [3.4, 2.6, 4.2]);

  const modeGroups = {};

  function addLabeled(pos, color, text) {
    const g = pointMesh(pos, color);
    const label = labelSprite(text, color);
    label.position.copy(pos).add(new THREE.Vector3(0, 0.32, 0));
    g.add(label);
    return g;
  }

  // --- points mode
  const gPoints = new THREE.Group();
  const P = [
    { p: new THREE.Vector3(-1.2, 0.4, 0.6), c: COLORS.cyan, n: 'A' },
    { p: new THREE.Vector3(0.9, 0.9, -0.3), c: COLORS.magenta, n: 'B' },
    { p: new THREE.Vector3(0.2, -0.6, -1.0), c: COLORS.yellow, n: 'C' },
  ];
  P.forEach(d => gPoints.add(addLabeled(d.p, d.c, d.n)));
  modeGroups.points = gPoints;

  // --- line mode (two points + infinite line through them)
  const gLine = new THREE.Group();
  const lA = new THREE.Vector3(-1.3, -0.5, 0.4);
  const lB = new THREE.Vector3(1.1, 0.7, -0.4);
  gLine.add(addLabeled(lA, COLORS.cyan, 'A'));
  gLine.add(addLabeled(lB, COLORS.magenta, 'B'));
  const dir = lB.clone().sub(lA).normalize();
  const ext = dir.clone().multiplyScalar(3.2);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([lA.clone().sub(ext), lB.clone().add(ext)]);
  const lineMat = new THREE.LineDashedMaterial({ color: COLORS.yellow, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.85 });
  const solidSeg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([lA, lB]), new THREE.LineBasicMaterial({ color: COLORS.yellow }));
  const dashLine = new THREE.Line(lineGeo, lineMat);
  dashLine.computeLineDistances();
  gLine.add(dashLine, solidSeg);
  modeGroups.line = gLine;

  // --- plane mode (3 points define a plane)
  const gPlane = new THREE.Group();
  const pA = new THREE.Vector3(-1.1, -0.3, 0.8);
  const pB = new THREE.Vector3(1.2, -0.1, -0.6);
  const pC = new THREE.Vector3(-0.2, 1.0, -0.1);
  [[pA, 'A', COLORS.cyan], [pB, 'B', COLORS.magenta], [pC, 'C', COLORS.yellow]].forEach(([p, n, c]) => gPlane.add(addLabeled(p, c, n)));
  const planeGeo2 = new THREE.PlaneGeometry(3.4, 2.8);
  const normal = new THREE.Vector3().crossVectors(pB.clone().sub(pA), pC.clone().sub(pA)).normalize();
  const centroid = pA.clone().add(pB).add(pC).multiplyScalar(1 / 3);
  const planeMesh = new THREE.Mesh(planeGeo2, new THREE.MeshStandardMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.14, side: THREE.DoubleSide, emissive: COLORS.cyan, emissiveIntensity: 0.2 }));
  planeMesh.position.copy(centroid);
  planeMesh.lookAt(centroid.clone().add(normal));
  gPlane.add(planeMesh);
  const planeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo2), new THREE.LineBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.6 }));
  planeEdges.position.copy(planeMesh.position);
  planeEdges.rotation.copy(planeMesh.rotation);
  gPlane.add(planeEdges);
  modeGroups.plane = gPlane;

  // --- intersect mode (two planes crossing in a line)
  const gInt = new THREE.Group();
  const geoP1 = new THREE.PlaneGeometry(3, 2.4);
  const m1 = new THREE.Mesh(geoP1, new THREE.MeshStandardMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.16, side: THREE.DoubleSide, emissive: COLORS.cyan, emissiveIntensity: 0.15 }));
  m1.rotation.y = Math.PI / 5;
  const e1 = new THREE.LineSegments(new THREE.EdgesGeometry(geoP1), new THREE.LineBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.6 }));
  e1.rotation.copy(m1.rotation);
  const geoP2 = new THREE.PlaneGeometry(3, 2.4);
  const m2 = new THREE.Mesh(geoP2, new THREE.MeshStandardMaterial({ color: COLORS.magenta, transparent: true, opacity: 0.16, side: THREE.DoubleSide, emissive: COLORS.magenta, emissiveIntensity: 0.15 }));
  m2.rotation.y = -Math.PI / 5;
  m2.rotation.x = Math.PI / 2.6;
  const e2 = new THREE.LineSegments(new THREE.EdgesGeometry(geoP2), new THREE.LineBasicMaterial({ color: COLORS.magenta, transparent: true, opacity: 0.6 }));
  e2.rotation.copy(m2.rotation);
  const interLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.3, 0, 0), new THREE.Vector3(1.3, 0, 0)]),
    new THREE.LineBasicMaterial({ color: COLORS.yellow, linewidth: 3 })
  );
  gInt.add(m1, e1, m2, e2, interLine, addLabeled(new THREE.Vector3(1.3, 0, 0), COLORS.yellow, 'line ℓ'));
  modeGroups.intersect = gInt;

  Object.values(modeGroups).forEach(g => { g.visible = false; scene.add(g); });
  modeGroups.points.visible = true;

  function setMode(mode) {
    Object.entries(modeGroups).forEach(([k, g]) => g.visible = k === mode);
  }
  document.querySelectorAll('[data-fscene]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-fscene]').forEach(b => b.classList.remove('chip-active'));
      btn.classList.add('chip-active');
      setMode(btn.dataset.fscene);
    });
  });

  runWhenVisible(container, () => {
    controls.update();
    renderer.render(scene, camera);
  });
}

/* ============ TRIG — 3D right triangle + unit circle ============ */
let trigState = { theta: 35, update: null };
function initTrigScene() {
  const container = document.getElementById('trigScene');
  if (!container) return;
  const { scene, camera, renderer, controls } = baseScene(container, [3.6, 2.4, 4.6]);

  const group = new THREE.Group();
  scene.add(group);

  // unit circle (radius 1.6 for visibility) in XY plane
  const R = 1.6;
  const circlePts = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    circlePts.push(new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, 0));
  }
  const circle = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePts), new THREE.LineBasicMaterial({ color: COLORS.dim }));
  group.add(circle);

  // axes
  const axisMat = new THREE.LineBasicMaterial({ color: 0x4a5a7a, transparent: true, opacity: 0.6 });
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.1, 0, 0), new THREE.Vector3(2.1, 0, 0)]), axisMat));
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2.1, 0), new THREE.Vector3(0, 2.1, 0)]), axisMat));

  const hyp = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COLORS.yellow }));
  const opp = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COLORS.cyan }));
  const adj = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COLORS.magenta }));
  group.add(hyp, opp, adj);

  const dot = pointMesh(new THREE.Vector3(R, 0, 0), COLORS.yellow, 0.08);
  group.add(dot);

  const arcMat = new THREE.LineBasicMaterial({ color: COLORS.yellow, transparent: true, opacity: 0.8 });
  const arcLine = new THREE.Line(new THREE.BufferGeometry(), arcMat);
  group.add(arcLine);

  function update(thetaDeg) {
    const t = THREE.MathUtils.degToRad(thetaDeg);
    const x = Math.cos(t) * R, y = Math.sin(t) * R;
    hyp.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0)]);
    opp.geometry.setFromPoints([new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, y, 0)]);
    adj.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, 0)]);
    dot.position.set(x, y, 0);
    const arcPts = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const a = (t * i) / steps;
      arcPts.push(new THREE.Vector3(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0));
    }
    arcLine.geometry.setFromPoints(arcPts);
  }
  update(35);
  trigState.update = update;

  runWhenVisible(container, () => {
    controls.update();
    renderer.render(scene, camera);
  });
}

export function setTrigTheta(theta) {
  if (trigState.update) trigState.update(theta);
}

window.addEventListener('DOMContentLoaded', () => {
  initHeroScene();
  initFoundationsScene();
  initTrigScene();
});
