/** Right-click drag arrows for planning moves on the board. */

/** @type {{ from: number, to: number }[]} */
let planArrows = [];

/** @type {null | { from: number, to: number | null }} */
let draft = null;

let listenersBound = false;

function getOverlay() {
  return document.getElementById("planOverlay");
}

function getBoardWrap() {
  return document.getElementById("boardWrap");
}

function squareFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  const cell = el.closest?.("td[data-sq]");
  if (!cell) return null;
  const sq = parseInt(cell.dataset.sq, 10);
  return Number.isFinite(sq) ? sq : null;
}

function squareCenter(sq) {
  const overlay = getOverlay();
  const cell = document.querySelector(`#board td[data-sq="${sq}"]`);
  if (!overlay || !cell) return null;
  const cellRect = cell.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();
  return {
    x: cellRect.left + cellRect.width / 2 - overlayRect.left,
    y: cellRect.top + cellRect.height / 2 - overlayRect.top,
  };
}

function squareSize() {
  const cell = document.querySelector("#board td[data-sq]");
  if (!cell) return 48;
  return cell.getBoundingClientRect().width;
}

function arrowPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 6) return null;

  // Stop short of the target so the arrowhead sits in the square
  const shorten = Math.min(squareSize() * 0.22, len * 0.25);
  const ux = dx / len;
  const uy = dy / len;
  const tipX = x2 - ux * shorten;
  const tipY = y2 - uy * shorten;

  return { x1, y1, x2: tipX, y2: tipY };
}

function ensureDefs(svg) {
  if (svg.querySelector("#planArrowHead")) return;
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker",
  );
  marker.setAttribute("id", "planArrowHead");
  marker.setAttribute("markerWidth", "3.5");
  marker.setAttribute("markerHeight", "3.5");
  marker.setAttribute("refX", "3");
  marker.setAttribute("refY", "1.75");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M0,0 L3.5,1.75 L0,3.5 Z");
  path.setAttribute("class", "plan-arrow-head");
  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);
}

function drawLine(svg, x1, y1, x2, y2, className) {
  const geom = arrowPath(x1, y1, x2, y2);
  if (!geom) return;
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(geom.x1));
  line.setAttribute("y1", String(geom.y1));
  line.setAttribute("x2", String(geom.x2));
  line.setAttribute("y2", String(geom.y2));
  line.setAttribute("class", className);
  line.setAttribute("marker-end", "url(#planArrowHead)");
  svg.appendChild(line);
}

export function redrawPlanArrows() {
  const overlay = getOverlay();
  if (!overlay) return;

  // Keep defs; clear drawn shapes
  const keep = overlay.querySelector("defs");
  overlay.innerHTML = "";
  if (keep) overlay.appendChild(keep);
  else ensureDefs(overlay);

  const rect = overlay.getBoundingClientRect();
  overlay.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  overlay.setAttribute("width", String(rect.width));
  overlay.setAttribute("height", String(rect.height));

  const stroke = Math.max(5, squareSize() * 0.12);
  overlay.style.setProperty("--plan-stroke", `${stroke}px`);
  overlay.style.setProperty("--plan-stroke-draft", `${stroke * 0.85}px`);

  for (const arrow of planArrows) {
    const from = squareCenter(arrow.from);
    const to = squareCenter(arrow.to);
    if (!from || !to) continue;
    drawLine(overlay, from.x, from.y, to.x, to.y, "plan-arrow");
  }

  if (draft && draft.to !== null && draft.to !== draft.from) {
    const from = squareCenter(draft.from);
    const to = squareCenter(draft.to);
    if (from && to) {
      drawLine(
        overlay,
        from.x,
        from.y,
        to.x,
        to.y,
        "plan-arrow plan-arrow-draft",
      );
    }
  }
}

export function clearPlanArrows() {
  planArrows = [];
  draft = null;
  redrawPlanArrows();
}

function arrowKey(from, to) {
  return `${from}-${to}`;
}

function toggleArrow(from, to) {
  if (from === to) return;
  const key = arrowKey(from, to);
  const idx = planArrows.findIndex((a) => arrowKey(a.from, a.to) === key);
  if (idx >= 0) planArrows.splice(idx, 1);
  else planArrows.push({ from, to });
}

function onContextMenu(e) {
  if (!e.target.closest?.("#board")) return;
  e.preventDefault();
}

function onPointerDown(e) {
  const board = document.getElementById("board");
  if (!board || !board.contains(e.target)) return;

  // Left click clears existing plan arrows
  if (e.button === 0 && !draft) {
    if (planArrows.length) clearPlanArrows();
    return;
  }

  if (e.button !== 2) return;

  e.preventDefault();
  const from = squareFromPoint(e.clientX, e.clientY);
  if (from === null) return;

  draft = { from, to: from };
  redrawPlanArrows();
}

function onPointerMove(e) {
  if (!draft) return;
  const to = squareFromPoint(e.clientX, e.clientY);
  // Keep last snapped square if the pointer leaves the board briefly
  if (to !== null && to !== draft.to) {
    draft.to = to;
    redrawPlanArrows();
  }
}

function onPointerUp(e) {
  if (!draft) return;
  // Only finish a right-button plan drag
  if (e.pointerType === "mouse" && e.button !== 2) return;

  const from = draft.from;
  const to =
    squareFromPoint(e.clientX, e.clientY) ??
    (draft.to !== draft.from ? draft.to : null);
  draft = null;

  if (to !== null) toggleArrow(from, to);
  redrawPlanArrows();
}

function onPointerCancel() {
  if (!draft) return;
  draft = null;
  redrawPlanArrows();
}

function onResize() {
  if (planArrows.length || draft) redrawPlanArrows();
}

/** Bind once; safe to call after each board render. */
export function initMovePlan() {
  const wrap = getBoardWrap();
  const overlay = getOverlay();
  if (!wrap || !overlay) return;

  ensureDefs(overlay);

  if (!listenersBound) {
    listenersBound = true;
    wrap.addEventListener("contextmenu", onContextMenu);
    // Use document so drag can continue outside the board
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("resize", onResize);
  }

  redrawPlanArrows();
}
