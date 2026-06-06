/**
 * Space-invaders shooter with destructible shields and a motherboard boss per level.
 * 3 lives with post-hit invulnerability; power-ups: RAPID, SPREAD, SHIELD, LIFE. Clear waves to advance.
 */
import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Bullet {
  x: number;
  y: number;
  speedY: number;
  speedX?: number;
  isEnemy: boolean;
  damage: number;
  isLaserBeam?: boolean;
}

type PowerKind = "RAPID" | "SPREAD" | "SHIELD" | "LIFE";

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  kind: PowerKind;
}

const POWER_META: Record<PowerKind, { label: string; color: string }> = {
  RAPID: { label: "R", color: "rgba(56, 189, 248, 0.95)" },
  SPREAD: { label: "3", color: "rgba(250, 204, 21, 0.95)" },
  SHIELD: { label: "S", color: "rgba(52, 211, 153, 0.95)" },
  LIFE: { label: "+", color: "rgba(244, 63, 94, 0.95)" },
};

interface Invader {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreVal: number;
  type: number; // 0=fast, 1=medium, 2=heavy
  offsetPhase: number;
}

interface Shield {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
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

interface MotherboardBoss {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speedX: number;
  state: "slide_in" | "fight" | "firing_beam";
  beamTimer: number;
  activeBeamX: number;
}

export class ShooterGame implements GameEngine {
  private playerShipX = 300;
  private readonly playerShipY = 365;
  private readonly shipWidth = 36;

  private bullets: Bullet[] = [];
  private invaders: Invader[] = [];
  private shields: Shield[] = [];
  private particles: Particle[] = [];
  private boss: MotherboardBoss | null = null;

  private invaderDirection = 1;
  private shooterLevel = 1;
  private shootCooldown = 0;
  private score = 0;
  private canvasWidth = 600;
  private readonly maxLives = 3;
  private lives = 3;
  private invuln = 0;
  private lastPointerX: number | null = null;

  private powerups: PowerUp[] = [];
  private rapidTimer = 0;
  private spreadTimer = 0;
  private shieldTimer = 0;

  init(ctx: GameContext): void {
    this.score = 0;
    this.shooterLevel = 1;
    this.canvasWidth = ctx.canvas.width;
    this.lives = this.maxLives;
    this.invuln = 0;
    this.lastPointerX = null;
    this.playerShipX = ctx.canvas.width / 2;
    this.powerups = [];
    this.rapidTimer = 0;
    this.spreadTimer = 0;
    this.shieldTimer = 0;
    this.bullets = [];
    this.particles = [];
    this.boss = null;
    this.shootCooldown = 0;
    this.invaderDirection = 1;

    this.initInvaders();
    this.initShields();
  }

  // One hit costs a life (with brief invulnerability + a bullet wipe) instead
  // of instantly ending the run.
  private hitPlayer(ctx: GameContext) {
    if (this.invuln > 0) return;
    // A SHIELD power-up absorbs one hit instead of costing a life.
    if (this.shieldTimer > 0) {
      this.shieldTimer = 0;
      this.invuln = 60;
      this.createParticles(this.playerShipX, this.playerShipY, "rgba(52, 211, 153, 0.95)", 16);
      ctx.playRetroSFX("COLLIDE");
      this.bullets = this.bullets.filter((b) => !b.isEnemy);
      return;
    }
    this.lives--;
    this.createParticles(this.playerShipX, this.playerShipY, "rgba(244, 63, 94, 0.95)", 18);
    ctx.playRetroSFX("CRASH");
    if (this.lives <= 0) {
      ctx.setGameState("GAMEOVER");
      ctx.checkAndSaveHighScore(this.score);
    } else {
      this.invuln = 90;
      this.bullets = this.bullets.filter((b) => !b.isEnemy);
      this.playerShipX = ctx.canvas.width / 2;
    }
  }

