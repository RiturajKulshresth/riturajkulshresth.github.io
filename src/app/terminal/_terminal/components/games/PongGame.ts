import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

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

interface CentralObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  angle: number;
}

export class PongGame implements GameEngine {
  private playerY = 170;
  private cpuY = 170;
  private ballX = 300;
  private ballY = 200;
  private ballSpeedX = 4;
  private ballSpeedY = 2;
  
  private readonly paddleWidth = 10;
  private readonly paddleHeight = 55;
  private score = 0;
  private particles: Particle[] = [];
  private obstacle: CentralObstacle = { x: 290, y: 180, width: 20, height: 40, active: false, angle: 0 };
  private consecutiveHits = 0;

  init(ctx: GameContext): void {
    this.score = 0;
    this.playerY = (ctx.canvas.height - this.paddleHeight) / 2;
    this.cpuY = (ctx.canvas.height - this.paddleHeight) / 2;
    this.ballX = ctx.canvas.width / 2;
    this.ballY = ctx.canvas.height / 2;
    
    this.ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
    this.ballSpeedY = (Math.random() - 0.5) * 4;
    
    this.consecutiveHits = 0;
    this.particles = [];
    this.obstacle = {
      x: 292,
      y: 170,
      width: 16,
      height: 60,
      active: false,
      angle: 0
    };
  }

  private createRipple(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2 + 1.5,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.03
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed, mouseY } = input;
    const speedFactor = ctx.speedFactor;

    // Difficulty Scaling Parameters
    const difficultyLevel = Math.floor(this.score / 50); // 0, 1, 2...
    const paddleScalingFactor = Math.max(35, this.paddleHeight - (difficultyLevel * 3)); // paddle shrinks!
    
    // Toggle central obstacle active on high score difficulty
    this.obstacle.active = this.score >= 40;
    if (this.obstacle.active) {
      this.obstacle.angle += 0.02 * speedFactor;
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
    // Player movement controls (Keyboard / Direct Mouse)
    // --------------------------------------------
    let playerMoveDir = 0;
    const oldPlayerY = this.playerY;

    if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) {
      this.playerY = Math.max(10, this.playerY - 6.5 * speedFactor);
      playerMoveDir = -1;
    } else if (keysPressed["ArrowDown"] || keysPressed["KeyS"]) {
      this.playerY = Math.min(ctx.canvas.height - paddleScalingFactor - 10, this.playerY + 6.5 * speedFactor);
      playerMoveDir = 1;
    } else {
      // Smooth tracking of mouseY centered on the paddle
      const paddleCenter = paddleScalingFactor / 2;
      const targetY = mouseY - paddleCenter;
      this.playerY += (targetY - this.playerY) * 0.25;
      this.playerY = Math.min(Math.max(this.playerY, 10), ctx.canvas.height - paddleScalingFactor - 10);
      playerMoveDir = Math.sign(this.playerY - oldPlayerY);
    }

    // --------------------------------------------
    // CPU Smart AI tracking controls
    // --------------------------------------------
    // CPU reaction increases dynamically with score, making AI super-smart!
    const cpuReactivity = Math.min(0.85, 0.22 + (this.score * 0.005));
    const cpuLimitSpeed = (3.5 + Math.min(4.0, (this.score / 35))) * speedFactor; // speed cap

    const cpuCenter = this.cpuY + paddleScalingFactor / 2;
    const cpuTargetDiff = this.ballY - cpuCenter;

    if (Math.abs(cpuTargetDiff) > 8) {
      const step = cpuTargetDiff * cpuReactivity;
      const clampedStep = Math.min(Math.max(step, -cpuLimitSpeed), cpuLimitSpeed);
      this.cpuY = Math.min(Math.max(10, this.cpuY + clampedStep), ctx.canvas.height - paddleScalingFactor - 10);
    }

    // --------------------------------------------
    // Ball movement with incremental acceleration
    // --------------------------------------------
    // General kinetic scaler
    const speedBoost = 1.0 + (this.consecutiveHits * 0.04);
    this.ballX += this.ballSpeedX * speedFactor * speedBoost;
    this.ballY += this.ballSpeedY * speedFactor * speedBoost;

