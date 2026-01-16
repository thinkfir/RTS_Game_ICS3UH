// Stick Wars 2D with p5.js. Simple, commented, undergrad-friendly.

// Canvas and layout
const CANVAS_W = 1366;
const CANVAS_H = 607;
const GROUND_Y = 430;
const PLAYER_X = 80;
const ENEMY_X = CANVAS_W - 140;

// Economy & bases
let gold = 20;
let income = 1; // gold per second
let mineLevel = 1;
let playerBaseHP = 400;
let enemyBaseHP = 400;

// Timing helpers
let lastIncomeMs = 0;
let lastFrameMs = 0;
let enemySpawnMs = 0;

// Unit definitions (10 types)
const UNIT_TYPES = [
  { key: 'worker', name: 'Worker', cost: 20, hp: 30, dmg: 4, spd: 1.4 },
  { key: 'club', name: 'Clubman', cost: 40, hp: 45, dmg: 6, spd: 1.2 },
  { key: 'spear', name: 'Spearman', cost: 55, hp: 55, dmg: 8, spd: 1.1 },
  { key: 'arch', name: 'Archer', cost: 65, hp: 40, dmg: 10, spd: 1.0, range: 140 },
  { key: 'sword', name: 'Swordsman', cost: 75, hp: 70, dmg: 11, spd: 1.25 },
  { key: 'heavy', name: 'Heavy', cost: 95, hp: 95, dmg: 13, spd: 0.9 },
  { key: 'horse', name: 'Horseman', cost: 110, hp: 80, dmg: 14, spd: 1.6 },
  { key: 'mage', name: 'Mage', cost: 125, hp: 55, dmg: 18, spd: 1.0, range: 120 },
  { key: 'giant', name: 'Giant', cost: 150, hp: 180, dmg: 26, spd: 0.7 },
  { key: 'assassin', name: 'Assassin', cost: 130, hp: 50, dmg: 20, spd: 2.0 },
];

// Collections
const playerUnits = [];
const enemyUnits = [];

// UI elements
const hpPlayerEl = document.getElementById('hp-player');
const hpEnemyEl = document.getElementById('hp-enemy');
const goldFillEl = document.getElementById('gold-fill');
const goldTextEl = document.getElementById('gold-text');
const incomeEl = document.getElementById('income');
const mineLevelEl = document.getElementById('mine-level');
const buttonsEl = document.getElementById('buttons');
const logEl = document.getElementById('log');

function log(msg) {
  const row = document.createElement('div');
  row.textContent = msg;
  logEl.prepend(row);
}

// p5 lifecycle
function setup() {
  const c = createCanvas(CANVAS_W, CANVAS_H);
  c.parent('canvas-holder');
  frameRate(60);
  initButtons();
  lastIncomeMs = millis();
  lastFrameMs = millis();
  enemySpawnMs = millis();
  log('Stick Wars loaded. Train units or invest in mining.');
}

function draw() {
  const now = millis();
  const dt = (now - lastFrameMs) / 1000;
  lastFrameMs = now;

  background('#0f172a');
  drawGround();

  handleIncome(now);
  handleEnemyAI(now);

  updateUnits(playerUnits, enemyUnits, dt, 1);
  updateUnits(enemyUnits, playerUnits, dt, -1);

  drawBases();
  drawUnits(playerUnits, '#22c55e');
  drawUnits(enemyUnits, '#f87171');

  updateHUD();
  checkWin();
}

// Economy
function handleIncome(nowMs) {
  if (nowMs - lastIncomeMs >= 1000) {
    gold += income;
    lastIncomeMs = nowMs;
  }
}

function investMining() {
  const cost = 50 * mineLevel;
  if (gold < cost) return log('Not enough gold to invest.');
  gold -= cost;
  mineLevel += 1;
  income += 0.6;
  log(`Invested in mining. Income +${income.toFixed(1)}/s (lvl ${mineLevel}).`);
}

// Units
class Unit {
  constructor(type, x, facing) {
    this.type = type;
    this.x = x;
    this.y = GROUND_Y - 24;
    this.hp = type.hp;
    this.facing = facing; // 1 player -> right, -1 enemy -> left
    this.range = type.range || 26;
    this.cooldown = 0;
    this.state = 'advancing';
  }
}

function spawnUnit(isPlayer, key) {
  const type = UNIT_TYPES.find(t => t.key === key);
  if (!type) return;
  if (isPlayer) {
    if (gold < type.cost) return log('Not enough gold.');
    gold -= type.cost;
    playerUnits.push(new Unit(type, PLAYER_X + 40, 1));
    log(`Trained ${type.name}.`);
  } else {
    enemyUnits.push(new Unit(type, ENEMY_X - 40, -1));
  }
}

