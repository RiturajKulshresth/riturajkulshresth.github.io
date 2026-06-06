import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Car {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
  speedY: number;
  color: string;
  type: "truck" | "sport" | "standard";
  alarmBlink: boolean;
}

interface FuelCanister {
  x: number;
  y: number;
  size: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  decay: number;
}

export class HighwayGame implements GameEngine {
  private playerLane = 1;
  private playerX = 300;
  private playerY = 320;
  private readonly playerWidth = 24;
  private readonly playerHeight = 42;

  // 3-lane horizontal spacing vectors
  private readonly laneWidth = 70;
  private readonly laneOffsetLeft = 200; // grid centered

  private scrollOffset = 0;
  private score = 0;
  private survivalTimer = 0;
  private elapsedFrames = 0;

  private traffic: Car[] = [];
  private collectibles: FuelCanister[] = [];
  private particles: Particle[] = [];

  private trafficSpawnCooldown = 0;
  private collectibleSpawnCooldown = 0;
  private boostActive = false;

  init(): void {
    this.playerLane = 1;
    this.playerX = this.laneOffsetLeft + this.playerLane * this.laneWidth + this.laneWidth / 2;
    this.playerY = 320;
    this.score = 0;
    this.survivalTimer = 0;
    this.elapsedFrames = 0;
    this.scrollOffset = 0;
    this.traffic = [];
    this.collectibles = [];
    this.particles = [];
    this.trafficSpawnCooldown = 0;
    this.collectibleSpawnCooldown = 0;
    this.boostActive = false;

    // Spawn initial starter traffic
    this.spawnTraffic(0);
  }

  private spawnTraffic(startY = -100) {
    const lane = Math.floor(Math.random() * 3);
    const typeChance = Math.random();
    
    let type: "truck" | "sport" | "standard" = "standard";
    let width = 22;
    let height = 38;
    let speedY = 3.2;
    let color = "rgba(239, 68, 68, 0.9)"; // Red malware standard

    if (typeChance > 0.82) {
      type = "truck";
      width = 24;
      height = 54;
      speedY = 2.0;
      color = "rgba(245, 158, 11, 0.9)"; // Cargo truck orange
    } else if (typeChance < 0.22) {
      type = "sport";
      width = 22;
      height = 38;
      speedY = 5.2; // Speedy fast car
      color = "rgba(217, 70, 239, 0.9)"; // Sports car fuchsia
    }

    const tx = this.laneOffsetLeft + lane * this.laneWidth + (this.laneWidth - width) / 2;
    this.traffic.push({
      x: tx,
      y: startY,
      width,
      height,
      lane,
      speedY,
      color,
      type,
      alarmBlink: Math.random() > 0.7
    });
  }

  private spawnCollectible() {
    const lane = Math.floor(Math.random() * 3);
    const cx = this.laneOffsetLeft + lane * this.laneWidth + this.laneWidth / 2;
    this.collectibles.push({
      x: cx,
      y: -50,
      size: 7,
      active: true
    });
  }

  private createParticles(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2.5 + 1.5,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.02
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed } = input;
    const speedFactor = ctx.speedFactor;

    // Difficulty increases road scroll and speeds dynamically
    const difficultyLevel = Math.floor(this.score / 150); // 0, 1, 2...
    const roadScrollSpeed = (6.0 + difficultyLevel * 1.2) * speedFactor * (this.boostActive ? 1.5 : 1.0);

    // Increase survival score ticking
    this.elapsedFrames += speedFactor;
    this.survivalTimer += speedFactor;
    if (this.survivalTimer >= 40) {
      this.survivalTimer = 0;
      this.score += 2;
      ctx.setScore(this.score);
    }

    // --------------------------------------------
    // Handle horizontal lane jumping / shifting
    // --------------------------------------------
    // Boost activation upon W / Up arrow holds
    this.boostActive = !!(keysPressed["ArrowUp"] || keysPressed["KeyW"]);

