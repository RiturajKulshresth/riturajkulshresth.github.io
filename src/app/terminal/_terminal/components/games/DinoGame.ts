import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Hurdle {
  x: number;
  width: number;
  height: number;
  type: "cactus_small" | "cactus_large" | "bird_low" | "bird_high";
  speed: number;
  wingPhase?: number;
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

export class DinoGame implements GameEngine {
  private dinoY = 320;
  private dinoVy = 0;
  private dinoOnGround = true;
  private isDucking = false;

  private readonly gravity = 0.35;
  private readonly jumpForce = -6.4;
  private readonly groundY = 320; // Dino baseline feet

  private obstacles: Hurdle[] = [];
  private particles: Particle[] = [];
  private score = 0;

  private dayTime = true;
  private timeCycle = 0;

  init(ctx: GameContext): void {
    this.score = 0;
    this.dinoY = this.groundY;
    this.dinoVy = 0;
    this.dinoOnGround = true;
    this.isDucking = false;
    this.dayTime = true;
    this.timeCycle = 0;

    this.obstacles = [];
    this.particles = [];

    this.spawnObstacle(ctx.canvas.width);
  }

  private spawnObstacle(canvasWidth: number, startX?: number) {
    const rx = startX !== undefined ? startX : canvasWidth + 100;
    const rand = Math.random();

    let type: "cactus_small" | "cactus_large" | "bird_low" | "bird_high" = "cactus_small";
    let width = 14;
    let height = 24;

    if (rand > 0.72) {
      type = "cactus_large";
      width = 22;
      height = 36;
    } else if (rand > 0.44 && this.score >= 40) {
      // Birds spawn only after 40 points
      type = "bird_high"; // Must duck under
      width = 24;
      height = 14;
    } else if (rand > 0.22 && this.score >= 40) {
      type = "bird_low"; // Must jump over
      width = 24;
      height = 14;
    }

    this.obstacles.push({
      x: rx,
      width,
      height,
      type,
      speed: 4.5,
      wingPhase: Math.random() * Math.PI
    });
  }

  private createParticles(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2 + 1,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed, mouseClicked } = input;
    const speedFactor = ctx.speedFactor;

    // Difficulty scrolls faster as index score expands
    const scrollSpeed = (4.5 + Math.min(3.5, this.score / 120)) * speedFactor;

    // Day/Night compiled inverted matrices cycle periodic details (every 800 frames)
    this.timeCycle += speedFactor;
    if (this.timeCycle >= 800) {
      this.dayTime = !this.dayTime;
      this.timeCycle = 0;
      ctx.playRetroSFX("SECURE");
    }

    // Check Crouch / Duck keys holds
    this.isDucking = !!(keysPressed["ArrowDown"] || keysPressed["KeyS"]);

    // Handle Jump keyboard controllers
    const jumpRequest = keysPressed["Space"] || keysPressed["ArrowUp"] || keysPressed["KeyW"] || mouseClicked;

    if (jumpRequest && this.dinoOnGround && !this.isDucking) {
      this.dinoVy = this.jumpForce;
      this.dinoOnGround = false;
      ctx.playRetroSFX("LAUNCH");

      // Jump dust kick particles
      this.createParticles(120, this.groundY + 12, getColorHex(ctx.colorPreset, 0.45), 4);
    }

    // Apply gravity
    if (!this.dinoOnGround) {
      this.dinoVy += this.gravity * speedFactor;
      this.dinoY += this.dinoVy * speedFactor;

      // Check ground intersections
      if (this.dinoY >= this.groundY) {
        this.dinoY = this.groundY;
        this.dinoVy = 0;
        this.dinoOnGround = true;
      }
    }

    // Tick score
    this.score += 0.08 * speedFactor; // Progressive increments
    ctx.setScore(Math.floor(this.score));

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

    // Obstacles updates
    if (this.obstacles.length < 2 && Math.random() < 0.008) {
      this.spawnObstacle(ctx.canvas.width);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const h = this.obstacles[i];
      // Scroll from right to left
      h.x -= scrollSpeed;

      // Animate birds wing flap
      if (h.type.startsWith("bird") && h.wingPhase !== undefined) {
        h.wingPhase += 0.2 * speedFactor;
      }

      // Collisions check (Dino hitbox bounds)
      const dinoHeight = this.isDucking ? 18 : 34;
      const dinoWidth = 24;
      const pl = 110;
      const pr = pl + dinoWidth;
      const pt = this.dinoY + (this.isDucking ? 16 : 0);
      const pb = this.dinoY + 34;

      const ol = h.x;
      const or = h.x + h.width;
      
      // Vertical hit boxes
      let ot = this.groundY + 34 - h.height;
      if (h.type === "bird_high") {
        ot = this.groundY + 4; // high ducking bird height
      } else if (h.type === "bird_low") {
        ot = this.groundY + 20; // low bird height requires jump
      }
      const ob = ot + h.height;

      const collideX = pr >= ol && pl <= or;
      const collideY = pb >= ot && pt <= ob;

      if (collideX && collideY) {
        this.createParticles(pl + 12, pt + 10, getColorSecondaryHex(ctx.colorPreset, 0.95), 18);
        ctx.setGameState("GAMEOVER");
        ctx.playRetroSFX("CRASH");
        ctx.checkAndSaveHighScore(Math.floor(this.score));
        return;
      }

      // Recycle hurdles
      if (h.x + h.width < -30) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;
    const theme = ctx.colorPreset;

    // Apply periodic Day/Night reversing inverted design palettes
    if (!this.dayTime) {
      c2d.fillStyle = "rgba(255, 255, 255, 0.05)";
      c2d.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // Draw baseline ground wireframe
    c2d.save();
    c2d.strokeStyle = getColorHex(theme, this.dayTime ? 0.2 : 0.4);
    c2d.lineWidth = 1.6;
    c2d.beginPath();
    c2d.moveTo(0, this.groundY + 34);
    c2d.lineTo(ctx.canvas.width, this.groundY + 34);
    c2d.stroke();
    c2d.restore();

    // Ground spikes details
    c2d.fillStyle = getColorHex(theme, 0.05);
    const scrollLinesOdd = Math.floor(Date.now() / 60) % 40;
    for (let x = -scrollLinesOdd; x < ctx.canvas.width; x += 40) {
      c2d.fillRect(x, this.groundY + 36, 12, 1);
    }

    // Draw Particles
    this.particles.forEach(p => {
      c2d.save();
      c2d.globalAlpha = p.life;
      c2d.shadowBlur = 5;
      c2d.shadowColor = p.color;
      c2d.fillStyle = p.color;
      c2d.fillRect(p.x, p.y, p.size, p.size);
      c2d.restore();
    });

    // Draw obstacles (Cactus hurdles & Flying birds)
    this.obstacles.forEach(h => {
      c2d.save();
      c2d.shadowBlur = 6;
      c2d.shadowColor = getColorHex(theme, 0.5);
      c2d.strokeStyle = getColorHex(theme, 0.82);
      c2d.fillStyle = getColorHex(theme, 0.25);
      c2d.lineWidth = 1.5;

      let ot = this.groundY + 34 - h.height;
      if (h.type === "bird_high") {
        ot = this.groundY + 4;
      } else if (h.type === "bird_low") {
        ot = this.groundY + 20;
      }

      if (h.type.startsWith("bird")) {
        // Draw vector flying cyber-bird/pterodactyl malware
        c2d.beginPath();
        c2d.moveTo(h.x, ot + h.height / 2);
        c2d.lineTo(h.x + h.width / 2, ot);
        c2d.lineTo(h.x + h.width, ot + h.height / 2);
        
        // Wing flaps phase calculations
        const wingYOffset = Math.sin(h.wingPhase || 0) * 12;
        c2d.lineTo(h.x + h.width / 2, ot + h.height / 2 + wingYOffset);
        c2d.closePath();
        c2d.stroke();
        c2d.fill();
        
        // head dot
        c2d.fillStyle = getColorHex(theme, 0.95);
        c2d.fillRect(h.x, ot + h.height / 2 - 2, 4, 4);
      } else {
        // Draw vector Cactus plants grid
        c2d.strokeRect(h.x, ot, h.width, h.height);
        c2d.fillRect(h.x, ot, h.width, h.height);

        // side arms for larger cactus
        if (h.type === "cactus_large") {
          c2d.strokeRect(h.x - 5, ot + 6, 5, 8);
          c2d.strokeRect(h.x + h.width, ot + 12, 5, 8);
        }
      }
      c2d.restore();
    });

    // Draw player T-Rex dino (Green wireframe)
    c2d.save();
    c2d.shadowBlur = 12;
    c2d.shadowColor = getColorSecondaryHex(theme, 0.9);
    c2d.strokeStyle = "#ffffff";
    c2d.fillStyle = getColorHex(theme, 0.35);
    c2d.lineWidth = 1.8;

    const dinoHeight = this.isDucking ? 18 : 34;
    const dy = this.dinoY + (this.isDucking ? 16 : 0);

    // Draw geometric T-Rex character layout
    c2d.beginPath();
    c2d.moveTo(110, dy + dinoHeight);
    c2d.lineTo(110, dy + 8);
    c2d.lineTo(120, dy);
    c2d.lineTo(134, dy); // Head cap
    c2d.lineTo(134, dy + 8); // muzzle
    c2d.lineTo(126, dy + 12); // mouth clamp
    
    if (this.isDucking) {
      c2d.lineTo(134, dy + 18);
    } else {
      c2d.lineTo(124, dy + 18); // center chest
      c2d.lineTo(124, dy + 28);
    }
    
    c2d.lineTo(118, dy + dinoHeight); // rear legs
    c2d.closePath();
    c2d.stroke();
    c2d.fill();

    // Eye segment blinking
    c2d.fillStyle = "#ffffff";
    c2d.fillRect(122, dy + 3, 3, 3);
    c2d.restore();

    // Diagnostics overlays
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    const visualSpeed = 4.5 + Math.min(3.5, this.score / 120);
    c2d.fillText(`CHRONO_COMPRESSION_VEL: ${visualSpeed.toFixed(1)}x`, 8, ctx.canvas.height - 8);
    c2d.fillText(`MODE_PHASE: ${this.dayTime ? "DAY_CYCLE" : "NIGHT_REVERSED"}`, 160, ctx.canvas.height - 8);
  }
}
export default DinoGame;
