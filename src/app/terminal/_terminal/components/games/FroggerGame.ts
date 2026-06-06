import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface VehicleLog {
  x: number;
  y: number;
  speed: number;
  width: number;
  isLog: boolean; // True is floating log, false is car obstacle
  color: string;
  submergeTimer?: number; // logs which sink periodically!
  isSubmerged?: boolean;
}

interface CoreSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  secured: boolean;
}

export class FroggerGame implements GameEngine {
  private playerX = 300;
  private playerY = 370;
  private readonly playerSize = 14;

  private obstacles: VehicleLog[] = [];
  private coreSlots: CoreSlot[] = [];
  private score = 0;
  private deathsCount = 0;
  private readonly maxLives = 3;
  private gameOver = false;

  init(): void {
    this.score = 0;
    this.deathsCount = 0;
    this.gameOver = false;
    this.playerX = 300;
    this.playerY = 370;

    this.initSlots();
    this.initObstacles();
  }

  private initSlots() {
    this.coreSlots = [
      { x: 50, y: 70, width: 44, height: 35, secured: false },
      { x: 170, y: 70, width: 44, height: 35, secured: false },
      { x: 290, y: 70, width: 44, height: 35, secured: false },
      { x: 410, y: 70, width: 44, height: 35, secured: false },
      { x: 530, y: 70, width: 44, height: 35, secured: false }
    ];
  }

  private initObstacles() {
    this.obstacles = [];

    // Lane Row 1: Heavy Transport Cars (moving slow Left)
    this.obstacles.push({ x: 100, y: 320, speed: -1.3, width: 65, isLog: false, color: "rgba(239, 68, 68, 0.9)" });
    this.obstacles.push({ x: 380, y: 320, speed: -1.3, width: 65, isLog: false, color: "rgba(239, 68, 68, 0.9)" });

    // Lane Row 2: Commuter Compact Cars (moving medium Right)
    this.obstacles.push({ x: 30, y: 280, speed: 1.8, width: 40, isLog: false, color: "rgba(244, 63, 94, 0.9)" });
    this.obstacles.push({ x: 280, y: 280, speed: 1.8, width: 40, isLog: false, color: "rgba(244, 63, 94, 0.9)" });
    this.obstacles.push({ x: 490, y: 280, speed: 1.8, width: 40, isLog: false, color: "rgba(244, 63, 94, 0.9)" });

    // Lane Row 3: Supercell Firewalls (moving extremely rapid Left)
    this.obstacles.push({ x: 150, y: 240, speed: -3.0, width: 35, isLog: false, color: "rgba(217, 70, 239, 0.95)" });
    this.obstacles.push({ x: 450, y: 240, speed: -3.0, width: 35, isLog: false, color: "rgba(217, 70, 239, 0.95)" });

    // River Row 4: Small Swift Logs (floating Left)
    this.obstacles.push({ x: 50, y: 190, speed: -1.1, width: 75, isLog: true, color: "rgba(16, 185, 129, 0.8)", submergeTimer: 0, isSubmerged: false });
    this.obstacles.push({ x: 250, y: 190, speed: -1.1, width: 75, isLog: true, color: "rgba(16, 185, 129, 0.8)", submergeTimer: 180, isSubmerged: false });
    this.obstacles.push({ x: 450, y: 190, speed: -1.1, width: 75, isLog: true, color: "rgba(16, 185, 129, 0.8)", submergeTimer: 360, isSubmerged: false });

    // River Row 5: Huge Secure Logs (floating Right)
    this.obstacles.push({ x: 100, y: 150, speed: 1.4, width: 110, isLog: true, color: "rgba(52, 211, 153, 0.85)" });
    this.obstacles.push({ x: 400, y: 150, speed: 1.4, width: 110, isLog: true, color: "rgba(52, 211, 153, 0.85)" });

    // River Row 6: Overdrive Wave Logs (floating Left)
    this.obstacles.push({ x: 180, y: 110, speed: -1.8, width: 90, isLog: true, color: "rgba(16, 185, 129, 0.8)", submergeTimer: 90, isSubmerged: false });
    this.obstacles.push({ x: 480, y: 110, speed: -1.8, width: 90, isLog: true, color: "rgba(16, 185, 129, 0.8)", submergeTimer: 270, isSubmerged: false });
  }

