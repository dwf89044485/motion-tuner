// ── Vibeset · Vanilla Demo · main.js ─────────────────────────
// Framework-free demo — pure DOM + Canvas + vibeset Web Components

import { createVibeset, registerComponents } from "vibeset";

// Auto-register <vibeset-editor>, <vibeset-panel>, etc.
registerComponents();

// ── Design tokens (matching React version) ───────────────────

const TOKEN = {
  bg: "oklch(0.08 0 0)",
  fg: "oklch(0.95 0 0)",
  muted: "oklch(0.55 0 0)",
  accent: "oklch(0.7 0.2 45)",
  accentBorder: "oklch(0.7 0.2 45 / 0.6)",
  borderRest: "oklch(0.25 0 0 / 0.4)",
};

const FLAP_ORANGE = "#f97316";
const FLAP_ORANGE_BG = "rgba(249, 115, 22, 0.2)";

// ══════════════════════════════════════════════════════════════
// Vibeset store
// ══════════════════════════════════════════════════════════════

const vs = createVibeset();

// ══════════════════════════════════════════════════════════════
// Target 1 · 翻牌大字 hero-flap
// ══════════════════════════════════════════════════════════════

const HERO_FLAP_DEF = {
  id: "hero-flap",
  label: "翻牌大字",
  schema: [
    { key: "flipInterval", label: "翻牌速度", min: 30, max: 200, step: 5, group: "参数" },
    { key: "flipsPerChar", label: "翻牌次数", min: 1, max: 30, step: 1, group: "参数" },
    { key: "staggerStep", label: "字符错开", min: 10, max: 500, step: 10, group: "参数" },
    { key: "preSettleSlowdown", label: "末段减速", min: 0, max: 6, step: 1, group: "参数" },
  ],
  defaultConfig: {
    flipInterval: 90,
    preSettleSlowdown: 2,
    flipsPerChar: 4,
    staggerStep: 30,
  },
  states: [
    { value: "default", label: "默认" },
    { value: "running", label: "运行中" },
  ],
  defaultState: "default",
};

// ══════════════════════════════════════════════════════════════
// Target 2 · ASCII 球体 ascii-sphere
// ══════════════════════════════════════════════════════════════

const SPHERE_DEF = {
  id: "ascii-sphere",
  label: "字符球体",
  schema: [
    { key: "rotationSpeed", label: "旋转速度", min: 0.1, max: 3, step: 0.05, group: "基础" },
    { key: "charDensity", label: "字符密度", min: 0.08, max: 0.3, step: 0.01, group: "基础" },
    { key: "rotationXAxis", label: "X 轴转速", min: 0, max: 1, step: 0.05, group: "进阶" },
    { key: "rotationYAxis", label: "Y 轴转速", min: 0, max: 1, step: 0.05, group: "进阶" },
    { key: "depthAlphaCurve", label: "深度透明曲线", min: 0.1, max: 0.8, step: 0.05, group: "进阶" },
    { key: "fontSize", label: "字符大小 (px)", min: 8, max: 20, step: 1, group: "进阶" },
  ],
  defaultConfig: {
    rotationSpeed: 1.0,
    charDensity: 0.15,
    rotationXAxis: 0.2,
    rotationYAxis: 0.3,
    depthAlphaCurve: 0.4,
    fontSize: 12,
  },
  states: [
    { value: "running", label: "默认" },
    { value: "paused", label: "暂停" },
  ],
  defaultState: "running",
};

// ══════════════════════════════════════════════════════════════
// Target 3 · 底部流程卡 flow-cards
// ══════════════════════════════════════════════════════════════

