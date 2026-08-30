import { setTrigTheta } from './scenes.js';

const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

function drawGrid(svg, w, h, step = 25) {
  const g = el('g', { class: 'grid' });
  for (let x = 0; x <= w; x += step) {
    g.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: h, stroke: 'rgba(255,255,255,0.045)', 'stroke-width': 1 }));
  }
  for (let y = 0; y <= h; y += step) {
    g.appendChild(el('line', { x1: 0, y1: y, x2: w, y2: y, stroke: 'rgba(255,255,255,0.045)', 'stroke-width': 1 }));
  }
  g.appendChild(el('line', { x1: 0, y1: h / 2, x2: w, y2: h / 2, stroke: 'rgba(255,255,255,0.14)', 'stroke-width': 1 }));
  g.appendChild(el('line', { x1: w / 2, y1: 0, x2: w / 2, y2: h, stroke: 'rgba(255,255,255,0.14)', 'stroke-width': 1 }));
  svg.appendChild(g);
}

function makeDraggable(svg, node, getPos, setPos) {
  let dragging = false;
  const toLocal = (evt) => {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const x = ((evt.clientX - rect.left) / rect.width) * vb.width + vb.x;
    const y = ((evt.clientY - rect.top) / rect.height) * vb.height + vb.y;
    return { x, y };
  };
  node.style.cursor = 'grab';
  node.addEventListener('pointerdown', (e) => {
    dragging = true;
    node.setPointerCapture(e.pointerId);
    node.style.cursor = 'grabbing';
  });
  node.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setPos(toLocal(e));
  });
  ['pointerup', 'pointercancel'].forEach(evt => node.addEventListener(evt, () => {
    dragging = false;
    node.style.cursor = 'grab';
  }));
}