    // Ball Wall bounce physics (Top & Bottom)
    if (this.ballY - 4 <= 10) {
      this.ballY = 14;
      this.ballSpeedY = Math.abs(this.ballSpeedY);
      this.createRipple(this.ballX, 10, getColorHex(ctx.colorPreset, 0.5), 4);
      ctx.playRetroSFX("COLLIDE");
    } else if (this.ballY + 4 >= ctx.canvas.height - 10) {
      this.ballY = ctx.canvas.height - 14;
      this.ballSpeedY = -Math.abs(this.ballSpeedY);
      this.createRipple(this.ballX, ctx.canvas.height - 10, getColorHex(ctx.colorPreset, 0.5), 4);
      ctx.playRetroSFX("COLLIDE");
    }

    // --------------------------------------------
    // Obstacle Center deflection
    // --------------------------------------------
    if (this.obstacle.active) {
      const obs = this.obstacle;
      // Rough bounding box checks
      if (
        this.ballX + 4 >= obs.x &&
        this.ballX - 4 <= obs.x + obs.width &&
        this.ballY + 4 >= obs.y &&
        this.ballY - 4 <= obs.y + obs.height
      ) {
        // Reverse direction and randomize angle deflection
        this.ballSpeedX = -Math.sign(this.ballSpeedX) * (3.5 + Math.random() * 2);
        this.ballSpeedY = (Math.random() - 0.5) * 6;
        
        ctx.playRetroSFX("COLLIDE");
        this.createRipple(this.ballX, this.ballY, "rgba(239, 68, 68, 0.8)", 8);
      }
    }

    // --------------------------------------------
    // Ball-Paddle checks (Left/Player)
    // --------------------------------------------
    const playerPaddleEdgeX = 24 + this.paddleWidth;
    
    if (this.ballX - 4 <= playerPaddleEdgeX && this.ballX + 4 >= 24) {
      if (this.ballY >= this.playerY && this.ballY <= this.playerY + paddleScalingFactor) {
        this.ballX = playerPaddleEdgeX + 4;
        
        // Paddle Hit Vectoring physics based on position (higher angle on tips)
        const relativePosition = (this.ballY - (this.playerY + paddleScalingFactor / 2)) / (paddleScalingFactor / 2);
        this.ballSpeedX = Math.abs(this.ballSpeedX);
        this.ballSpeedY = relativePosition * 4.5 + (playerMoveDir * 0.8); // Apply Spin
        
        this.consecutiveHits++;
        this.score += 5;
        ctx.setScore(this.score);
        ctx.playRetroSFX("EAT");
        this.createRipple(this.ballX, this.ballY, getColorSecondaryHex(ctx.colorPreset, 0.9), 10);
      }
    }

    // Ball-Paddle checks (Right/CPU)
    const cpuPaddleEdgeX = 566;
    if (this.ballX + 4 >= cpuPaddleEdgeX && this.ballX - 4 <= 566 + this.paddleWidth) {
      if (this.ballY >= this.cpuY && this.ballY <= this.cpuY + paddleScalingFactor) {
        this.ballX = cpuPaddleEdgeX - 4;
        
        const relativePosition = (this.ballY - (this.cpuY + paddleScalingFactor / 2)) / (paddleScalingFactor / 2);
        this.ballSpeedX = -Math.abs(this.ballSpeedX);
        this.ballSpeedY = relativePosition * 4.5;
        
        this.consecutiveHits++;
        ctx.playRetroSFX("COLLIDE");
        this.createRipple(this.ballX, this.ballY, "rgba(255,255,255,0.7)", 8);
      }
    }

