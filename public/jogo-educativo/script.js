const canvas = document.querySelector("#gameCanvas");
let ctx = canvas.getContext("2d");
const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 640;
const RENDER_SCALE = 0.48;
const RENDER_WIDTH = Math.round(WORLD_WIDTH * RENDER_SCALE);
const RENDER_HEIGHT = Math.round(WORLD_HEIGHT * RENDER_SCALE);
canvas.width = RENDER_WIDTH;
canvas.height = RENDER_HEIGHT;
configureRenderContext(ctx);
const levelEl = document.querySelector("#level");
const scoreEl = document.querySelector("#score");
const timeEl = document.querySelector("#time");
const overlay = document.querySelector("#overlay");
const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");
const moveButtons = document.querySelectorAll(".move-btn");
const moveJoystick = document.querySelector("#moveJoystick");
const moveJoystickKnob = document.querySelector("#moveJoystickKnob");
const missionEl = document.querySelector("#mission");
const progressTextEl = document.querySelector("#progressText");
const carryTextEl = document.querySelector("#carryText");
const comboTextEl = document.querySelector("#comboText");
const lessonTextEl = document.querySelector("#lessonText");
const pauseBtn = document.querySelector("#pauseBtn");
const audioBtn = document.querySelector("#audioBtn");
const perfBtn = document.querySelector("#perfBtn");
const fpsMeter = document.querySelector("#fpsMeter");
const phaseCardsEl = document.querySelector("#phaseCards");
const phaseSelectHintEl = document.querySelector("#phaseSelectHint");

const BIN_W = 150;
const BIN_H = 74;
const ITEM_SIZE = 44;
const PLAYER_W = 46;
const PLAYER_H = 58;
const BIN_DROP_H = 48;
const TIP_BOX = { x: 14, y: 558, w: 466, h: 58 };
const MAX_PARTICLES = 45;
const MAX_MOTION_TRAILS = 4;
const MAX_EXPLOSIONS = 2;
const MAX_DELIVERY_BURSTS = 4;
const EXPLOSION_PARTICLE_COUNT = 8;
const EXPLOSION_SPARK_COUNT = 2;
const HAZARD_SPARK_MIN_DELAY = 0.42;
const HAZARD_SPARK_RANDOM_DELAY = 0.28;

const keys = new Set();
const heldDirections = new Set();
const joystickInput = { active: false, x: 0, y: 0, pointerId: null };
const backgroundCache = {
  canvas: document.createElement("canvas"),
  ctx: null,
  key: ""
};
backgroundCache.ctx = backgroundCache.canvas.getContext("2d");
const bombSprite = document.createElement("canvas");
bombSprite.width = 112;
bombSprite.height = 112;
const bombSpriteCtx = bombSprite.getContext("2d");
let bombSpriteReady = false;
const mapImage = new Image();
mapImage.src = "assets/park-background.png";
mapImage.addEventListener("load", () => {
  invalidateBackgroundCache();
  draw();
});
const bins = [
  { type: "papel", label: "PAPEL", color: "#2f6fed", x: 54, y: 48 },
  { type: "plastico", label: "PLASTICO", color: "#d94d42", x: 248, y: 48 },
  { type: "metal", label: "METAL", color: "#f4be32", x: 458, y: 48 },
  { type: "vidro", label: "VIDRO", color: "#21996f", x: 660, y: 48 }
];

const itemTypes = [
  { type: "papel", name: "jornal", color: "#b8d2ff", icon: "paper" },
  { type: "papel", name: "caixa", color: "#d6b078", icon: "box" },
  { type: "plastico", name: "garrafa", color: "#ff9e9a", icon: "bottle" },
  { type: "plastico", name: "sacola", color: "#ffc1be", icon: "bag" },
  { type: "metal", name: "lata", color: "#ffe08a", icon: "can" },
  { type: "metal", name: "tampa", color: "#f7cb54", icon: "cap" },
  { type: "vidro", name: "pote", color: "#8ee4c3", icon: "jar" },
  { type: "vidro", name: "copo", color: "#afeed8", icon: "glass" }
];

const SAVE_KEY = "missao-reciclar-save-v1";

const phaseConfigs = [
  { name: "Parque Escola", target: 8, hazards: 2, time: 60, mission: "Separe os resíduos do parque", tint: "rgba(255, 248, 210, 0.08)", accent: "#24b77b", learnings: ["Papel limpo pode voltar como caderno.", "Separar por cor acelera a reciclagem."] },
  { name: "Praça Central", target: 10, hazards: 3, time: 66, mission: "Limpe a praça antes do recreio", tint: "rgba(255, 225, 154, 0.14)", accent: "#f4be32", learnings: ["Metal reciclado economiza energia.", "Latas devem ir para a lixeira amarela."] },
  { name: "Lago Sustentável", target: 12, hazards: 4, time: 72, mission: "Proteja a água e os animais", tint: "rgba(115, 211, 255, 0.16)", accent: "#2f6fed", learnings: ["Plástico no ambiente prejudica rios e lagos.", "Vidro pode ser reciclado muitas vezes."] },
  { name: "Praia Limpa", target: 13, hazards: 5, time: 76, mission: "Retire resíduos antes que cheguem ao mar", tint: "rgba(56, 189, 248, 0.18)", accent: "#38bdf8", learnings: ["Plástico no mar ameaça peixes e aves.", "Praias limpas protegem turismo e biodiversidade."] },
  { name: "Floresta Viva", target: 14, hazards: 5, time: 80, mission: "Proteja a trilha ecológica", tint: "rgba(34, 197, 94, 0.16)", accent: "#16a34a", learnings: ["Resíduos na mata podem causar incêndios.", "Vidro abandonado também fere animais."] },
  { name: "Bairro Industrial", target: 15, hazards: 6, time: 84, mission: "Organize a coleta perto das fábricas", tint: "rgba(148, 163, 184, 0.2)", accent: "#64748b", learnings: ["Indústrias precisam separar resíduos corretamente.", "Metal reciclado reduz mineração e gasto energético."] },
  { name: "Cooperativa Verde", target: 16, hazards: 6, time: 88, mission: "Ajude a cooperativa a fechar a triagem", tint: "rgba(250, 204, 21, 0.13)", accent: "#eab308", learnings: ["Cooperativas geram renda com reciclagem.", "Material limpo vale mais e é reaproveitado melhor."] },
  { name: "Eco Desafio Final", target: 18, hazards: 7, time: 94, mission: "Complete a reciclagem da cidade", tint: "rgba(255, 255, 255, 0.12)", accent: "#21996f", learnings: ["Reciclar reduz resíduos enviados a aterros.", "A separação correta melhora toda a cadeia."] }
];

const phaseMapThemes = [
  { groundTop: "#a7d98a", groundBottom: "#6dbb74", path: "#f0e3bc", pathEdge: "#d8c69d", detail: "#24b77b", label: "PARQUE" },
  { groundTop: "#dbe7df", groundBottom: "#b7c7bf", path: "#ded7c5", pathEdge: "#aeb8b1", detail: "#f4be32", label: "PRACA" },
  { groundTop: "#aee1bf", groundBottom: "#5fb989", path: "#d7c49d", pathEdge: "#b59468", detail: "#2f6fed", label: "LAGO" },
  { groundTop: "#ffe8a8", groundBottom: "#f7c979", path: "#f9df9c", pathEdge: "#d9a95f", detail: "#38bdf8", label: "PRAIA" },
  { groundTop: "#79ba68", groundBottom: "#2f7d4a", path: "#ceb98a", pathEdge: "#8d7347", detail: "#16a34a", label: "FLORESTA" },
  { groundTop: "#a8b0b9", groundBottom: "#6b7280", path: "#7f8791", pathEdge: "#4b5563", detail: "#64748b", label: "INDUSTRIA" },
  { groundTop: "#bfdc94", groundBottom: "#79b36a", path: "#d7c99a", pathEdge: "#9c8a58", detail: "#eab308", label: "COOPERATIVA" },
  { groundTop: "#8fb6c8", groundBottom: "#49757f", path: "#8a999e", pathEdge: "#334155", detail: "#21996f", label: "CIDADE" }
];

const educationTips = {
  papel: "Papel e papelão vão na lixeira azul. Eles podem voltar como cadernos, caixas e embalagens.",
  plastico: "Plástico vai na lixeira vermelha. Garrafas e sacolas precisam estar limpas e secas.",
  metal: "Metal vai na lixeira amarela. Latas recicladas economizam muita energia.",
  vidro: "Vidro vai na lixeira verde. Ele pode ser reciclado muitas vezes sem perder qualidade."
};

const scenery = [
  { x: 26, y: 134, size: 42 },
  { x: 868, y: 130, size: 52 },
  { x: 72, y: 528, size: 52 },
  { x: 828, y: 510, size: 50 },
  { x: 520, y: 568, size: 38 },
  { x: 742, y: 318, size: 34 },
  { x: 170, y: 312, size: 32 }
];

const flowers = Array.from({ length: 45 }, (_, index) => ({
  x: 28 + ((index * 73) % 890),
  y: 154 + ((index * 59) % 452),
  color: ["#f7d255", "#ffffff", "#ff9cab", "#8de0ff"][index % 4]
}));

let particles = [];
let motionTrails = [];

let player;
let items;
let hazards;
let score;
let level;
let timeLeft;
let carried;
let running = false;
let paused = false;
let lastTime;
let timerId;
let animationId;
let delivered = 0;
let targetCount = 8;
let combo = 1;
let floatingTexts = [];
let deliveryBursts = [];
let explosions = [];
let screenFlash = 0;
let slowMoTime = 0;
let shakeTime = 0;
let shakeStrength = 0;
let stepDustTimer = 0;
let ambientTime = 0;
let audioCtx;
let audioMuted = false;
let showPerf = false;
let fps = 60;
let fpsFrames = 0;
let fpsLastTime = performance.now();
let selectedLevel = 1;
let saveData = loadSave();
audioMuted = saveData.audioMuted;