const FLOW_CARDS_DEF = {
  id: "flow-cards",
  label: "底部流程卡",
  schema: [
    { key: "hoverTransition", label: "过渡速度 (ms)", min: 80, max: 800, step: 10, group: "基础" },
    { key: "titleLift", label: "标题上移 (px)", min: 0, max: 12, step: 1, group: "基础" },
    { key: "cornerDuration", label: "角标显隐 (ms)", min: 80, max: 800, step: 10, group: "基础" },
  ],
  defaultConfig: {
    hoverTransition: 300,
    titleLift: 0,
    cornerDuration: 300,
  },
  states: [
    { value: "free", label: "跟随鼠标" },
    { value: "default", label: "默认" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "free",
};

// ── Register targets ─────────────────────────────────────────

vs.register(HERO_FLAP_DEF, document.getElementById("hero-flap"));
vs.register(SPHERE_DEF, document.getElementById("ascii-sphere"));
vs.register(FLOW_CARDS_DEF, document.getElementById("flow-cards"));

// Helper: read config for a target
function getConfig(targetId) {
  return vs.store.getConfig(targetId);
}

function getPreviewState(targetId) {
  return vs.store.getPreviewState(targetId);
}

// ══════════════════════════════════════════════════════════════
// 1) 翻牌大字 — pure DOM implementation
// ══════════════════════════════════════════════════════════════

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const FLIP_TEXT = "VIBESET";
const flipContainer = document.getElementById("hero-flap");

// State per character
let flipChars = []; // array of { el, interval, timeout, settled }
let flipTriggerKey = 0;
let hasInitialized = false;
let flipRunningInterval = null;

function buildFlipDOM() {
  flipContainer.innerHTML = "";
  flipChars = [];

  for (let i = 0; i < FLIP_TEXT.length; i++) {
    const finalChar = FLIP_TEXT[i];

    if (finalChar === " ") {
      const spacer = document.createElement("div");
      spacer.className = "flip-space";
      flipContainer.appendChild(spacer);
      flipChars.push({ el: spacer, isSpace: true, interval: null, timeout: null, settled: true });
      continue;
    }

    const tile = document.createElement("div");
    tile.className = "flip-char";
    tile.style.backgroundColor = "hsl(0, 0%, 0%)";

    tile.innerHTML = `
      <div class="midline"></div>
      <div class="half-top"><span style="color:#fff">${finalChar}</span></div>
      <div class="half-bottom"><span style="color:#fff">${finalChar}</span></div>
      <div class="flap-top" style="background:hsl(0,0%,0%)"><span style="color:#fff">${finalChar}</span></div>
    `;

    flipContainer.appendChild(tile);
    flipChars.push({
      el: tile,
      isSpace: false,
      finalChar,
      index: i,
      interval: null,
      timeout: null,
      settled: true,
    });
  }
}

function setCharDisplay(entry, char, settled) {
  if (entry.isSpace) return;
  const bgColor = settled ? "hsl(0, 0%, 0%)" : FLAP_ORANGE_BG;
  const textColor = settled ? "#ffffff" : FLAP_ORANGE;

  entry.el.style.backgroundColor = bgColor;

  const topSpan = entry.el.querySelector(".half-top span");
  const bottomSpan = entry.el.querySelector(".half-bottom span");
  const flapTop = entry.el.querySelector(".flap-top");
  const flapSpan = flapTop.querySelector("span");

  topSpan.textContent = char;
  topSpan.style.color = textColor;
  bottomSpan.textContent = char;
  bottomSpan.style.color = textColor;
  flapSpan.textContent = char;
  flapSpan.style.color = textColor;
  flapTop.style.backgroundColor = bgColor;
}

function runFlipAnimation(skipEntrance) {
  const config = getConfig("hero-flap");

  for (const entry of flipChars) {
    if (entry.interval) window.clearInterval(entry.interval);
    if (entry.timeout) window.clearTimeout(entry.timeout);

    if (entry.isSpace) continue;

    const { finalChar, index } = entry;
    const displayChar = CHARSET.includes(finalChar) ? finalChar : " ";

    entry.settled = false;
    setCharDisplay(entry, CHARSET[Math.floor(Math.random() * CHARSET.length)], false);

    const baseFlips = Math.max(1, Math.round(config.flipsPerChar));
    const startDelay = skipEntrance
      ? config.staggerStep * index * 0.4
      : config.staggerStep * index * 0.8;

    let flipIndex = 0;

    // Entrance animation (opacity + translateY)
    if (!skipEntrance) {
      const tileDelaySec = (config.staggerStep * index) / 1000;
      entry.el.style.animation = `tileEnter 0.3s ease ${tileDelaySec}s both`;
    } else {
      entry.el.style.animation = "none";
      entry.el.style.opacity = "1";
      entry.el.style.transform = "translateY(0)";
    }

    // Flap animation on top half
    const flapTop = entry.el.querySelector(".flap-top");
    const flapDelay = skipEntrance
      ? (config.staggerStep * index) / 1000 * 0.5
      : (config.staggerStep * index) / 1000 + 0.15;

    flapTop.style.animation = `flapIn 0.25s cubic-bezier(0.22, 0.61, 0.36, 1) ${flapDelay}s both`;

    entry.timeout = window.setTimeout(() => {
      entry.interval = window.setInterval(() => {
        const settleThreshold = baseFlips + index * Math.max(0, Math.round(config.preSettleSlowdown));

        if (flipIndex >= settleThreshold) {
          if (entry.interval) window.clearInterval(entry.interval);
          entry.settled = true;
          setCharDisplay(entry, displayChar, true);
          return;
        }

        setCharDisplay(entry, CHARSET[Math.floor(Math.random() * CHARSET.length)], false);
        flipIndex += 1;
      }, Math.max(16, config.flipInterval));
    }, startDelay);
  }
}

function calcFlipCycleMs() {
  const config = getConfig("hero-flap");
  const letters = FLIP_TEXT.replace(/\s/g, "").length;
  const maxIndex = Math.max(0, letters - 1);
  const settleThreshold =
    Math.max(1, Math.round(config.flipsPerChar)) +
    maxIndex * Math.max(0, Math.round(config.preSettleSlowdown));
  return Math.max(
    300,
    config.staggerStep * maxIndex + settleThreshold * Math.max(16, config.flipInterval) + 120,
  );
}

function startRunningMode() {
  stopRunningMode();
  runFlipAnimation(true);
  flipRunningInterval = window.setInterval(() => {
    runFlipAnimation(true);
  }, calcFlipCycleMs());
}

function stopRunningMode() {
  if (flipRunningInterval) {
    window.clearInterval(flipRunningInterval);
    flipRunningInterval = null;
  }
}

// Build initial DOM
buildFlipDOM();

// Initial entrance animation
runFlipAnimation(false);

// Mark as initialized after 1s
setTimeout(() => {
  hasInitialized = true;
}, 1000);

// Hover: trigger flip (unless in running mode)
flipContainer.addEventListener("mouseenter", () => {
  const state = getPreviewState("hero-flap");
  if (state !== "running") {
    runFlipAnimation(hasInitialized);
  }
});

// ══════════════════════════════════════════════════════════════
// 2) ASCII 球体 — canvas + rAF
// ══════════════════════════════════════════════════════════════

const sphereWrap = document.getElementById("ascii-sphere");
const sphereCanvas = document.getElementById("sphere-canvas");
const sphereCtx = sphereCanvas.getContext("2d");
const SPHERE_CHARS = "░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯";
let sphereTime = 0;

function sizeSphere() {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const heroAvailableHeight = Math.max(300, winH - 200 - 24);
  const naturalSize = Math.min(winW * 0.52, heroAvailableHeight * 1.12);
  const size = Math.floor(Math.max(700, Math.min(1100, naturalSize)));

  sphereWrap.style.width = size + "px";
  sphereWrap.style.height = size + "px";

  const dpr = window.devicePixelRatio || 1;
  const rect = sphereCanvas.getBoundingClientRect();
  sphereCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  sphereCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  sphereCtx.setTransform(1, 0, 0, 1, 0, 0);
  sphereCtx.scale(dpr, dpr);
}

function renderSphere() {
  const c = getConfig("ascii-sphere");
  const isPaused = getPreviewState("ascii-sphere") === "paused";
  const rect = sphereCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  sphereCtx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const fontSize = c.fontSize;
  const safePadding = fontSize * 1.3;
  const radius = Math.max(0, Math.min(width, height) / 2 - safePadding);

  sphereCtx.font = `${fontSize}px monospace`;
  sphereCtx.textAlign = "center";
  sphereCtx.textBaseline = "middle";

  const points = [];
  const step = c.charDensity;

  for (let phi = 0; phi < Math.PI * 2; phi += step) {
    for (let theta = 0; theta < Math.PI; theta += step) {
      const x = Math.sin(theta) * Math.cos(phi + sphereTime * 0.5);
      const y = Math.sin(theta) * Math.sin(phi + sphereTime * 0.5);
      const z = Math.cos(theta);

      const rotY = sphereTime * c.rotationYAxis;
      const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
      const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);

      const rotX = sphereTime * c.rotationXAxis;
      const y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
      const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

      const depth = (z2 + 1) / 2;
      const charIndex = Math.floor(depth * (SPHERE_CHARS.length - 1));

      points.push({
        x: centerX + x1 * radius,
        y: centerY + y1 * radius,
        z: z2,
        char: SPHERE_CHARS[charIndex],
      });
    }
  }

  points.sort((a, b) => a.z - b.z);

  for (const p of points) {
    const alpha = c.depthAlphaCurve * 0.4 + (p.z + 1) * c.depthAlphaCurve;
    sphereCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha)})`;
    sphereCtx.fillText(p.char, p.x, p.y);
  }

  if (!isPaused) sphereTime += 0.02 * c.rotationSpeed;
  requestAnimationFrame(renderSphere);
}

sizeSphere();
requestAnimationFrame(renderSphere);
window.addEventListener("resize", sizeSphere);

// ══════════════════════════════════════════════════════════════
// 3) Flow cards — CSS hover + param-driven transitions
// ══════════════════════════════════════════════════════════════

const flowCards = document.querySelectorAll(".flow-card");
let flowForceState = null; // null = follow mouse, "hover" = all hovered, "default" = all unhovered

function applyFlowConfig() {
  const config = getConfig("flow-cards");
  const ms = config.hoverTransition + "ms";
  const cornerMs = config.cornerDuration + "ms";

  for (const card of flowCards) {
    card.style.transition = `border-color ${ms} ease`;
    card.querySelector(".card-tag").style.transition = `color ${ms} ease`;
    card.querySelector(".card-title").style.transition = `color ${ms} ease, transform ${ms} ease`;
    card.querySelector(".card-desc").style.transition = `opacity ${ms} ease, transform ${ms} ease`;
    card.querySelector(".corner-mark").style.transition = `opacity ${cornerMs} ease`;

    // Apply titleLift if hovered
    if (card.classList.contains("hovered")) {
      card.querySelector(".card-title").style.transform = `translateY(-${config.titleLift}px)`;
    } else {
      card.querySelector(".card-title").style.transform = "translateY(0)";
    }
  }
}

function setFlowCardHover(card, hovered) {
  if (hovered) {
    card.classList.add("hovered");
    const config = getConfig("flow-cards");
    card.querySelector(".card-title").style.transform = `translateY(-${config.titleLift}px)`;
  } else {
    card.classList.remove("hovered");
    card.querySelector(".card-title").style.transform = "translateY(0)";
  }
}

function syncFlowForceState() {
  const state = flowForceState ?? getPreviewState("flow-cards");
  if (state === "hover") {
    for (const card of flowCards) setFlowCardHover(card, true);
  } else if (state === "default") {
    for (const card of flowCards) setFlowCardHover(card, false);
  }
  // "free" or null: mouse-driven (no override)
}

for (const card of flowCards) {
  card.addEventListener("mouseenter", () => {
    const effective = flowForceState ?? getPreviewState("flow-cards");
    if (!effective || effective === "free") {
      setFlowCardHover(card, true);
    }
  });

  card.addEventListener("mouseleave", () => {
    const effective = flowForceState ?? getPreviewState("flow-cards");
    if (!effective || effective === "free") {
      setFlowCardHover(card, false);
    }
  });
}

applyFlowConfig();

// ══════════════════════════════════════════════════════════════
// Event listeners — vibeset bus
// ══════════════════════════════════════════════════════════════

vs.bus.on("change", (data) => {
  if (data.targetId === "flow-cards") {
    applyFlowConfig();
  }
  // Sphere and flip read config each frame/trigger, no extra action needed
});

vs.bus.on("state-change", (data) => {
  if (data.targetId === "hero-flap") {
    if (data.state === "running") {
      startRunningMode();
    } else {
      stopRunningMode();
    }
  }

  if (data.targetId === "flow-cards") {
    flowForceState = null; // clear manual override
    syncFlowForceState();
  }
});

// param-commit: trigger preview
vs.bus.on("param-commit", (data) => {
  if (data.targetId === "hero-flap") {
    // Re-run flip animation
    const state = getPreviewState("hero-flap");
    if (state === "running") {
      startRunningMode(); // restart cycle with new params
    } else {
      runFlipAnimation(hasInitialized);
    }
  }

  if (data.targetId === "flow-cards") {
    // 3-stage preview: default → hover → restore
    const config = getConfig("flow-cards");
    const settle = Math.max(120, Math.round(config.hoverTransition) + 40);

    flowForceState = "default";
    syncFlowForceState();

    setTimeout(() => {
      flowForceState = "hover";
      syncFlowForceState();

      setTimeout(() => {
        flowForceState = null;
        syncFlowForceState();
      }, settle);
    }, settle);
  }
});

// ══════════════════════════════════════════════════════════════
// Mount <vibeset-editor> Web Component
// ══════════════════════════════════════════════════════════════

const editor = document.createElement("vibeset-editor");
editor.theme = "dark";
editor.showKeyName = false;
editor.store = vs;
document.body.appendChild(editor);
