import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Laser {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  vertices: { x: number; y: number }[];
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

export class AsteroidsGame implements GameEngine {
  private shipX = 300;
  private shipY = 200;
  private shipAngle = -Math.PI / 2;
  private shipVx = 0;
  private shipVy = 0;

  private lasers: Laser[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle[] = [];

  private shootCooldown = 0;
  private score = 0;
  private currentWave = 1;
  private cw = 600;
  private ch = 400;
  private gravityWell = { x: 300, y: 200, pullRadius: 180, active: false };

  init(ctx: GameContext): void {
    this.score = 0;
    this.currentWave = 1;
    this.cw = ctx.canvas.width;
    this.ch = ctx.canvas.height;
    this.shipX = ctx.canvas.width / 2;
    this.shipY = ctx.canvas.height / 2;
    this.shipAngle = -Math.PI / 2;
    this.shipVx = 0;
    this.shipVy = 0;
    this.lasers = [];
    this.particles = [];
    this.gravityWell.x = ctx.canvas.width / 2;
    this.gravityWell.y = ctx.canvas.height / 2;
    this.gravityWell.active = false;

    this.spawnAsteroidWave(4);
  }

  private createAsteroidGeometry(radius: number): { x: number; y: number }[] {
    const vertices = [];
    const count = Math.floor(Math.random() * 5 + 8); // 8 to 12 vertices
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }
    return vertices;
  }

  private spawnAsteroidWave(count: number) {
    this.asteroids = [];
    for (let i = 0; i < count; i++) {
      // Spawn near edges of screen to leave ship centerpiece safe initially
      const safeCx = this.cw / 2;
      const safeCy = this.ch / 2;
      let sx = Math.random() * this.cw;
      let sy = Math.random() * this.ch;
      while (Math.abs(sx - safeCx) < 100 && Math.abs(sy - safeCy) < 100) {
        sx = Math.random() * this.cw;
        sy = Math.random() * this.ch;
      }

      const radius = Math.random() * 12 + 20; // larger rocks
      this.asteroids.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        radius,
        hp: 1,
        vertices: this.createAsteroidGeometry(radius)
      });
    }
  }

  private createParticles(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2 + 1.5,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed, mouseClicked } = input;
    const speedFactor = ctx.speedFactor;

    // Active gravitational pulls beyond wave 2 (progressive complexity difficulty)
    this.gravityWell.active = this.currentWave >= 3;

    if (this.shootCooldown > 0) this.shootCooldown -= speedFactor;

    // Movement Angle Steers
    if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
      this.shipAngle -= 0.08 * speedFactor;
    }
    if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
      this.shipAngle += 0.08 * speedFactor;
    }

    // Engine thrusters with thrust inertia increments
    if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) {
      this.shipVx += Math.cos(this.shipAngle) * 0.16 * speedFactor;
      this.shipVy += Math.sin(this.shipAngle) * 0.16 * speedFactor;

      // Emit small blue engine flame particles
      if (Math.random() < 0.4) {
        const tx = this.shipX - Math.cos(this.shipAngle) * 10;
        const ty = this.shipY - Math.sin(this.shipAngle) * 10;
        this.createParticles(tx, ty, getColorSecondaryHex(ctx.colorPreset, 0.7), 2);
      }
    }

    // Passive cosmic friction deceleration
    this.shipVx *= Math.pow(0.985, speedFactor);
    this.shipVy *= Math.pow(0.985, speedFactor);

    // Gravity well pulling vectors (difficulty neutron star)
    if (this.gravityWell.active) {
      const dx = this.gravityWell.x - this.shipX;
      const dy = this.gravityWell.y - this.shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.gravityWell.pullRadius && dist > 15) {
        const pull = (0.015 / (dist / 100)) * speedFactor;
        this.shipVx += (dx / dist) * pull;
        this.shipVy += (dy / dist) * pull;
      }
    }

    // Apply velocities
    this.shipX += this.shipVx * speedFactor;
    this.shipY += this.shipVy * speedFactor;

    // Screen wrapping (Toroidal spaces)
    if (this.shipX < 0) this.shipX = ctx.canvas.width;
    if (this.shipX > ctx.canvas.width) this.shipX = 0;
    if (this.shipY < 0) this.shipY = ctx.canvas.height;
    if (this.shipY > ctx.canvas.height) this.shipY = 0;

    // Shooting Lasers
    if ((keysPressed["Space"] || keysPressed["KeyS"] || mouseClicked) && this.shootCooldown <= 0) {
      this.lasers.push({
        x: this.shipX + Math.cos(this.shipAngle) * 14,
        y: this.shipY + Math.sin(this.shipAngle) * 14,
        vx: Math.cos(this.shipAngle) * 8.0,
        vy: Math.sin(this.shipAngle) * 8.0,
        life: 50 // frames of lifetime
      });
      this.shootCooldown = 11;
      ctx.playRetroSFX("LAUNCH");
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x += l.vx * speedFactor;
      l.y += l.vy * speedFactor;

      // Wrapping lasers
      if (l.x < 0) l.x = ctx.canvas.width;
      if (l.x > ctx.canvas.width) l.x = 0;
      if (l.y < 0) l.y = ctx.canvas.height;
      if (l.y > ctx.canvas.height) l.y = 0;

      l.life -= speedFactor;
      if (l.life <= 0) {
        this.lasers.splice(i, 1);
        continue;
      }

      // Check laser collision with asteroid rocks
      let hitAsteroid = false;
      for (let a = this.asteroids.length - 1; a >= 0; a--) {
        const ast = this.asteroids[a];
        const distSq = Math.pow(l.x - ast.x, 2) + Math.pow(l.y - ast.y, 2);

        if (distSq < Math.pow(ast.radius, 2)) {
          // Hit asteroid!
          this.createParticles(l.x, l.y, getColorHex(ctx.colorPreset, 0.8), 12);
          this.lasers.splice(i, 1);
          hitAsteroid = true;
          
          ctx.playRetroSFX("EAT");

          const points = ast.radius > 18 ? 30 : 50;
          this.score += points;
          ctx.setScore(this.score);

          // Split Asteroids checks
          if (ast.radius > 14) {
            const childrenCount = 2;
            const newRadius = ast.radius / 1.7;
            const splitSpeedScale = 1.6 + (this.currentWave * 0.15); // split velocity ramps up with waves!
            
            for (let c = 0; c < childrenCount; c++) {
              const angleOffset = (Math.random() - 0.5) * Math.PI;
              const angle = Math.atan2(ast.vy, ast.vx) + angleOffset;
              this.asteroids.push({
                x: ast.x,
                y: ast.y,
                vx: Math.cos(angle) * (splitSpeedScale + Math.random()),
                vy: Math.sin(angle) * (splitSpeedScale + Math.random()),
                radius: newRadius,
                hp: 1,
                vertices: this.createAsteroidGeometry(newRadius)
              });
            }
          }

          this.asteroids.splice(a, 1);

          // All cleared trigger
          if (this.asteroids.length === 0) {
            this.currentWave++;
            ctx.playRetroSFX("LEVELUP");
            this.spawnAsteroidWave(4 + this.currentWave);
            this.score += 200; // completion bonus
            ctx.setScore(this.score);
          }
          break;
        }
      }
      if (hitAsteroid) continue;
    }

    // Update and check asteroid collisions on Ship
    for (let a = 0; a < this.asteroids.length; a++) {
      const ast = this.asteroids[a];
      ast.x += ast.vx * speedFactor;
      ast.y += ast.vy * speedFactor;

      // Wrapping Asteroids
      if (ast.x < -30) ast.x = ctx.canvas.width + 30;
      if (ast.x > ctx.canvas.width + 30) ast.x = -30;
      if (ast.y < -30) ast.y = ctx.canvas.height + 30;
      if (ast.y > ctx.canvas.height + 30) ast.y = -30;

      // Gravity well pull on asteroids too (progressive details!)
      if (this.gravityWell.active) {
        const dx = this.gravityWell.x - ast.x;
        const dy = this.gravityWell.y - ast.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.gravityWell.pullRadius) {
          const pull = (0.005 / (dist / 100)) * speedFactor;
          ast.vx += (dx / dist) * pull;
          ast.vy += (dy / dist) * pull;
        }
      }

      // Check collision on ship
      const distS = Math.pow(this.shipX - ast.x, 2) + Math.pow(this.shipY - ast.y, 2);
      if (distS < Math.pow(ast.radius + 10, 2)) {
        // Ship crashed
        this.createParticles(this.shipX, this.shipY, "#ffffff", 25);
        ctx.setGameState("GAMEOVER");
        ctx.playRetroSFX("CRASH");
        ctx.checkAndSaveHighScore(this.score);
        return;
      }
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;

    // Draw central neutron star gravity well
    if (this.gravityWell.active) {
      c2d.save();
      c2d.shadowBlur = 15;
      c2d.shadowColor = "rgba(217,70,239,0.7)";
      c2d.fillStyle = "rgba(217,70,239,0.12)";
      c2d.beginPath();
      c2d.arc(this.gravityWell.x, this.gravityWell.y, 25 + Math.sin(Date.now() * 0.01) * 8, 0, Math.PI * 2);
      c2d.fill();

      // Core singularity black dot
      c2d.fillStyle = "#0c0114";
      c2d.beginPath();
      c2d.arc(this.gravityWell.x, this.gravityWell.y, 8, 0, Math.PI * 2);
      c2d.fill();
      
      // Ring detailing
      c2d.strokeStyle = "rgba(217,70,239,0.4)";
      c2d.lineWidth = 1;
      c2d.beginPath();
      c2d.arc(this.gravityWell.x, this.gravityWell.y, this.gravityWell.pullRadius, 0, Math.PI * 2);
      c2d.stroke();
      c2d.restore();
    }

    // Draw Particles
    this.particles.forEach(p => {
      c2d.save();
      c2d.globalAlpha = p.life;
      c2d.shadowBlur = 5;
      c2d.shadowColor = p.color;
      c2d.fillStyle = p.color;
      c2d.beginPath();
      c2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c2d.fill();
      c2d.restore();
    });

    // Draw Asteroids with complex vector geometries
    this.asteroids.forEach(ast => {
      c2d.save();
      c2d.translate(ast.x, ast.y);
      c2d.shadowBlur = 8;
      c2d.shadowColor = getColorHex(ctx.colorPreset, 0.45);
      c2d.strokeStyle = getColorHex(ctx.colorPreset, 0.85);
      c2d.lineWidth = 1.3;
      c2d.fillStyle = "rgba(0,0,0,0.3)";

      c2d.beginPath();
      c2d.moveTo(ast.vertices[0].x, ast.vertices[0].y);
      for (let v = 1; v < ast.vertices.length; v++) {
        c2d.lineTo(ast.vertices[v].x, ast.vertices[v].y);
      }
      c2d.closePath();
      c2d.fill();
      c2d.stroke();

      // Draw inside structure lines representing wireframe rock details
      c2d.strokeStyle = getColorHex(ctx.colorPreset, 0.25);
      c2d.beginPath();
      c2d.moveTo(0, 0);
      c2d.lineTo(ast.vertices[0].x / 2, ast.vertices[0].y / 2);
      c2d.moveTo(0, 0);
      c2d.lineTo(ast.vertices[2].x / 2, ast.vertices[2].y / 2);
      c2d.stroke();

      c2d.restore();
    });

    // Draw spaceships fighter with vector outlines
    c2d.save();
    c2d.translate(this.shipX, this.shipY);
    c2d.rotate(this.shipAngle);
    
    c2d.shadowBlur = 12;
    c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.9);
    c2d.strokeStyle = "#ffffff";
    c2d.fillStyle = getColorHex(ctx.colorPreset, 0.25);
    c2d.lineWidth = 2.0;

    c2d.beginPath();
    c2d.moveTo(12, 0); // nose cone pointing forward right
    c2d.lineTo(-10, -8);
    c2d.lineTo(-6, 0);
    c2d.lineTo(-10, 8);
    c2d.closePath();
    c2d.stroke();
    c2d.fill();
    c2d.restore();

    // Draw neon glowing projectiles
    this.lasers.forEach(l => {
      c2d.save();
      c2d.shadowBlur = 10;
      c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.95);
      c2d.fillStyle = "#ffffff";
      c2d.beginPath();
      c2d.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
      c2d.fill();
      c2d.restore();
    });

    // HUD overlays
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`GRID_COGNITION: WAVE ${this.currentWave}`, 8, ctx.canvas.height - 8);
    c2d.fillText(`DEBRIS_INDEX: ${this.asteroids.length}`, 110, ctx.canvas.height - 8);
    if (this.gravityWell.active) {
      c2d.fillStyle = "rgba(217,70,239,0.55)";
      c2d.fillText("▼ GRAVITY WELL COMPROMISED ▼", 210, ctx.canvas.height - 8);
    }
  }
}
