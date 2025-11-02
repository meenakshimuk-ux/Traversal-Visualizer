// Simple BFS/DFS Visualizer

// Graph data (undirected)
let nodes = [
  { id: 'A', x: 120, y: 120 },
  { id: 'B', x: 260, y: 80 },
  { id: 'C', x: 220, y: 220 },
  { id: 'D', x: 380, y: 140 },
  { id: 'E', x: 500, y: 90 },
  { id: 'F', x: 520, y: 240 },
  { id: 'G', x: 650, y: 160 },
  { id: 'H', x: 360, y: 300 },
  { id: 'I', x: 160, y: 320 },
];
let edges = [
  ['A','B'], ['A','C'], ['B','D'], ['C','D'], ['B','E'], ['D','F'], ['E','G'], ['F','G'], ['C','H'], ['H','F'], ['C','I']
];

const svg = document.getElementById('graph');
const algorithmSelect = document.getElementById('algorithm');
const startSelect = document.getElementById('start-node');
const structureTitle = document.getElementById('structure-title');
const structureList = document.getElementById('structure');
const visitedList = document.getElementById('visited');
const btnStart = document.getElementById('btn-start');
const btnStep = document.getElementById('btn-step');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const speedRange = document.getElementById('speed');
const nodeCountInput = document.getElementById('node-count');
const btnRandomize = document.getElementById('btn-randomize');

// Build adjacency
const adj = new Map();
function rebuildAdjacency() {
  adj.clear();
  for (const n of nodes) adj.set(n.id, new Set());
  for (const [u, v] of edges) {
    if (adj.has(u) && adj.has(v) && u !== v) {
      adj.get(u).add(v);
      adj.get(v).add(u);
    }
  }
  for (const [k, set] of adj) adj.set(k, new Set([...set].sort()));
}
rebuildAdjacency();

// Draw graph
const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
edgeGroup.setAttribute('class', 'edges');
nodeGroup.setAttribute('class', 'nodes');
svg.appendChild(edgeGroup);
svg.appendChild(nodeGroup);

function clearGroup(g) {
  while (g.firstChild) g.removeChild(g.firstChild);
}

function draw() {
  clearGroup(edgeGroup);
  clearGroup(nodeGroup);
  // edges
  for (const [u, v] of edges) {
    const a = nodes.find(n => n.id === u);
    const b = nodes.find(n => n.id === v);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    line.setAttribute('class', 'edge');
    edgeGroup.appendChild(line);
  }
  // nodes
  for (const n of nodes) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node unvisited');
    g.dataset.id = n.id;

    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', n.x);
    c.setAttribute('cy', n.y);
    c.setAttribute('r', 18);

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', n.x);
    t.setAttribute('y', n.y + 1);
    t.textContent = n.id;

    g.appendChild(c);
    g.appendChild(t);
    g.addEventListener('click', () => {
      startSelect.value = n.id;
      resetStates();
    });
    nodeGroup.appendChild(g);
  }
}

draw();

// Populate controls
function populateStartNodes() {
  startSelect.innerHTML = '';
  for (const n of nodes) {
    const opt = document.createElement('option');
    opt.value = n.id;
    opt.textContent = n.id;
    startSelect.appendChild(opt);
  }
  if (nodes.length) startSelect.value = nodes[0].id;
}
populateStartNodes();

function updateStructureTitle() {
  structureTitle.textContent = algorithmSelect.value === 'bfs' ? 'Queue' : 'Stack';
}
updateStructureTitle();
algorithmSelect.addEventListener('change', () => {
  updateStructureTitle();
  resetStates();
});

// State helpers
function setNodeClass(id, cls) {
  const el = nodeGroup.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  el.classList.remove('unvisited','frontier','current','visited');
  el.classList.add(cls);
}
function getNodeClass(id) {
  const el = nodeGroup.querySelector(`[data-id="${id}"]`);
  if (!el) return 'unvisited';
  if (el.classList.contains('visited')) return 'visited';
  if (el.classList.contains('current')) return 'current';
  if (el.classList.contains('frontier')) return 'frontier';
  return 'unvisited';
}
function markAllUnvisited() {
  for (const n of nodes) setNodeClass(n.id, 'unvisited');
}

// UI lists
function renderList(ul, arr) {
  ul.innerHTML = '';
  for (const id of arr) {
    const li = document.createElement('li');
    li.textContent = id;
    ul.appendChild(li);
  }
}

// Traversal generators
function* bfs(start) {
  const visited = new Set();
  const inStruct = new Set();
  const q = [];
  q.push(start); inStruct.add(start);
  yield { phase: 'init', structure: [...q], visited: [...visited], current: null };
  while (q.length) {
    const v = q.shift(); inStruct.delete(v);
    yield { phase: 'dequeue', current: v, structure: [...q], visited: [...visited] };
    if (!visited.has(v)) {
      visited.add(v);
      yield { phase: 'visit', current: v, structure: [...q], visited: [...visited] };
      for (const nb of adj.get(v)) {
        if (!visited.has(nb) && !inStruct.has(nb)) {
          q.push(nb); inStruct.add(nb);
          yield { phase: 'enqueue', current: v, touched: nb, structure: [...q], visited: [...visited] };
        }
      }
    }
  }
  yield { phase: 'done', structure: [], visited: [...visited], current: null };
}

