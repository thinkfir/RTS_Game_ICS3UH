// Stick Wars–style strategy game (p5.js)
// Single-file prototype for a school project
// -------------------------------------------
// Player base (left) vs Enemy base (right)
// Gold auto-generates, units cost gold
// Simple rule-based AI spawns units
// Rock–paper–scissors unit system + brute unit

let playerBase, enemyBase;
let playerUnits = [];
let enemyUnits = [];

let playerGold = 100;
let enemyGold = 100;
let playerIncome = 1;
let enemyIncome = 1;

const BASE_HEALTH = 1000;

// Unit definitions (rock-paper-scissors)
const UNIT_TYPES = {
  sword: { cost: 50, hp: 100, dmg: 12, speed: 1.2, bonus: 'archer' },
  archer: { cost: 60, hp: 70, dmg: 16, speed: 1.0, bonus: 'brute' },
  brute: { cost: 120, hp: 220, dmg: 25, speed: 0.6, bonus: 'sword' }
};

function setup() {
  createCanvas(900, 400);
  playerBase = new Base(50, height / 2, 'player');
  enemyBase = new Base(width - 50, height / 2, 'enemy');
}

function draw() {
  background(220);

  // Gold generation
  if (frameCount % 30 === 0) {
    playerGold += playerIncome;
    enemyGold += enemyIncome;
  }

  drawUI();

  playerBase.draw();
  enemyBase.draw();

  // Update units
  for (let u of playerUnits) u.update(enemyUnits, enemyBase);
  for (let u of enemyUnits) u.update(playerUnits, playerBase);

  // Remove dead units
  playerUnits = playerUnits.filter(u => u.hp > 0);
  enemyUnits = enemyUnits.filter(u => u.hp > 0);

  runEnemyAI();

  checkGameOver();
}

// ---------------- CLASSES ----------------

class Base {
  constructor(x, y, side) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.hp = BASE_HEALTH;
  }

  draw() {
    fill(this.side === 'player' ? 'blue' : 'red');
    rectMode(CENTER);
    rect(this.x, this.y, 40, 80);
    fill(0);
    textAlign(CENTER);
    text(Math.floor(this.hp), this.x, this.y - 50);
  }
}

class Unit {
  constructor(type, side) {
    this.type = type;
    this.side = side;
    let data = UNIT_TYPES[type];
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.dmg = data.dmg;
    this.speed = data.speed;
    this.bonus = data.bonus;
    this.x = side === 'player' ? 90 : width - 90;
    this.y = random(height - 80) + 40;
    this.cooldown = 0;
  }

  update(enemies, enemyBase) {
    // Move forward
    this.x += this.side === 'player' ? this.speed : -this.speed;

    // Attack nearby enemy
    for (let e of enemies) {
      if (abs(this.x - e.x) < 20 && abs(this.y - e.y) < 20) {
        this.attack(e);
        return;
      }
    }

    // Attack base
    if (abs(this.x - enemyBase.x) < 20) {
      if (this.cooldown <= 0) {
        enemyBase.hp -= this.dmg;
        this.cooldown = 30;
      }
    }

    this.cooldown--;
    this.draw();
  }

  attack(enemy) {
    if (this.cooldown <= 0) {
      let damage = this.dmg;
      if (this.bonus === enemy.type) damage *= 1.5;
      enemy.hp -= damage;
      this.cooldown = 30;
    }
  }

  draw() {
    fill(this.side === 'player' ? 'blue' : 'red');
    ellipse(this.x, this.y, 20, 20);
    // HP bar
    fill('green');
    rect(this.x - 10, this.y - 15, 20 * (this.hp / this.maxHp), 3);
  }
}

// ---------------- UI ----------------

function drawUI() {
  fill(180);
  rect(0, 0, width, 40);
  fill(0);
  textAlign(LEFT);
  text(`Gold: ${Math.floor(playerGold)}`, 10, 25);

  let x = 150;
  for (let type in UNIT_TYPES) {
    let cost = UNIT_TYPES[type].cost;
    fill(playerGold >= cost ? 255 : 150);
    rect(x, 10, 80, 20);
    fill(0);
    text(`${type} (${cost})`, x + 5, 25);
    x += 90;
  }

  // Income upgrade
  fill(playerGold >= 100 ? 255 : 150);
  rect(x, 10, 120, 20);
  fill(0);
  text('Income +1 (100)', x + 5, 25);
}

function mousePressed() {
  let x = 150;
  for (let type in UNIT_TYPES) {
    let cost = UNIT_TYPES[type].cost;
    if (mouseX > x && mouseX < x + 80 && mouseY > 10 && mouseY < 30) {
      if (playerGold >= cost) {
        playerGold -= cost;
        playerUnits.push(new Unit(type, 'player'));
      }
    }
    x += 90;
  }

  // Income upgrade
  if (mouseX > x && mouseX < x + 120 && mouseY > 10 && mouseY < 30) {
    if (playerGold >= 100) {
      playerGold -= 100;
      playerIncome += 1;
    }
  }
}

// ---------------- AI ----------------

function runEnemyAI() {
  // Simple rule-based AI
  if (frameCount % 60 !== 0) return;

  if (enemyGold > 150 && enemyUnits.length < playerUnits.length) {
    spawnEnemy('brute');
  } else if (enemyGold > 60) {
    spawnEnemy(random(['sword', 'archer']));
  }

  // Income upgrade
  if (enemyGold > 200 && enemyIncome < 5) {
    enemyGold -= 100;
    enemyIncome += 1;
  }
}

function spawnEnemy(type) {
  let cost = UNIT_TYPES[type].cost;
  if (enemyGold >= cost) {
    enemyGold -= cost;
    enemyUnits.push(new Unit(type, 'enemy'));
  }
}

// ---------------- GAME OVER ----------------

function checkGameOver() {
  if (playerBase.hp <= 0) {
    noLoop();
    alert('You lose');
  }
  if (enemyBase.hp <= 0) {
    noLoop();
    alert('You win');
  }
}
