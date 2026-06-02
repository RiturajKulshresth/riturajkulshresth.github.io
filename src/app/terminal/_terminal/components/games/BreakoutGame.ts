import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  durability: number;
  maxDurability: number;
  type: "normal" | "fortified" | "quantum";
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

export class BreakoutGame implements GameEngine {
  private paddleWidth = 95;
  private paddleHeight = 12;
  private paddleX = 0;
  
  private ballX = 0;
  private ballY = 0;
  private ballSpeedX = 4;
  private ballSpeedY = -4;
  private ballRadius = 6.5;
  private baseBallSpeed = 4.5;
  
  private bricks: Brick[] = [];
  private particles: Particle[] = [];
  private score = 0;
  private stepDownTimer = 0;
  private stepDownInterval = 1200; // frames before bricks step down
  
  private colorRows = 5;
  private bricksPerRow = 9;
  private brickWidth = 56;
  private brickHeight = 16;
  private brickPadding = 6;
  private offsetTop = 45;
  private offsetLeft = 24;

  init(ctx: GameContext): void {
    this.score = 0;
    this.paddleWidth = 95;
    this.paddleX = (ctx.canvas.width - this.paddleWidth) / 2;
    this.ballX = ctx.canvas.width / 2;
    this.ballY = ctx.canvas.height - 40;
    this.baseBallSpeed = 4.5;
    
    const angle = (Math.random() * 0.4 + 0.3) * Math.PI; // Launch angle
    this.ballSpeedX = Math.cos(angle) * this.baseBallSpeed * (Math.random() > 0.5 ? 1 : -1);
    this.ballSpeedY = -this.baseBallSpeed;
    
    this.stepDownTimer = 0;
    this.particles = [];
    this.initBricks();
  }

  private initBricks() {
    this.bricks = [];
    for (let r = 0; r < this.colorRows; r++) {
      for (let c = 0; c < this.bricksPerRow; c++) {
        const type = Math.random() > 0.85 ? "quantum" : r === 0 ? "fortified" : "normal";
        const maxHp = type === "fortified" ? 2 : 1;
        this.bricks.push({
          x: c * (this.brickWidth + this.brickPadding) + this.offsetLeft,
          y: r * (this.brickHeight + this.brickPadding) + this.offsetTop,
          width: this.brickWidth,
          height: this.brickHeight,
          durability: maxHp,
          maxDurability: maxHp,
          type: type
        });
      }
    }
  }

  private createParticles(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2.5 + 1.5,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed, mouseX } = input;
    const speedFactor = ctx.speedFactor;

    // Difficulty-scaling attributes dynamically calculated
    this.paddleWidth = Math.max(50, 95 - Math.floor(this.score / 60) * 5);
    const speedMultiplier = 1.0 + (this.score / 500); // Ball moves faster as game score ramps up

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