  private handleDeath(ctx: GameContext) {
    if (this.gameOver) return;
    this.deathsCount++;
    ctx.playRetroSFX("CRASH");

    // Out of lives: end the run (previously the game never ended).
    if (this.deathsCount >= this.maxLives) {
      this.gameOver = true;
      ctx.checkAndSaveHighScore(this.score);
      ctx.setGameState("GAMEOVER");
      return;
    }

    // Respawn at the starting bank for the next life.
    this.playerX = 300;
    this.playerY = 370;
  }

  private keyCooldowns: Record<string, boolean> = {};

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed } = input;
    const speedFactor = ctx.speedFactor;

    // Difficulty multipliers based on score
    const speedMultiplier = 1.0 + (this.score / 220); // vehicles speed up
    const sinkingTriggerChance = this.score >= 50;  // logs start submerging at 50 pts

    // --------------------------------------------
    // Handle hopping movement with input debounce checks
    // --------------------------------------------
    const hopSize = 40;
    const directions = [
      { key: "ArrowLeft", code: "KeyA", dx: -hopSize, dy: 0 },
      { key: "ArrowRight", code: "KeyD", dx: hopSize, dy: 0 },
      { key: "ArrowUp", code: "KeyW", dx: 0, dy: -hopSize },
      { key: "ArrowDown", code: "KeyS", dx: 0, dy: hopSize }
    ];

    directions.forEach(dir => {
      const isPressed = keysPressed[dir.key] || keysPressed[dir.code];
      const activeCooldown = this.keyCooldowns[dir.key];

      if (isPressed && !activeCooldown) {
        this.playerX += dir.dx;
        this.playerY += dir.dy;
        this.keyCooldowns[dir.key] = true;
        ctx.playRetroSFX("LAUNCH");

        // Keep inside bounds
        this.playerX = Math.min(Math.max(this.playerX, 20), ctx.canvas.width - 20);
        this.playerY = Math.min(Math.max(this.playerY, 50), ctx.canvas.height - 30);
      } else if (!isPressed) {
        this.keyCooldowns[dir.key] = false;
      }
    });

    // --------------------------------------------
    // Move obstacles and manage log submerging timers
    // --------------------------------------------
    let onLog = false;
    let logCarrierSpeed = 0;

    this.obstacles.forEach(obs => {
      // Scale scroll movement velocity dynamically
      obs.x += obs.speed * speedFactor * speedMultiplier;

      // Wrap-around borders
      if (obs.speed > 0 && obs.x > ctx.canvas.width + 50) {
        obs.x = -obs.width;
      } else if (obs.speed < 0 && obs.x < -obs.width - 50) {
        obs.x = ctx.canvas.width;
      }

      // Sinking mechanics on certain logs (increases with scores)
      if (obs.isLog && obs.submergeTimer !== undefined) {
        obs.submergeTimer += speedFactor;
        
        // Cycle is: 180 frames active, 80 frames submerged
        const phaseMax = sinkingTriggerChance ? 220 : 9999;
        const subThreshold = sinkingTriggerChance ? 150 : 9999;
        
        const cycleCoord = obs.submergeTimer % phaseMax;
        obs.isSubmerged = cycleCoord > subThreshold;
      }

      // Collisions check (AABB overlaps)
      const pl = this.playerX - this.playerSize / 2;
      const pr = this.playerX + this.playerSize / 2;
      const pt = this.playerY - this.playerSize / 2;
      const pb = this.playerY + this.playerSize / 2;

      const ol = obs.x;
      const or = obs.x + obs.width;
      const ot = obs.y + 4;
      const ob = obs.y + 36;

      const overlapX = pr >= ol && pl <= or;
      const overlapY = pb >= ot && pt <= ob;

      if (overlapX && overlapY) {
        if (obs.isLog) {
          if (!obs.isSubmerged) {
            onLog = true;
            logCarrierSpeed = obs.speed * speedFactor * speedMultiplier;
          }
        } else {
          // Flattened by speeding car!
          this.handleDeath(ctx);
        }
      }
    });

    // --------------------------------------------
    // Float on logs logic
    // --------------------------------------------
    const inRiverLine = this.playerY >= 100 && this.playerY <= 220;
    if (inRiverLine) {
      if (onLog) {
        this.playerX += logCarrierSpeed; // Carry the frog horizontally with log velocity
        // River boundaries kill
        if (this.playerX < 15 || this.playerX > ctx.canvas.width - 15) {
          this.handleDeath(ctx);
        }
      } else {
        // Drowned in core water cells!
        this.handleDeath(ctx);
      }
    }

    // --------------------------------------------
    // Check Goal Slots arrivals
    // --------------------------------------------
    if (this.playerY <= 80) {
      let securedIndex = -1;
      
      this.coreSlots.forEach((slot, idx) => {
        if (!slot.secured && this.playerX >= slot.x && this.playerX <= slot.x + slot.width) {
          securedIndex = idx;
        }
      });

      if (securedIndex !== -1) {
        this.coreSlots[securedIndex].secured = true;
        this.score += 100;
        ctx.setScore(this.score);
        ctx.playRetroSFX("SECURE");

        // Respawn frog toward starting row
        this.playerX = 300;
        this.playerY = 370;

        // Reset slots wave if all 5 slots are compiled successfully
        const allSecured = this.coreSlots.every(s => s.secured);
        if (allSecured) {
          this.score += 500; // super bonus
          ctx.setScore(this.score);
          ctx.playRetroSFX("LEVELUP");
          this.initSlots();
        }
      } else {
        // Splat into top walls (missed the slot centers)
        this.handleDeath(ctx);
      }
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;
    const theme = ctx.colorPreset;

    // 🎨 DRAW BACKGROUND STRUCTURES (Road vs River)
    // 1. Water Core flow area
    c2d.fillStyle = "rgba(0, 15, 30, 0.95)";
    c2d.fillRect(0, 95, ctx.canvas.width, 140);
    
    // Wave grid accents
    c2d.strokeStyle = "rgba(4, 120, 220, 0.08)";
    c2d.lineWidth = 1;
    for (let x = 0; x < ctx.canvas.width; x += 30) {
      c2d.beginPath();
      c2d.moveTo(x + Math.sin(Date.now() * 0.003) * 10, 95);
      c2d.lineTo(x + Math.sin(Date.now() * 0.003) * 10, 235);
      c2d.stroke();
    }

    // 2. Safe highway dividers / starting platforms
    c2d.fillStyle = "rgba(255, 255, 255, 0.02)";
    c2d.fillRect(0, 350, ctx.canvas.width, 40); // Base lane row
    c2d.fillRect(0, 230, ctx.canvas.width, 10); // Center safe divider bank

    // 3. Render Slots boxes on top bank
    this.coreSlots.forEach(s => {
      c2d.save();
      c2d.shadowBlur = 6;
      if (s.secured) {
        c2d.shadowColor = getColorSecondaryHex(theme, 0.8);
        c2d.strokeStyle = getColorSecondaryHex(theme, 0.9);
        c2d.fillStyle = getColorSecondaryHex(theme, 0.22);
      } else {
        c2d.shadowColor = getColorHex(theme, 0.4);
        c2d.strokeStyle = getColorHex(theme, 0.5);
        c2d.fillStyle = "rgba(0,0,0,0.4)";
      }
      c2d.lineWidth = 1.6;
      c2d.fillRect(s.x, s.y, s.width, s.height);
      c2d.strokeRect(s.x, s.y, s.width, s.height);
      c2d.restore();

      // Draw compiled chip locked visual inside secured slots
      if (s.secured) {
        c2d.fillStyle = getColorSecondaryHex(theme, 0.95);
        c2d.fillRect(s.x + s.width / 2 - 6, s.y + s.height / 2 - 6, 12, 12);
        
        c2d.strokeStyle = "#ffffff";
        c2d.strokeRect(s.x + s.width / 2 - 6, s.y + s.height / 2 - 6, 12, 12);
      }
    });

    // --------------------------------------------
    // Draw Obstacles (Cars / Sinking Logs)
    // --------------------------------------------
    this.obstacles.forEach(obs => {
      c2d.save();
      c2d.shadowBlur = 8;
      c2d.shadowColor = obs.color;
      c2d.fillStyle = obs.color;
      c2d.lineWidth = 1.2;

      if (obs.isLog) {
        // Logs styling loops (Green packets banks)
        if (obs.isSubmerged) {
          c2d.globalAlpha = 0.05; // Invisible submerged logs danger
        } else if (obs.submergeTimer !== undefined && obs.submergeTimer % 220 > 120) {
          // Warning blinking pattern!
          c2d.globalAlpha = Math.floor(Date.now() / 100) % 2 === 0 ? 0.3 : 0.8;
        }

        c2d.fillRect(obs.x, obs.y + 4, obs.width, 32);
        
        // Log nodes horizontal accents
        c2d.strokeStyle = "rgba(0, 0, 0, 0.35)";
        c2d.beginPath();
        c2d.moveTo(obs.x + 8, obs.y + 12);
        c2d.lineTo(obs.x + obs.width - 8, obs.y + 12);
        c2d.moveTo(obs.x + 12, obs.y + 28);
        c2d.lineTo(obs.x + obs.width - 12, obs.y + 28);
        c2d.stroke();
      } else {
        // Vehicles detailing (Red/Fuchsia cyber trucks)
        c2d.fillRect(obs.x, obs.y + 6, obs.width, 28);
        
        c2d.fillStyle = "#ffffff";
        // Headlights glow directions based on scroll vector
        if (obs.speed > 0) {
          c2d.fillRect(obs.x + obs.width - 4, obs.y + 10, 4, 3);
          c2d.fillRect(obs.x + obs.width - 4, obs.y + 27, 4, 3);
        } else {
          c2d.fillRect(obs.x, obs.y + 10, 4, 3);
          c2d.fillRect(obs.x, obs.y + 27, 4, 3);
        }
      }
      c2d.restore();
    });

    // --------------------------------------------
    // Draw Frog player (Green telemetry microchip)
    // --------------------------------------------
    c2d.save();
    c2d.shadowBlur = 12;
    c2d.shadowColor = "rgba(34, 197, 94, 0.95)";
    c2d.strokeStyle = "#ffffff";
    c2d.fillStyle = "rgba(34, 197, 94, 0.9)";
    c2d.lineWidth = 1.8;

    c2d.beginPath();
    // Microchip frog circular shape
    c2d.arc(this.playerX, this.playerY, this.playerSize / 2, 0, Math.PI * 2);
    c2d.fill();
    c2d.stroke();

    // Small connector terminals as legs (cyber accents!)
    c2d.strokeStyle = "rgba(34, 197, 94, 0.95)";
    c2d.lineWidth = 2.0;
    c2d.beginPath();
    c2d.moveTo(this.playerX - 6, this.playerY - 4);
    c2d.lineTo(this.playerX - 11, this.playerY - 8);
    c2d.moveTo(this.playerX + 6, this.playerY - 4);
    c2d.lineTo(this.playerX + 11, this.playerY - 8);
    c2d.moveTo(this.playerX - 6, this.playerY + 4);
    c2d.lineTo(this.playerX - 11, this.playerY + 8);
    c2d.moveTo(this.playerX + 6, this.playerY + 4);
    c2d.lineTo(this.playerX + 11, this.playerY + 8);
    c2d.stroke();
    c2d.restore();

    // Core secure slot status bar overlay
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`CHIPS SECURED: ${this.coreSlots.filter(s => s.secured).length}/5`, 8, ctx.canvas.height - 8);
    c2d.fillStyle = "rgba(34, 197, 94, 0.6)";
    c2d.fillText(`LIVES: ${Math.max(0, this.maxLives - this.deathsCount)}/${this.maxLives}`, 120, ctx.canvas.height - 8);
    
    if (this.score >= 50) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.55)";
      c2d.fillText("WARNING: SUB-SURFACE LOG DECAY DETECTED", 215, ctx.canvas.height - 8);
    }
  }
}
