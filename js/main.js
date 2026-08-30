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

/* Numbered axis ticks so students can read exact coordinates off the grid,
   not just infer them from unlabeled lines. */
function drawAxisNumbers(svg, w, h, scale, cx, cy, step = 2) {
  const g = el('g');
  const pxStep = scale * step;
  for (let gx = pxStep; cx + gx < w - 10; gx += pxStep) {
    const label = Math.round(gx / scale);
    g.appendChild(Object.assign(el('text', { x: cx + gx, y: cy + 14, fill: 'rgba(255,255,255,0.35)', 'font-family': 'JetBrains Mono', 'font-size': 10, 'text-anchor': 'middle' }), { textContent: label }));
    g.appendChild(Object.assign(el('text', { x: cx - gx, y: cy + 14, fill: 'rgba(255,255,255,0.35)', 'font-family': 'JetBrains Mono', 'font-size': 10, 'text-anchor': 'middle' }), { textContent: -label }));
  }
  for (let gy = pxStep; cy + gy < h - 6; gy += pxStep) {
    const label = Math.round(gy / scale);
    g.appendChild(Object.assign(el('text', { x: cx + 6, y: cy + gy + 4, fill: 'rgba(255,255,255,0.35)', 'font-family': 'JetBrains Mono', 'font-size': 10 }), { textContent: -label }));
    g.appendChild(Object.assign(el('text', { x: cx + 6, y: cy - gy + 4, fill: 'rgba(255,255,255,0.35)', 'font-family': 'JetBrains Mono', 'font-size': 10 }), { textContent: label }));
  }
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
    drawAxisNumbers(svg, W, H, SCALE, CX, CY, 2);
    const [ax, ay] = toPx(A.x, A.y);
    const [bx, by] = toPx(B.x, B.y);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const [mpx, mpy] = toPx(mx, my);
    const dist = Math.sqrt((B.x - A.x) ** 2 + (B.y - A.y) ** 2);

    svg.appendChild(el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#f9ff3d', 'stroke-width': 2.5, opacity: 0.85 }));

    // length label at the midpoint of the segment, offset perpendicular to it
    const ddx = bx - ax, ddy = by - ay, dlen = Math.hypot(ddx, ddy) || 1;
    const nx = -ddy / dlen, ny = ddx / dlen;
    const labelOffset = 16 * (ny > 0 ? -1 : 1);
    svg.appendChild(Object.assign(el('text', {
      x: (ax + bx) / 2 + nx * labelOffset, y: (ay + by) / 2 + ny * labelOffset,
      fill: '#f9ff3d', 'font-family': 'JetBrains Mono', 'font-size': 13, 'text-anchor': 'middle'
    }), { textContent: `AB = ${dist.toFixed(2)}` }));

    const mDot = el('circle', { cx: mpx, cy: mpy, r: 7, fill: '#f9ff3d' });
    mDot.style.filter = 'drop-shadow(0 0 6px #f9ff3d)';
    svg.appendChild(mDot);
    svg.appendChild(Object.assign(el('text', { x: mpx + 10, y: mpy + 20, fill: '#f9ff3d', 'font-family': 'JetBrains Mono', 'font-size': 12 }), { textContent: `M(${mx.toFixed(1)}, ${my.toFixed(1)})` }));

    const aDot = el('circle', { cx: ax, cy: ay, r: 11, fill: '#2af7ff' });
    aDot.style.filter = 'drop-shadow(0 0 8px #2af7ff)';
    const bDot = el('circle', { cx: bx, cy: by, r: 11, fill: '#ff3ee0' });
    bDot.style.filter = 'drop-shadow(0 0 8px #ff3ee0)';
    svg.appendChild(aDot); svg.appendChild(bDot);

    svg.appendChild(Object.assign(el('text', { x: ax + 14, y: ay - 10, fill: '#2af7ff', 'font-family': 'JetBrains Mono', 'font-size': 15 }), { textContent: `A(${A.x.toFixed(1)}, ${A.y.toFixed(1)})` }));
    svg.appendChild(Object.assign(el('text', { x: bx + 14, y: by - 10, fill: '#ff3ee0', 'font-family': 'JetBrains Mono', 'font-size': 15 }), { textContent: `B(${B.x.toFixed(1)}, ${B.y.toFixed(1)})` }));

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

  function wedgeLabel(midDeg, r, text, color) {
    const rad = (Math.PI / 180) * midDeg;
    return Object.assign(el('text', {
      x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad),
      fill: color, 'font-family': 'JetBrains Mono', 'font-size': 15, 'text-anchor': 'middle'
    }), { textContent: text });
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

    // label all four wedges around the vertex — the two θ wedges (vertical pair)
    // in cyan, the two supplementary wedges in magenta, so the pairing is visible at a glance
    svg.appendChild(wedgeLabel(t / 2, 78, `${t}°`, '#2af7ff'));
    svg.appendChild(wedgeLabel(180 + t / 2, 78, `${t}°`, '#2af7ff'));
    svg.appendChild(wedgeLabel((t + 180) / 2, 62, `${supp}°`, '#ff3ee0'));
    svg.appendChild(wedgeLabel((180 + t + 360) / 2, 62, `${supp}°`, '#ff3ee0'));

    document.getElementById('angTheta').textContent = `${t}°`;
    document.getElementById('angComp').textContent = t < 90 ? `${90 - t}°` : '—';
    document.getElementById('angSupp').textContent = `${supp}°`;
    document.getElementById('angVert').textContent = `${t}°`;

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

  // P0 is the right-angle vertex. The small triangle is anchored far enough
  // to the right that even at the slider's max k it stays inside the viewBox
  // (this was the bug: the old layout let it run off the right edge).
  const P0 = { x: 60, y: 360 }, P1 = { x: 60, y: 228 }, P2 = { x: 236, y: 360 };
  const legA = 8, legB = 6, hyp = 10; // units; 22px per unit
  const anchor = { x: 270, y: 360 };

  function angleArc(vertex, from, to, r, color) {
    const a1 = Math.atan2(from.y - vertex.y, from.x - vertex.x);
    const a2 = Math.atan2(to.y - vertex.y, to.x - vertex.x);
    const x1 = vertex.x + r * Math.cos(a1), y1 = vertex.y + r * Math.sin(a1);
    const x2 = vertex.x + r * Math.cos(a2), y2 = vertex.y + r * Math.sin(a2);
    let diff = a2 - a1; while (diff < 0) diff += Math.PI * 2;
    const large = diff > Math.PI ? 1 : 0;
    return el('path', { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, fill: 'none', stroke: color, 'stroke-width': 2.2 });
  }

  function render(k) {
    clear(svg);

    svg.appendChild(el('polygon', { points: `${P0.x},${P0.y} ${P1.x},${P1.y} ${P2.x},${P2.y}`, fill: 'rgba(42,247,255,0.08)', stroke: '#2af7ff', 'stroke-width': 3 }));
    svg.appendChild(el('path', { d: `M ${P0.x} ${P0.y - 14} L ${P0.x + 14} ${P0.y - 14} L ${P0.x + 14} ${P0.y}`, fill: 'none', stroke: '#2af7ff', 'stroke-width': 1.5 }));
    // angle arcs on the big triangle: cyan at the top vertex (P1), yellow at the right vertex (P2)
    svg.appendChild(angleArc(P1, P0, P2, 26, '#2af7ff'));
    svg.appendChild(angleArc(P2, P1, P0, 26, '#f9ff3d'));

    const sx = a => anchor.x + (a.x - P0.x) * k;
    const sy = a => anchor.y + (a.y - P0.y) * k;
    const Q0 = { x: sx(P0), y: sy(P0) }, Q1 = { x: sx(P1), y: sy(P1) }, Q2 = { x: sx(P2), y: sy(P2) };
    svg.appendChild(el('polygon', { points: `${Q0.x},${Q0.y} ${Q1.x},${Q1.y} ${Q2.x},${Q2.y}`, fill: 'rgba(255,62,224,0.1)', stroke: '#ff3ee0', 'stroke-width': 3 }));
    svg.appendChild(el('path', { d: `M ${Q0.x} ${Q0.y - 14 * k} L ${Q0.x + 14 * k} ${Q0.y - 14 * k} L ${Q0.x + 14 * k} ${Q0.y}`, fill: 'none', stroke: '#ff3ee0', 'stroke-width': 1.5 }));
    // same-colored arcs on the small triangle prove the angles match regardless of size
    svg.appendChild(angleArc(Q1, Q0, Q2, 20, '#2af7ff'));
    svg.appendChild(angleArc(Q2, Q1, Q0, 20, '#f9ff3d'));

    const mono = { 'font-family': 'JetBrains Mono', 'font-size': 13 };
    svg.appendChild(Object.assign(el('text', { x: (P0.x + P2.x) / 2 - 8, y: P0.y + 22, fill: '#2af7ff', ...mono }), { textContent: `a = ${legA}` }));
    svg.appendChild(Object.assign(el('text', { x: P0.x - 46, y: (P0.y + P1.y) / 2, fill: '#2af7ff', ...mono }), { textContent: `b = ${legB}` }));
    svg.appendChild(Object.assign(el('text', { x: (P1.x + P2.x) / 2 + 10, y: (P1.y + P2.y) / 2 - 6, fill: '#2af7ff', ...mono }), { textContent: `c = ${hyp}` }));

    const smallMono = { 'font-family': 'JetBrains Mono', 'font-size': 12 };
    svg.appendChild(Object.assign(el('text', { x: (Q0.x + Q2.x) / 2 - 6, y: Q0.y + 18, fill: '#ff3ee0', ...smallMono }), { textContent: (legA * k).toFixed(1) }));
    svg.appendChild(Object.assign(el('text', { x: Q0.x + 8, y: (Q0.y + Q1.y) / 2, fill: '#ff3ee0', ...smallMono }), { textContent: (legB * k).toFixed(1) }));
    svg.appendChild(Object.assign(el('text', { x: (Q1.x + Q2.x) / 2 + 8, y: (Q1.y + Q2.y) / 2 - 4, fill: '#ff3ee0', ...smallMono }), { textContent: (hyp * k).toFixed(1) }));

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
  // Origin sits well inside the viewBox so the outward-facing squares
  // (drawn away from the triangle on all three sides) always stay in frame.
  const origin = { x: 300, y: 480 };

  function square(p1, p2, outX, outY, color, opacity) {
    // p1 -> p2 is one side; (outX,outY) is the outward displacement vector (same length as the side)
    const p3 = { x: p2.x + outX, y: p2.y + outY };
    const p4 = { x: p1.x + outX, y: p1.y + outY };
    return el('polygon', { points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`, fill: color, opacity, stroke: color, 'stroke-width': 2 });
  }

  function render(a) {
    clear(svg);
    const b = a * (4 / 3);
    const c = a * (5 / 3);
    const A = origin, B = { x: origin.x + a, y: origin.y }, C = { x: origin.x, y: origin.y - b };

    // square on leg a (bottom edge A->B), pointing straight down
    svg.appendChild(square(A, B, 0, a, '#2af7ff', 0.12));
    // square on leg b (edge C->A), pointing straight left
    svg.appendChild(square(C, A, -b, 0, '#ff3ee0', 0.12));
    // square on hypotenuse (edge B->C), pointing away from A (up-and-right)
    svg.appendChild(square(B, C, b, -a, '#f9ff3d', 0.1));

    svg.appendChild(el('polygon', { points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`, fill: 'rgba(255,255,255,0.05)', stroke: '#eef1f8', 'stroke-width': 3 }));
    svg.appendChild(el('path', { d: `M ${A.x} ${A.y - 16} L ${A.x + 16} ${A.y - 16} L ${A.x + 16} ${A.y}`, fill: 'none', stroke: '#eef1f8', 'stroke-width': 1.5 }));

    const mono = { 'font-family': 'JetBrains Mono', 'font-size': 16, 'text-anchor': 'middle' };
    svg.appendChild(Object.assign(el('text', { x: (A.x + B.x) / 2, y: A.y + 24, fill: '#2af7ff', ...mono }), { textContent: `a = ${a.toFixed(0)}` }));
    svg.appendChild(Object.assign(el('text', { x: A.x - 24, y: (A.y + C.y) / 2, fill: '#ff3ee0', ...mono, 'text-anchor': 'end' }), { textContent: `b = ${b.toFixed(0)}` }));
    svg.appendChild(Object.assign(el('text', { x: (B.x + C.x) / 2 + 14, y: (B.y + C.y) / 2 - 10, fill: '#f9ff3d', ...mono }), { textContent: `c = ${c.toFixed(1)}` }));

    // area labels centered inside each square
    svg.appendChild(Object.assign(el('text', { x: (A.x + B.x) / 2, y: A.y + a / 2 + 6, fill: '#2af7ff', ...mono, 'font-size': 14 }), { textContent: `a² = ${(a * a).toFixed(0)}` }));
    svg.appendChild(Object.assign(el('text', { x: A.x - b / 2, y: (A.y + C.y) / 2 + 5, fill: '#ff3ee0', ...mono, 'font-size': 14 }), { textContent: `b² = ${(b * b).toFixed(0)}` }));
    const hypMidX = (B.x + C.x) / 2 + b / 2, hypMidY = (B.y + C.y) / 2 - a / 2;
    svg.appendChild(Object.assign(el('text', { x: hypMidX, y: hypMidY + 5, fill: '#f9ff3d', ...mono, 'font-size': 14 }), { textContent: `c² = ${(c * c).toFixed(0)}` }));

    document.getElementById('rtA').textContent = a.toFixed(0);
    document.getElementById('rtB').textContent = b.toFixed(0);
    document.getElementById('rtC').textContent = c.toFixed(1);
    document.getElementById('rtAreaA').textContent = (a * a).toFixed(0);
    document.getElementById('rtAreaB').textContent = (b * b).toFixed(0);
    document.getElementById('rtSumAB').textContent = (a * a + b * b).toFixed(0);
    document.getElementById('rtAreaC').textContent = (c * c).toFixed(0);
  }

  render(parseFloat(slider.value));
  slider.addEventListener('input', () => render(parseFloat(slider.value)));
}

/* ================= TRIGONOMETRY (2D companion diagram) ================= */
function initTrig2D() {
  const svg = document.getElementById('trigSvg2D');
  if (!svg) return null;
  const O = { x: 80, y: 280 };
  const HYP_UNITS = 10, SCALE = 24; // fixed hypotenuse of 10 units keeps every θ in frame

  return function render(thetaDeg) {
    clear(svg);
    const rad = thetaDeg * Math.PI / 180;
    const adjUnits = HYP_UNITS * Math.cos(rad), oppUnits = HYP_UNITS * Math.sin(rad);
    const R = { x: O.x + adjUnits * SCALE, y: O.y };
    const T = { x: R.x, y: R.y - oppUnits * SCALE };

    svg.appendChild(el('line', { x1: 20, y1: O.y, x2: 460, y2: O.y, stroke: 'rgba(255,255,255,0.08)', 'stroke-width': 1 }));
    svg.appendChild(el('polygon', { points: `${O.x},${O.y} ${R.x},${R.y} ${T.x},${T.y}`, fill: 'rgba(249,255,61,0.05)', stroke: '#f9ff3d', 'stroke-width': 2.5 }));
    svg.appendChild(el('path', { d: `M ${R.x - 14} ${R.y} L ${R.x - 14} ${R.y - 14} L ${R.x} ${R.y - 14}`, fill: 'none', stroke: '#eef1f8', 'stroke-width': 1.5 }));

    const arcR = 36;
    svg.appendChild(el('path', { d: `M ${O.x + arcR} ${O.y} A ${arcR} ${arcR} 0 0 0 ${O.x + arcR * Math.cos(rad)} ${O.y - arcR * Math.sin(rad)}`, fill: 'none', stroke: '#f9ff3d', 'stroke-width': 2 }));
    svg.appendChild(Object.assign(el('text', { x: O.x + arcR + 16, y: O.y - 12, fill: '#f9ff3d', 'font-family': 'JetBrains Mono', 'font-size': 14 }), { textContent: `θ = ${thetaDeg}°` }));

    const mono = { 'font-family': 'JetBrains Mono', 'font-size': 13 };
    svg.appendChild(Object.assign(el('text', { x: (O.x + R.x) / 2, y: O.y + 22, fill: '#ff3ee0', ...mono, 'text-anchor': 'middle' }), { textContent: `adjacent = ${adjUnits.toFixed(2)}` }));
    svg.appendChild(Object.assign(el('text', { x: R.x + 10, y: (R.y + T.y) / 2, fill: '#2af7ff', ...mono }), { textContent: `opposite = ${oppUnits.toFixed(2)}` }));
    svg.appendChild(Object.assign(el('text', { x: (O.x + T.x) / 2 - 70, y: (O.y + T.y) / 2 - 8, fill: '#f9ff3d', ...mono }), { textContent: `hypotenuse = ${HYP_UNITS}` }));

    [[O, '#f9ff3d'], [R, '#eef1f8'], [T, '#eef1f8']].forEach(([p, c]) => svg.appendChild(el('circle', { cx: p.x, cy: p.y, r: 5, fill: c })));
  };
}

/* ================= TRIGONOMETRY ================= */
function initTrigControls() {
  const slider = document.getElementById('trigSlider');
  if (!slider) return;
  const render2D = initTrig2D();
  const HYP_UNITS = 10;

  function render(theta) {
    const rad = theta * Math.PI / 180;
    const sin = Math.sin(rad), cos = Math.cos(rad), tan = Math.tan(rad);
    document.getElementById('trigTheta').textContent = `${theta}°`;
    document.getElementById('trigThetaR').textContent = `${theta}°`;
    document.getElementById('trigSin').textContent = sin.toFixed(3);
    document.getElementById('trigCos').textContent = cos.toFixed(3);
    document.getElementById('trigTan').textContent = tan.toFixed(3);
    setTrigTheta(theta);
    if (render2D) render2D(theta);

    const worked = document.getElementById('trigWorked');
    if (worked) {
      const opp = HYP_UNITS * sin, adj = HYP_UNITS * cos;
      worked.innerHTML =
        `Given: θ = ${theta}°, hypotenuse = ${HYP_UNITS}<br>` +
        `opposite = hyp × sin θ = ${HYP_UNITS} × ${sin.toFixed(3)} = <span class="text-neon-cyan">${opp.toFixed(2)}</span><br>` +
        `adjacent = hyp × cos θ = ${HYP_UNITS} × ${cos.toFixed(3)} = <span class="text-neon-magenta">${adj.toFixed(2)}</span><br>` +
        `check: opposite / adjacent = ${(opp / adj).toFixed(3)} ≈ tan θ = ${tan.toFixed(3)} ✓`;
    }
  }
  render(parseFloat(slider.value));
  slider.addEventListener('input', () => render(parseFloat(slider.value)));
}

/* ================= PRACTICE EXERCISES ================= */
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function initPracticeScore() {
  const scoreEl = document.getElementById('practiceScoreVal');
  let correct = 0, total = 0;
  return function record(isCorrect) {
    total++;
    if (isCorrect) correct++;
    if (scoreEl) scoreEl.textContent = `${correct} / ${total}`;
  };
}

function initNumericPractice(cardId, recordScore, generate) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const promptEl = card.querySelector('.practice-prompt');
  const inputs = Array.from(card.querySelectorAll('.practice-input'));
  const checkBtn = card.querySelector('.practice-check');
  const newBtn = card.querySelector('.practice-new');
  const feedback = card.querySelector('.practice-feedback');
  let current = null;
  let checked = false;

  function next() {
    current = generate();
    promptEl.innerHTML = current.prompt;
    inputs.forEach(i => i.value = '');
    feedback.textContent = '';
    feedback.className = 'practice-feedback';
    checked = false;
  }

  checkBtn.addEventListener('click', () => {
    const vals = inputs.map(i => parseFloat(i.value));
    if (vals.some(v => Number.isNaN(v))) {
      feedback.textContent = 'Fill in every box first.';
      feedback.className = 'practice-feedback wrong';
      return;
    }
    const tol = current.tol || inputs.map(() => 0.1);
    const ok = current.answers.every((a, i) => Math.abs(a - vals[i]) <= tol[i]);
    if (!checked) { recordScore(ok); checked = true; }
    feedback.textContent = ok ? '✔ Correct!' : `✘ Not quite — correct answer: ${current.answers.map(a => Math.round(a * 100) / 100).join(', ')}`;
    feedback.className = 'practice-feedback ' + (ok ? 'correct' : 'wrong');
  });
  newBtn.addEventListener('click', next);
  next();
}