    // Keyboard controls
    if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
      this.paddleX = Math.max(this.paddleX - 7 * speedFactor, 0);
    } else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
      this.paddleX = Math.min(this.paddleX + 7 * speedFactor, ctx.canvas.width - this.paddleWidth);
    } else {
      // Smooth dragging mouse lock fallback
      const targetX = mouseX - this.paddleWidth / 2;
      this.paddleX += (targetX - this.paddleX) * 0.25;
      this.paddleX = Math.min(Math.max(this.paddleX, 0), ctx.canvas.width - this.paddleWidth);
    }

    // Ball movement with speed scales
    this.ballX += this.ballSpeedX * speedFactor * speedMultiplier;
    this.ballY += this.ballSpeedY * speedFactor * speedMultiplier;

    // Left/Right wall bouncers
    if (this.ballX - this.ballRadius <= 0) {
      this.ballX = this.ballRadius;
      this.ballSpeedX = Math.abs(this.ballSpeedX);
      ctx.playRetroSFX("COLLIDE");
      this.createParticles(0, this.ballY, getColorHex(ctx.colorPreset, 0.6), 4);
    } else if (this.ballX + this.ballRadius >= ctx.canvas.width) {
      this.ballX = ctx.canvas.width - this.ballRadius;
      this.ballSpeedX = -Math.abs(this.ballSpeedX);
      ctx.playRetroSFX("COLLIDE");
      this.createParticles(ctx.canvas.width, this.ballY, getColorHex(ctx.colorPreset, 0.6), 4);
    }

    // Ceiling bounce
    if (this.ballY - this.ballRadius <= 0) {
      this.ballY = this.ballRadius;
      this.ballSpeedY = Math.abs(this.ballSpeedY);
      ctx.playRetroSFX("COLLIDE");
      this.createParticles(this.ballX, 0, getColorHex(ctx.colorPreset, 0.6), 4);
    }

    // Timeout: periodic descent of remaining firewall blocks (difficulty)
    this.stepDownTimer += speedFactor;
    if (this.stepDownTimer >= this.stepDownInterval) {
      this.stepDownTimer = 0;
      this.bricks.forEach(b => {
        b.y += 8;
      });
      ctx.playRetroSFX("COLLIDE");
      // Check if any blocks crossed the threshold to reach the danger line
      const overBounds = this.bricks.some(b => b.durability > 0 && b.y + b.height >= ctx.canvas.height - 40);
      if (overBounds) {
        ctx.setGameState("GAMEOVER");
        ctx.playRetroSFX("CRASH");
        ctx.checkAndSaveHighScore(this.score);
        return;
      }
    }

    // Paddle interaction overlay checks
    if (this.ballY + this.ballRadius >= ctx.canvas.height - 25 && this.ballY - this.ballRadius <= ctx.canvas.height - 13) {
      if (this.ballX >= this.paddleX && this.ballX <= this.paddleX + this.paddleWidth) {
        this.ballSpeedY = -Math.abs(this.ballSpeedY);
        // Dynamic direction deflection math based on hit coordinate offset
        const paddleCenter = this.paddleX + this.paddleWidth / 2;
        const hitOffset = (this.ballX - paddleCenter) / (this.paddleWidth / 2);
        this.ballSpeedX = hitOffset * 6.5;
        
        ctx.playRetroSFX("LAUNCH");
        this.createParticles(this.ballX, ctx.canvas.height - 25, getColorSecondaryHex(ctx.colorPreset, 0.9), 6);
      }
    }

    // Behind safety/dead lines fail check
    if (this.ballY + this.ballRadius >= ctx.canvas.height) {
      ctx.setGameState("GAMEOVER");
      ctx.playRetroSFX("CRASH");
      ctx.checkAndSaveHighScore(this.score);
      return;
    }

    // Collision tests with Brick matrix
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      if (b.durability <= 0) continue;

      if (
        this.ballX + this.ballRadius >= b.x &&
        this.ballX - this.ballRadius <= b.x + b.width &&
        this.ballY + this.ballRadius >= b.y &&
        this.ballY - this.ballRadius <= b.y + b.height
      ) {
        // Resolve bounding bounce direction vectors
        const leftEdgeDiff = Math.abs((this.ballX + this.ballRadius) - b.x);
        const rightEdgeDiff = Math.abs((this.ballX - this.ballRadius) - (b.x + b.width));
        const topEdgeDiff = Math.abs((this.ballY + this.ballRadius) - b.y);
        const bottomEdgeDiff = Math.abs((this.ballY - this.ballRadius) - (b.y + b.height));

        const minOverlap = Math.min(leftEdgeDiff, rightEdgeDiff, topEdgeDiff, bottomEdgeDiff);

        if (minOverlap === leftEdgeDiff || minOverlap === rightEdgeDiff) {
          this.ballSpeedX = -this.ballSpeedX;
        } else {
          this.ballSpeedY = -this.ballSpeedY;
        }

        b.durability--;
        
        let reward = 10;
        let pColor = getColorHex(ctx.colorPreset, 0.9);
        if (b.type === "fortified") {
          reward = b.durability === 0 ? 30 : 10;
          pColor = "#ffffff";
        } else if (b.type === "quantum") {
          reward = 50;
          pColor = `hsl(${Math.floor(Date.now() / 6) % 360}, 90%, 65%)`;
          ctx.playRetroSFX("SECURE");
        }

        this.score += reward;
        ctx.setScore(this.score);
        ctx.playRetroSFX("EAT");

        // Fire hit particles
        this.createParticles(this.ballX, this.ballY, pColor, 10);

        // Grid completed checking
        const activeBricks = this.bricks.filter(item => item.durability > 0);
        if (activeBricks.length === 0) {
          ctx.setGameState("VICTORY");
          ctx.playRetroSFX("LEVELUP");
          ctx.checkAndSaveHighScore(this.score);
        }
        break;
      }
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;

    // Particles drawing
    this.particles.forEach(p => {
      c2d.save();
      c2d.globalAlpha = p.life;
      c2d.shadowBlur = 6;
      c2d.shadowColor = p.color;
      c2d.fillStyle = p.color;
      c2d.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      c2d.restore();
    });

    // Draw defensive bottom deadline hazard warning softly
    c2d.strokeStyle = "rgba(239, 68, 68, 0.08)";
    c2d.lineWidth = 2;
    c2d.setLineDash([4, 12]);
    c2d.beginPath();
    c2d.moveTo(0, ctx.canvas.height - 25);
    c2d.lineTo(ctx.canvas.width, ctx.canvas.height - 25);
    c2d.stroke();
    c2d.setLineDash([]); // clear dash

    // Draw Bricks with styling loops
    this.bricks.forEach(b => {
      if (b.durability <= 0) return;

      c2d.save();
      c2d.shadowBlur = 4;
      c2d.strokeStyle = getColorHex(ctx.colorPreset, 0.4);
      c2d.lineWidth = 1;

      if (b.type === "quantum") {
        const rColor = `hsl(${Math.floor(Date.now() / 12 + b.x) % 360}, 90%, 55%)`;
        c2d.shadowColor = rColor;
        c2d.fillStyle = rColor;
      } else if (b.type === "fortified") {
        c2d.shadowColor = "#ffffff";
        c2d.strokeStyle = "rgba(255, 255, 255, 0.85)";
        c2d.fillStyle = b.durability === 1 ? getColorHex(ctx.colorPreset, 0.5) : "rgba(255, 255, 255, 0.85)";
      } else {
        c2d.shadowColor = getColorHex(ctx.colorPreset, 0.5);
        c2d.fillStyle = getColorHex(ctx.colorPreset, 0.6);
      }

      c2d.fillRect(b.x + 1, b.y + 1, b.width - 2, b.height - 2);
      c2d.strokeRect(b.x, b.y, b.width, b.height);
      c2d.restore();

      // Durability crack marks for fortified bricks
      if (b.type === "fortified" && b.durability === 1) {
        c2d.strokeStyle = "rgba(0,0,0,0.4)";
        c2d.lineWidth = 1.5;
        c2d.beginPath();
        c2d.moveTo(b.x + 5, b.y + 5);
        c2d.lineTo(b.x + b.width / 2, b.y + b.height - 4);
        c2d.lineTo(b.x + b.width - 8, b.y + 3);
        c2d.stroke();
      }
    });

    // Draw player paddle with aesthetic design lines
    c2d.save();
    c2d.shadowBlur = 12;
    c2d.shadowColor = getColorHex(ctx.colorPreset, 0.9);
    c2d.fillStyle = getColorHex(ctx.colorPreset, 0.85);
    c2d.fillRect(this.paddleX, ctx.canvas.height - 25, this.paddleWidth, this.paddleHeight);

    // Grid nodes on paddle tips
    c2d.fillStyle = "#ffffff";
    c2d.fillRect(this.paddleX + 1, ctx.canvas.height - 25, 4, this.paddleHeight);
    c2d.fillRect(this.paddleX + this.paddleWidth - 5, ctx.canvas.height - 25, 4, this.paddleHeight);
    c2d.restore();

    // Draw ball with neon energy glow
    c2d.save();
    c2d.shadowBlur = 14;
    c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.95);
    c2d.fillStyle = "#ffffff";
    c2d.beginPath();
    c2d.arc(this.ballX, this.ballY, this.ballRadius, 0, 2 * Math.PI);
    c2d.fill();
    c2d.restore();

    // Draw HUD metrics overlay
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`PADDLE_SPAN: ${this.paddleWidth}PX`, 8, ctx.canvas.height - 8);
    c2d.fillText(`REMAINING_BLOCKS: ${this.bricks.filter(b => b.durability > 0).length}`, 110, ctx.canvas.height - 8);

    // Warning alert warning for step down timer
    const timeRatio = this.stepDownTimer / this.stepDownInterval;
    if (timeRatio > 0.75) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.6)";
      c2d.fillText("▼ FIREWALL COMPRESS ALERT ▼", 215, ctx.canvas.height - 8);
    }
  }
}
