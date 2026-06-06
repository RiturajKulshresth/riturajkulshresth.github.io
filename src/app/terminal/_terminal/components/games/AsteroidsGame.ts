/**
 * Asteroids orbit sim with thrust inertia and toroidal screen wrapping.
 * 3 lives; waves spawn more rocks; gravity well pulls from wave 3. Power-ups: RAPID, TRIPLE, SHIELD, LIFE.
 */
import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Laser {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

type PowerKind = "RAPID" | "TRIPLE" | "SHIELD" | "LIFE";

interface PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: PowerKind;
}

const POWER_META: Record<PowerKind, { label: string; color: string }> = {
  RAPID: { label: "R", color: "rgba(56, 189, 248, 0.95)" },
  TRIPLE: { label: "3", color: "rgba(250, 204, 21, 0.95)" },
  SHIELD: { label: "S", color: "rgba(52, 211, 153, 0.95)" },
  LIFE: { label: "+", color: "rgba(244, 63, 94, 0.95)" },
};

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
  private readonly maxLives = 3;
  private lives = 3;
  private invuln = 0;
  private powerups: PowerUp[] = [];
  private rapidTimer = 0;
  private tripleTimer = 0;
  private shieldTimer = 0;
  private cw = 600;
  private ch = 400;
  private gravityWell = { x: 300, y: 200, pullRadius: 180, active: false };

  init(ctx: GameContext): void {
    this.score = 0;
    this.currentWave = 1;
    this.lives = this.maxLives;
    this.invuln = 0;
    this.powerups = [];
    this.rapidTimer = 0;
    this.tripleTimer = 0;
    this.shieldTimer = 0;
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

  // Random capsule drop from a destroyed rock. Capsules drift and wrap like
  // everything else in this toroidal field.
  private maybeDropPowerUp(x: number, y: number) {
    if (Math.random() > 0.16) return;
    const roll = Math.random();
    const kind: PowerKind =
      roll < 0.34 ? "RAPID" : roll < 0.64 ? "TRIPLE" : roll < 0.88 ? "SHIELD" : "LIFE";
    this.powerups.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      life: 600,
      kind,
    });
  }

  private applyPowerUp(kind: PowerKind, ctx: GameContext) {
    ctx.playRetroSFX("SECURE");
    this.createParticles(this.shipX, this.shipY, POWER_META[kind].color, 14);
    if (kind === "RAPID") this.rapidTimer = 420;
    else if (kind === "TRIPLE") this.tripleTimer = 420;
    else if (kind === "SHIELD") this.shieldTimer = 480;
    else if (kind === "LIFE") {
      if (this.lives < this.maxLives) this.lives++;
      else {
        this.score += 75;
        ctx.setScore(this.score);
      }
    }
  }

  private updatePowerUps(speedFactor: number, ctx: GameContext) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];

      // Magnet: a capsule within range drifts toward the ship so it is always
      // catchable, even if the player keeps the ship mostly still and just
      // rotates/shoots (the classic Asteroids playstyle).
      const dxs = this.shipX - p.x;
      const dys = this.shipY - p.y;
      const dShip = Math.hypot(dxs, dys) || 1;
      if (dShip < 140) {
        p.x += (dxs / dShip) * 2.2 * speedFactor;
        p.y += (dys / dShip) * 2.2 * speedFactor;
      } else {
        p.x += p.vx * speedFactor;
        p.y += p.vy * speedFactor;
      }

      if (p.x < 0) p.x = this.cw;
      if (p.x > this.cw) p.x = 0;
      if (p.y < 0) p.y = this.ch;
      if (p.y > this.ch) p.y = 0;
      p.life -= speedFactor;
      if (p.life <= 0) {
        this.powerups.splice(i, 1);
        continue;
      }
      // Fly into it to collect.
      if (dShip < 20) {
        this.applyPowerUp(p.kind, ctx);
        this.powerups.splice(i, 1);
      }
    }
  }

  // Shooting a capsule also collects it: ideal when the ship is held still and
  // the player only rotates and fires. Called from the laser update loop.
  private collectPowerUpByLaser(lx: number, ly: number, ctx: GameContext): boolean {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (Math.hypot(lx - p.x, ly - p.y) < 12) {
        this.applyPowerUp(p.kind, ctx);
        this.powerups.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed, mouseClicked } = input;
    const speedFactor = ctx.speedFactor;

    // Active gravitational pulls beyond wave 2 (progressive complexity difficulty)
    this.gravityWell.active = this.currentWave >= 3;

    if (this.shootCooldown > 0) this.shootCooldown -= speedFactor;
    if (this.invuln > 0) this.invuln -= speedFactor;
    if (this.rapidTimer > 0) this.rapidTimer -= speedFactor;
    if (this.tripleTimer > 0) this.tripleTimer -= speedFactor;
    if (this.shieldTimer > 0) this.shieldTimer -= speedFactor;
    this.updatePowerUps(speedFactor, ctx);

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
      const angles = this.tripleTimer > 0 ? [-0.2, 0, 0.2] : [0];
      angles.forEach((off) => {
        const a = this.shipAngle + off;
        this.lasers.push({
          x: this.shipX + Math.cos(a) * 14,
          y: this.shipY + Math.sin(a) * 14,
          vx: Math.cos(a) * 8.0,
          vy: Math.sin(a) * 8.0,
          life: 50, // frames of lifetime
        });
      });
      this.shootCooldown = this.rapidTimer > 0 ? 5 : 11;
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

      // A laser that strikes a capsule collects it (and is consumed).
      if (this.collectPowerUpByLaser(l.x, l.y, ctx)) {
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

          this.maybeDropPowerUp(ast.x, ast.y);
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

      // Check collision on ship (only when not briefly shielded after a hit)
      const distS = Math.pow(this.shipX - ast.x, 2) + Math.pow(this.shipY - ast.y, 2);
      if (this.invuln <= 0 && distS < Math.pow(ast.radius + 10, 2)) {
        // A SHIELD power-up absorbs the impact and vaporises the rock.
        if (this.shieldTimer > 0) {
          this.shieldTimer = 0;
          this.invuln = 90;
          this.createParticles(this.shipX, this.shipY, "rgba(52, 211, 153, 0.95)", 18);
          ctx.playRetroSFX("COLLIDE");
          this.asteroids.splice(a, 1);
          a--;
          continue;
        }
        this.createParticles(this.shipX, this.shipY, "#ffffff", 25);
        this.lives--;
        if (this.lives <= 0) {
          ctx.setGameState("GAMEOVER");
          ctx.playRetroSFX("CRASH");
          ctx.checkAndSaveHighScore(this.score);
          return;
        }
        // Respawn at centre with a short shield window.
        ctx.playRetroSFX("CRASH");
        this.shipX = this.cw / 2;
        this.shipY = this.ch / 2;
        this.shipVx = 0;
        this.shipVy = 0;
        this.invuln = 120;
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

    // Draw drifting power-up capsules.
    this.powerups.forEach((p) => {
      const meta = POWER_META[p.kind];
      c2d.save();
      c2d.globalAlpha = p.life < 120 && Math.floor(Date.now() / 150) % 2 === 0 ? 0.4 : 1;
      c2d.shadowBlur = 12;
      c2d.shadowColor = meta.color;
      c2d.strokeStyle = meta.color;
      c2d.fillStyle = "rgba(0,0,0,0.55)";
      c2d.lineWidth = 2;
      c2d.beginPath();
      c2d.arc(p.x, p.y, 9, 0, Math.PI * 2);
      c2d.fill();
      c2d.stroke();
      c2d.fillStyle = meta.color;
      c2d.font = "bold 11px monospace";
      c2d.textAlign = "center";
      c2d.textBaseline = "middle";
      c2d.fillText(meta.label, p.x, p.y + 0.5);
      c2d.restore();
    });
    c2d.textBaseline = "alphabetic";

    // Shield bubble while the SHIELD power-up is active.
    if (this.shieldTimer > 0) {
      c2d.save();
      c2d.globalAlpha = this.shieldTimer < 90 && Math.floor(Date.now() / 120) % 2 === 0 ? 0.3 : 0.7;
      c2d.shadowBlur = 12;
      c2d.shadowColor = "rgba(52, 211, 153, 0.9)";
      c2d.strokeStyle = "rgba(52, 211, 153, 0.9)";
      c2d.lineWidth = 2;
      c2d.beginPath();
      c2d.arc(this.shipX, this.shipY, 20, 0, Math.PI * 2);
      c2d.stroke();
      c2d.restore();
    }

    // Draw spaceships fighter with vector outlines (blink while shielded)
    c2d.save();
    if (this.invuln > 0) c2d.globalAlpha = Math.floor(this.invuln / 6) % 2 === 0 ? 0.3 : 1;
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

    c2d.fillStyle = getColorHex(ctx.colorPreset, 0.9);
    c2d.font = "bold 10px monospace";
    c2d.fillText(`LIVES: ${"♥".repeat(this.lives)}${"·".repeat(Math.max(0, this.maxLives - this.lives))}`, 8, 16);

    const buffs: { t: string; c: string }[] = [];
    if (this.rapidTimer > 0) buffs.push({ t: `RAPID ${(this.rapidTimer / 60).toFixed(0)}s`, c: POWER_META.RAPID.color });
    if (this.tripleTimer > 0) buffs.push({ t: `TRIPLE ${(this.tripleTimer / 60).toFixed(0)}s`, c: POWER_META.TRIPLE.color });
    if (this.shieldTimer > 0) buffs.push({ t: `SHIELD ${(this.shieldTimer / 60).toFixed(0)}s`, c: POWER_META.SHIELD.color });
    c2d.font = "bold 9px monospace";
    buffs.forEach((b, idx) => {
      c2d.fillStyle = b.c;
      c2d.fillText(b.t, 8, 30 + idx * 12);
    });

    if (this.gravityWell.active) {
      c2d.fillStyle = "rgba(217,70,239,0.55)";
      c2d.fillText("▼ GRAVITY WELL COMPROMISED ▼", 210, ctx.canvas.height - 8);
    }
  }
}