    // --------------------------------------------
    // Left/Right Dead Margins Checks
    // --------------------------------------------
    if (this.ballX < 0) {
      // Player lost
      ctx.setGameState("GAMEOVER");
      ctx.playRetroSFX("CRASH");
      ctx.checkAndSaveHighScore(this.score);
    } else if (this.ballX > ctx.canvas.width) {
      // CPU bypass scoring reward
      this.score += 25;
      ctx.setScore(this.score);
      ctx.playRetroSFX("SECURE");
      
      // Particle burst inside cpu goal
      this.createRipple(ctx.canvas.width - 10, this.ballY, "rgba(236,72,153,0.9)", 16);

      // Reset Ball location towards center toward CPU
      this.ballX = ctx.canvas.width / 2;
      this.ballY = ctx.canvas.height / 2;
      this.ballSpeedX = -4.0;
      this.ballSpeedY = (Math.random() - 0.5) * 4;
      this.consecutiveHits = 0;
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;
    const difficultyLevel = Math.floor(this.score / 50);
    const paddleScalingFactor = Math.max(35, this.paddleHeight - (difficultyLevel * 3));

    // Midfield dashed grid boundaries
    c2d.save();
    c2d.strokeStyle = getColorHex(ctx.colorPreset, 0.15);
    c2d.lineWidth = 2;
    c2d.setLineDash([6, 12]);
    c2d.beginPath();
    c2d.moveTo(ctx.canvas.width / 2, 0);
    c2d.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
    c2d.stroke();
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

    // Draw central obstacle if active (rotating firewall barrier block)
    if (this.obstacle.active) {
      c2d.save();
      c2d.translate(this.obstacle.x + this.obstacle.width / 2, this.obstacle.y + this.obstacle.height / 2);
      c2d.rotate(this.obstacle.angle);
      
      c2d.shadowBlur = 10;
      c2d.shadowColor = "rgba(239, 68, 68, 0.8)";
      c2d.strokeStyle = "rgba(239, 68, 68, 0.95)";
      c2d.fillStyle = "rgba(239, 68, 68, 0.25)";
      c2d.lineWidth = 1.5;
      
      const rx = -this.obstacle.width / 2;
      const ry = -this.obstacle.height / 2;
      c2d.fillRect(rx, ry, this.obstacle.width, this.obstacle.height);
      c2d.strokeRect(rx, ry, this.obstacle.width, this.obstacle.height);
      
      // visual warning hazard icon inside obstacle rotation
      c2d.beginPath();
      c2d.moveTo(rx + 2, ry + 15);
      c2d.lineTo(rx + this.obstacle.width - 2, ry + 15);
      c2d.stroke();
      
      c2d.restore();
    }

    // Draw Left Player Paddle structure
    c2d.save();
    c2d.shadowBlur = 10;
    c2d.shadowColor = getColorHex(ctx.colorPreset, 0.92);
    c2d.fillStyle = getColorHex(ctx.colorPreset, 0.9);
    c2d.fillRect(24, this.playerY, this.paddleWidth, paddleScalingFactor);
    
    // Core visual strip
    c2d.fillStyle = "#ffffff";
    c2d.fillRect(26, this.playerY + 2, 2, paddleScalingFactor - 4);
    c2d.restore();

    // Draw Right CPU Paddle
    c2d.save();
    c2d.shadowBlur = 10;
    c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.85);
    c2d.fillStyle = getColorSecondaryHex(ctx.colorPreset, 0.85);
    c2d.fillRect(566, this.cpuY, this.paddleWidth, paddleScalingFactor);
    c2d.restore();

    // Draw Ball
    c2d.save();
    c2d.shadowBlur = 12;
    c2d.shadowColor = "#ffffff";
    c2d.fillStyle = "#ffffff";
    c2d.fillRect(this.ballX - 4, this.ballY - 4, 8, 8);
    c2d.restore();

    // HUD labels
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`CHANNEL_LOAD: ${(1.0 + this.consecutiveHits * 0.04).toFixed(2)}X`, 8, ctx.canvas.height - 8);
    c2d.fillText(`AI_REACTION_PULSE: ${Math.floor(difficultyLevel * 15 + 40)}%`, 140, ctx.canvas.height - 8);
    
    if (this.obstacle.active) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.55)";
      c2d.fillText("WARNING: CENTRAL CORE FLOATER DETECTED", 280, ctx.canvas.height - 8);
    }
  }
}