function initCongruencePractice(recordScore) {
  const card = document.getElementById('pcCongruence');
  if (!card) return;
  const promptEl = card.querySelector('.practice-prompt');
  const buttons = Array.from(card.querySelectorAll('[data-cong-answer]'));
  const newBtn = card.querySelector('.practice-new');
  const feedback = card.querySelector('.practice-feedback');
  const bank = [
    { text: 'All three pairs of corresponding sides are congruent.', answer: 'SSS' },
    { text: 'Two pairs of corresponding sides and the included angle between them are congruent.', answer: 'SAS' },
    { text: 'Two pairs of corresponding angles and the included side between them are congruent.', answer: 'ASA' },
    { text: 'Two pairs of corresponding angles are congruent, plus a side that is NOT between them.', answer: 'AAS' },
    { text: 'Both are right triangles with congruent hypotenuses and one congruent pair of legs.', answer: 'HL' },
  ];
  let current = null, checked = false;

  function next() {
    current = bank[rand(0, bank.length - 1)];
    promptEl.textContent = current.text;
    buttons.forEach(b => b.classList.remove('correct', 'wrong'));
    feedback.textContent = '';
    feedback.className = 'practice-feedback';
    checked = false;
  }

  buttons.forEach(btn => btn.addEventListener('click', () => {
    if (checked) return;
    checked = true;
    const ok = btn.dataset.congAnswer === current.answer;
    recordScore(ok);
    buttons.forEach(b => {
      if (b.dataset.congAnswer === current.answer) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    feedback.textContent = ok ? '✔ Correct!' : `✘ Not quite — the answer is ${current.answer}.`;
    feedback.className = 'practice-feedback ' + (ok ? 'correct' : 'wrong');
  }));
  newBtn.addEventListener('click', next);
  next();
}

function genMidpointPractice() {
  let ax, ay, bx, by;
  do { ax = rand(-10, 10); ay = rand(-10, 10); bx = rand(-10, 10); by = rand(-10, 10); }
  while (ax === bx && ay === by);
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const dist = Math.hypot(bx - ax, by - ay);
  return {
    prompt: `A(${ax}, ${ay}) and B(${bx}, ${by}). Find the midpoint of AB, and the distance AB.`,
    answers: [mx, my, dist],
    tol: [0.05, 0.05, 0.1],
  };
}

function genAnglePractice() {
  const theta = rand(5, 85);
  return {
    prompt: `An angle measures ${theta}°. Find its complement, then its supplement.`,
    answers: [90 - theta, 180 - theta],
    tol: [0.5, 0.5],
  };
}

function genRightTrianglePractice() {
  const legA = rand(3, 20), legB = rand(3, 20);
  const hyp = Math.hypot(legA, legB);
  if (Math.random() < 0.5) {
    return { prompt: `A right triangle has legs a = ${legA} and b = ${legB}. Find the hypotenuse c.`, answers: [hyp], tol: [0.1] };
  }
  return { prompt: `A right triangle has hypotenuse c = ${hyp.toFixed(2)} and one leg a = ${legA}. Find the other leg b.`, answers: [legB], tol: [0.1] };
}

function genTrigPractice() {
  const theta = rand(15, 75);
  const hyp = rand(5, 20);
  const rad = theta * Math.PI / 180;
  return {
    prompt: `A right triangle has angle θ = ${theta}° and hypotenuse = ${hyp}. Find the opposite and adjacent side lengths.`,
    answers: [hyp * Math.sin(rad), hyp * Math.cos(rad)],
    tol: [0.1, 0.1],
  };
}

function genSimilarPractice() {
  const k = +(rand(12, 30) / 10).toFixed(1);
  const smallSide = rand(3, 15);
  const bigSide = +(smallSide * k).toFixed(2);
  if (Math.random() < 0.5) {
    return { prompt: `△ABC ~ △DEF with scale factor k = ${k} (△DEF is the larger triangle). If AB = ${smallSide}, find DE.`, answers: [bigSide], tol: [0.1] };
  }
  return { prompt: `△ABC ~ △DEF with scale factor k = ${k} (△DEF is the larger triangle). If DE = ${bigSide}, find AB.`, answers: [smallSide], tol: [0.1] };
}

function initPractice() {
  const recordScore = initPracticeScore();
  initNumericPractice('pcMidpoint', recordScore, genMidpointPractice);
  initNumericPractice('pcAngles', recordScore, genAnglePractice);
  initNumericPractice('pcRight', recordScore, genRightTrianglePractice);
  initNumericPractice('pcTrig', recordScore, genTrigPractice);
  initNumericPractice('pcSimilar', recordScore, genSimilarPractice);
  initCongruencePractice(recordScore);
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
  initPractice();
});
