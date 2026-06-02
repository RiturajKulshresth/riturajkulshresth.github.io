import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Pillar {
  x: number;
  gapY: number; // Y center of gap
  gapHeight: number;
  width: number;
  passed: boolean;
  oscillationRange: number; // dynamically oscillates!
  oscillationSpeed: number;
  phase: number;
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

export class FlappyGame implements GameEngine {
  private nodeY = 200;
  private nodeVelocity = 0;
  private readonly nodeRadius = 8;
  private readonly gravity = 0.28;
  private readonly jumpForce = -5.4;

  private pillars: Pillar[] = [];
  private score = 0;
  private particles: Particle[] = [];
  private distanceTraveled = 0;

  init(ctx: GameContext): void {
    this.score = 0;
    this.nodeY = ctx.canvas.height / 2;
    this.nodeVelocity = 0;
    this.particles = [];
    this.distanceTraveled = 0;

    this.spawnPillars(ctx.canvas.width);
  }

  private spawnPillars(canvasWidth: number) {
    this.pillars = [];
    const pillarCount = 3;
    const spacing = 220;

    for (let i = 0; i < pillarCount; i++) {
      this.pillars.push({
        x: canvasWidth + 100 + i * spacing,
        gapY: 140 + Math.random() * 140, // y offset
        gapHeight: 110, // opening size
        width: 48,
        passed: false,
        oscillationRange: 0,
        oscillationSpeed: 0,
        phase: Math.random() * Math.PI * 2
      });
    }
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
        size: Math.random() * 2.5 + 1.5,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.02
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed, mouseClicked } = input;
    const speedFactor = ctx.speedFactor;

    // Difficulty scaling thresholds
    const difficultyLevel = Math.floor(this.score / 20); // 0, 1, 2...
    const scrollSpeed = (2.2 + Math.min(2.5, (this.score / 15))) * speedFactor;
    const currentGapHeight = Math.max(76, 110 - (difficultyLevel * 6));

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

    // Input flap detection (Space, ArrowUp, W or direct Canvas Click)
    const justPressedFlap = keysPressed["Space"] || keysPressed["ArrowUp"] || keysPressed["KeyW"] || mouseClicked;

    if (justPressedFlap) {
      this.nodeVelocity = this.jumpForce;
      ctx.playRetroSFX("LAUNCH");

      // Emit trailing jump sparks
      this.createParticles(70, this.nodeY, getColorSecondaryHex(ctx.colorPreset, 0.65), 3);
    }

    // Apply gravity
    this.nodeVelocity += this.gravity * speedFactor;
    this.nodeY += this.nodeVelocity * speedFactor;

    // Ceiling / Floor boundaries
    if (this.nodeY + this.nodeRadius >= ctx.canvas.height - 12) {
      // Crash floor
      ctx.setGameState("GAMEOVER");
      ctx.playRetroSFX("CRASH");
      ctx.checkAndSaveHighScore(this.score);
      return;
    }
    if (this.nodeY - this.nodeRadius <= 0) {
      this.nodeY = this.nodeRadius + 2;
      this.nodeVelocity = 0.5; // stop rising, bump down
    }

    // Move and update Pillars
    const spacing = 220;
    this.pillars.forEach((p) => {
      p.x -= scrollSpeed;
      p.gapHeight = currentGapHeight;

      // Vertical oscillation increases with score (difficulty!)
      if (this.score >= 10) {
        p.oscillationRange = Math.min(65, (this.score - 5) * 1.5);
        p.oscillationSpeed = 0.015 + Math.min(0.02, (this.score * 0.0005));
        p.phase += p.oscillationSpeed * speedFactor;
        p.gapY = 170 + Math.sin(p.phase) * p.oscillationRange;
      }

      // Check passing boundaries
      if (!p.passed && p.x + p.width / 2 < 70) {
        p.passed = true;
        this.score += 10;
        ctx.setScore(this.score);
        ctx.playRetroSFX("EAT");

        // Flash pass particles
        this.createParticles(70, this.nodeY, "rgba(255,255,255,0.7)", 8);
      }

      // Collisions check (AABB box style against cylindrical pillars / laser fences)
      const playerX = 70;
      if (playerX + this.nodeRadius >= p.x && playerX - this.nodeRadius <= p.x + p.width) {
        const gapTop = p.gapY - p.gapHeight / 2;
        const gapBottom = p.gapY + p.gapHeight / 2;

        if (this.nodeY - this.nodeRadius <= gapTop || this.nodeY + this.nodeRadius >= gapBottom) {
          // Crash pillar!
          this.createParticles(playerX, this.nodeY, "rgba(239, 68, 68, 0.95)", 18);
          ctx.setGameState("GAMEOVER");
          ctx.playRetroSFX("CRASH");
          ctx.checkAndSaveHighScore(this.score);
        }
      }

      // Recycle Pillars
      if (p.x + p.width < -50) {
        let maxRightX = -1;
        this.pillars.forEach(item => { if (item.x > maxRightX) maxRightX = item.x; });

        p.x = maxRightX + spacing;
        p.gapY = 130 + Math.random() * 140;
        p.passed = false;
        p.phase = Math.random() * Math.PI * 2;
      }
    });
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;
    const colorTheme = ctx.colorPreset;

    // Draw background scrolllines representing diagnostic matrix
    c2d.save();
    c2d.strokeStyle = getColorHex(colorTheme, 0.03);
    c2d.lineWidth = 1;
    this.distanceTraveled += 0.85;
    const bgOffset = this.distanceTraveled % 40;
    for (let x = -bgOffset; x < ctx.canvas.width; x += 40) {
      c2d.beginPath();
      c2d.moveTo(x, 0);
      c2d.lineTo(x, ctx.canvas.height);
      c2d.stroke();
    }
    c2d.restore();

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

    // Draw Pillars/Wall gates (vector pillars)
    this.pillars.forEach(p => {
      c2d.save();
      c2d.shadowBlur = 8;
      c2d.shadowColor = getColorHex(colorTheme, 0.55);
      c2d.strokeStyle = getColorHex(colorTheme, 0.82);
      c2d.fillStyle = getColorHex(colorTheme, 0.18);
      c2d.lineWidth = 1.6;

      const gapTop = p.gapY - p.gapHeight / 2;
      const gapBottom = p.gapY + p.gapHeight / 2;

      // Top pillar segment
      c2d.fillRect(p.x, 0, p.width, gapTop);
      c2d.strokeRect(p.x, -2, p.width, gapTop + 2);

      // Bottom pillar segment
      c2d.fillRect(p.x, gapBottom, p.width, ctx.canvas.height - gapBottom);
      c2d.strokeRect(p.x, gapBottom, p.width, ctx.canvas.height - gapBottom + 2);

      // Warning nodes on endpoints
      c2d.fillStyle = getColorSecondaryHex(colorTheme, 0.9);
      c2d.fillRect(p.x - 2, gapTop - 8, p.width + 4, 8);
      c2d.fillRect(p.x - 2, gapBottom, p.width + 4, 8);
      
      // Connecting force-fields lasers softly inside gateways
      c2d.strokeStyle = "rgba(239, 68, 68, 0.1)";
      c2d.lineWidth = 1.0;
      c2d.beginPath();
      c2d.moveTo(p.x + p.width/2, gapTop);
      c2d.lineTo(p.x + p.width/2, gapBottom);
      c2d.stroke();

      c2d.restore();
    });

    // Draw quantum processing node package
    c2d.save();
    c2d.shadowBlur = 12;
    c2d.shadowColor = getColorSecondaryHex(colorTheme, 0.95);
    c2d.fillStyle = "#ffffff";
    c2d.beginPath();
    c2d.arc(70, this.nodeY, this.nodeRadius, 0, Math.PI * 2);
    c2d.fill();

    // Orbital ring
    const rotationAngle = (Date.now() * 0.01) % (Math.PI * 2);
    c2d.strokeStyle = getColorSecondaryHex(colorTheme, 0.6);
    c2d.lineWidth = 1.3;
    c2d.beginPath();
    c2d.arc(70, this.nodeY, this.nodeRadius * 1.7, rotationAngle, rotationAngle + Math.PI);
    c2d.stroke();
    c2d.restore();

    // HUD items
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    const difficultyLevel = Math.floor(this.score / 20);
    const gapHeight = Math.max(76, 110 - (difficultyLevel * 6));
    c2d.fillText(`GATEWAY_OPEN: ${gapHeight}UM`, 8, ctx.canvas.height - 8);
    c2d.fillText(`TELEMETRY_VEL: ${(this.nodeVelocity * 10).toFixed(0)}m/s`, 120, ctx.canvas.height - 8);
    
    if (this.score >= 10) {
      c2d.fillStyle = "rgba(16, 185, 129, 0.4)";
      c2d.fillText(`GATE_OSCILLATION: ACTIVE`, 215, ctx.canvas.height - 8);
    }
  }
}