function* dfs(start) {
  const visited = new Set();
  const inStruct = new Set();
  const st = [];
  st.push(start); inStruct.add(start);
  yield { phase: 'init', structure: [...st], visited: [...visited], current: null };
  while (st.length) {
    const v = st.pop(); inStruct.delete(v);
    yield { phase: 'pop', current: v, structure: [...st], visited: [...visited] };
    if (!visited.has(v)) {
      visited.add(v);
      yield { phase: 'visit', current: v, structure: [...st], visited: [...visited] };
      const nbs = [...adj.get(v)].slice().reverse(); // optional to mimic recursive order
      for (const nb of nbs) {
        if (!visited.has(nb) && !inStruct.has(nb)) {
          st.push(nb); inStruct.add(nb);
          yield { phase: 'push', current: v, touched: nb, structure: [...st], visited: [...visited] };
        }
      }
    }
  }
  yield { phase: 'done', structure: [], visited: [...visited], current: null };
}

// Engine
let gen = null;
let playing = false;
let timer = null;

function resetStates() {
  stop();
  markAllUnvisited();
  renderList(structureList, []);
  renderList(visitedList, []);
}

function createGenerator() {
  const start = startSelect.value;
  return algorithmSelect.value === 'bfs' ? bfs(start) : dfs(start);
}

function applyStep(step) {
  // clear frontier/current except visited; we'll reset based on step
  for (const n of nodes) if (getNodeClass(n.id) !== 'visited') setNodeClass(n.id, 'unvisited');

  // mark visited nodes
  for (const id of (step.visited || [])) setNodeClass(id, 'visited');

  // mark structure as frontier
  for (const id of (step.structure || [])) if (getNodeClass(id) !== 'visited') setNodeClass(id, 'frontier');

  // mark touched newly added in frontier (optional pulse)
  if (step.touched && getNodeClass(step.touched) !== 'visited') setNodeClass(step.touched, 'frontier');

  // mark current
  if (step.current && getNodeClass(step.current) !== 'visited') setNodeClass(step.current, 'current');

  renderList(structureList, step.structure || []);
  renderList(visitedList, step.visited || []);
}

function stepOnce() {
  if (!gen) gen = createGenerator();
  const { value, done } = gen.next();
  if (value) applyStep(value);
  if (done) stop();
}

function play() {
  if (playing) return;
  playing = true;
  if (!gen) gen = createGenerator();
  runTimer();
}

function runTimer() {
  clearInterval(timer);
  const delay = Number(speedRange.value);
  timer = setInterval(() => {
    const { value, done } = gen.next();
    if (value) applyStep(value);
    if (done) stop();
  }, delay);
}

function pause() {
  playing = false;
  clearInterval(timer);
  timer = null;
}

function stop() {
  pause();
  gen = null;
}

btnStart.addEventListener('click', () => { resetStates(); gen = createGenerator(); play(); });
btnStep.addEventListener('click', () => { pause(); stepOnce(); });
btnPause.addEventListener('click', () => { pause(); });
btnReset.addEventListener('click', () => { resetStates(); });
speedRange.addEventListener('input', () => { if (playing) runTimer(); });

// Graph generation and controls
function letters(n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(String.fromCharCode(65 + i));
  return arr;
}

function generateNodes(count) {
  const ids = letters(count);
  const cx = 400, cy = 250, r = 190;
  return ids.map((id, i) => {
    const a = (2 * Math.PI * i) / count;
    return { id, x: Math.round(cx + r * Math.cos(a)), y: Math.round(cy + r * Math.sin(a)) };
  });
}

function generateRandomEdges(currentNodes) {
  const ids = currentNodes.map(n => n.id);
  const m = ids.length;
  const set = new Set();
  function key(u, v) { return u < v ? `${u}|${v}` : `${v}|${u}`; }
  // ensure connectivity via random chain
  const shuffled = ids.slice().sort(() => Math.random() - 0.5);
  for (let i = 1; i < m; i++) set.add(key(shuffled[i - 1], shuffled[i]));
  // add extra edges
  const targetExtra = Math.max(0, Math.floor(m * 1.2));
  let tries = 0;
  while (set.size < m - 1 + targetExtra && tries < m * m) {
    const u = ids[Math.floor(Math.random() * m)];
    const v = ids[Math.floor(Math.random() * m)];
    if (u === v) { tries++; continue; }
    set.add(key(u, v));
    tries++;
  }
  return Array.from(set).map(s => s.split('|'));
}

function rebuildGraph(newCount, randomizeOnlyEdges = false) {
  if (!randomizeOnlyEdges) {
    nodes = generateNodes(newCount);
  }
  edges = generateRandomEdges(nodes);
  rebuildAdjacency();
  draw();
  populateStartNodes();
  resetStates();
  applyStep({ phase: 'init', structure: [], visited: [], current: null });
}

nodeCountInput.addEventListener('change', () => {
  const n = Math.max(Number(nodeCountInput.min), Math.min(Number(nodeCountInput.max), Number(nodeCountInput.value)));
  nodeCountInput.value = String(n);
  rebuildGraph(n, false);
});

btnRandomize.addEventListener('click', () => {
  const n = nodes.length;
  rebuildGraph(n, true);
});

// Initialize structure/visited
resetStates();
applyStep({ phase: 'init', structure: [], visited: [], current: null });