// AI
function handleEnemyAI(nowMs) {
  if (nowMs - enemySpawnMs < 1800) return;
  enemySpawnMs = nowMs;
  const budget = 60 + random(90);
  const options = UNIT_TYPES.filter(u => u.cost <= budget);
  if (!options.length) return;
  const pick = random(options);
  spawnUnit(false, pick.key);
}

// Update & combat
function updateUnits(myUnits, otherUnits, dt, dir) {
  myUnits.forEach(u => {
    if (u.hp <= 0) return;
    const target = otherUnits.find(o => o.hp > 0 && Math.abs(o.x - u.x) <= u.range);
    if (target) {
      u.state = 'fighting';
      u.cooldown -= dt;
      if (u.cooldown <= 0) {
        target.hp -= u.type.dmg;
        u.cooldown = 0.7;
      }
    } else {
      u.state = 'advancing';
      u.x += u.type.spd * dir;
    }

    // Base damage if reached
    if (dir === 1 && u.x >= ENEMY_X) enemyBaseHP -= u.type.dmg * dt * 0.8;
    if (dir === -1 && u.x <= PLAYER_X) playerBaseHP -= u.type.dmg * dt * 0.8;
  });

  // cleanup dead
  for (let i = myUnits.length - 1; i >= 0; i--) {
    if (myUnits[i].hp <= 0) myUnits.splice(i, 1);
  }
  for (let i = otherUnits.length - 1; i >= 0; i--) {
    if (otherUnits[i].hp <= 0) otherUnits.splice(i, 1);
  }
}

// Drawing
function drawGround() {
  noStroke();
  fill('#0b1224');
  rect(0, 0, width, height);
  fill('#1f2937');
  rect(0, GROUND_Y, width, height - GROUND_Y);
  fill('#14b8a6');
  rect(0, GROUND_Y, width, 6);
}

function drawBases() {
  fill('#22c55e');
  rect(PLAYER_X - 20, GROUND_Y - 80, 70, 80, 8);
  fill('#f87171');
  rect(ENEMY_X - 40, GROUND_Y - 80, 70, 80, 8);

  // Health bars above bases
  drawBar(PLAYER_X - 30, GROUND_Y - 100, 140, 12, playerBaseHP / 400, '#22c55e');
  drawBar(ENEMY_X - 60, GROUND_Y - 100, 140, 12, enemyBaseHP / 400, '#f87171');
}

function drawUnits(list, color) {
  list.forEach(u => {
    const h = map(u.hp, 0, u.type.hp, 12, 34);
    const w = 14;
    fill(color);
    rect(u.x - w / 2, u.y - h, w, h, 4);
    // weapon
    stroke(255);
    strokeWeight(2);
    line(u.x, u.y - h, u.x + (u.facing * 10), u.y - h - 10);
    noStroke();
  });
}

function drawBar(x, y, w, h, t, col) {
  fill('#0f172a');
  stroke('#1e293b');
  strokeWeight(2);
  rect(x, y, w, h, 6);
  noStroke();
  fill(col);
  rect(x, y, constrain(t, 0, 1) * w, h, 6);
}

// HUD updates
function updateHUD() {
  hpPlayerEl.textContent = Math.max(0, playerBaseHP).toFixed(0);
  hpEnemyEl.textContent = Math.max(0, enemyBaseHP).toFixed(0);
  goldTextEl.textContent = `Gold: ${Math.floor(gold)}`;
  goldFillEl.style.width = `${Math.min(100, (gold / 200) * 100)}%`;
  incomeEl.textContent = `+${income.toFixed(1)}/s`;
  mineLevelEl.textContent = mineLevel;
}

// Win/Loss
function checkWin() {
  if (enemyBaseHP <= 0) {
    noLoop();
    log('You win!');
  }
  if (playerBaseHP <= 0) {
    noLoop();
    log('You lost.');
  }
}

// UI buttons
function initButtons() {
  buttonsEl.innerHTML = '';
  UNIT_TYPES.forEach(t => {
    const btn = document.createElement('button');
    btn.textContent = `${t.name} (-${t.cost})`;
    btn.onclick = () => spawnUnit(true, t.key);
    buttonsEl.appendChild(btn);
  });
  const investBtn = document.createElement('button');
  investBtn.textContent = 'Invest in Mining';
  investBtn.onclick = investMining;
  buttonsEl.appendChild(investBtn);
}