const ambientLeaves = Array.from({ length: 18 }, (_, index) => ({
  x: (index * 137) % 960,
  y: 170 + ((index * 89) % 430),
  size: 3 + (index % 4),
  speed: 8 + (index % 5) * 3,
  drift: 16 + (index % 6) * 3,
  phase: index * 0.7,
  color: ["rgba(255,238,140,0.55)", "rgba(188,235,151,0.5)", "rgba(255,190,128,0.45)"][index % 3]
}));

const groundBlades = Array.from({ length: 48 }, (_, index) => ({
  x: 18 + ((index * 53) % 920),
  y: 540 + ((index * 29) % 82),
  h: 10 + (index % 5) * 3,
  tilt: ((index % 7) - 3) * 1.8,
  phase: index * 0.45
}));

function configureRenderContext(targetCtx) {
  targetCtx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = "medium";
}

function withDrawingContext(nextCtx, drawFn) {
  const previousCtx = ctx;
  ctx = nextCtx;
  try {
    drawFn();
  } finally {
    ctx = previousCtx;
  }
}

function invalidateBackgroundCache() {
  backgroundCache.key = "";
}

function roundedRectPath(targetCtx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  targetCtx.beginPath();
  targetCtx.moveTo(x + radius, y);
  targetCtx.lineTo(x + w - radius, y);
  targetCtx.quadraticCurveTo(x + w, y, x + w, y + radius);
  targetCtx.lineTo(x + w, y + h - radius);
  targetCtx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  targetCtx.lineTo(x + radius, y + h);
  targetCtx.quadraticCurveTo(x, y + h, x, y + h - radius);
  targetCtx.lineTo(x, y + radius);
  targetCtx.quadraticCurveTo(x, y, x + radius, y);
  targetCtx.closePath();
}

function fillGradientRoundedRectOn(targetCtx, x, y, w, h, r, topColor, bottomColor) {
  const gradient = targetCtx.createLinearGradient(0, y, 0, y + h);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  targetCtx.fillStyle = gradient;
  roundedRectPath(targetCtx, x, y, w, h, r);
  targetCtx.fill();
}

function drawBombSprite() {
  if (bombSpriteReady) return;
  const targetCtx = bombSpriteCtx;
  const cx = 56;
  const cy = 60;

  targetCtx.clearRect(0, 0, bombSprite.width, bombSprite.height);
  targetCtx.save();
  targetCtx.translate(cx, cy);

  const metal = targetCtx.createRadialGradient(-12, -14, 4, 0, 0, 44);
  metal.addColorStop(0, "#cbd5e1");
  metal.addColorStop(0.24, "#64748b");
  metal.addColorStop(0.62, "#243044");
  metal.addColorStop(1, "#070b13");
  targetCtx.fillStyle = metal;
  targetCtx.beginPath();
  targetCtx.ellipse(0, 0, 34, 31, 0.03, 0, Math.PI * 2);
  targetCtx.fill();

  targetCtx.strokeStyle = "rgba(255,255,255,0.16)";
  targetCtx.lineWidth = 3;
  targetCtx.beginPath();
  targetCtx.arc(-2, -2, 24, -2.55, -0.45);
  targetCtx.stroke();
  targetCtx.strokeStyle = "rgba(0,0,0,0.42)";
  targetCtx.beginPath();
  targetCtx.arc(2, 3, 27, 0.25, 2.4);
  targetCtx.stroke();

  fillGradientRoundedRectOn(targetCtx, -14, -38, 28, 15, 5, "#94a3b8", "#0f172a");
  targetCtx.strokeStyle = "#020617";
  targetCtx.lineWidth = 2;
  roundedRectPath(targetCtx, -14, -38, 28, 15, 5);
  targetCtx.stroke();

  targetCtx.strokeStyle = "#78350f";
  targetCtx.lineWidth = 4;
  targetCtx.lineCap = "round";
  targetCtx.beginPath();
  targetCtx.moveTo(10, -38);
  targetCtx.bezierCurveTo(26, -55, 44, -35, 31, -22);
  targetCtx.stroke();

  targetCtx.fillStyle = "rgba(255,255,255,0.22)";
  targetCtx.beginPath();
  targetCtx.ellipse(-12, -17, 11, 5, -0.58, 0, Math.PI * 2);
  targetCtx.arc(13, 18, 5, 0, Math.PI * 2);
  targetCtx.fill();

  targetCtx.fillStyle = "#ef4444";
  targetCtx.beginPath();
  targetCtx.moveTo(-18, -7);
  targetCtx.lineTo(-4, -3);
  targetCtx.lineTo(-15, 5);
  targetCtx.closePath();
  targetCtx.moveTo(18, -7);
  targetCtx.lineTo(4, -3);
  targetCtx.lineTo(15, 5);
  targetCtx.closePath();
  targetCtx.fill();

  targetCtx.strokeStyle = "rgba(255,255,255,0.76)";
  targetCtx.lineWidth = 3;
  targetCtx.beginPath();
  targetCtx.arc(0, 12, 10, 0.18, Math.PI - 0.18);
  targetCtx.stroke();
  targetCtx.restore();
  bombSpriteReady = true;
}

function rectsTouch(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isInForbiddenArea(rect) {
  const paddedTip = {
    x: TIP_BOX.x - 12,
    y: TIP_BOX.y - 18,
    w: TIP_BOX.w + 24,
    h: TIP_BOX.h + 30
  };
  const recyclingStationArea = { x: 0, y: 0, w: WORLD_WIDTH, h: 210 };
  const nearAnyBin = bins.some((bin) => {
    const dropZone = getBinDropZone(bin);
    const safeZone = {
      x: bin.x - 34,
      y: bin.y - 16,
      w: BIN_W + 68,
      h: dropZone.y + dropZone.h - bin.y + 44
    };
    return rectsTouch(rect, safeZone);
  });

  return rectsTouch(rect, paddedTip) || rectsTouch(rect, recyclingStationArea) || nearAnyBin;
}

function randomOpenPosition(w, h) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const rect = {
      x: rand(45, WORLD_WIDTH - w - 35),
      y: rand(170, WORLD_HEIGHT - h - 34),
      w,
      h
    };
    if (!isInForbiddenArea(rect)) return rect;
  }

  return { x: WORLD_WIDTH - w - 70, y: WORLD_HEIGHT - h - 72, w, h };
}

function getBinDropZone(bin) {
  return {
    x: bin.x + 18,
    y: bin.y + BIN_H + 32,
    w: BIN_W - 36,
    h: BIN_DROP_H
  };
}

function playerFootPoint() {
  return {
    x: player.x + player.w / 2,
    y: player.y + player.h - 5
  };
}

function pointInEllipse(point, zone) {
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + zone.h / 2;
  const rx = zone.w / 2;
  const ry = zone.h / 2;
  const nx = (point.x - cx) / rx;
  const ny = (point.y - cy) / ry;
  return nx * nx + ny * ny <= 1;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function directionToAngle(dx, dy) {
  return Math.atan2(dx, dy);
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRoundedRect(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  roundedRect(x, y, w, h, r);
  ctx.fill();
}

function fillGradientRoundedRect(x, y, w, h, r, topColor, bottomColor) {
  const gradient = ctx.createLinearGradient(0, y, 0, y + h);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  roundedRect(x, y, w, h, r);
  ctx.fill();
}

function drawSoftEllipse(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pushParticle(particle) {
  particles.push(particle);
  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}

function addParticles(x, y, color, amount = 12, power = 1) {
  for (let i = 0; i < amount; i += 1) {
    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.18;
    const speed = rand(45, 120) * power;
    pushParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.75 - 42 * power,
      life: 0.58 + Math.random() * 0.28,
      maxLife: 0.82,
      color,
      size: rand(3, 7) * power,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 8,
      gravity: 150
    });
  }
}

function addSpark(x, y, color = "#facc15") {
  pushParticle({
    x,
    y,
    vx: rand(-42, 42),
    vy: rand(-74, -18),
    life: 0.32,
    maxLife: 0.32,
    color,
    size: rand(2, 4),
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 14,
    gravity: 90,
    shape: "spark"
  });
}

function addDeliveryBurst(x, y, color) {
  deliveryBursts.push({
    x,
    y,
    color,
    life: 0.72,
    maxLife: 0.72,
    phase: Math.random() * Math.PI * 2
  });
  if (deliveryBursts.length > MAX_DELIVERY_BURSTS) deliveryBursts.shift();
  addParticles(x, y, color, 16, 1.18);
  for (let i = 0; i < 6; i += 1) {
    addSpark(x + rand(-14, 14), y + rand(-10, 8), i % 2 ? "#ffffff" : "#fff7a8");
  }
}

function addExplosion(x, y) {
  explosions.push({
    x,
    y,
    life: 0.86,
    maxLife: 0.86,
    phase: Math.random() * Math.PI * 2
  });
  if (explosions.length > MAX_EXPLOSIONS) explosions.shift();

  for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i += 1) {
    const angle = (Math.PI * 2 * i) / EXPLOSION_PARTICLE_COUNT + Math.random() * 0.12;
    const speed = rand(95, 230);
    pushParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.78 - 42,
      life: 0.48 + Math.random() * 0.44,
      maxLife: 0.92,
      color: ["#fff7a8", "#f97316", "#ef4444", "#111827"][i % 4],
      size: rand(4, 8),
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 12,
      gravity: i % 4 === 3 ? 55 : 185,
      shape: i % 4 === 3 ? "smoke" : "spark"
    });
  }

  for (let i = 0; i < EXPLOSION_SPARK_COUNT; i += 1) {
    addSpark(x + rand(-18, 18), y + rand(-14, 16), i % 2 ? "#ffffff" : "#facc15");
  }
}

function addMotionTrail() {
  if (!player || !player.walking) return;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed < 70) return;
  motionTrails.push({
    x: player.x,
    y: player.y,
    facingAngle: player.facingAngle || 0,
    life: 0.24,
    maxLife: 0.24,
    color: carried ? carried.color : "#b7f7d0"
  });
  if (motionTrails.length > MAX_MOTION_TRAILS) motionTrails.shift();
}

