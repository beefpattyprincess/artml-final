let rooms = [];
let idx = 0;
let dataLoaded = false;
let particles = [];
let time = 0;

function preload() {
  Papa.parse('data.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: res => {
      rooms = res.data.filter(r => Number.isFinite(r["Temperature (C)"]));
      console.log('Loaded rooms:', rooms.length);
      dataLoaded = rooms.length > 0;
    },
    error: err => console.error('CSV load error', err)
  });
}

function setup() {
  createCanvas(720, 720).parent('canvas-holder');
  noStroke();
  rectMode(CENTER);
}

function draw() {
  if (!dataLoaded) return;

  background(18);
  const room = rooms[idx];
  const t = room["Temperature (C)"],
        l = room["Light Level (Lux)"],
        s = room["Sound Level (dB)"],
        h = room["Humidity (%)"];

  generatePortrait(t, l, s, h);
  time += deltaTime / 1000;
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    idx = (idx + 1) % rooms.length;
    time = 0;
    particles = [];
    return false;  // prevent browser scroll
  }
  if (keyCode === LEFT_ARROW) {
    idx = (idx - 1 + rooms.length) % rooms.length;
    time = 0;
    particles = [];
    return false;
  }
}

function generatePortrait(t, l, s, h) {
  colorMode(HSB, 360, 100, 100, 100);
  const tempHue    = map(t, 15, 35, 200, 0);
  const glowSize   = map(l, 100, 800, 50, width * 0.8);
  const pulseSpeed = map(s, 10, 60, 0.5, 3);
  const pulseAmt   = sin(time * pulseSpeed) * 30;

  // layered glows
  for (let layer = 0; layer < 3; layer++) {
    const offset = layer * 120;
    for (let rGrad = glowSize; rGrad > 0; rGrad -= 15) {
      const alpha = map(rGrad, glowSize, 0, 80, 0);
      const hue   = (tempHue + offset + sin(time + rGrad * 0.02)*15)%360;
      fill(hue, 80, map(rGrad, glowSize, 0, 90, 0), alpha);
      ellipse(width/2, height/2, (rGrad + pulseAmt*(layer+1))*2);
    }
  }

  // humidity rings
  const rings = floor(map(h, 20, 100, 3, 15));
  for (let layer = 0; layer < 3; layer++) {
    const layerOffset = layer*120;
    stroke((tempHue+layerOffset)%360, 40, 90, 30);
    noFill();
    for (let i=1; i<=rings; i++) {
      const radius = i*(width*0.4)/rings;
      const wobble = sin(time*(1.5+layer*0.5) + i*0.5)*8;
      const rotation = time*(0.3 + i*0.15 + layer*0.1);
      strokeWeight(random(0.5,3));
      push();
        translate(width/2, height/2);
        rotate(rotation);
        ellipse(0,0,(radius+wobble)*2);
      pop();
    }
  }
  noStroke();

  // particles
  const particleCount = floor(map(s,10,60,50,200));
  const speed = map(s,10,60,0.3,3.0);
  for (let i=particles.length-1; i>=0; i--) {
    particles[i].update(speed);
    particles[i].display(tempHue);
    if (particles[i].isDead()) particles.splice(i,1);
  }
  while (particles.length < particleCount) {
    particles.push(new Particle(random()<0.3));
  }

  // light beams
  const beamCount = floor(map(l,100,800,3,8));
  for (let i=0; i<beamCount; i++) {
    const angle = (TWO_PI/beamCount)*i + time*0.5;
    const len   = width*0.4;
    const x1 = width/2 + cos(angle)*len*0.2;
    const y1 = height/2 + sin(angle)*len*0.2;
    const x2 = width/2 + cos(angle)*len;
    const y2 = height/2 + sin(angle)*len;
    stroke(tempHue,70,90,30);
    strokeWeight(map(l,100,800,1,4));
    line(x1,y1,x2,y2);
  }

  colorMode(RGB);
  fill(255,240);
  textAlign(CENTER);
  textSize(14);
  text(
    `T: ${t.toFixed(1)}°C  |  Lux: ${l.toFixed(0)}  |  dB: ${s.toFixed(0)}  |  Hum: ${h.toFixed(0)}%`,
    width/2, height - 28
  );
}

class Particle {
  constructor(isSpecial=false) {
    this.isSpecial = isSpecial;
    this.reset();
  }
  reset() {
    this.ang = random(TWO_PI);
    this.rad = random(width*0.05, width*0.4);
    this.x = width/2 + cos(this.ang)*this.rad;
    this.y = height/2 + sin(this.ang)*this.rad;
    this.sz = this.isSpecial ? random(4,12) : random(2,6);
    this.life = 255;
    this.speed = random(0.5,2);
    this.oscAmt = random(2,8);
  }
  update(baseSpeed) {
    this.ang += 0.005 * baseSpeed * this.speed;
    this.rad += sin(time + this.ang)*this.oscAmt;
    this.x = width/2 + cos(this.ang)*this.rad;
    this.y = height/2 + sin(this.ang)*this.rad;
    this.life -= this.isSpecial ? 0.5 : 1;
  }
  display(hue) {
    if (this.isSpecial) {
      const pulse = sin(time*2)*2;
      fill(hue,70,100,this.life);
      ellipse(this.x,this.y,this.sz + pulse);
      fill((hue+180)%360,70,100,this.life*0.5);
      ellipse(this.x,this.y,this.sz*0.5 + pulse);
    } else {
      fill(hue,50,100,this.life);
      ellipse(this.x,this.y,this.sz);
    }
  }
  isDead() {
    return this.life < 0;
  }
}