    // Key debounce checking for snappy lane switching
    if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
      if (!this.laneKeyCooldown) {
        this.playerLane = Math.max(0, this.playerLane - 1);
        this.laneKeyCooldown = true;
        ctx.playRetroSFX("LAUNCH");
      }
    } else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
      if (!this.laneKeyCooldown) {
        this.playerLane = Math.min(2, this.playerLane + 1);
        this.laneKeyCooldown = true;
        ctx.playRetroSFX("LAUNCH");
      }
    } else {
      this.laneKeyCooldown = false;
    }

    // Interpolate horizontal position smoothly towards target lane center
    const targetX = this.laneOffsetLeft + this.playerLane * this.laneWidth + (this.laneWidth - this.playerWidth) / 2;
    this.playerX += (targetX - this.playerX) * 0.28;

    // Scroll lines
    this.scrollOffset = (this.scrollOffset + roadScrollSpeed) % 80;

    // --------------------------------------------
    // Update and recycle traffic congestion
    // --------------------------------------------
    this.trafficSpawnCooldown -= speedFactor;
    const spawnRate = Math.max(25, 65 - difficultyLevel * 5); // spawns increasingly faster
    if (this.trafficSpawnCooldown <= 0) {
      this.spawnTraffic(-80);
      this.trafficSpawnCooldown = spawnRate + Math.random() * 25;
    }

    // Update traffic cars
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      // Move downward relative to player speed and car own velocity
      car.y += (roadScrollSpeed * 0.45 + car.speedY) * speedFactor;

      // Collide check (AABB overlaps)
      const pl = this.playerX;
      const pr = this.playerX + this.playerWidth;
      const pt = this.playerY;
      const pb = this.playerY + this.playerHeight;

      const cl = car.x;
      const cr = car.x + car.width;
      const ct = car.y;
      const cb = car.y + car.height;

      if (pr >= cl && pl <= cr && pb >= ct && pt <= cb) {
        // Exploding crash!
        this.createParticles(this.playerX + this.playerWidth / 2, this.playerY + 10, "#ffffff", 25);
        this.createParticles(car.x + car.width / 2, car.y + car.height / 2, "rgba(239, 68, 68, 0.95)", 20);
        
        ctx.setGameState("GAMEOVER");
        ctx.playRetroSFX("CRASH");
        ctx.checkAndSaveHighScore(this.score);
        return;
      }

      // Recycle off-screen traffic
      if (car.y > ctx.canvas.height + 60) {
        this.traffic.splice(i, 1);
      }
    }

    // --------------------------------------------
    // Update and manage collectibles data kits
    // --------------------------------------------
    this.collectibleSpawnCooldown -= speedFactor;
    if (this.collectibleSpawnCooldown <= 0) {
      this.spawnCollectible();
      this.collectibleSpawnCooldown = 150 + Math.random() * 100;
    }

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.y += roadScrollSpeed; // scrolls with road lines

      // Grab check
      const dist = Math.sqrt(
        Math.pow((this.playerX + this.playerWidth / 2) - col.x, 2) +
        Math.pow((this.playerY + this.playerHeight / 2) - col.y, 2)
      );

      if (dist < 26 && col.active) {
        col.active = false;
        this.score += 25; // massive score boost!
        ctx.setScore(this.score);
        ctx.playRetroSFX("EAT");
        
        this.createParticles(col.x, col.y, getColorSecondaryHex(ctx.colorPreset, 0.95), 14);
        this.collectibles.splice(i, 1);
        continue;
      }

      if (col.y > ctx.canvas.height + 30) {
        this.collectibles.splice(i, 1);
      }
    }

    // --------------------------------------------
    // Update Particles trail
    // --------------------------------------------
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Tyre spark particles when drift and boost
    if (Math.random() < 0.5) {
      const rearLeftWheelX = this.playerX + 3;
      const rearRightWheelX = this.playerX + this.playerWidth - 3;
      const rearY = this.playerY + this.playerHeight - 2;

      const trailColor = this.boostActive ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.08)";
      this.createParticles(rearLeftWheelX, rearY, trailColor, 1);
      this.createParticles(rearRightWheelX, rearY, trailColor, 1);
    }
  }

  private laneKeyCooldown = false;

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;
    const theme = ctx.colorPreset;

    const roadWidth = this.laneWidth * 3;
    const rl = this.laneOffsetLeft;
    const rr = rl + roadWidth;

    // 🎨 DRAW ROAD PAVEMENT BACKDROP
    c2d.fillStyle = "rgba(4, 8, 16, 0.95)";
    c2d.fillRect(rl, 0, roadWidth, ctx.canvas.height);

    // Left and Right guard rails boundaries
    c2d.save();
    c2d.shadowBlur = 10;
    c2d.shadowColor = getColorHex(theme, 0.6);
    c2d.strokeStyle = getColorHex(theme, 0.85);
    c2d.lineWidth = 3;
    c2d.beginPath();
    c2d.moveTo(rl, 0); c2d.lineTo(rl, ctx.canvas.height);
    c2d.moveTo(rr, 0); c2d.lineTo(rr, ctx.canvas.height);
    c2d.stroke();
    c2d.restore();

    // Dash segments indicating Lane dividers scrolling downwards
    c2d.strokeStyle = "rgba(255, 255, 255, 0.15)";
    c2d.lineWidth = 1.5;
    c2d.setLineDash([20, 20]);
    for (let l = 1; l < 3; l++) {
      const lx = rl + l * this.laneWidth;
      c2d.beginPath();
      c2d.moveTo(lx, this.scrollOffset - 40);
      c2d.lineTo(lx, ctx.canvas.height + 40);
      c2d.stroke();
    }
    c2d.setLineDash([]); // Reset line dash

    // Draw Particles
    this.particles.forEach(p => {
      c2d.save();
      c2d.globalAlpha = p.life;
      c2d.shadowBlur = 4;
      c2d.shadowColor = p.color;
      c2d.fillStyle = p.color;
      c2d.beginPath();
      c2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c2d.fill();
      c2d.restore();
    });

    // Draw Fuel Collectible canisters (Matrix glow units)
    this.collectibles.forEach(col => {
      if (!col.active) return;
      c2d.save();
      c2d.shadowBlur = 12;
      c2d.shadowColor = getColorSecondaryHex(theme, 0.85);
      c2d.fillStyle = getColorSecondaryHex(theme, 0.95);
      
      c2d.beginPath();
      c2d.arc(col.x, col.y, col.size, 0, Math.PI * 2);
      c2d.fill();

      // Mini wire harness decoration
      c2d.strokeStyle = "#ffffff";
      c2d.lineWidth = 1;
      c2d.strokeRect(col.x - 5, col.y - 5, 10, 10);
      c2d.restore();
    });

    // --------------------------------------------
    // Draw Traffic Cars
    // --------------------------------------------
    this.traffic.forEach(car => {
      c2d.save();
      c2d.shadowBlur = 6;
      c2d.shadowColor = car.color;
      c2d.fillStyle = car.color;
      c2d.strokeStyle = "#000000";
      c2d.lineWidth = 1.5;

      // Draw vector chassis
      c2d.fillRect(car.x, car.y, car.width, car.height);
      c2d.strokeRect(car.x, car.y, car.width, car.height);

      // Windshield glass accent block
      c2d.fillStyle = "rgba(0, 0, 0, 0.7)";
      c2d.fillRect(car.x + 2, car.y + 12, car.width - 4, 8);

      // Hostile red headlights beaming directions DOWNWARD
      c2d.fillStyle = "rgba(239, 68, 68, 0.95)";
      c2d.fillRect(car.x + 3, car.y + car.height - 3, 3, 3);
      c2d.fillRect(car.x + car.width - 6, car.y + car.height - 3, 3, 3);

      // Erratic "alarm" vehicles flash a warning halo so they read as a threat.
      if (car.alarmBlink && Math.floor(Date.now() / 200) % 2 === 0) {
        c2d.shadowBlur = 12;
        c2d.shadowColor = "rgba(239, 68, 68, 0.9)";
        c2d.strokeStyle = "rgba(239, 68, 68, 0.9)";
        c2d.lineWidth = 2;
        c2d.strokeRect(car.x - 2, car.y - 2, car.width + 4, car.height + 4);
      }

      c2d.restore();
    });

    // --------------------------------------------
    // Draw Player's Sports Car (Top-down vector)
    // --------------------------------------------
    c2d.save();
    c2d.shadowBlur = 15;
    c2d.shadowColor = getColorHex(theme, 0.9);
    c2d.fillStyle = getColorHex(theme, 0.8);
    c2d.strokeStyle = "#ffffff";
    c2d.lineWidth = 1.8;

    // Draw main aerodynamic chassis
    c2d.beginPath();
    c2d.moveTo(this.playerX + 5, this.playerY); // Nose tip
    c2d.lineTo(this.playerX + this.playerWidth - 5, this.playerY);
    c2d.lineTo(this.playerX + this.playerWidth, this.playerY + 8);
    c2d.lineTo(this.playerX + this.playerWidth, this.playerY + this.playerHeight);
    c2d.lineTo(this.playerX, this.playerY + this.playerHeight);
    c2d.lineTo(this.playerX, this.playerY + 8);
    c2d.closePath();
    c2d.fill();
    c2d.stroke();

    // Windshield glass block
    c2d.fillStyle = "rgba(255,255,255,0.85)";
    c2d.fillRect(this.playerX + 3, this.playerY + 8, this.playerWidth - 6, 7);

    // Spoiler wing on rear
    c2d.fillStyle = getColorSecondaryHex(theme, 0.95);
    c2d.fillRect(this.playerX - 2, this.playerY + this.playerHeight - 4, this.playerWidth + 4, 4);

    // Glowing cyan/amber Headlights beaming UPWARD
    c2d.shadowBlur = 8;
    c2d.shadowColor = "#ffffff";
    c2d.fillStyle = "#ffffff";
    c2d.fillRect(this.playerX + 2, this.playerY, 3, 3);
    c2d.fillRect(this.playerX + this.playerWidth - 5, this.playerY, 3, 3);

    // Nitrous boost flames ejecting from rear exhaust slots
    if (this.boostActive) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.95)";
      c2d.fillRect(this.playerX + 4, this.playerY + this.playerHeight, 4, 10 + Math.random() * 6);
      c2d.fillRect(this.playerX + this.playerWidth - 8, this.playerY + this.playerHeight, 4, 10 + Math.random() * 6);
    }
    c2d.restore();

    // Developer grid overlays on boundaries
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`ENGINE_FREQ: ${this.boostActive ? "7.2" : "4.8"}GHz`, 8, ctx.canvas.height - 8);
    const difficultyLevel = Math.floor(this.score / 150);
    const trafficSpeed = 6.0 + difficultyLevel * 1.2;
    c2d.fillText(`TRAFFIC_SPEED: ${trafficSpeed.toFixed(0)}m/h`, 110, ctx.canvas.height - 8);
    c2d.fillText(`SURVIVED: ${(this.elapsedFrames / 60).toFixed(1)}s`, 215, ctx.canvas.height - 8);
    
    if (this.boostActive) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.7)";
      c2d.fillText("NITROUS NITRO BOOSTED ACTIVE", 330, ctx.canvas.height - 8);
    }
  }
}
