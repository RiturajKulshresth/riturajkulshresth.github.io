import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface MazeDot {
  x: number;
  y: number;
  isSuper: boolean;
  active: boolean;
  isAlertTrigger?: boolean;
}

interface Ghost {
  x: number;
  y: number;
  color: string;
  speed: number;
  baseSpeed: number;
  dirX: number;
  dirY: number;
  mode: "chase" | "scatter" | "frightened";
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

export class PacmanGame implements GameEngine {
  private playerX = 300;
  private playerY = 200;
  private playerDirX = 0;
  private playerDirY = 0;
  private nextDirX = 0;
  private nextDirY = 0;
  private playerSpeed = 3.5;

  private dots: MazeDot[] = [];
  private ghosts: Ghost[] = [];
  private particles: Particle[] = [];
  private score = 0;

  // Mode durations timers
  private frightenedTimer = 0;
  private modeTimer = 0;
  private globalMode: "chase" | "scatter" = "scatter";

  private triggerTimer = 0; // alarm alerted trigger (ghosts override behaviors)

  init(ctx: GameContext): void {
    this.score = 0;
    this.playerX = 300;
    this.playerY = 240;
    this.playerDirX = 0;
    this.playerDirY = 0;
    this.nextDirX = 0;
    this.nextDirY = 0;
    this.playerSpeed = 3.5;

    this.frightenedTimer = 0;
    this.modeTimer = 0;
    this.globalMode = "scatter";
    this.triggerTimer = 0;
    this.particles = [];

    this.initDots();
    this.initGhosts();
  }

  private initDots() {
    this.dots = [];
    const minX = 60;
    const maxX = 540;
    const minY = 60;
    const maxY = 340;
    const spacing = 40;

    for (let x = minX; x <= maxX; x += spacing) {
      for (let y = minY; y <= maxY; y += spacing) {
        // Keep center safe
        if (Math.abs(x - 300) < 50 && Math.abs(y - 200) < 50) continue;

        // Random chance of power pellet / alarm trigger nodes
        const rand = Math.random();
        const isSuper = rand > 0.94;
        const isAlertTrigger = !isSuper && rand < 0.08;

        this.dots.push({
          x,
          y,
          isSuper,
          isAlertTrigger,
          active: true
        });
      }
    }
  }

  private initGhosts() {
    this.ghosts = [
      // Red: Blinky (pure tracking)
      { x: 100, y: 100, color: "rgba(239, 68, 68, 0.95)", speed: 1.5, baseSpeed: 1.5, dirX: 1, dirY: 0, mode: "scatter" },
      // Pink: Pinky (intercepts path)
      { x: 500, y: 100, color: "rgba(236, 72, 153, 0.95)", speed: 1.3, baseSpeed: 1.3, dirX: -1, dirY: 0, mode: "scatter" },
      // Cyan: Inky (random pathing / scatter patrol)
      { x: 100, y: 300, color: "rgba(6, 182, 212, 0.95)", speed: 1.2, baseSpeed: 1.2, dirX: 0, dirY: -1, mode: "scatter" },
      // Amber: Clyde (eccentric coward)
      { x: 500, y: 300, color: "rgba(245, 158, 11, 0.95)", speed: 1.1, baseSpeed: 1.1, dirX: 0, dirY: 1, mode: "scatter" }
    ];
  }

  private createParticles(x: number, y: number, color: string, count = 10) {
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
        decay: Math.random() * 0.05 + 0.03
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed } = input;
    const speedFactor = ctx.speedFactor;

    // Difficulty velocity increments as index score expands
    const progressiveVelocity = Math.min(1.0, this.score / 600);
    const speedMultiplier = 1.0 + progressiveVelocity;