  private initInvaders() {
    this.invaders = [];
    const rows = 3;
    const cols = 8;
    let idCounter = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = r; // 0 is heavy top, 1 is medium center, 2 is swift bottom
        const hp = type === 0 ? 3 : type === 1 ? 2 : 1;
        this.invaders.push({
          id: idCounter++,
          x: c * 52 + 80,
          y: r * 38 + 50,
          width: 32,
          height: 24,
          hp: hp,
          maxHp: hp,
          scoreVal: (3 - r) * 15,
          type,
          offsetPhase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  private initShields() {
    this.shields = [];
    const shieldCount = 3;
    const shieldWidth = 60;
    const canvasWidth = this.canvasWidth;

    for (let i = 0; i < shieldCount; i++) {
      const sx = (canvasWidth / (shieldCount + 1)) * (i + 1) - shieldWidth / 2;
      this.shields.push({
        x: sx,
        y: 310,
        width: shieldWidth,
        height: 14,
        hp: 5,
        maxHp: 5
      });
    }
  }

  private spawnBoss() {
    this.boss = {
      x: 100,
      y: -50,
      width: 120,
      height: 40,
      hp: 15 + this.shooterLevel * 5,
      maxHp: 15 + this.shooterLevel * 5,
      speedX: 1.8,
      state: "slide_in",
      beamTimer: 0,
      activeBeamX: -1
    };
  }

  private createParticles(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2.5 + 2,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  // Random capsule drop when an enemy dies. Tuned low so buffs feel earned.
  private maybeDropPowerUp(x: number, y: number) {
    if (Math.random() > 0.16) return;
    const roll = Math.random();
    const kind: PowerKind =
      roll < 0.34 ? "RAPID" : roll < 0.64 ? "SPREAD" : roll < 0.88 ? "SHIELD" : "LIFE";
    this.powerups.push({ x, y, vy: 1.6, kind });
  }

  private applyPowerUp(kind: PowerKind, ctx: GameContext) {
    ctx.playRetroSFX("SECURE");
    this.createParticles(this.playerShipX, this.playerShipY, POWER_META[kind].color, 14);
    if (kind === "RAPID") this.rapidTimer = 420;
    else if (kind === "SPREAD") this.spreadTimer = 420;
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
      p.y += p.vy * speedFactor;
      if (p.y > ctx.canvas.height + 12) {
        this.powerups.splice(i, 1);
        continue;
      }
      // Caught by the ship.
      if (
        p.y >= this.playerShipY - 16 &&
        p.y <= this.playerShipY + 14 &&
        Math.abs(p.x - this.playerShipX) <= this.shipWidth / 2 + 8
      ) {
        this.applyPowerUp(p.kind, ctx);
        this.powerups.splice(i, 1);
      }
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed, mouseX, mouseClicked } = input;
    const speedFactor = ctx.speedFactor;

    if (this.shootCooldown > 0) this.shootCooldown -= speedFactor;
    if (this.invuln > 0) this.invuln -= speedFactor;
    if (this.rapidTimer > 0) this.rapidTimer -= speedFactor;
    if (this.spreadTimer > 0) this.spreadTimer -= speedFactor;
    if (this.shieldTimer > 0) this.shieldTimer -= speedFactor;
    this.updatePowerUps(speedFactor, ctx);

    // Movement controls. Keys take priority; the pointer only steers when it
    // actually moves, so releasing a key leaves the ship put instead of
    // sliding back toward the default centred pointer position.
    if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
      this.playerShipX = Math.max(this.playerShipX - 6.5 * speedFactor, this.shipWidth / 2);
      this.lastPointerX = mouseX;
    } else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
      this.playerShipX = Math.min(this.playerShipX + 6.5 * speedFactor, ctx.canvas.width - this.shipWidth / 2);
      this.lastPointerX = mouseX;
    } else if (this.lastPointerX === null || Math.abs(mouseX - this.lastPointerX) > 0.5) {
      this.lastPointerX = mouseX;
      const targetX = mouseX;
      this.playerShipX += (targetX - this.playerShipX) * 0.22;
      this.playerShipX = Math.min(Math.max(this.playerShipX, this.shipWidth / 2), ctx.canvas.width - this.shipWidth / 2);
    }

    // Fire weapon trigger
    if ((keysPressed["Space"] || keysPressed["KeyW"] || mouseClicked) && this.shootCooldown <= 0) {
      const by = this.playerShipY - 14;
      if (this.spreadTimer > 0) {
        // Triple spread: centre shot plus two angled rounds.
        this.bullets.push({ x: this.playerShipX, y: by, speedY: -7.5, isEnemy: false, damage: 1 });
        this.bullets.push({ x: this.playerShipX, y: by, speedY: -7.2, speedX: -2.4, isEnemy: false, damage: 1 });
        this.bullets.push({ x: this.playerShipX, y: by, speedY: -7.2, speedX: 2.4, isEnemy: false, damage: 1 });
      } else {
        this.bullets.push({ x: this.playerShipX, y: by, speedY: -7.5, isEnemy: false, damage: 1 });
      }
      const baseCooldown = Math.max(8, 14 - this.shooterLevel); // Fire rate speeds up slightly
      this.shootCooldown = this.rapidTimer > 0 ? Math.max(4, baseCooldown - 6) : baseCooldown;
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

    // --------------------------------------------
    // BOSS MOTHERBOARD UPDATE LOGIC
    // --------------------------------------------
    if (this.boss) {
      const b = this.boss;
      if (b.state === "slide_in") {
        b.y += 0.8 * speedFactor;
        if (b.y >= 45) {
          b.state = "fight";
        }
      } else if (b.state === "fight") {
        b.x += b.speedX * speedFactor;
        if (b.x + b.width >= ctx.canvas.width - 20) {
          b.speedX = -Math.abs(b.speedX);
        } else if (b.x <= 20) {
          b.speedX = Math.abs(b.speedX);
        }

        // Randomly charge ion beam
        b.beamTimer += speedFactor;
        if (b.beamTimer > 250 && Math.random() < 0.05) {
          b.state = "firing_beam";
          b.beamTimer = 0;
          ctx.playRetroSFX("SECURE");
        }

        // Standard boss multi bullets
        if (Math.random() < 0.035 * speedFactor) {
          this.bullets.push({ x: b.x + 10, y: b.y + b.height, speedY: 3.5, isEnemy: true, damage: 1 });
          this.bullets.push({ x: b.x + b.width - 10, y: b.y + b.height, speedY: 3.5, isEnemy: true, damage: 1 });
        }
      } else if (b.state === "firing_beam") {
        b.beamTimer += speedFactor;
        b.activeBeamX = b.x + b.width / 2;

        // Visual beam damage trigger
        if (b.beamTimer >= 35 && b.beamTimer < 75) {
          const beamLeft = b.activeBeamX - 12;
          const beamRight = b.activeBeamX + 12;

          // Check player collision with laser beam
          if (this.playerShipX + this.shipWidth / 2 >= beamLeft && this.playerShipX - this.shipWidth / 2 <= beamRight) {
            this.hitPlayer(ctx);
            if (this.lives <= 0) return;
          }

          // Check shields collision with laser beam
          this.shields.forEach(sh => {
            if (sh.hp > 0 && sh.x + sh.width >= beamLeft && sh.x <= beamRight) {
              sh.hp -= 0.1 * speedFactor; // Progressive degradation
            }
          });
        }

        if (b.beamTimer >= 90) {
          b.state = "fight";
          b.beamTimer = 0;
          b.activeBeamX = -1;
        }
      }
    }

    // --------------------------------------------
    // STANDARD WAVE UPDATE LOGIC
    // --------------------------------------------
    else {
      let reachedSide = false;
      const speedScale = 0.8 + (this.shooterLevel * 0.15); // Progressive movement speed factor

      this.invaders.forEach(inv => {
        inv.x += this.invaderDirection * speedScale * speedFactor;
        if (inv.x + inv.width >= ctx.canvas.width - 15 || inv.x <= 15) {
          reachedSide = true;
        }
      });

      if (reachedSide) {
        this.invaderDirection = -this.invaderDirection;
        this.invaders.forEach(inv => {
          inv.y += 18;
          // Sky invaders collide on ship height line is instantaneous gameover
          if (inv.y + inv.height >= this.playerShipY - 5) {
            ctx.setGameState("GAMEOVER");
            ctx.playRetroSFX("CRASH");
            ctx.checkAndSaveHighScore(this.score);
          }
        });
      }

      // Invaders firing bombs (increased rate based on level difficulty)
      const attackFrequency = 0.012 + (this.shooterLevel * 0.005);
      if (Math.random() < attackFrequency * speedFactor && this.invaders.length > 0) {
        const inv = this.invaders[Math.floor(Math.random() * this.invaders.length)];
        this.bullets.push({
          x: inv.x + inv.width / 2,
          y: inv.y + inv.height,
          speedY: 4.0 + (this.shooterLevel * 0.25),
          isEnemy: true,
          damage: 1
        });
      }
    }

    // --------------------------------------------
    // BULLETS COLLISION SYSTEM
    // --------------------------------------------
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      // Clearing a wave / taking a hit can replace `this.bullets` mid-loop,
      // leaving stale indices; skip any that no longer exist.
      if (!b) continue;
      b.y += b.speedY * speedFactor;
      if (b.speedX) b.x += b.speedX * speedFactor;

      // Unregister out-of-screen bullets
      if (b.y < 0 || b.y > ctx.canvas.height || b.x < 0 || b.x > ctx.canvas.width) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check Shield collisions
      let hitSomething = false;
      for (let s = 0; s < this.shields.length; s++) {
        const sh = this.shields[s];
        if (sh.hp > 0 && b.x >= sh.x && b.x <= sh.x + sh.width && b.y >= sh.y && b.y <= sh.y + sh.height) {
          sh.hp -= b.damage;
          this.createParticles(b.x, b.y, "rgba(255,255,255,0.7)", 5);
          ctx.playRetroSFX("COLLIDE");
          this.bullets.splice(i, 1);
          hitSomething = true;
          break;
        }
      }
      if (hitSomething) continue;

      if (b.isEnemy) {
        // Player hitbox check
        if (
          this.invuln <= 0 &&
          b.x >= this.playerShipX - this.shipWidth / 2 &&
          b.x <= this.playerShipX + this.shipWidth / 2 &&
          b.y >= this.playerShipY - 5 &&
          b.y <= this.playerShipY + 12
        ) {
          this.bullets.splice(i, 1);
          this.hitPlayer(ctx);
          if (this.lives <= 0) return;
          continue;
        }
      } else {
        // Hero shot hits Boss Motherboard
        if (this.boss) {
          const bossObj = this.boss;
          if (b.x >= bossObj.x && b.x <= bossObj.x + bossObj.width && b.y >= bossObj.y && b.y <= bossObj.y + bossObj.height) {
            bossObj.hp -= b.damage;
            this.createParticles(b.x, b.y, "rgba(239, 68, 68, 0.95)", 7);
            ctx.playRetroSFX("COLLIDE");
            this.bullets.splice(i, 1);

            if (bossObj.hp <= 0) {
              this.score += 500;
              ctx.setScore(this.score);
              ctx.playRetroSFX("LEVELUP");
              // Particle shockwaves
              this.createParticles(bossObj.x + bossObj.width / 2, bossObj.y + bossObj.height / 2, "#ffffff", 35);
              // A felled boss always drops a capsule as a reward.
              this.powerups.push({
                x: bossObj.x + bossObj.width / 2,
                y: bossObj.y + bossObj.height / 2,
                vy: 1.6,
                kind: Math.random() < 0.5 ? "SHIELD" : "LIFE",
              });
              this.boss = null;
              
              // Enter new stage wave
              this.shooterLevel++;
              this.initInvaders();
              this.initShields();
            }
            continue;
          }
        }

        // Hero shot hits Invaders
        for (let n = this.invaders.length - 1; n >= 0; n--) {
          const inv = this.invaders[n];
          if (b.x >= inv.x && b.x <= inv.x + inv.width && b.y >= inv.y && b.y <= inv.y + inv.height) {
            inv.hp -= b.damage;
            this.bullets.splice(i, 1);
            this.createParticles(b.x, b.y, getColorSecondaryHex(ctx.colorPreset, 0.8), 6);

            if (inv.hp <= 0) {
              this.score += inv.scoreVal;
              ctx.setScore(this.score);
              ctx.playRetroSFX("EAT");
              this.maybeDropPowerUp(inv.x + inv.width / 2, inv.y + inv.height / 2);
              this.invaders.splice(n, 1);
            } else {
              ctx.playRetroSFX("COLLIDE");
            }

            // All standard invaders destroyed check
            if (this.invaders.length === 0) {
              this.bullets = [];
              ctx.playRetroSFX("SECURE");
              
              // Instead of straight wave completion, spawn a Motherboard Boss on every 2nd wave!
              if (this.shooterLevel % 2 === 1) {
                this.spawnBoss();
              } else {
                this.shooterLevel++;
                this.initInvaders();
                this.initShields();
              }
            }
            break;
          }
        }
      }
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;

    // Draw grid scanner particles
    this.particles.forEach(p => {
      c2d.save();
      c2d.globalAlpha = p.life;
      c2d.shadowBlur = 6;
      c2d.shadowColor = p.color;
      c2d.fillStyle = p.color;
      c2d.beginPath();
      c2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c2d.fill();
      c2d.restore();
    });

    // Draw Shields/Debris shelters
    this.shields.forEach(sh => {
      if (sh.hp <= 0) return;

      c2d.save();
      const integrity = sh.hp / sh.maxHp;
      c2d.shadowBlur = 4;
      c2d.shadowColor = getColorHex(ctx.colorPreset, 0.6);
      c2d.strokeStyle = getColorHex(ctx.colorPreset, 0.82);
      c2d.fillStyle = getColorHex(ctx.colorPreset, 0.25 * integrity);
      c2d.lineWidth = 1.5;

      c2d.fillRect(sh.x, sh.y, sh.width, sh.height);
      c2d.strokeRect(sh.x, sh.y, sh.width, sh.height);
      
      // Cracks inside decaying shields
      if (integrity < 0.75) {
        c2d.strokeStyle = "rgba(255,255,255,0.3)";
        c2d.beginPath();
        c2d.moveTo(sh.x + 10, sh.y + 4);
        c2d.lineTo(sh.x + 25, sh.y + 11);
        c2d.moveTo(sh.x + sh.width - 20, sh.y + 2);
        c2d.lineTo(sh.x + sh.width - 12, sh.y + 12);
        c2d.stroke();
      }
      c2d.restore();
    });

    // Draw Boss Motherboard
    if (this.boss) {
      const b = this.boss;
      c2d.save();
      c2d.shadowBlur = 15;
      c2d.shadowColor = "rgba(239, 68, 68, 0.75)";
      c2d.strokeStyle = "rgba(239, 68, 68, 0.95)";
      c2d.fillStyle = "rgba(30, 0, 5, 0.25)";
      c2d.lineWidth = 2.5;

      // Heavy mainframe geometry representation
      c2d.beginPath();
      c2d.moveTo(b.x + 15, b.y);
      c2d.lineTo(b.x + b.width - 15, b.y);
      c2d.lineTo(b.x + b.width, b.y + 15);
      c2d.lineTo(b.x + b.width - 30, b.y + b.height);
      c2d.lineTo(b.x + 30, b.y + b.height);
      c2d.lineTo(b.x, b.y + 15);
      c2d.closePath();
      c2d.stroke();
      c2d.fill();

      // Core green/fuchsia processor grid inside Boss
      const colors = ["#ff00ff", "#00ffff", "#ffff00"];
      c2d.fillStyle = colors[Math.floor(Date.now() / 150) % 3];
      c2d.fillRect(b.x + b.width / 2 - 12, b.y + 10, 24, 8);

      // HP bar for boss
      const hpRatio = b.hp / b.maxHp;
      c2d.fillStyle = "rgba(239, 68, 68, 0.2)";
      c2d.fillRect(b.x, b.y - 12, b.width, 4);
      c2d.fillStyle = "rgba(239, 68, 68, 0.95)";
      c2d.fillRect(b.x, b.y - 12, b.width * hpRatio, 4);

      // Draw sweeping ion laser beam
      if (b.state === "firing_beam" && b.beamTimer >= 35 && b.beamTimer < 75) {
        c2d.shadowColor = "#ff0088";
        c2d.shadowBlur = 20;
        c2d.fillStyle = "rgba(255, 255, 255, 0.95)";
        c2d.fillRect(b.activeBeamX - 12, b.y + b.height, 24, ctx.canvas.height - b.y - b.height);

        c2d.strokeStyle = "rgba(251, 113, 133, 0.4)";
        c2d.lineWidth = 12;
        c2d.strokeRect(b.activeBeamX - 18, b.y + b.height, 36, ctx.canvas.height - b.y - b.height);
      }
      c2d.restore();
    }

    // Draw regular Invaders
    this.invaders.forEach(inv => {
      c2d.save();
      c2d.shadowBlur = 6;
      c2d.lineWidth = 1.5;

      const hoverOffset = Math.sin(Date.now() * 0.007 + inv.offsetPhase) * 2;
      const iy = inv.y + hoverOffset;

      if (inv.type === 0) {
        c2d.shadowColor = "rgba(239, 68, 68, 0.75)";
        c2d.strokeStyle = "rgba(239, 68, 68, 0.85)";
      } else if (inv.type === 1) {
        c2d.shadowColor = getColorHex(ctx.colorPreset, 0.6);
        c2d.strokeStyle = getColorHex(ctx.colorPreset, 0.85);
      } else {
        c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.6);
        c2d.strokeStyle = getColorSecondaryHex(ctx.colorPreset, 0.85);
      }

      // Drawing cute geometric wireframe crab space invaders
      c2d.beginPath();
      c2d.moveTo(inv.x + 6, iy);
      c2d.lineTo(inv.x + inv.width - 6, iy);
      c2d.lineTo(inv.x + inv.width, iy + inv.height / 2);
      c2d.lineTo(inv.x + inv.width - 4, iy + inv.height);
      c2d.lineTo(inv.x + 4, iy + inv.height);
      c2d.lineTo(inv.x, iy + inv.height / 2);
      c2d.closePath();
      c2d.stroke();

      // Antenna segments
      c2d.beginPath();
      c2d.moveTo(inv.x + 8, iy);
      c2d.lineTo(inv.x + 4, iy - 4);
      c2d.moveTo(inv.x + inv.width - 8, iy);
      c2d.lineTo(inv.x + inv.width - 4, iy - 4);
      c2d.stroke();

      // Core microchips dots inside them
      c2d.fillStyle = c2d.strokeStyle;
      c2d.fillRect(inv.x + inv.width / 2 - 2, iy + inv.height / 2 - 2, 4, 4);
      c2d.restore();
    });

    // Draw floating power-up capsules.
    this.powerups.forEach((p) => {
      const meta = POWER_META[p.kind];
      c2d.save();
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

    // Draw Hero spaceship (vector spacefighter). Blink while invulnerable.
    c2d.save();
    if (this.invuln > 0) {
      c2d.globalAlpha = Math.floor(Date.now() / 100) % 2 === 0 ? 0.35 : 0.85;
    }
    c2d.shadowBlur = 15;
    c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.9);
    c2d.strokeStyle = "#ffffff";
    c2d.lineWidth = 2;
    c2d.fillStyle = getColorHex(ctx.colorPreset, 0.25);

    c2d.beginPath();
    c2d.moveTo(this.playerShipX, this.playerShipY - 14);
    c2d.lineTo(this.playerShipX + this.shipWidth / 2, this.playerShipY + 6);
    c2d.lineTo(this.playerShipX + 8, this.playerShipY);
    c2d.lineTo(this.playerShipX - 8, this.playerShipY);
    c2d.lineTo(this.playerShipX - this.shipWidth / 2, this.playerShipY + 6);
    c2d.closePath();
    c2d.stroke();
    c2d.fill();

    // Thrust jet flares
    c2d.fillStyle = "rgba(244, 63, 94, 0.95)";
    c2d.beginPath();
    c2d.moveTo(this.playerShipX - 4, this.playerShipY + 4);
    c2d.lineTo(this.playerShipX, this.playerShipY + 11 + Math.random() * 6);
    c2d.lineTo(this.playerShipX + 4, this.playerShipY + 4);
    c2d.closePath();
    c2d.fill();
    c2d.restore();

    // Shield bubble while the SHIELD power-up is active.
    if (this.shieldTimer > 0) {
      c2d.save();
      const breaking = this.shieldTimer < 90 && Math.floor(Date.now() / 120) % 2 === 0;
      c2d.globalAlpha = breaking ? 0.3 : 0.7;
      c2d.shadowBlur = 12;
      c2d.shadowColor = "rgba(52, 211, 153, 0.9)";
      c2d.strokeStyle = "rgba(52, 211, 153, 0.9)";
      c2d.lineWidth = 2;
      c2d.beginPath();
      c2d.arc(this.playerShipX, this.playerShipY - 2, this.shipWidth / 2 + 9, 0, Math.PI * 2);
      c2d.stroke();
      c2d.restore();
    }

    // Draw Active Bullets
    this.bullets.forEach(b => {
      c2d.save();
      c2d.shadowBlur = 9;
      if (b.isEnemy) {
        c2d.shadowColor = "rgba(239, 68, 68, 0.95)";
        c2d.fillStyle = "rgba(239, 68, 68, 0.95)";
        c2d.fillRect(b.x - 2, b.y - 4, 4, 8);
      } else {
        c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.95);
        c2d.fillStyle = "#ffffff";
        c2d.fillRect(b.x - 1.5, b.y - 7, 3, 9);
      }
      c2d.restore();
    });

    // Draw HUD variables overlay for developer aesthetics
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`SECTOR_DEFENSE: LVL ${this.shooterLevel}`, 8, ctx.canvas.height - 8);
    c2d.fillText(`VIRUS_INDEX: ${this.invaders.length}`, 130, ctx.canvas.height - 8);

    c2d.textAlign = "right";
    c2d.fillStyle = getColorSecondaryHex(ctx.colorPreset, 0.7);
    c2d.fillText(`LIVES: ${Math.max(0, this.lives)}/${this.maxLives}`, ctx.canvas.width - 8, ctx.canvas.height - 8);
    c2d.textAlign = "left";

    // Active power-up readout (top-left).
    const buffs: { t: string; c: string }[] = [];
    if (this.rapidTimer > 0) buffs.push({ t: `RAPID ${(this.rapidTimer / 60).toFixed(0)}s`, c: POWER_META.RAPID.color });
    if (this.spreadTimer > 0) buffs.push({ t: `SPREAD ${(this.spreadTimer / 60).toFixed(0)}s`, c: POWER_META.SPREAD.color });
    if (this.shieldTimer > 0) buffs.push({ t: `SHIELD ${(this.shieldTimer / 60).toFixed(0)}s`, c: POWER_META.SHIELD.color });
    c2d.font = "bold 9px monospace";
    buffs.forEach((b, idx) => {
      c2d.fillStyle = b.c;
      c2d.fillText(b.t, 8, 16 + idx * 12);
    });

    if (this.boss) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.5)";
      c2d.fillText("BOSS COMPROMISE COMPILING", 250, ctx.canvas.height - 8);
    }
  }
}