/* ================= SEGMENTS & MIDPOINT ================= */
function initSegmentDemo() {
  const svg = document.getElementById('segmentSvg');
  if (!svg) return;
  const W = 500, H = 500, SCALE = 22, CX = W / 2, CY = H / 2;
  const toMath = (px, py) => [+(((px - CX) / SCALE).toFixed(2)), +(((CY - py) / SCALE).toFixed(2))];
  const toPx = (mx, my) => [CX + mx * SCALE, CY - my * SCALE];

  let A = { x: -5, y: -3 };
  let B = { x: 4, y: 4 };

  function render() {
    clear(svg);
    drawGrid(svg, W, H);
    const [ax, ay] = toPx(A.x, A.y);
    const [bx, by] = toPx(B.x, B.y);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const [mpx, mpy] = toPx(mx, my);
    const dist = Math.sqrt((B.x - A.x) ** 2 + (B.y - A.y) ** 2);

    svg.appendChild(el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#f9ff3d', 'stroke-width': 2.5, opacity: 0.85 }));

    const mDot = el('circle', { cx: mpx, cy: mpy, r: 7, fill: '#f9ff3d' });
    mDot.style.filter = 'drop-shadow(0 0 6px #f9ff3d)';
    svg.appendChild(mDot);

    const aDot = el('circle', { cx: ax, cy: ay, r: 11, fill: '#2af7ff' });
    aDot.style.filter = 'drop-shadow(0 0 8px #2af7ff)';
    const bDot = el('circle', { cx: bx, cy: by, r: 11, fill: '#ff3ee0' });
    bDot.style.filter = 'drop-shadow(0 0 8px #ff3ee0)';
    svg.appendChild(aDot); svg.appendChild(bDot);

    svg.appendChild(el('text', { x: ax + 14, y: ay - 10, fill: '#2af7ff', 'font-family': 'JetBrains Mono', 'font-size': 15 })).textContent = 'A';
    svg.appendChild(el('text', { x: bx + 14, y: by - 10, fill: '#ff3ee0', 'font-family': 'JetBrains Mono', 'font-size': 15 })).textContent = 'B';

    document.getElementById('ptA').textContent = `(${A.x.toFixed(1)}, ${A.y.toFixed(1)})`;
    document.getElementById('ptB').textContent = `(${B.x.toFixed(1)}, ${B.y.toFixed(1)})`;
    document.getElementById('ptDist').textContent = dist.toFixed(2);
    document.getElementById('ptMid').textContent = `(${mx.toFixed(2)}, ${my.toFixed(2)})`;

    makeDraggable(svg, aDot, () => A, (p) => { const [mx2, my2] = toMath(p.x, p.y); A = { x: mx2, y: my2 }; render(); });
    makeDraggable(svg, bDot, () => B, (p) => { const [mx2, my2] = toMath(p.x, p.y); B = { x: mx2, y: my2 }; render(); });
  }
  render();
}

/* ================= ANGLE PAIRS ================= */
function initAngleDemo() {
  const svg = document.getElementById('angleSvg');
  if (!svg) return;
  const W = 500, H = 500, CX = 250, CY = 260, LEN = 190;
  let theta = 40;

  function arcPath(startDeg, endDeg, r) {
    const s = (Math.PI / 180) * startDeg, e = (Math.PI / 180) * endDeg;
    const x1 = CX + r * Math.cos(s), y1 = CY - r * Math.sin(s);
    const x2 = CX + r * Math.cos(e), y2 = CY - r * Math.sin(e);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${CX} ${CY} L ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z`;
  }

  function render() {
    clear(svg);
    drawGrid(svg, W, H);
    const t = theta, supp = 180 - t;

    svg.appendChild(el('path', { d: arcPath(0, t, 60), fill: '#2af7ff', opacity: 0.25 }));
    svg.appendChild(el('path', { d: arcPath(180, 180 + t, 60), fill: '#2af7ff', opacity: 0.25 }));
    svg.appendChild(el('path', { d: arcPath(t, 180, 46), fill: '#ff3ee0', opacity: 0.22 }));
    svg.appendChild(el('path', { d: arcPath(180 + t, 360, 46), fill: '#ff3ee0', opacity: 0.22 }));

    const line1 = el('line', { x1: CX - LEN, y1: CY, x2: CX + LEN, y2: CY, stroke: '#9aa4bd', 'stroke-width': 2.5 });
    const rad = (Math.PI / 180) * t;
    const dx = Math.cos(rad) * LEN, dy = Math.sin(rad) * LEN;
    const line2 = el('line', { x1: CX - dx, y1: CY + dy, x2: CX + dx, y2: CY - dy, stroke: '#f9ff3d', 'stroke-width': 2.5 });
    svg.appendChild(line1); svg.appendChild(line2);

    const vertex = el('circle', { cx: CX, cy: CY, r: 6, fill: '#eef1f8' });
    svg.appendChild(vertex);

    const handle = el('circle', { cx: CX + dx, cy: CY - dy, r: 12, fill: '#f9ff3d' });
    handle.style.filter = 'drop-shadow(0 0 8px #f9ff3d)';
    svg.appendChild(handle);

    svg.appendChild(el('text', { x: CX + 66, y: CY - 22, fill: '#2af7ff', 'font-family': 'JetBrains Mono', 'font-size': 16 })).textContent = `${t}°`;
    svg.appendChild(el('text', { x: CX - 100, y: CY - 14, fill: '#ff3ee0', 'font-family': 'JetBrains Mono', 'font-size': 14 })).textContent = `${supp}°`;

    document.getElementById('angTheta').textContent = `${t}°`;
    document.getElementById('angComp').textContent = t < 90 ? `${90 - t}°` : '—';
    document.getElementById('angSupp').textContent = `${supp}°`;

    makeDraggable(svg, handle, null, (p) => {
      const vx = p.x - CX, vy = CY - p.y;
      let deg = Math.atan2(vy, vx) * (180 / Math.PI);
      if (deg < 1) deg = 1;
      if (deg > 179) deg = 179;
      theta = Math.round(deg);
      render();
    });
  }
  render();
}

/* ================= CONGRUENT TRIANGLES ================= */
function initCongruenceDemo() {
  const svg = document.getElementById('congSvg');
  if (!svg) return;

  const A = { x: 70, y: 300 }, B = { x: 210, y: 300 }, C = { x: 128, y: 120 };
  const OFF = 260;
  const A2 = { x: A.x + OFF, y: A.y }, B2 = { x: B.x + OFF, y: B.y }, C2 = { x: C.x + OFF, y: C.y };

  function tick(p1, p2, count, color) {
    const g = el('g');
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const spacing = 7;
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * spacing;
      const bx = mx + (dx / len) * off, by = my + (dy / len) * off;
      g.appendChild(el('line', { x1: bx - nx * 8, y1: by - ny * 8, x2: bx + nx * 8, y2: by + ny * 8, stroke: color, 'stroke-width': 2.5 }));
    }
    return g;
  }

  function angleArc(vertex, p1, p2, count, color) {
    const g = el('g');
    const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
    for (let i = 0; i < count; i++) {
      const r = 22 + i * 6;
      const x1 = vertex.x + r * Math.cos(a1), y1 = vertex.y + r * Math.sin(a1);
      const x2 = vertex.x + r * Math.cos(a2), y2 = vertex.y + r * Math.sin(a2);
      let diff = a2 - a1;
      while (diff < 0) diff += Math.PI * 2;
      const large = diff > Math.PI ? 1 : 0;
      g.appendChild(el('path', { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, fill: 'none', stroke: color, 'stroke-width': 2.2 }));
    }
    return g;
  }

  function rightAngleMarker(vertex, p1, p2, color) {
    const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
    const s = 16;
    const x1 = vertex.x + s * Math.cos(a1), y1 = vertex.y + s * Math.sin(a1);
    const x2 = vertex.x + s * Math.cos(a2), y2 = vertex.y + s * Math.sin(a2);
    const xc = x1 + (x2 - vertex.x), yc = y1 + (y2 - vertex.y);
    return el('path', { d: `M ${x1} ${y1} L ${xc} ${yc} L ${x2} ${y2}`, fill: 'none', stroke: color, 'stroke-width': 2 });
  }

  function triOutline(a, b, c, color) {
    return el('polygon', { points: `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`, fill: 'rgba(255,255,255,0.03)', stroke: color, 'stroke-width': 2.5 });
  }

  const DATA = {
    SSS: {
      title: 'Side–Side–Side (SSS)', color: '#2af7ff',
      desc: 'If all three sides of one triangle equal all three sides of another, the triangles must be congruent — the shape is locked in.',
      marks: 'All three pairs of sides are marked congruent (matching tick counts).',
      draw(g, A, B, C, col) {
        g.appendChild(tick(A, B, 1, col)); g.appendChild(tick(B, C, 2, col)); g.appendChild(tick(C, A, 3, col));
      }
    },
    SAS: {
      title: 'Side–Angle–Side (SAS)', color: '#ff3ee0',
      desc: 'If two sides and the angle between them (the included angle) match, the triangles are congruent.',
      marks: 'Two sides are ticked, and the angle sandwiched between them is arc-marked.',
      draw(g, A, B, C, col) {
        g.appendChild(tick(A, B, 1, col)); g.appendChild(tick(B, C, 2, col));
        g.appendChild(angleArc(B, A, C, 1, col));
      }
    },
    ASA: {
      title: 'Angle–Side–Angle (ASA)', color: '#f9ff3d',
      desc: 'If two angles and the side between them (the included side) match, the triangles are congruent.',
      marks: 'Two angles are arc-marked, and the side between them is ticked.',
      draw(g, A, B, C, col) {
        g.appendChild(angleArc(A, C, B, 1, col)); g.appendChild(angleArc(B, A, C, 2, col));
        g.appendChild(tick(A, B, 1, col));
      }
    },
    AAS: {
      title: 'Angle–Angle–Side (AAS)', color: '#2af7ff',
      desc: 'If two angles and a side NOT between them match, the triangles are congruent — the third angle is forced to match too.',
      marks: 'Two angles are arc-marked; the ticked side sits outside the pair of angles.',
      draw(g, A, B, C, col) {
        g.appendChild(angleArc(A, C, B, 1, col)); g.appendChild(angleArc(B, A, C, 2, col));
        g.appendChild(tick(B, C, 1, col));
      }
    },
    HL: {
      title: 'Hypotenuse–Leg (HL)', color: '#ff3ee0',
      desc: 'Right triangles only: if the hypotenuse and one leg match, the triangles are congruent.',
      marks: 'The right angle is boxed, the hypotenuse and one leg are ticked.',
      draw(g, A, B, C, col) {
        g.appendChild(rightAngleMarker(A, B, C, col));
        g.appendChild(tick(A, B, 1, col));
        g.appendChild(tick(B, C, 2, col));
      }
    }
  };

  function render(type) {
    clear(svg);
    const d = DATA[type];
    const g = el('g');
    g.appendChild(triOutline(A, B, C, d.color));
    g.appendChild(triOutline(A2, B2, C2, d.color));
    ['A', 'B', 'C'].forEach((n, i) => {
      const p = [A, B, C][i], p2 = [A2, B2, C2][i];
      g.appendChild(Object.assign(el('text', { x: p.x - (n === 'C' ? 6 : n === 'A' ? 20 : -14), y: p.y + (n === 'C' ? -10 : 20), fill: '#9aa4bd', 'font-family': 'JetBrains Mono', 'font-size': 13 }), { textContent: n }));
      g.appendChild(Object.assign(el('text', { x: p2.x - (n === 'C' ? 6 : n === 'A' ? 20 : -14), y: p2.y + (n === 'C' ? -10 : 20), fill: '#9aa4bd', 'font-family': 'JetBrains Mono', 'font-size': 13 }), { textContent: n + "'" }));
    });
    d.draw(g, A, B, C, d.color);
    d.draw(g, A2, B2, C2, d.color);
    svg.appendChild(g);

    document.getElementById('congTitle').textContent = d.title;
    document.getElementById('congDesc').textContent = d.desc;
    document.getElementById('congMarks').textContent = d.marks;
  }

  render('SSS');
  document.querySelectorAll('.ptab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ptab').forEach(b => b.classList.remove('ptab-active'));
      btn.classList.add('ptab-active');
      render(btn.dataset.cong);
    });
  });
}

/* ================= SIMILAR TRIANGLES ================= */
function initSimilarityDemo() {
  const svg = document.getElementById('simSvg');
  if (!svg) return;
  const slider = document.getElementById('simSlider');

  const P0 = { x: 70, y: 340 }, P1 = { x: 70, y: 160 }, P2 = { x: 310, y: 340 };
  const legA = 8, legB = 6, hyp = 10;
  const anchor = { x: 330, y: 340 };

  function render(k) {
    clear(svg);
    svg.appendChild(el('polygon', { points: `${P0.x},${P0.y} ${P1.x},${P1.y} ${P2.x},${P2.y}`, fill: 'rgba(42,247,255,0.08)', stroke: '#2af7ff', 'stroke-width': 3 }));
    svg.appendChild(el('path', { d: `M ${P0.x} ${P0.y - 16} L ${P0.x + 16} ${P0.y - 16} L ${P0.x + 16} ${P0.y}`, fill: 'none', stroke: '#2af7ff', 'stroke-width': 1.5 }));

    const sx = a => anchor.x + (a.x - P0.x) * k;
    const sy = a => anchor.y + (a.y - P0.y) * k;
    const Q0 = { x: sx(P0), y: sy(P0) }, Q1 = { x: sx(P1), y: sy(P1) }, Q2 = { x: sx(P2), y: sy(P2) };
    svg.appendChild(el('polygon', { points: `${Q0.x},${Q0.y} ${Q1.x},${Q1.y} ${Q2.x},${Q2.y}`, fill: 'rgba(255,62,224,0.1)', stroke: '#ff3ee0', 'stroke-width': 3 }));

    svg.appendChild(Object.assign(el('text', { x: (P0.x + P2.x) / 2 - 10, y: P0.y + 22, fill: '#2af7ff', 'font-family': 'JetBrains Mono', 'font-size': 13 }), { textContent: '8' }));
    svg.appendChild(Object.assign(el('text', { x: P0.x - 24, y: (P0.y + P1.y) / 2, fill: '#2af7ff', 'font-family': 'JetBrains Mono', 'font-size': 13 }), { textContent: '6' }));
    svg.appendChild(Object.assign(el('text', { x: (P1.x + P2.x) / 2 + 6, y: (P1.y + P2.y) / 2 - 6, fill: '#2af7ff', 'font-family': 'JetBrains Mono', 'font-size': 13 }), { textContent: '10' }));

    document.getElementById('simK').textContent = k.toFixed(2);
    document.getElementById('simKReadout').textContent = k.toFixed(2);
    document.getElementById('simBigSides').textContent = `${legB}, ${legA}, ${hyp}`;
    document.getElementById('simSmallSides').textContent = `${(legB * k).toFixed(1)}, ${(legA * k).toFixed(1)}, ${(hyp * k).toFixed(1)}`;
    document.getElementById('simPerim').textContent = k.toFixed(2);
    document.getElementById('simArea').textContent = (k * k).toFixed(2);
  }

  render(parseFloat(slider.value));
  slider.addEventListener('input', () => render(parseFloat(slider.value)));
}

/* ================= RIGHT TRIANGLES ================= */
function initRightTriDemo() {
  const svg = document.getElementById('rightSvg');
  if (!svg) return;
  const slider = document.getElementById('legSlider');
  const origin = { x: 90, y: 370 };

  function render(a) {
    clear(svg);
    const b = a * (4 / 3);
    const c = a * (5 / 3);
    const A = origin, B = { x: origin.x + a, y: origin.y }, C = { x: origin.x, y: origin.y - b };

    svg.appendChild(el('polygon', { points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`, fill: 'rgba(249,255,61,0.06)', stroke: '#f9ff3d', 'stroke-width': 3 }));
    svg.appendChild(el('path', { d: `M ${A.x} ${A.y - 16} L ${A.x + 16} ${A.y - 16} L ${A.x + 16} ${A.y}`, fill: 'none', stroke: '#eef1f8', 'stroke-width': 1.5 }));

    svg.appendChild(Object.assign(el('text', { x: (A.x + B.x) / 2 - 8, y: A.y + 24, fill: '#2af7ff', 'font-family': 'JetBrains Mono', 'font-size': 15 }), { textContent: 'a' }));
    svg.appendChild(Object.assign(el('text', { x: A.x - 22, y: (A.y + C.y) / 2, fill: '#ff3ee0', 'font-family': 'JetBrains Mono', 'font-size': 15 }), { textContent: 'b' }));
    svg.appendChild(Object.assign(el('text', { x: (B.x + C.x) / 2 + 10, y: (B.y + C.y) / 2 - 4, fill: '#f9ff3d', 'font-family': 'JetBrains Mono', 'font-size': 15 }), { textContent: 'c' }));

    document.getElementById('rtA').textContent = a.toFixed(0);
    document.getElementById('rtB').textContent = b.toFixed(0);
    document.getElementById('rtC').textContent = c.toFixed(1);
  }

  render(parseFloat(slider.value));
  slider.addEventListener('input', () => render(parseFloat(slider.value)));
}