function addFloatingText(text, x, y, color = "#ffffff") {
  floatingTexts.push({
    text,
    x,
    y,
    vy: -42,
    life: 1,
    maxLife: 1,
    color
  });
}

function updateEffectLists(dt) {
  let writeIndex = 0;
  for (let i = 0; i < motionTrails.length; i += 1) {
    const trail = motionTrails[i];
    trail.life -= dt;
    if (trail.life > 0) {
      motionTrails[writeIndex] = trail;
      writeIndex += 1;
    }
  }
  motionTrails.length = writeIndex;

  writeIndex = 0;
  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.rotation = (particle.rotation || 0) + (particle.spin || 0) * dt;
    particle.vy += (particle.gravity || 160) * dt;
    particle.life -= dt;
    if (particle.life > 0) {
      particles[writeIndex] = particle;
      writeIndex += 1;
    }
  }
  particles.length = writeIndex;

  writeIndex = 0;
  for (let i = 0; i < deliveryBursts.length; i += 1) {
    const burst = deliveryBursts[i];
    burst.life -= dt;
    if (burst.life > 0) {
      deliveryBursts[writeIndex] = burst;
      writeIndex += 1;
    }
  }
  deliveryBursts.length = writeIndex;

  writeIndex = 0;
  for (let i = 0; i < explosions.length; i += 1) {
    const explosion = explosions[i];
    explosion.life -= dt;
    if (explosion.life > 0) {
      explosions[writeIndex] = explosion;
      writeIndex += 1;
    }
  }
  explosions.length = writeIndex;

  writeIndex = 0;
  for (let i = 0; i < floatingTexts.length; i += 1) {
    const text = floatingTexts[i];
    text.y += text.vy * dt;
    text.life -= dt;
    if (text.life > 0) {
      floatingTexts[writeIndex] = text;
      writeIndex += 1;
    }
  }
  floatingTexts.length = writeIndex;
}

function strokeRoundedRect(x, y, w, h, r, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  roundedRect(x, y, w, h, r);
  ctx.stroke();
}

function makeItems(amount) {
  const list = [];
  for (let i = 0; i < amount; i += 1) {
    const template = itemTypes[rand(0, itemTypes.length - 1)];
    const position = randomOpenPosition(ITEM_SIZE, ITEM_SIZE);
    list.push({
      ...template,
      ...position,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35
    });
  }
  return list;
}

function makeHazards(amount) {
  const list = [];
  const speed = 42 + Math.min(level, phaseConfigs.length) * 8;
  for (let i = 0; i < amount; i += 1) {
    const position = randomOpenPosition(66, 50);
    list.push({
      ...position,
      vx: Math.random() > 0.5 ? speed : -speed,
      phase: Math.random() * Math.PI * 2,
      sparkTimer: Math.random() * HAZARD_SPARK_RANDOM_DELAY
    });
  }
  return list;
}

function makePlayer() {
  return {
    x: 460,
    y: 540,
    w: PLAYER_W,
    h: PLAYER_H,
    speed: 290,
    vx: 0,
    vy: 0,
    invincible: 0,
    facing: "down",
    facingAngle: 0,
    targetFacingAngle: 0,
    visualLean: 0,
    visualTurn: 0,
    turnEnergy: 0,
    walking: false,
    walkCycle: 0
  };
}

function newGame() {
  ensureAudio();
  cancelAnimationFrame(animationId);
  clearInterval(timerId);
  keys.clear();
  heldDirections.clear();
  syncMoveButtons();
  resetJoystick();
  player = makePlayer();
  score = 0;
  level = selectedLevel;
  const phase = currentPhase();
  timeLeft = phase.time;
  carried = null;
  delivered = 0;
  targetCount = phase.target;
  combo = 1;
  paused = false;
  motionTrails = [];
  floatingTexts = [];
  deliveryBursts = [];
  explosions = [];
  screenFlash = 0;
  slowMoTime = 0;
  shakeTime = 0;
  shakeStrength = 0;
  stepDustTimer = 0;
  particles = [];
  items = makeItems(targetCount);
  hazards = makeHazards(phase.hazards);
  running = true;
  lastTime = performance.now();
  overlay.classList.add("hidden");
  pauseBtn.textContent = "Pausar";
  setLesson("Separe cada resíduo pela cor certa. Azul: papel, vermelho: plástico, amarelo: metal, verde: vidro.");
  updateHud();
  renderPhaseCards();
  timerId = setInterval(tickClock, 1000);
  animationId = requestAnimationFrame(loop);
  playSound("level");
}

function nextLevel() {
  level += 1;
  selectedLevel = Math.min(level, saveData.unlockedLevel);
  renderPhaseCards();
  const phase = currentPhase();
  timeLeft += phase.time - 48;
  player.x = 460;
  player.y = 540;
  player.vx = 0;
  player.vy = 0;
  carried = null;
  delivered = 0;
  targetCount = phase.target;
  addParticles(player.x + player.w / 2, player.y + player.h / 2, "#f4be32");
  addFloatingText(`Fase ${level}!`, player.x, player.y - 20, "#fff7a8");
  items = makeItems(targetCount);
  hazards = makeHazards(phase.hazards);
  setLesson(`${phase.name}: ${phase.mission}.`);
  updateHud();
  playSound("level");
}

function tickClock() {
  if (!running || paused) return;
  timeLeft -= 1;
  updateHud();
  if (timeLeft <= 0) endGame("Tempo esgotado", "Tente separar mais resíduos antes do tempo acabar.");
}

function updateHud() {
  const phase = currentPhase();
  levelEl.textContent = level;
  scoreEl.textContent = score;
  timeEl.textContent = Math.max(0, timeLeft);
  missionEl.textContent = phase.mission;
  progressTextEl.textContent = `${delivered}/${targetCount}`;
  carryTextEl.textContent = carried ? `${carried.name} (${carried.type})` : "Nada";
  comboTextEl.textContent = `x${combo}`;
}

function endGame(title, text) {
  running = false;
  paused = false;
  keys.clear();
  heldDirections.clear();
  syncMoveButtons();
  resetJoystick();
  clearInterval(timerId);
  overlay.innerHTML = `
    <h2>${title}</h2>
    <p>${text}<br>Pontuação final: <strong>${score}</strong></p>
    <button data-action="new-game" type="button">Jogar de novo</button>
  `;
  overlay.classList.remove("hidden");
  pauseBtn.textContent = "Pausar";
  renderPhaseCards();
  playSound(title.toLowerCase().includes("vitoria") ? "level" : "error");
}

