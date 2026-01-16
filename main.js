// Stick Wars 2D prototype with p5.js. Undergrad-friendly, clear comments.

// ---- Game constants ----
const CANVAS_W = 1200;
const CANVAS_H = 600;
const GROUND_Y = 420;
const PLAYER_X = 120;
const ENEMY_X = CANVAS_W - 140;

// 10 unit archetypes (simplified stats)
const UNIT_TYPES = [
  { key: 'worker', name: 'Worker', cost: 40, hp: 20, dmg: 3, spd: 1.4 },
  { key: 'club', name: 'Clubman', cost: 60, hp: 35, dmg: 6, spd: 1.2 },
  { key: 'spear', name: 'Spearman', cost: 70, hp: 40, dmg: 7, spd: 1.1 },
  { key: 'arch', name: 'Archer', cost: 80, hp: 30, dmg: 9, spd: 1.0, range: 140 },
  { key: 'sword', name: 'Swordsman', cost: 90, hp: 55, dmg: 10, spd: 1.3 },
  { key: 'heavy', name: 'Heavy', cost: 110, hp: 80, dmg: 12, spd: 0.9 },
  { key: 'horse', name: 'Horseman', cost: 120, hp: 65, dmg: 11, spd: 1.6 },
  { key: 'mage', name: 'Mage', cost: 140, hp: 45, dmg: 16, spd: 1.0, range: 120 },
  { key: 'giant', name: 'Giant', cost: 180, hp: 150, dmg: 24, spd: 0.7 },
  { key: 'assassin', name: 'Assassin', cost: 130, hp: 40, dmg: 18, spd: 2.0 },
];

// ---- State ----
let gold = 0;
let income = 1; // gold per second
let mineLevel = 1;
let lastIncomeTime = 0;
const playerUnits = [];
const enemyUnits = [];
let playerBaseHP = 100;
let enemyBaseHP = 100;

// ---- UI elements ----
const hpPlayerEl = document.getElementById('hp-player');
const hpEnemyEl = document.getElementById('hp-enemy');
const goldFillEl = document.getElementById('gold-fill');
const goldTextEl = document.getElementById('gold-text');
const incomeEl = document.getElementById('income');
const mineLevelEl = document.getElementById('mine-level');
const buttonsEl = document.getElementById('buttons');
const logEl = document.getElementById('log');

function log(msg) {
  const p = document.createElement('div');
  p.textContent = msg;
  logEl.prepend(p);
}

// ---- p5 setup/draw ----
let lastTime = 0;
let sprites = {};

function preload() {
  // Simple colored rectangles will be drawn; no image assets needed.
}

function setup() {
  const c = createCanvas(CANVAS_W, CANVAS_H);
  c.parent('canvas-holder');
  frameRate(60);
  initButtons();
  lastIncomeTime = millis();
  log('Welcome to Stick Wars. Train units or invest in mining.');
}

function draw() {
  background('#0f172a');
  drawGround();
  const now = millis();
  const dt = (now - lastTime) / 1000 || 0;
  lastTime = now;

  handleIncome(now);
  updateUnits(playerUnits, enemyUnits, dt, 1);
  updateUnits(enemyUnits, playerUnits, dt, -1);
  resolveCombat(playerUnits, enemyUnits);
  resolveCombat(enemyUnits, playerUnits);
  drawBases();
  drawUnits(playerUnits, '#22c55e');
  drawUnits(enemyUnits, '#f87171');
  updateHUD();
  checkWin();
}

// ---- Income ----
function handleIncome(now) {
  if (now - lastIncomeTime > 1000) {
    gold += income;
    lastIncomeTime = now;
  }
}

// ---- Units ----
class Unit {
  constructor(type, x, facing) {
    this.type = type;
    this.x = x;
    this.y = GROUND_Y - 20;
    this.hp = type.hp;
    this.facing = facing; // 1 for player->right, -1 for enemy->left
    this.range = type.range || 24;
    this.attackCooldown = 0;
    this.state = 'advancing';
  }
}

function spawnUnit(isPlayer, typeKey) {
  const type = UNIT_TYPES.find(u => u.key === typeKey);
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

// ---- AI ----
function enemyAI() {
  const roll = random();
  const tier = enemyUnits.length < 4 ? 0.5 : 0.8;
  const choices = UNIT_TYPES.filter(u => u.cost <= (tier === 0.5 ? 90 : 150));
  const pick = random(choices);
  spawnUnit(false, pick.key);
}
setInterval(enemyAI, 2200);

// ---- Mining investment ----
function investMining() {
  const cost = 50 * mineLevel;
  if (gold < cost) return log('Not enough gold to invest.');
  gold -= cost;
  mineLevel += 1;
  income += 0.5;
  log(`Invested in mining. Income now +${income.toFixed(1)}/s.`);
}

// ---- Updates ----
function updateUnits(myUnits, otherUnits, dt, dir) {
  myUnits.forEach(u => {
    if (u.hp <= 0) return;
    // If enemy in range, attack
    const target = otherUnits.find(o => o.hp > 0 && Math.abs(o.x - u.x) <= u.range);
    if (target) {
      u.state = 'fighting';
      u.attackCooldown -= dt;
      if (u.attackCooldown <= 0) {
        target.hp -= u.type.dmg;
        u.attackCooldown = 0.7;
      }
    } else {
      u.state = 'advancing';
      u.x += u.type.spd * dir;
    }

    // Attack base if reached
    if (dir === 1 && u.x >= ENEMY_X) {
      enemyBaseHP -= u.type.dmg * dt * 0.7;
    }
    if (dir === -1 && u.x <= PLAYER_X) {
      playerBaseHP -= u.type.dmg * dt * 0.7;
    }
  });

  // Remove dead
  for (let i = myUnits.length - 1; i >= 0; i--) {
    if (myUnits[i].hp <= 0) myUnits.splice(i, 1);
  }
}

function resolveCombat(myUnits, otherUnits) {
  // Already handled in update via attack; here we cleanup dead targets for accuracy
  for (let i = otherUnits.length - 1; i >= 0; i--) {
    if (otherUnits[i].hp <= 0) otherUnits.splice(i, 1);
  }
}

// ---- Drawing ----
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
  rect(PLAYER_X - 20, GROUND_Y - 60, 60, 60, 8);
  fill('#f87171');
  rect(ENEMY_X - 40, GROUND_Y - 60, 60, 60, 8);
}

function drawUnits(list, color) {
  list.forEach(u => {
    const h = map(u.hp, 0, u.type.hp, 10, 30);
    const w = 12;
    fill(color);
    rect(u.x - w/2, u.y - h, w, h, 4);
    // weapon tip for style
    stroke(255);
    strokeWeight(2);
    line(u.x, u.y - h, u.x + (u.facing*8), u.y - h - 10);
    noStroke();
  });
}

// ---- HUD ----
function updateHUD() {
  hpPlayerEl.textContent = Math.max(0, playerBaseHP).toFixed(0);
  hpEnemyEl.textContent = Math.max(0, enemyBaseHP).toFixed(0);
  goldTextEl.textContent = `Gold: ${Math.floor(gold)}`;
  goldFillEl.style.width = `${Math.min(100, gold)}%`;
  incomeEl.textContent = `+${income.toFixed(1)}/s`;
  mineLevelEl.textContent = mineLevel;
}

// ---- Win/Lose ----
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

// ---- UI buttons ----
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