/* ================= TRIGONOMETRY ================= */
function initTrigControls() {
  const slider = document.getElementById('trigSlider');
  if (!slider) return;
  function render(theta) {
    const rad = theta * Math.PI / 180;
    document.getElementById('trigTheta').textContent = `${theta}°`;
    document.getElementById('trigThetaR').textContent = `${theta}°`;
    document.getElementById('trigSin').textContent = Math.sin(rad).toFixed(3);
    document.getElementById('trigCos').textContent = Math.cos(rad).toFixed(3);
    document.getElementById('trigTan').textContent = Math.tan(rad).toFixed(3);
    setTrigTheta(theta);
  }
  render(parseFloat(slider.value));
  slider.addEventListener('input', () => render(parseFloat(slider.value)));
}

/* ================= QUIZZES ================= */
function initQuizzes() {
  document.querySelectorAll('[data-quiz]').forEach(quiz => {
    const buttons = quiz.querySelectorAll('.quiz-opts button');
    const feedback = quiz.querySelector('.quiz-feedback');
    let answered = false;
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = btn.dataset.correct === 'true';
        buttons.forEach(b => {
          if (b.dataset.correct === 'true') b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        feedback.textContent = correct ? '✔ Correct — nice work!' : '✘ Not quite — the correct answer is highlighted in green.';
        feedback.style.color = correct ? '#48ff97' : '#ff3e6e';
      });
    });
  });
}

/* ================= NAV ================= */
function initNav() {
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main .section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));

  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('sideNav');
  toggle?.addEventListener('click', () => nav.classList.toggle('open'));
  links.forEach(l => l.addEventListener('click', () => nav.classList.remove('open')));
}

window.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSegmentDemo();
  initAngleDemo();
  initCongruenceDemo();
  initSimilarityDemo();
  initRightTriDemo();
  initTrigControls();
  initQuizzes();
});