    // Decrease alarmed status timers
    if (this.triggerTimer > 0) this.triggerTimer -= speedFactor;

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
    // Keyboard inputs and buffered direction steers
    // --------------------------------------------
    if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) { this.nextDirX = -1; this.nextDirY = 0; }
    if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) { this.nextDirX = 1; this.nextDirY = 0; }
    if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) { this.nextDirX = 0; this.nextDirY = -1; }
    if (keysPressed["ArrowDown"] || keysPressed["KeyS"]) { this.nextDirX = 0; this.nextDirY = 1; }

    // Validate the buffered steer immediately
    this.playerDirX = this.nextDirX;
    this.playerDirY = this.nextDirY;

    // Apply translation vectors
    this.playerX += this.playerDirX * this.playerSpeed * speedFactor * speedMultiplier;
    this.playerY += this.playerDirY * this.playerSpeed * speedFactor * speedMultiplier;

    // Maze looping wrap borders
    if (this.playerX < 20) this.playerX = ctx.canvas.width - 20;
    if (this.playerX > ctx.canvas.width - 20) this.playerX = 20;
    if (this.playerY < 20) this.playerY = ctx.canvas.height - 20;
    if (this.playerY > ctx.canvas.height - 20) this.playerY = 20;

    // --------------------------------------------
    // Manage Global AI Mode Cycles
    // --------------------------------------------
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= speedFactor;
    } else {
      this.modeTimer += speedFactor;
      // Cycles is: 300 frames scatter, 600 frames chase
      if (this.globalMode === "scatter" && this.modeTimer > 350) {
        this.globalMode = "chase";
        this.modeTimer = 0;
      } else if (this.globalMode === "chase" && this.modeTimer > 700) {
        this.globalMode = "scatter";
        this.modeTimer = 0;
      }
    }

    // --------------------------------------------
    // Grid Dots Collisions Scavenging
    // --------------------------------------------
    this.dots.forEach(d => {
      if (!d.active) return;

      const dx = Math.abs(this.playerX - d.x);
      const dy = Math.abs(this.playerY - d.y);
      if (dx < 14 && dy < 14) {
        d.active = false;
        
        let pointValue = 10;
        let particleColor = getColorHex(ctx.colorPreset, 0.7);

        // Power Pellet triggered
        if (d.isSuper) {
          pointValue = 50;
          this.frightenedTimer = 350; // Active frightened ghosts duration
          ctx.playRetroSFX("SECURE");
          particleColor = "rgba(236,72,153,0.95)";
        } 
        // Warning Alarm block triggered (difficulty progressive complication)
        else if (d.isAlertTrigger) {
          pointValue = -25; // Deduce score penalty
          this.triggerTimer = 180; // 3 seconds of direct alert coordinates track
          ctx.playRetroSFX("COLLIDE");
          particleColor = "rgba(239, 68, 68, 0.95)";
        } else {
          ctx.playRetroSFX("EAT");
        }

        this.score += pointValue;
        ctx.setScore(this.score);

        this.createParticles(d.x, d.y, particleColor, 6);

        // Regenerate maze if all dots compiled successfully
        const activeCount = this.dots.filter(item => item.active).length;
        if (activeCount === 0) {
          this.score += 250;
          ctx.setScore(this.score);
          ctx.playRetroSFX("LEVELUP");
          this.initDots();
        }
      }
    });

    // --------------------------------------------
    // Ghosts Pathing AI & Collisions check
    // --------------------------------------------
    this.ghosts.forEach(g => {
      // Set current individual mode state
      g.mode = this.frightenedTimer > 0 ? "frightened" : this.globalMode;

      // Slower speed during frightened mode, else progressively faster
      const ghostCurrentSpeedScale = g.mode === "frightened" ? 0.65 : speedMultiplier;
      g.speed = g.baseSpeed * ghostCurrentSpeedScale;

      // 1. Decipher targeted block coordinates based on Mode State
      let targetX = 300;
      let targetY = 200;

      if (this.triggerTimer > 0) {
        // Direct coordinates pinging alarm tracker overwrite!
        targetX = this.playerX;
        targetY = this.playerY;
      } else if (g.mode === "frightened") {
        // Random scattering
        targetX = Math.random() * ctx.canvas.width;
        targetY = Math.random() * ctx.canvas.height;
      } else if (g.mode === "scatter") {
        // Corners patrolling
        if (g.color.includes("239, 68")) { targetX = 40; targetY = 40; } // blinking blinky top left
        else if (g.color.includes("236, 72")) { targetX = 560; targetY = 40; } // pinky top right
        else if (g.color.includes("6, 182")) { targetX = 40; targetY = 360; } // inky bottom left
        else { targetX = 560; targetY = 360; } // clyde bottom right
      } else {
        // Chase Mode: Blinky pursues, Pinky intercepts
        if (g.color.includes("239, 68")) {
          targetX = this.playerX;
          targetY = this.playerY;
        } else if (g.color.includes("236, 72")) {
          targetX = this.playerX + this.playerDirX * 80;
          targetY = this.playerY + this.playerDirY * 80;
        } else {
          targetX = this.playerX;
          targetY = this.playerY;
        }
      }

      // Simple grid intersection decision trees
      const ghostGridTimer = 10;
      if (Math.random() < 0.08) {
        const dx = targetX - g.x;
        const dy = targetY - g.y;
        
        // Pick optimal vector path
        if (Math.abs(dx) > Math.abs(dy)) {
          g.dirX = Math.sign(dx);
          g.dirY = 0;
        } else {
          g.dirY = Math.sign(dy);
          g.dirX = 0;
        }
      }

      // Translate Ghost coordinates
      g.x += g.dirX * g.speed * speedFactor;
      g.y += g.dirY * g.speed * speedFactor;

      // Wrap-around ghosts too
      if (g.x < 10) g.x = ctx.canvas.width - 20;
      if (g.x > ctx.canvas.width - 10) g.x = 20;
      if (g.y < 10) g.y = ctx.canvas.height - 20;
      if (g.y > ctx.canvas.height - 10) g.y = 20;

      // Collisions check against player Pacman
      const distToPlayer = Math.sqrt(Math.pow(this.playerX - g.x, 2) + Math.pow(this.playerY - g.y, 2));
      if (distToPlayer < 18) {
        if (g.mode === "frightened") {
          // Devoured the ghost virus! Secure system award
          this.score += 200;
          ctx.setScore(this.score);
          ctx.playRetroSFX("SECURE");
          this.createParticles(g.x, g.y, "#ffffff", 15);

          // Return ghost back home
          g.x = 300;
          g.y = 100;
        } else {
          // Flattened by active malware virus
          this.createParticles(this.playerX, this.playerY, "rgba(239, 68, 68, 0.95)", 20);
          ctx.setGameState("GAMEOVER");
          ctx.playRetroSFX("CRASH");
          ctx.checkAndSaveHighScore(this.score);
        }
      }
    });
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;
    const theme = ctx.colorPreset;

    // Draw central node ghost house bounds
    c2d.strokeStyle = getColorHex(theme, 0.1);
    c2d.lineWidth = 2;
    c2d.strokeRect(230, 140, 140, 100);

    // Draw grid wires walls softly in maze-like structures
    c2d.strokeStyle = getColorHex(theme, 0.05);
    c2d.lineWidth = 1;
    for (let x = 40; x < ctx.canvas.width; x += 80) {
      c2d.strokeRect(x, 40, 50, 320);
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

    // Draw Grid Dots
    this.dots.forEach(d => {
      if (!d.active) return;

      c2d.save();
      if (d.isSuper) {
        c2d.shadowBlur = 10;
        c2d.shadowColor = "rgba(236,72,153,0.85)";
        c2d.fillStyle = "rgba(236,72,153,0.95)";
        c2d.beginPath();
        c2d.arc(d.x, d.y, 6.5, 0, Math.PI * 2);
        c2d.fill();
      } else if (d.isAlertTrigger) {
        c2d.shadowBlur = 8;
        c2d.shadowColor = "rgba(239, 68, 68, 0.6)";
        c2d.strokeStyle = "rgba(239, 68, 68, 0.9)";
        c2d.lineWidth = 1.2;
        c2d.strokeRect(d.x - 4, d.y - 4, 8, 8);
      } else {
        c2d.fillStyle = getColorHex(theme, 0.55);
        c2d.fillRect(d.x - 2, d.y - 2, 4, 4);
      }
      c2d.restore();
    });

    // Draw Ghost Viruses
    this.ghosts.forEach(g => {
      c2d.save();
      c2d.shadowBlur = 8;

      let drawColor = g.color;
      if (g.mode === "frightened") {
        // Blink pattern when freighted timer is starting to expire
        const blinking = this.frightenedTimer < 100 && Math.floor(Date.now() / 150) % 2 === 0;
        drawColor = blinking ? "#ffffff" : "rgba(59, 130, 246, 0.95)"; // blue frightened mode
      }

      c2d.shadowColor = drawColor;
      c2d.strokeStyle = drawColor;
      c2d.fillStyle = "rgba(0,0,0,0.45)";
      c2d.lineWidth = 1.8;

      // Vector cyber capsule ghost shape
      c2d.beginPath();
      c2d.arc(g.x, g.y, 10, Math.PI, 0, false);
      c2d.lineTo(g.x + 10, g.y + 12);
      // Zigzag bottom tentacles
      c2d.lineTo(g.x + 5, g.y + 8);
      c2d.lineTo(g.x, g.y + 12);
      c2d.lineTo(g.x - 5, g.y + 8);
      c2d.lineTo(g.x - 10, g.y + 12);
      c2d.closePath();
      c2d.stroke();
      c2d.fill();

      // Draw virus blinking scanner optic lenses
      c2d.fillStyle = g.mode === "frightened" ? "#ff00ff" : "#ffffff";
      c2d.fillRect(g.x - 6, g.y - 4, 4, 4);
      c2d.fillRect(g.x + 2, g.y - 4, 4, 4);

      c2d.restore();
    });

    // Draw hero player (Pacman wedge disk with mouth biting anim)
    c2d.save();
    c2d.shadowBlur = 12;
    c2d.shadowColor = "rgba(251, 191, 36, 0.95)";
    c2d.fillStyle = "rgba(251, 191, 36, 0.95)";
    c2d.beginPath();

    // Dynamically calculate biting chomps angle using sine functions
    const biteChomp = 0.22 * Math.abs(Math.sin(Date.now() * 0.015));
    let startAngle = biteChomp;
    let endAngle = 2 * Math.PI - biteChomp;

    // Adjust mouth orientation based on movement vectors
    g_rotate_mesh: {
      if (this.playerDirX === -1) { startAngle = Math.PI + biteChomp; endAngle = Math.PI - biteChomp + 2 * Math.PI; }
      else if (this.playerDirY === -1) { startAngle = 1.5 * Math.PI + biteChomp; endAngle = 1.5 * Math.PI - biteChomp + 2 * Math.PI; }
      else if (this.playerDirY === 1) { startAngle = 0.5 * Math.PI + biteChomp; endAngle = 0.5 * Math.PI - biteChomp + 2 * Math.PI; }
    }

    c2d.arc(this.playerX, this.playerY, 11, startAngle, endAngle, false);
    c2d.lineTo(this.playerX, this.playerY);
    c2d.closePath();
    c2d.fill();
    c2d.restore();

    // Core diagnostics HUD overlay
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    const progressiveVelocity = Math.min(1.0, this.score / 600);
    const speedMultiplier = 1.0 + progressiveVelocity;
    c2d.fillText(`CHASE_PROG_V: ${speedMultiplier.toFixed(2)}X`, 8, ctx.canvas.height - 8);
    c2d.fillText(`ACTIVE_PACKETS: ${this.dots.filter(d => d.active).length}`, 120, ctx.canvas.height - 8);

    if (this.frightenedTimer > 0) {
      c2d.fillStyle = "rgba(59, 130,  blue, 0.6)";
      c2d.fillStyle = "rgba(236,72,153,0.7)";
      c2d.fillText(`VIRUS_FREIGHT: ${(this.frightenedTimer / 10).toFixed(0)}s`, 215, ctx.canvas.height - 8);
    } else if (this.triggerTimer > 0) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.7)";
      c2d.fillText(`VIRUS_ALARM_TRACKER: ACTIVE`, 215, ctx.canvas.height - 8);
    }
  }
}
