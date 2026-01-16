
let gold = 10;
let rate = 0.02;
let pSoldierSprite;
function preload(){
  pSoldier = loadImage('pSoldierstand.png');
}
function setup() {
  createCanvas(1366, 607); //Width, Height
  background(255);
  player = { /*player is to check the coordinates by moving around only.*/
    x:50,
    y:50,
    w:50,
    h:50
  }
  ground = {
    x: 0,
    y: 407,
    w: 1366,
    h: 200
  }
  pbase = {
    x: 10,
    y: 207,
    w:100,
    h:200,
    health:400
  }
  ebase = {
    x: 1256,
    y: 207,
    w:100,
    h:200,
    health:400
  }

 // pSoldierSprite = createSprite(mouseX,mouseY,400,400);
  //pSoldierSprite.addImage(pSoldier);
}

function CreateHealthBar(){
  stroke(0,0,0);
  strokeWeight(5);
  fill(255,255,255);
  rect(956,5,400,50)
  rect(10,5,400,50);
  fill(0,255,0);
  rect(10,5,pbase.health,50);
  fill(255,0,0);
  rect(956,5,ebase.health,50);
  textSize(35);
  stroke(0,0,0);
  strokeWeight(5);
  fill(255,255,255);
  text(pbase.health, 175, 43);
  text(ebase.health, 1131, 43);
}



function createGold(){
  if (gold <= 400) {
    gold += rate;
    /*setTimeout(() => {
      gold++;
    },rate);*/
  }
  noFill();
  rect(10,60,401,50);
  fill('gold');
  rect(10, 60, gold, 50);
  text((gold - (gold % 1)), 175, 98);
}

function setStructures() {
  fill(0,171,255);
  rect(pbase.x, pbase.y, pbase.w, pbase.h);
  fill(255,0,0);
  rect(ebase.x, ebase.y, ebase.w, ebase.h);
  fill(0,0,0);
  rect(ground.x, ground.y, ground.w, ground.h);
}

function WASDmovement(entity) {
  if (keyIsDown(87)){ // W
    entity.y -= 5;
  }
  if (keyIsDown(65)){ // A 
    entity.x -= 5;
  }
  if (keyIsDown(83)){ // S
    entity.y += 5;
  }
  if (keyIsDown(68)){ // D 
    entity.x += 5;
  }
}

function arrowMovement(entity) {
  if (keyIsDown(38)){ // W
    entity.y -= 5;
  }
  if (keyIsDown(37)){ // A  
    entity.x -= 5;
  }
  if (keyIsDown(40)){ // S
    entity.y += 5;
  }
  if (keyIsDown(39)){ // D 
    entity.x += 5;
  }
}

function createPlayer(){
  ellipse(player.x, player.y, player.w, player.h);
}

function draw() {
  background(255);
   //pSoldierSprite = createSprite(mouseX,mouseY,1,1);
  background(255);
  CreateHealthBar();
  createGold();
  setStructures();
  drawSprites();
  createPlayer();
  WASDmovement(player);
  
  
  
 
  
}