function phaseLearningHtml(phase) {
  return `<ul class="learning-list">${phase.learnings.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function completePhase() {
  const finishedLevel = level;
  const phase = currentPhase();
  completeLevelSave(finishedLevel, score);
  running = false;
  paused = false;
  clearInterval(timerId);
  keys.clear();
  heldDirections.clear();
  syncMoveButtons();
  resetJoystick();

  const finalPhase = finishedLevel >= phaseConfigs.length;
  overlay.innerHTML = `
    <h2>${finalPhase ? "Vitória!" : "Fase concluída"}</h2>
    <p>${phase.name}<br>Pontuação atual: <strong>${score}</strong></p>
    ${phaseLearningHtml(phase)}
    <div class="overlay-actions">
      ${finalPhase ? "" : `<button data-action="next-level" type="button">Próxima fase</button>`}
      <button data-action="new-game" type="button">${finalPhase ? "Jogar de novo" : "Rejogar"}</button>
    </div>
  `;
  overlay.classList.remove("hidden");
  pauseBtn.textContent = "Pausar";
  setLesson(finalPhase ? "Campanha concluída. Seu progresso foi salvo." : "Fase concluída. Veja os aprendizados e avance quando quiser.");
  playSound(finalPhase ? "level" : "success");
}

function showPauseOverlay() {
  overlay.innerHTML = `
    <h2>Jogo pausado</h2>
    <p>Ajuste o ritmo, respire e volte para completar a reciclagem.</p>
    <div class="overlay-actions">
      <button data-action="resume" type="button">Continuar</button>
      <button data-action="new-game" type="button">Reiniciar</button>
    </div>
  `;
  overlay.classList.remove("hidden");
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  keys.clear();
  heldDirections.clear();
  syncMoveButtons();
  resetJoystick();
  pauseBtn.textContent = paused ? "Continuar partida" : "Pausar";
  if (paused) showPauseOverlay();
  else overlay.classList.add("hidden");
}

function movePlayer(dt) {
  if (!running || !player) return;

  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a") || heldDirections.has("left")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d") || heldDirections.has("right")) dx += 1;
  if (keys.has("arrowup") || keys.has("w") || heldDirections.has("up")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s") || heldDirections.has("down")) dy += 1;
  if (joystickInput.active) {
    dx += joystickInput.x;
    dy += joystickInput.y;
  }

  let targetVx = 0;
  let targetVy = 0;
  const wasWalking = player.walking;
  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    const inputStrength = joystickInput.active ? Math.min(1, length) : 1;
    targetVx = (dx / length) * player.speed * inputStrength;
    targetVy = (dy / length) * player.speed * inputStrength;
    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? "right" : "left";
    else player.facing = dy > 0 ? "down" : "up";
    player.targetFacingAngle = directionToAngle(dx / length, dy / length);
  }

  const acceleration = 10.5;
  const drag = dx === 0 && dy === 0 ? 14 : acceleration;
  player.vx += (targetVx - player.vx) * Math.min(1, drag * dt);
  player.vy += (targetVy - player.vy) * Math.min(1, drag * dt);
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const speed = Math.hypot(player.vx, player.vy);
  player.walking = speed > 18;
  const turnDelta = normalizeAngle(player.targetFacingAngle - player.facingAngle);
  player.facingAngle = normalizeAngle(player.facingAngle + turnDelta * Math.min(1, 8.5 * dt));
  const targetTurnEnergy = Math.min(1, Math.abs(turnDelta) * 1.35);
  player.turnEnergy += (targetTurnEnergy - player.turnEnergy) * Math.min(1, 12 * dt);
  const targetLean = Math.max(-1, Math.min(1, player.vx / player.speed)) * 0.08;
  player.visualLean += (targetLean - player.visualLean) * Math.min(1, 9 * dt);
  const targetTurn = dx === 0 && dy === 0 ? 0 : Math.max(-1, Math.min(1, dx)) * 2.2;
  player.visualTurn += (targetTurn - player.visualTurn) * Math.min(1, 10 * dt);
  if (player.walking) {
    player.walkCycle += dt * (7.5 + speed / 48);
    stepDustTimer -= dt;
    if (stepDustTimer <= 0) {
      addStepDust();
      addMotionTrail();
      stepDustTimer = 0.16;
    }
  } else if (wasWalking) {
    player.walkCycle = 0;
  }

  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
  player.y = Math.max(132, Math.min(WORLD_HEIGHT - player.h, player.y));
  player.invincible = Math.max(0, player.invincible - dt);
}

function addStepDust() {
  const footY = player.y + player.h - 3;
  const centerX = player.x + player.w / 2;
  const speed = Math.hypot(player.vx, player.vy);
  for (let i = 0; i < 4; i += 1) {
    pushParticle({
      x: centerX + rand(-12, 12),
      y: footY + rand(-2, 4),
      vx: rand(-20, 20) - player.vx * 0.07,
      vy: rand(-18, -5) - Math.min(32, speed * 0.05),
      life: 0.34,
      maxLife: 0.34,
      color: "rgba(239, 224, 181, 0.9)",
      size: rand(3, 7),
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 5,
      gravity: 90
    });
  }
}

function updateWorld(dt) {
  ambientTime += dt;
  screenFlash = Math.max(0, screenFlash - dt * 2.8);
  slowMoTime = Math.max(0, slowMoTime - dt);
  shakeTime = Math.max(0, shakeTime - dt);

  updateEffectLists(dt);

  hazards.forEach((hazard) => {
    hazard.x += hazard.vx * dt;
    if (hazard.x < 20 || hazard.x + hazard.w > WORLD_WIDTH - 20) hazard.vx *= -1;
    hazard.sparkTimer -= dt;
    if (hazard.sparkTimer <= 0) {
      const fuseX = hazard.x + hazard.w / 2 + 31 + Math.sin(ambientTime * 11 + hazard.phase) * 2.4;
      const fuseY = hazard.y + hazard.h / 2 - 22 + Math.cos(ambientTime * 9 + hazard.phase) * 2;
      addSpark(fuseX, fuseY, Math.random() > 0.45 ? "#facc15" : "#ef4444");
      hazard.sparkTimer = HAZARD_SPARK_MIN_DELAY + Math.random() * HAZARD_SPARK_RANDOM_DELAY;
    }
    if (rectsTouch(player, hazard) && player.invincible <= 0) {
      score = Math.max(0, score - 35);
      timeLeft = Math.max(0, timeLeft - 4);
      combo = 1;
      player.invincible = 1.2;
      shakeTime = 0.44;
      shakeStrength = 12;
      screenFlash = 1;
      slowMoTime = 0.14;
      addExplosion(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
      addFloatingText("-4s", player.x, player.y - 10, "#ffb4ad");
      setLesson("Atenção: evite as bombas. Elas representam riscos e atrasam a limpeza da cidade.");
      playSound("boom");
      updateHud();
    }
  });

  if (!carried) {
    const found = items.find((item) => rectsTouch(player, item));
    if (found) {
      carried = found;
      items = items.filter((item) => item !== found);
      addParticles(found.x + found.w / 2, found.y + found.h / 2, found.color, 18, 1.2);
      for (let i = 0; i < 5; i += 1) addSpark(found.x + found.w / 2, found.y + found.h / 2, "#ffffff");
      addFloatingText(found.name, found.x, found.y - 10, "#ffffff");
      setLesson(educationTips[found.type]);
      playSound("pickup");
      updateHud();
    }
  } else {
    const foot = playerFootPoint();
    const bin = bins.find((target) => pointInEllipse(foot, getBinDropZone(target)));

    if (bin) {
      if (bin.type === carried.type) {
        const gained = 120 * combo;
        score += gained;
        timeLeft += 3;
        delivered += 1;
        addFloatingText(`+${gained}`, player.x, player.y - 18, "#fff7a8");
        addDeliveryBurst(player.x + player.w / 2, player.y + player.h / 2, bin.color);
        screenFlash = Math.max(screenFlash, 0.28);
        combo = Math.min(5, combo + 1);
        setLesson(`Correto: ${educationTips[bin.type]}`);
        playSound("success");
      } else {
        score = Math.max(0, score - 50);
        timeLeft = Math.max(0, timeLeft - 5);
        combo = 1;
        shakeTime = 0.28;
        shakeStrength = 8;
        addFloatingText("lixeira errada", player.x - 18, player.y - 18, "#ffb4ad");
        setLesson(`Quase! ${educationTips[carried.type]}`);
        playSound("error");
      }
      carried = null;
      updateHud();
    }
  }

  if (items.length === 0 && !carried) {
    completePhase();
  }
}

function renderBackgroundCache(phase, theme, phaseIndex, imageReady) {
  backgroundCache.canvas.width = RENDER_WIDTH;
  backgroundCache.canvas.height = RENDER_HEIGHT;
  configureRenderContext(backgroundCache.ctx);
  withDrawingContext(backgroundCache.ctx, () => {
    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    if (phaseIndex === 0 && imageReady) {
      ctx.save();
      ctx.drawImage(mapImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.fillStyle = phase.tint;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.restore();
      drawMapLight();
      drawPhaseIdentity(phase);
      drawEcoCenter();
      drawAmbientLeaves();
      drawMapAtmosphere(phaseMapThemes[0]);
      drawForegroundGrass(phaseMapThemes[0]);
      drawVignette();
      return;
    }

    drawGeneratedMap(phase, theme);
    drawVignette();
  });
}

function drawBackground() {
  const phase = currentPhase();
  const phaseIndex = Math.min(level - 1, phaseMapThemes.length - 1);
  const imageReady = phaseIndex === 0 && mapImage.complete && mapImage.naturalWidth > 0;
  const cacheKey = `${level}:${RENDER_WIDTH}:${RENDER_HEIGHT}:${imageReady ? "image" : "generated"}`;
  if (backgroundCache.key !== cacheKey) {
    renderBackgroundCache(phase, phaseMapThemes[phaseIndex], phaseIndex, imageReady);
    backgroundCache.key = cacheKey;
  }
  ctx.drawImage(backgroundCache.canvas, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawGeneratedMap(phase, theme) {
  const ground = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  ground.addColorStop(0, theme.groundTop);
  ground.addColorStop(1, theme.groundBottom);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  drawSunbeams();
  drawMapTexture(theme);
  drawThemeBase(theme);
  drawThemePath(theme);
  drawThemeDetails(theme);
  drawPhaseIdentity(phase);
  drawEcoCenter();
  drawAmbientLeaves();
  drawMapAtmosphere(theme);
  drawForegroundGrass(theme);
}

function drawMapTexture(theme) {
  ctx.save();
  ctx.globalAlpha = 0.14;
  for (let y = 150; y < WORLD_HEIGHT; y += 28) {
    for (let x = 0; x < WORLD_WIDTH; x += 36) {
      ctx.fillStyle = (x + y) % 4 === 0 ? "#ffffff" : theme.detail;
      ctx.beginPath();
      ctx.ellipse(x + ((y * 2) % 24), y, 12, 3, -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMapAtmosphere(theme) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const centerGlow = ctx.createRadialGradient(430, 310, 70, 430, 310, 470);
  centerGlow.addColorStop(0, "rgba(255,255,255,0.22)");
  centerGlow.addColorStop(0.48, `${theme.detail}22`);
  centerGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 130, WORLD_WIDTH, WORLD_HEIGHT - 130);

  ctx.globalAlpha = 0.18 + Math.sin(ambientTime * 1.2) * 0.04;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 10; i += 1) {
    const x = 74 + ((i * 97 + Math.sin(ambientTime * 0.8 + i) * 10) % 820);
    const y = 178 + ((i * 61) % 360);
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + (i % 3) * 6, 4 + (i % 2) * 2, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  const lowerShade = ctx.createLinearGradient(0, 430, 0, WORLD_HEIGHT);
  lowerShade.addColorStop(0, "rgba(15,23,42,0)");
  lowerShade.addColorStop(1, "rgba(15,23,42,0.16)");
  ctx.fillStyle = lowerShade;
  ctx.fillRect(0, 430, WORLD_WIDTH, WORLD_HEIGHT - 430);
  ctx.restore();
}

function drawForegroundGrass(theme) {
  ctx.save();
  ctx.lineCap = "round";
  groundBlades.forEach((blade, index) => {
    const sway = Math.sin(ambientTime * 1.8 + blade.phase) * 2;
    ctx.globalAlpha = 0.22 + (index % 4) * 0.035;
    ctx.strokeStyle = index % 3 === 0 ? shade(theme.detail, -18) : "rgba(255,255,255,0.42)";
    ctx.lineWidth = 2 + (index % 2);
    ctx.beginPath();
    ctx.moveTo(blade.x, blade.y);
    ctx.quadraticCurveTo(blade.x + blade.tilt + sway, blade.y - blade.h * 0.6, blade.x + blade.tilt * 1.8 + sway, blade.y - blade.h);
    ctx.stroke();
  });
  ctx.restore();
}

function drawThemePath(theme) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = theme.pathEdge;
  ctx.lineWidth = 72;
  ctx.beginPath();
  if (level === 4) {
    ctx.moveTo(-20, 522);
    ctx.bezierCurveTo(170, 470, 324, 535, 486, 450);
    ctx.bezierCurveTo(642, 368, 724, 312, WORLD_WIDTH + 20, 292);
  } else if (level === 6 || level === 8) {
    ctx.moveTo(-20, 472);
    ctx.lineTo(340, 420);
    ctx.lineTo(610, 520);
    ctx.lineTo(WORLD_WIDTH + 20, 410);
  } else if (level === 7) {
    ctx.moveTo(-20, 516);
    ctx.bezierCurveTo(210, 420, 390, 505, 520, 380);
    ctx.bezierCurveTo(640, 270, 790, 315, WORLD_WIDTH + 20, 236);
  } else {
    ctx.moveTo(-20, WORLD_HEIGHT - 38);
    ctx.bezierCurveTo(210, 530, 394, 410, 526, 320);
    ctx.bezierCurveTo(668, 224, 760, 214, WORLD_WIDTH + 20, 190);
  }
  ctx.stroke();

  ctx.strokeStyle = theme.path;
  ctx.lineWidth = 54;
  ctx.stroke();

  ctx.strokeStyle = "rgba(40, 52, 62, 0.24)";
  ctx.lineWidth = 2;
  ctx.setLineDash(level === 6 || level === 8 ? [26, 22] : [10, 12]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawThemeBase(theme) {
  if (level === 2) drawPlazaBase(theme);
  else if (level === 3) drawLakeBase();
  else if (level === 4) drawBeachBase();
  else if (level === 5) drawForestBase();
  else if (level === 6) drawIndustrialBase();
  else if (level === 7) drawCooperativeBase();
  else if (level >= 8) drawCityBase();
  else {
    drawLake();
    flowers.forEach(drawFlower);
    scenery.forEach(drawTree);
  }
}

function drawThemeDetails(theme) {
  drawMapLabel(theme);
  if (level === 2) drawPlazaDetails();
  else if (level === 3) drawLakeDetails();
  else if (level === 4) drawBeachDetails();
  else if (level === 5) drawForestDetails();
  else if (level === 6) drawIndustrialDetails();
  else if (level === 7) drawCooperativeDetails();
  else if (level >= 8) drawCityDetails();
}

function drawMapLabel(theme) {
  ctx.save();
  ctx.globalAlpha = 0.82;
  fillGradientRoundedRect(22, 566, 122, 32, 8, "rgba(255,255,255,0.84)", "rgba(235,249,242,0.72)");
  ctx.fillStyle = theme.detail;
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(theme.label, 83, 587);
  ctx.restore();
}

function drawPlazaBase(theme) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  for (let x = 0; x < WORLD_WIDTH; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 150);
    ctx.lineTo(x - 120, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 170; y < WORLD_HEIGHT; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y - 90);
    ctx.stroke();
  }
  ctx.restore();
  drawSoftEllipse(748, 342, 86, 50, "rgba(255,255,255,0.34)");
  strokeRoundedRect(672, 296, 152, 92, 8, "rgba(117,94,61,0.25)", 4);
  fillGradientRoundedRect(180, 438, 142, 18, 6, "#9a6a3c", "#5e3b22");
  fillGradientRoundedRect(610, 498, 142, 18, 6, "#9a6a3c", "#5e3b22");
  fillRoundedRect(202, 456, 10, 28, 4, "#5e3b22");
  fillRoundedRect(292, 456, 10, 28, 4, "#5e3b22");
  fillRoundedRect(632, 516, 10, 28, 4, "#5e3b22");
  fillRoundedRect(722, 516, 10, 28, 4, "#5e3b22");
  ctx.fillStyle = theme.detail;
  for (let x = 74; x < 910; x += 110) drawSoftEllipse(x, 224 + (x % 3) * 22, 17, 17, "rgba(244,190,50,0.45)");
}

function drawLakeBase() {
  const water = ctx.createLinearGradient(0, 178, 0, 570);
  water.addColorStop(0, "#88dff4");
  water.addColorStop(1, "#2384bd");
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(225, 405, 240, 174, -0.18, 0, Math.PI * 2);
  ctx.ellipse(50, 520, 168, 124, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.58)";
  ctx.lineWidth = 4;
  for (let y = 290; y < 536; y += 48) {
    ctx.beginPath();
    ctx.moveTo(38, y);
    ctx.quadraticCurveTo(180, y + 26, 384, y - 8);
    ctx.stroke();
  }
}

function drawBeachBase() {
  const ocean = ctx.createLinearGradient(610, 0, WORLD_WIDTH, 0);
  ocean.addColorStop(0, "#6ed5ee");
  ocean.addColorStop(1, "#1677b8");
  ctx.fillStyle = ocean;
  ctx.beginPath();
  ctx.moveTo(650, 145);
  ctx.bezierCurveTo(594, 260, 680, 350, 616, 452);
  ctx.bezierCurveTo(560, 548, 650, 620, WORLD_WIDTH, 640);
  ctx.lineTo(WORLD_WIDTH, 145);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.68)";
  ctx.lineWidth = 6;
  for (let y = 225; y < 600; y += 58) {
    ctx.beginPath();
    ctx.moveTo(620, y);
    ctx.quadraticCurveTo(744, y + 34, 940, y - 4);
    ctx.stroke();
  }
}

function drawForestBase() {
  for (let i = 0; i < 24; i += 1) {
    const x = 35 + (i * 83) % 900;
    const y = 165 + (i * 67) % 410;
    drawTree({ x, y, size: 32 + (i % 4) * 9 });
  }
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#0d3f31";
  for (let i = 0; i < 18; i += 1) {
    ctx.beginPath();
    ctx.ellipse(70 + (i * 97) % 840, 224 + (i * 53) % 330, 42, 12, i * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawIndustrialBase() {
  ctx.save();
  ctx.fillStyle = "rgba(31,41,55,0.26)";
  ctx.fillRect(0, 152, WORLD_WIDTH, 488);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  for (let x = 0; x < WORLD_WIDTH; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, 152);
    ctx.lineTo(x - 190, 640);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 5; i += 1) {
    fillGradientRoundedRect(560 + i * 74, 220 - i * 12, 56, 116 + i * 10, 4, "#64748b", "#334155");
    fillRoundedRect(572 + i * 74, 238 - i * 12, 9, 9, 2, "rgba(255,247,168,0.68)");
    fillRoundedRect(596 + i * 74, 266 - i * 12, 9, 9, 2, "rgba(255,247,168,0.52)");
  }
}

function drawCooperativeBase() {
  for (let i = 0; i < 6; i += 1) {
    const x = 98 + i * 132;
    fillGradientRoundedRect(x, 358 + (i % 2) * 44, 78, 54, 7, "#e8d28a", "#b79245");
    strokeRoundedRect(x, 358 + (i % 2) * 44, 78, 54, 7, "rgba(67,48,24,0.24)", 2);
  }
  ctx.save();
  ctx.strokeStyle = "rgba(36,93,64,0.38)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(150, 518);
  ctx.lineTo(792, 432);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.52)";
  ctx.lineWidth = 2;
  for (let x = 172; x < 780; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 515);
    ctx.lineTo(x + 28, 493);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCityBase() {
  const sky = ctx.createLinearGradient(0, 150, 0, 360);
  sky.addColorStop(0, "rgba(15,23,42,0.24)");
  sky.addColorStop(1, "rgba(15,23,42,0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 150, WORLD_WIDTH, 250);
  for (let i = 0; i < 12; i += 1) {
    const x = 486 + i * 42;
    const h = 52 + (i % 4) * 24;
    fillGradientRoundedRect(x, 246 - h, 32, h, 3, "#334155", "#102033");
    fillRoundedRect(x + 8, 226 - h, 5, 5, 1, "rgba(255,247,168,0.68)");
    fillRoundedRect(x + 19, 250 - h, 5, 5, 1, "rgba(190,242,100,0.55)");
  }
}

function drawPlazaDetails() {
  ctx.fillStyle = "#7c5c37";
  for (let i = 0; i < 4; i += 1) {
    fillRoundedRect(122 + i * 34, 302, 20, 48, 5, "#9f7340");
  }
  drawSoftEllipse(748, 338, 42, 18, "rgba(80,160,185,0.44)");
  drawSoftEllipse(748, 326, 20, 8, "rgba(255,255,255,0.56)");
}

function drawLakeDetails() {
  for (let i = 0; i < 10; i += 1) {
    drawSoftEllipse(82 + (i * 61) % 320, 324 + (i * 43) % 186, 14, 6, "rgba(24,135,91,0.72)");
  }
  fillGradientRoundedRect(392, 420, 132, 24, 6, "#ad7d45", "#71491f");
  ctx.strokeStyle = "rgba(80,51,26,0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(406, 406);
  ctx.lineTo(406, 468);
  ctx.moveTo(508, 406);
  ctx.lineTo(508, 468);
  ctx.stroke();
}

function drawBeachDetails() {
  const umbrellas = [
    { x: 178, y: 332, color: "#ef4444" },
    { x: 380, y: 500, color: "#2f6fed" },
    { x: 528, y: 268, color: "#f4be32" }
  ];
  umbrellas.forEach((umbrella) => {
    ctx.fillStyle = umbrella.color;
    ctx.beginPath();
    ctx.arc(umbrella.x, umbrella.y, 28, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7c5636";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(umbrella.x, umbrella.y);
    ctx.lineTo(umbrella.x + 18, umbrella.y + 64);
    ctx.stroke();
  });
}

function drawForestDetails() {
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(108 + i * 190, 190);
    ctx.bezierCurveTo(150 + i * 180, 260, 88 + i * 214, 390, 168 + i * 166, 520);
    ctx.stroke();
  }
}

function drawIndustrialDetails() {
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#e5e7eb";
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(600 + i * 74 + Math.sin(ambientTime + i) * 8, 88 - i * 8, 28 + i * 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  fillRoundedRect(110, 394, 150, 64, 8, "rgba(15,23,42,0.32)");
  fillRoundedRect(122, 408, 126, 12, 4, "rgba(250,204,21,0.7)");
}

function drawCooperativeDetails() {
  for (let i = 0; i < 4; i += 1) {
    fillGradientRoundedRect(610 + i * 56, 250 + (i % 2) * 34, 44, 30, 5, "#94a3b8", "#475569");
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(616 + i * 56, 266 + (i % 2) * 34);
    ctx.lineTo(646 + i * 56, 266 + (i % 2) * 34);
    ctx.stroke();
  }
  drawSoftEllipse(290, 272, 62, 18, "rgba(255,247,168,0.36)");
}

function drawCityDetails() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(52,211,153,0.5)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 550);
  ctx.bezierCurveTo(260, 468, 430, 590, 660, 456);
  ctx.bezierCurveTo(760, 398, 840, 426, 920, 372);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 8; i += 1) {
    drawSoftEllipse(80 + i * 106, 254 + (i % 3) * 72, 20, 20, i % 2 ? "rgba(52,211,153,0.28)" : "rgba(59,130,246,0.25)");
  }
}

function drawPhaseIdentity(phase) {
  ctx.save();
  if (level === 2) {
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = phase.accent;
    ctx.lineWidth = 4;
    for (let x = 120; x < 880; x += 84) {
      ctx.beginPath();
      ctx.moveTo(x, 190);
      ctx.lineTo(x - 160, 630);
      ctx.stroke();
    }
  } else if (level === 3) {
    ctx.globalAlpha = 0.3;
    const water = ctx.createLinearGradient(0, 300, 0, 610);
    water.addColorStop(0, "rgba(47,111,237,0.2)");
    water.addColorStop(1, "rgba(33,153,111,0.22)");
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.ellipse(780, 430, 150, 86, -0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (level === 4) {
    ctx.globalAlpha = 0.42;
    const sand = ctx.createLinearGradient(0, 400, 0, 640);
    sand.addColorStop(0, "rgba(254, 240, 138, 0.24)");
    sand.addColorStop(1, "rgba(251, 191, 36, 0.3)");
    ctx.fillStyle = sand;
    ctx.beginPath();
    ctx.ellipse(185, 520, 210, 84, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 5;
    for (let y = 390; y < 510; y += 34) {
      ctx.beginPath();
      ctx.moveTo(610, y);
      ctx.quadraticCurveTo(720, y + 26, 920, y - 2);
      ctx.stroke();
    }
  } else if (level === 5) {
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = phase.accent;
    for (let i = 0; i < 16; i += 1) {
      const x = 80 + (i * 61) % 820;
      const y = 230 + (i * 47) % 340;
      ctx.beginPath();
      ctx.ellipse(x, y, 30, 10, (i % 4) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (level === 6) {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#475569";
    for (let i = 0; i < 8; i += 1) {
      const x = 560 + i * 42;
      const h = 55 + (i % 4) * 20;
      fillRoundedRect(x, 210 - h, 30, h, 3, "#475569");
      ctx.fillStyle = "rgba(203,213,225,0.55)";
      ctx.fillRect(x + 7, 190 - h, 5, 5);
      ctx.fillStyle = "#475569";
    }
    ctx.strokeStyle = "rgba(100,116,139,0.36)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(60, 520);
    ctx.lineTo(900, 430);
    ctx.stroke();
  } else if (level === 7) {
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = phase.accent;
    ctx.lineWidth = 5;
    for (let i = 0; i < 5; i += 1) {
      ctx.strokeRect(110 + i * 150, 360 + (i % 2) * 35, 90, 54);
      ctx.beginPath();
      ctx.arc(155 + i * 150, 387 + (i % 2) * 35, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (level >= 8) {
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#102033";
    for (let i = 0; i < 7; i += 1) {
      const x = 610 + i * 44;
      const h = 42 + (i % 3) * 18;
      fillRoundedRect(x, 188 - h, 28, h, 4, "#102033");
      ctx.fillStyle = "rgba(255,247,168,0.55)";
      ctx.fillRect(x + 7, 160 - h, 4, 4);
      ctx.fillStyle = "#102033";
    }
  }
  ctx.restore();
}

function drawMapLight() {
  ctx.save();
  const glow = ctx.createRadialGradient(455, 315, 80, 455, 315, 430);
  glow.addColorStop(0, "rgba(255, 246, 166, 0.22)");
  glow.addColorStop(0.62, "rgba(255, 246, 166, 0.06)");
  glow.addColorStop(1, "rgba(255, 246, 166, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.globalAlpha = 0.18 + Math.sin(ambientTime * 1.4) * 0.04;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(102, 466, 32, 6, -0.18, 0, Math.PI * 2);
  ctx.ellipse(112, 493, 24, 5, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAmbientLeaves() {
  ambientLeaves.forEach((leaf) => {
    const x = (leaf.x + ambientTime * leaf.speed) % (WORLD_WIDTH + 40) - 20;
    const y = leaf.y + Math.sin(ambientTime * 1.3 + leaf.phase) * leaf.drift;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(ambientTime * 2 + leaf.phase) * 0.8);
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size * 1.8, leaf.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawSunbeams() {
  const beam = ctx.createRadialGradient(80, 20, 10, 80, 20, 470);
  beam.addColorStop(0, "rgba(255, 246, 170, 0.38)");
  beam.addColorStop(1, "rgba(255, 246, 170, 0)");
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#fff5a8";
  ctx.beginPath();
  ctx.moveTo(35, 0);
  ctx.lineTo(190, WORLD_HEIGHT);
  ctx.lineTo(245, WORLD_HEIGHT);
  ctx.lineTo(82, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLake() {
  const water = ctx.createLinearGradient(0, 170, 0, 330);
  water.addColorStop(0, "#85d7e6");
  water.addColorStop(1, "#3da6c0");
  ctx.save();
  ctx.shadowColor = "rgba(14, 70, 88, 0.24)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(820, 286, 118, 70, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(792, 268, 62, 15, -0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.beginPath();
  ctx.ellipse(854, 314, 34, 6, -0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawEcoCenter() {
  ctx.save();
  ctx.shadowColor = "rgba(16,32,51,0.28)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  fillGradientRoundedRect(20, 20, 920, 124, 8, "rgba(255,250,224,0.72)", "rgba(196,231,185,0.56)");
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = "rgba(102, 80, 42, 0.25)";
  ctx.lineWidth = 4;
  for (let x = 44; x < 914; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 34);
    ctx.lineTo(x + 18, 132);
    ctx.stroke();
  }
  ctx.restore();

  fillGradientRoundedRect(36, 116, 888, 28, 8, "rgba(117,86,48,0.76)", "rgba(75,55,35,0.82)");
  fillGradientRoundedRect(350, 16, 264, 34, 8, "rgba(22,86,62,0.96)", "rgba(12,52,39,0.96)");
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ESTACAO DE RECICLAGEM", 482, 39);

  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(482, 86, 390, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawVignette() {
  const vignette = ctx.createRadialGradient(
    WORLD_WIDTH / 2,
    WORLD_HEIGHT / 2,
    170,
    WORLD_WIDTH / 2,
    WORLD_HEIGHT / 2,
    620
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(16,32,51,0.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawTree(tree) {
  ctx.save();
  ctx.shadowColor = "rgba(16,32,51,0.2)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 8;
  fillRoundedRect(tree.x + tree.size * 0.38, tree.y + tree.size * 0.52, tree.size * 0.22, tree.size * 0.52, 5, "#7c5636");
  ctx.fillStyle = "#1f774f";
  ctx.beginPath();
  ctx.arc(tree.x + tree.size * 0.35, tree.y + tree.size * 0.44, tree.size * 0.32, 0, Math.PI * 2);
  ctx.arc(tree.x + tree.size * 0.62, tree.y + tree.size * 0.42, tree.size * 0.34, 0, Math.PI * 2);
  ctx.arc(tree.x + tree.size * 0.5, tree.y + tree.size * 0.2, tree.size * 0.31, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2fa66f";
  ctx.beginPath();
  ctx.arc(tree.x + tree.size * 0.25, tree.y + tree.size * 0.4, tree.size * 0.13, 0, Math.PI * 2);
  ctx.arc(tree.x + tree.size * 0.67, tree.y + tree.size * 0.28, tree.size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(tree.x + tree.size * 0.42, tree.y + tree.size * 0.28, tree.size * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlower(flower) {
  if (flower.y < 126 || (flower.x > 730 && flower.x < 920 && flower.y > 175 && flower.y < 330)) return;
  ctx.fillStyle = flower.color;
  ctx.beginPath();
  ctx.arc(flower.x, flower.y, 2.5, 0, Math.PI * 2);
  ctx.arc(flower.x + 4, flower.y + 1, 2, 0, Math.PI * 2);
  ctx.arc(flower.x - 3, flower.y + 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBins() {
  bins.forEach((bin) => {
    const zone = getBinDropZone(bin);
    const isCorrectTarget = carried && carried.type === bin.type;
    const isWrongTarget = carried && carried.type !== bin.type;
    const bodyTop = bin.y + 26;

    ctx.save();
    ctx.globalAlpha = isCorrectTarget ? 0.58 : carried ? 0.14 : 0.16;
    ctx.strokeStyle = bin.color;
    ctx.lineWidth = isCorrectTarget ? 6 : 4;
    ctx.beginPath();
    ctx.ellipse(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w / 2, zone.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = isCorrectTarget ? 0.2 : 0.07;
    ctx.fillStyle = bin.color;
    ctx.beginPath();
    ctx.ellipse(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w / 2, zone.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = isWrongTarget ? 0.68 : 1;
    fillRoundedRect(bin.x - 13, bin.y + 92, BIN_W + 26, 23, 7, "rgba(116, 91, 56, 0.78)");
    fillRoundedRect(bin.x + 8, bodyTop, BIN_W - 16, 74, 8, bin.color);
    fillRoundedRect(bin.x + 17, bodyTop + 9, BIN_W - 34, 54, 6, shade(bin.color, -24));
    fillRoundedRect(bin.x + 8, bin.y + 9 - (isCorrectTarget ? 6 : 0), BIN_W - 16, 20, 6, shade(bin.color, -12));
    fillRoundedRect(bin.x + 30, bin.y - 2 - (isCorrectTarget ? 6 : 0), BIN_W - 60, 12, 5, shade(bin.color, -30));
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bin.label, bin.x + BIN_W / 2, bin.y + 66);
    ctx.textBaseline = "alphabetic";
    ctx.restore();

    if (isCorrectTarget) {
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = "#fff7a8";
      ctx.font = "bold 17px Arial";
      ctx.textAlign = "center";
      ctx.fillText("AQUI", zone.x + zone.w / 2, zone.y + zone.h + 18);
      ctx.restore();
    }
  });
}

function shade(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawItems() {
  items.forEach((item) => {
    const bob = Math.sin(ambientTime * 2.6 + item.phase) * 3;
    const x = item.x + item.w / 2;
    const y = item.y + item.h / 2 + bob;
    ctx.save();
    drawSoftEllipse(x, y + item.h * 0.38, item.w * 0.36, 4, "rgba(16,32,51,0.18)");
    fillRoundedRect(x - item.w * 0.34, y - item.h * 0.32, item.w * 0.68, item.h * 0.64, 6, item.color);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(x - item.w * 0.18, y - item.h * 0.2, item.w * 0.1, item.h * 0.34);
    ctx.strokeStyle = shade(item.color, -36);
    ctx.lineWidth = 2;
    ctx.strokeRect(x - item.w * 0.34, y - item.h * 0.32, item.w * 0.68, item.h * 0.64);
    ctx.restore();
  });
}

function currentPhase() {
  return phaseConfigs[Math.min(level - 1, phaseConfigs.length - 1)];
}

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    return {
      unlockedLevel: Math.max(1, Math.min(phaseConfigs.length, parsed.unlockedLevel || 1)),
      bestScores: Array.isArray(parsed.bestScores) ? parsed.bestScores : [],
      audioMuted: Boolean(parsed.audioMuted)
    };
  } catch {
    return { unlockedLevel: 1, bestScores: [], audioMuted: false };
  }
}

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch {
    // Progress save is optional; the game should keep working if storage is blocked.
  }
}

function completeLevelSave(levelNumber, points) {
  const index = levelNumber - 1;
  saveData.bestScores[index] = Math.max(saveData.bestScores[index] || 0, points);
  saveData.unlockedLevel = Math.max(saveData.unlockedLevel, Math.min(phaseConfigs.length, levelNumber + 1));
  saveProgress();
  renderPhaseCards();
}

function renderPhaseCards() {
  if (!phaseCardsEl) return;
  document.body.classList.toggle("is-playing", running);
  if (phaseSelectHintEl) {
    phaseSelectHintEl.textContent = running ? "Conclua ou reinicie a fase atual" : "Escolha uma área liberada";
  }

  phaseCardsEl.innerHTML = phaseConfigs.map((phase, index) => {
    const levelNumber = index + 1;
    const locked = levelNumber > saveData.unlockedLevel;
    const disabled = locked || running;
    const active = levelNumber === selectedLevel;
    const best = saveData.bestScores[index] || 0;
    return `
      <button class="phase-card ${active ? "active" : ""} ${locked ? "locked" : ""} ${running && !locked ? "in-play" : ""}" data-phase="${levelNumber}" type="button" ${disabled ? "disabled" : ""}>
        <span>Fase ${levelNumber}</span>
        <strong>${phase.name}</strong>
        <small>${locked ? "Bloqueada" : running ? "Em andamento" : `Recorde ${best}`}</small>
      </button>
    `;
  }).join("");
}

function setLesson(text) {
  if (lessonTextEl) lessonTextEl.textContent = text;
}

function ensureAudio() {
  if (audioCtx || audioMuted) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioCtx = new AudioContext();
}

function playTone(frequency, duration = 0.08, type = "sine", volume = 0.06) {
  if (audioMuted) return;
  ensureAudio();
  if (!audioCtx) return;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration + 0.02);
}

function playSound(kind) {
  if (kind === "pickup") {
    playTone(660, 0.07, "triangle", 0.045);
    window.setTimeout(() => playTone(880, 0.06, "triangle", 0.035), 45);
  } else if (kind === "success") {
    playTone(523, 0.08, "sine", 0.05);
    window.setTimeout(() => playTone(784, 0.09, "sine", 0.055), 70);
    window.setTimeout(() => playTone(1046, 0.12, "sine", 0.045), 140);
  } else if (kind === "error") {
    playTone(170, 0.16, "sawtooth", 0.045);
  } else if (kind === "boom") {
    playTone(72, 0.22, "sawtooth", 0.08);
    window.setTimeout(() => playTone(44, 0.18, "square", 0.045), 40);
  } else if (kind === "level") {
    playTone(392, 0.08, "triangle", 0.045);
    window.setTimeout(() => playTone(587, 0.08, "triangle", 0.05), 75);
    window.setTimeout(() => playTone(784, 0.12, "triangle", 0.045), 150);
  }
}

function drawHazards() {
  drawBombSprite();
  hazards.forEach((hazard) => {
    const pulse = 1 + Math.sin(ambientTime * 6.25 + hazard.phase) * 0.035;
    const cx = hazard.x + hazard.w / 2;
    const cy = hazard.y + hazard.h / 2;
    const wobble = Math.sin(ambientTime * 9 + hazard.phase) * 0.07;
    const alarm = 0.5 + Math.sin(ambientTime * 7 + hazard.phase) * 0.5;

    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20, 41 * pulse, 13 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.12 + alarm * 0.08;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 42 * pulse, 32 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.08 + alarm * 0.06;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(cx, cy, 48 + alarm * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wobble);
    ctx.scale(pulse, pulse);
    ctx.drawImage(bombSprite, -56, -56);

    const sparkX = 31 + Math.sin(ambientTime * 11 + hazard.phase) * 2.4;
    const sparkY = -22 + Math.cos(ambientTime * 9 + hazard.phase) * 2;
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      const radius = i % 2 === 0 ? 7 : 3;
      const x = sparkX + Math.cos(angle + ambientTime * 7) * radius;
      const y = sparkY + Math.sin(angle + ambientTime * 7) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPlayerFast() {
  const phase = player.walkCycle;
  const walk = player.walking ? 1 : 0;
  const stride = Math.sin(phase) * walk;
  const px = player.x;
  const py = player.y + (player.walking ? Math.abs(Math.sin(phase)) * -1.5 : 0);
  const centerX = px + player.w / 2;
  const alpha = player.invincible > 0 ? 0.55 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  drawSoftEllipse(centerX, player.y + player.h + 1, 25, 7, "rgba(16,32,51,0.22)");

  ctx.strokeStyle = "#1d3b55";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centerX - 7, py + 39);
  ctx.lineTo(centerX - 11 + stride * 6, py + 57);
  ctx.moveTo(centerX + 7, py + 39);
  ctx.lineTo(centerX + 11 - stride * 6, py + 57);
  ctx.stroke();

  ctx.fillStyle = "#149660";
  fillRoundedRect(centerX - 15, py + 20, 30, 26, 8, "#149660");
  ctx.fillStyle = "#eeb98f";
  ctx.beginPath();
  ctx.arc(centerX, py + 12, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#17231f";
  ctx.beginPath();
  ctx.ellipse(centerX, py + 3, 14, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#243042";
  ctx.beginPath();
  ctx.arc(centerX - 4, py + 12, 1.8, 0, Math.PI * 2);
  ctx.arc(centerX + 4, py + 12, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#243042";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(centerX, py + 17, 4.4, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.strokeStyle = "#eeb98f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(centerX - 13, py + 27);
  ctx.lineTo(centerX - 21 - stride * 5, py + 39);
  ctx.moveTo(centerX + 13, py + 27);
  ctx.lineTo(centerX + 21 + stride * 5, py + 39);
  ctx.stroke();

  if (carried) {
    fillRoundedRect(centerX - 18, py - 30, 36, 25, 6, carried.color);
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillRect(centerX - 8, py - 24, 6, 14);
  }
  ctx.restore();
}

function drawParticles() {
  particles.forEach((particle) => {
    ctx.save();
    const progress = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = progress;
    const size = (particle.size || 4) * (0.55 + (1 - progress) * 0.9);
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation || 0);
    if (particle.shape === "smoke") {
      ctx.globalAlpha = progress * 0.32;
      ctx.fillStyle = "rgba(55,65,81,0.55)";
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 2.1, size * 1.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.shape === "spark") {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.6);
      ctx.lineTo(size * 0.45, 0);
      ctx.lineTo(0, size * 1.6);
      ctx.lineTo(-size * 0.45, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      drawSoftEllipse(0, 0, size, size * 0.75, particle.color);
    }
    ctx.restore();
  });
}

function drawExplosions() {
  explosions.forEach((explosion) => {
    const progress = 1 - explosion.life / explosion.maxLife;
    const alpha = Math.max(0, 1 - progress);
    const radius = 18 + progress * 92;

    ctx.save();
    ctx.translate(explosion.x, explosion.y);

    ctx.globalAlpha = alpha * 0.86;
    ctx.fillStyle = "rgba(255,247,168,0.62)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.38;
    ctx.fillStyle = "rgba(249,115,22,0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.76, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(explosion.phase + progress * 3.5);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#fff7a8";
    ctx.lineWidth = Math.max(1, 7 * alpha);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = Math.max(1, 4 * alpha);
    ctx.beginPath();
    for (let i = 0; i < 14; i += 1) {
      const angle = (Math.PI * 2 * i) / 14;
      const inner = radius * 0.28;
      const outer = radius * (0.72 + (i % 2) * 0.18);
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    }
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.28;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 9 * alpha;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawDeliveryBursts() {
  deliveryBursts.forEach((burst) => {
    const progress = 1 - burst.life / burst.maxLife;
    const alpha = Math.max(0, 1 - progress);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(burst.x, burst.y);
    ctx.rotate(burst.phase + progress * Math.PI);
    ctx.strokeStyle = burst.color;
    ctx.lineWidth = 4 * alpha;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + progress * 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.42;
    ctx.fillStyle = burst.color;
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const radius = 18 + progress * 72;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.75, 5, 2, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawMotionTrails() {
  motionTrails.forEach((trail) => {
    const progress = Math.max(0, trail.life / trail.maxLife);
    const cx = trail.x + PLAYER_W / 2;
    const cy = trail.y + PLAYER_H / 2 + 6;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = progress * 0.14;
    ctx.translate(cx, cy);
    ctx.rotate((trail.facingAngle || 0) * 0.18);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
    glow.addColorStop(0, trail.color);
    glow.addColorStop(0.45, "rgba(183,247,208,0.34)");
    glow.addColorStop(1, "rgba(183,247,208,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17 * progress, 31 * progress, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawScreenEffects() {
  if (screenFlash <= 0 && slowMoTime <= 0) return;
  ctx.save();
  if (screenFlash > 0) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = Math.min(0.42, screenFlash * 0.36);
    ctx.fillStyle = "#fff7a8";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
  if (slowMoTime > 0) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.min(0.18, slowMoTime * 0.9);
    const shock = ctx.createRadialGradient(player.x + player.w / 2, player.y + player.h / 2, 30, player.x + player.w / 2, player.y + player.h / 2, 360);
    shock.addColorStop(0, "rgba(255,255,255,0)");
    shock.addColorStop(0.55, "rgba(239,68,68,0.18)");
    shock.addColorStop(1, "rgba(15,23,42,0.28)");
    ctx.fillStyle = shock;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
  ctx.restore();
}

function drawTip() {
  ctx.save();
  ctx.shadowColor = "rgba(24,32,42,0.18)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  fillGradientRoundedRect(TIP_BOX.x, TIP_BOX.y, TIP_BOX.w, TIP_BOX.h, 8, "rgba(255,253,238,0.96)", "rgba(235,252,230,0.95)");
  strokeRoundedRect(TIP_BOX.x, TIP_BOX.y, TIP_BOX.w, TIP_BOX.h, 8, "rgba(36,113,80,0.28)", 2);
  ctx.restore();
  ctx.fillStyle = "#14523e";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "left";
  const text = carried
    ? `Levando ${carried.name}: entre no círculo da lixeira de ${carried.type}.`
    : "Pegue um resíduo e leve para a lixeira correta.";
  ctx.fillText(text, TIP_BOX.x + 16, TIP_BOX.y + 36);
}

function draw() {
  if (!player || !items || !hazards) return;
  ctx.save();
  if (shakeTime > 0) {
    const shakeEase = shakeTime * shakeTime;
    ctx.translate(
      Math.sin(ambientTime * 92) * shakeStrength * shakeEase + Math.sin(ambientTime * 43) * shakeStrength * 0.35 * shakeEase,
      Math.cos(ambientTime * 88) * shakeStrength * shakeEase + Math.sin(ambientTime * 57) * shakeStrength * 0.25 * shakeEase
    );
  }
  drawBackground();
  drawBins();
  drawItems();
  drawMotionTrails();
  drawHazards();
  drawExplosions();
  drawDeliveryBursts();
  drawParticles();
  drawPlayerFast();
  drawFloatingTexts();
  drawTip();
  drawScreenEffects();
  ctx.restore();
}

function loop(now) {
  if (!running) return;
  fpsFrames += 1;
  if (now - fpsLastTime >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
    fpsFrames = 0;
    fpsLastTime = now;
    if (showPerf) fpsMeter.textContent = `${fps} FPS`;
  }
  const rawDt = Math.min(0.033, (now - lastTime) / 1000);
  const dt = slowMoTime > 0 ? rawDt * 0.45 : rawDt;
  lastTime = now;
  if (!paused) {
    movePlayer(dt);
    updateWorld(dt);
  }
  draw();
  animationId = requestAnimationFrame(loop);
}

function drawFloatingTexts() {
  floatingTexts.forEach((floatText) => {
    const progress = 1 - floatText.life / floatText.maxLife;
    const alpha = Math.max(0, floatText.life / floatText.maxLife);
    const scale = 0.82 + Math.sin(Math.min(1, progress) * Math.PI) * 0.34;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(floatText.x, floatText.y);
    ctx.scale(scale, scale);
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(16,32,51,0.56)";
    ctx.strokeText(floatText.text, 0, 0);
    ctx.fillStyle = floatText.color;
    ctx.fillText(floatText.text, 0, 0);
    ctx.restore();
  });
}

function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
}

function isMovementKey(key) {
  return ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key);
}

function syncMoveButtons() {
  moveButtons.forEach((button) => {
    button.classList.toggle("active", heldDirections.has(button.dataset.move));
  });
}

function resetJoystick() {
  joystickInput.active = false;
  joystickInput.x = 0;
  joystickInput.y = 0;
  joystickInput.pointerId = null;
  if (moveJoystickKnob) {
    moveJoystickKnob.style.transform = "translate(-50%, -50%)";
  }
  moveJoystick?.classList.remove("active");
}

function updateJoystickFromPointer(event) {
  if (!moveJoystick || !moveJoystickKnob) return;

  const rect = moveJoystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxDistance = rect.width * 0.34;
  const rawX = event.clientX - centerX;
  const rawY = event.clientY - centerY;
  const distance = Math.hypot(rawX, rawY);
  const clampedDistance = Math.min(maxDistance, distance);
  const angle = Math.atan2(rawY, rawX);
  const knobX = distance === 0 ? 0 : Math.cos(angle) * clampedDistance;
  const knobY = distance === 0 ? 0 : Math.sin(angle) * clampedDistance;

  joystickInput.active = distance > 8;
  joystickInput.x = distance === 0 ? 0 : knobX / maxDistance;
  joystickInput.y = distance === 0 ? 0 : knobY / maxDistance;
  moveJoystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
  moveJoystick.classList.toggle("active", joystickInput.active);
}

function renderGameToText() {
  return JSON.stringify({
    coordinateSystem: "Canvas 960x640, origin at top-left, x increases right, y increases down.",
    mode: running ? (paused ? "paused" : "playing") : "menu",
    level,
    score,
    timeLeft: Math.max(0, timeLeft),
    progress: `${delivered}/${targetCount}`,
    carried: carried ? { name: carried.name, type: carried.type } : null,
    player: player ? { x: Math.round(player.x), y: Math.round(player.y), w: player.w, h: player.h } : null,
    items: (items || []).slice(0, 8).map((item) => ({
      name: item.name,
      type: item.type,
      x: Math.round(item.x),
      y: Math.round(item.y)
    })),
    hazards: (hazards || []).map((hazard) => ({
      x: Math.round(hazard.x),
      y: Math.round(hazard.y),
      w: hazard.w,
      h: hazard.h
    }))
  });
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms = 1000 / 60) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let step = 0; step < steps; step += 1) {
    if (!paused) {
      movePlayer(1 / 60);
      updateWorld(1 / 60);
    }
  }
  draw();
  updateHud();
};

window.addEventListener("keydown", (event) => {
  const key = normalizeKey(event.key);
  if (key === "p") {
    togglePause();
    event.preventDefault();
    return;
  }
  if (isMovementKey(key)) {
    keys.add(key);
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(normalizeKey(event.key));
});

window.addEventListener("blur", () => {
  keys.clear();
  heldDirections.clear();
  syncMoveButtons();
  resetJoystick();
});

moveButtons.forEach((button) => {
  const direction = button.dataset.move;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    heldDirections.add(direction);
    syncMoveButtons();
  });

  button.addEventListener("pointerup", () => {
    heldDirections.delete(direction);
    syncMoveButtons();
  });

  button.addEventListener("pointercancel", () => {
    heldDirections.delete(direction);
    syncMoveButtons();
  });

  button.addEventListener("lostpointercapture", () => {
    heldDirections.delete(direction);
    syncMoveButtons();
  });
});

moveJoystick?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  moveJoystick.setPointerCapture(event.pointerId);
  joystickInput.pointerId = event.pointerId;
  updateJoystickFromPointer(event);
});

moveJoystick?.addEventListener("pointermove", (event) => {
  if (joystickInput.pointerId !== event.pointerId) return;
  event.preventDefault();
  updateJoystickFromPointer(event);
});

moveJoystick?.addEventListener("pointerup", (event) => {
  if (joystickInput.pointerId !== event.pointerId) return;
  resetJoystick();
});

moveJoystick?.addEventListener("pointercancel", resetJoystick);
moveJoystick?.addEventListener("lostpointercapture", resetJoystick);

startBtn.addEventListener("click", newGame);
restartBtn.addEventListener("click", newGame);
pauseBtn.addEventListener("click", togglePause);
audioBtn.addEventListener("click", () => {
  audioMuted = !audioMuted;
  saveData.audioMuted = audioMuted;
  saveProgress();
  audioBtn.textContent = audioMuted ? "Som: Off" : "Som: On";
  if (!audioMuted) {
    ensureAudio();
    playSound("pickup");
  }
});
perfBtn.addEventListener("click", () => {
  showPerf = !showPerf;
  fpsMeter.hidden = !showPerf;
  perfBtn.classList.toggle("active", showPerf);
});
overlay.addEventListener("click", (event) => {
  const action = event.target?.dataset?.action;
  if (action === "resume") togglePause();
  if (action === "new-game") newGame();
  if (action === "next-level") {
    running = true;
    overlay.classList.add("hidden");
    nextLevel();
    lastTime = performance.now();
    timerId = setInterval(tickClock, 1000);
    animationId = requestAnimationFrame(loop);
  }
});
phaseCardsEl?.addEventListener("click", (event) => {
  if (running) return;
  const target = event.target;
  const button = target instanceof Element ? target.closest(".phase-card") : null;
  if (!button || button.disabled) return;
  selectedLevel = Number(button.dataset.phase);
  renderPhaseCards();
  const phase = phaseConfigs[selectedLevel - 1];
  setLesson(`${phase.name}: ${phase.mission}.`);
});
player = makePlayer();
selectedLevel = Math.min(selectedLevel, saveData.unlockedLevel);
audioBtn.textContent = audioMuted ? "Som: Off" : "Som: On";
renderPhaseCards();
items = makeItems(8);
hazards = makeHazards(2);
score = 0;
level = 1;
timeLeft = 60;
carried = null;
delivered = 0;
targetCount = 8;
combo = 1;
floatingTexts = [];
explosions = [];
deliveryBursts = [];
shakeTime = 0;
shakeStrength = 0;
running = false;
setLesson("Separe cada resíduo pela cor da lixeira.");
updateHud();
draw();
