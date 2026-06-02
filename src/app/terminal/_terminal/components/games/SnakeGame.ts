import { GameEngine, GameInput, GameContext, getColorHex, getColorSecondaryHex } from "./types";

interface Segment {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export class SnakeGame implements GameEngine {
  private gridSize = 20;
  private snake: Segment[] = [];
  private snakeDir = "RIGHT";
  private snakeNextDir = "RIGHT";
  private dataPacket = { x: 18, y: 10 };
  private superPacket = { x: -1, y: -1, duration: 0 };
  private snakeTimer = 0;
  private score = 0;
  private obstacles: Segment[] = [];
  private particles: Particle[] = [];

  init(ctx: GameContext): void {
    this.snake = [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 },
    ];
    this.snakeDir = "RIGHT";
    this.snakeNextDir = "RIGHT";
    this.dataPacket = { x: 18, y: 10 };
    this.superPacket = { x: -1, y: -1, duration: 0 };
    this.snakeTimer = 0;
    this.score = 0;
    this.obstacles = [];
    this.particles = [];
  }

  private spawnDataPacket(cols: number, rows: number): void {
    let attempts = 0;
    while (attempts < 200) {
      const rx = Math.floor(Math.random() * cols);
      const ry = Math.floor(Math.random() * rows);
      const onSnake = this.snake.some(seg => seg.x === rx && seg.y === ry);
      const onObstacle = this.obstacles.some(obs => obs.x === rx && obs.y === ry);

      if (!onSnake && !onObstacle) {
        this.dataPacket = { x: rx, y: ry };
        break;
      }
      attempts++;
    }
  }

  private addObstacles(cols: number, rows: number): void {
    // Spawn a static obstacle node when score climbs to make game harder
    let attempts = 0;
    while (attempts < 100) {
      const rx = Math.floor(Math.random() * cols);
      const ry = Math.floor(Math.random() * rows);
      
      // Keep away from snake head & immediate front path
      const distanceToHead = Math.abs(rx - this.snake[0].x) + Math.abs(ry - this.snake[0].y);
      const onSnake = this.snake.some(seg => seg.x === rx && seg.y === ry);
      const onFood = (this.dataPacket.x === rx && this.dataPacket.y === ry) || 
                     (this.superPacket.x === rx && this.superPacket.y === ry);
      const onObstacle = this.obstacles.some(obs => obs.x === rx && obs.y === ry);

      if (distanceToHead > 3 && !onSnake && !onFood && !onObstacle) {
        this.obstacles.push({ x: rx, y: ry });
        break;
      }
      attempts++;
    }
  }

  private createParticles(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        life: 1,
        maxLife: Math.random() * 20 + 20
      });
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed } = input;
    const speedFactor = ctx.speedFactor;

    // Track input
    if ((keysPressed["ArrowLeft"] || keysPressed["KeyA"]) && this.snakeDir !== "RIGHT") this.snakeNextDir = "LEFT";
    if ((keysPressed["ArrowRight"] || keysPressed["KeyD"]) && this.snakeDir !== "LEFT") this.snakeNextDir = "RIGHT";
    if ((keysPressed["ArrowUp"] || keysPressed["KeyW"]) && this.snakeDir !== "DOWN") this.snakeNextDir = "UP";
    if ((keysPressed["ArrowDown"] || keysPressed["KeyS"]) && this.snakeDir !== "UP") this.snakeNextDir = "DOWN";

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Process tick timing (adjusting speed dynamically as score rises)
    this.snakeTimer += speedFactor;
    // Base speed: moves every X frames. Slower means higher value, faster means lower value.
    // Progressively speeds up
    const baseSpeed = Math.max(2, 7.5 - Math.floor(this.score / 40));

    if (this.snakeTimer >= baseSpeed) {
      this.snakeTimer = 0;
      this.snakeDir = this.snakeNextDir;

      const head = { ...this.snake[0] };
      if (this.snakeDir === "LEFT") head.x -= 1;
      else if (this.snakeDir === "RIGHT") head.x += 1;
      else if (this.snakeDir === "UP") head.y -= 1;
      else if (this.snakeDir === "DOWN") head.y += 1;

      const colsCount = ctx.canvas.width / this.gridSize;
      const rowsCount = ctx.canvas.height / this.gridSize;

      // Wall crash
      if (head.x < 0 || head.x >= colsCount || head.y < 0 || head.y >= rowsCount) {
        ctx.setGameState("GAMEOVER");
        ctx.playRetroSFX("CRASH");
        ctx.checkAndSaveHighScore(this.score);
        return;
      }

      // Self crash
      for (let i = 0; i < this.snake.length; i++) {
        if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
          ctx.setGameState("GAMEOVER");
          ctx.playRetroSFX("CRASH");
          ctx.checkAndSaveHighScore(this.score);
          return;
        }
      }

      // Obstacle crash
      for (let i = 0; i < this.obstacles.length; i++) {
        if (this.obstacles[i].x === head.x && this.obstacles[i].y === head.y) {
          ctx.setGameState("GAMEOVER");
          ctx.playRetroSFX("CRASH");
          ctx.checkAndSaveHighScore(this.score);
          return;
        }
      }

      this.snake.unshift(head);

      // Eat data packet
      if (head.x === this.dataPacket.x && head.y === this.dataPacket.y) {
        const points = 10;
        this.score += points;
        ctx.setScore(this.score);
        ctx.playRetroSFX("EAT");

        // Dynamic visual burst on eating
        const px = this.dataPacket.x * this.gridSize + this.gridSize / 2;
        const py = this.dataPacket.y * this.gridSize + this.gridSize / 2;
        this.createParticles(px, py, getColorSecondaryHex(ctx.colorPreset, 0.95), 12);

        this.spawnDataPacket(colsCount, rowsCount);

        // Score based progressive difficulty obstacles
        if (this.score % 30 === 0) {
          this.addObstacles(colsCount, rowsCount);
          ctx.playRetroSFX("SECURE");
        }

        // Spawn Super Packet
        if (Math.random() > 0.70 && this.superPacket.duration <= 0) {
          let attemptsSuper = 0;
          while (attemptsSuper < 100) {
            const rx = Math.floor(Math.random() * colsCount);
            const ry = Math.floor(Math.random() * rowsCount);
            const onSnake = this.snake.some(seg => seg.x === rx && seg.y === ry);
            const onObs = this.obstacles.some(obs => obs.x === rx && obs.y === ry);
            if (!onSnake && !onObs && (this.dataPacket.x !== rx || this.dataPacket.y !== ry)) {
              this.superPacket = { x: rx, y: ry, duration: 18 }; // duration moves
              break;
            }
            attemptsSuper++;
          }
        }
      }
      // Eat super packet
      else if (this.superPacket.duration > 0 && head.x === this.superPacket.x && head.y === this.superPacket.y) {
        const points = 50;
        this.score += points;
        ctx.setScore(this.score);
        ctx.playRetroSFX("SECURE");
        
        const px = this.superPacket.x * this.gridSize + this.gridSize / 2;
        const py = this.superPacket.y * this.gridSize + this.gridSize / 2;
        this.createParticles(px, py, "rgba(236,72,153,0.95)", 20);

        this.superPacket = { x: -1, y: -1, duration: 0 };
      } else {
        this.snake.pop(); // regular slither
      }

      // Tick down super packet life
      if (this.superPacket.duration > 0) {
        this.superPacket.duration--;
        if (this.superPacket.duration <= 0) {
          this.superPacket = { x: -1, y: -1, duration: 0 };
        }
      }
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;

    // Draw grid background spikes/dots softly
    c2d.fillStyle = "rgba(255, 255, 255, 0.012)";
    for (let x = 10; x < ctx.canvas.width; x += 20) {
      for (let y = 10; y < ctx.canvas.height; y += 20) {
        c2d.fillRect(x - 1, y - 1, 2, 2);
      }
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

    // Draw super packet
    if (this.superPacket.duration > 0) {
      c2d.shadowBlur = 18;
      c2d.shadowColor = "rgba(236,72,153, 0.85)";
      c2d.fillStyle = "rgba(236,72,153, 0.95)";
      c2d.beginPath();
      const px = this.superPacket.x * this.gridSize + this.gridSize / 2;
      const py = this.superPacket.y * this.gridSize + this.gridSize / 2;
      c2d.arc(px, py, this.gridSize / 2 - 2, 0, 2 * Math.PI);
      c2d.fill();

      // Pulsing effect ring
      c2d.strokeStyle = "rgba(236,72,153, 0.4)";
      c2d.lineWidth = 1.5;
      c2d.beginPath();
      c2d.arc(px, py, (this.gridSize / 2 - 2) * (1.4 + 0.35 * Math.sin(Date.now() * 0.015)), 0, 2 * Math.PI);
      c2d.stroke();
    }

    // Draw standard food packet
    c2d.shadowBlur = 10;
    c2d.shadowColor = getColorSecondaryHex(ctx.colorPreset, 0.8);
    c2d.fillStyle = getColorSecondaryHex(ctx.colorPreset, 0.95);
    c2d.beginPath();
    const fx = this.dataPacket.x * this.gridSize + this.gridSize / 2;
    const fy = this.dataPacket.y * this.gridSize + this.gridSize / 2;
    c2d.arc(fx, fy, this.gridSize / 2 - 3, 0, 2 * Math.PI);
    c2d.fill();

    // Draw obstacle blocks with pulsing alert red/amber wireframe details
    this.obstacles.forEach(obs => {
      c2d.shadowBlur = 8;
      c2d.shadowColor = "rgba(239, 68, 68, 0.75)";
      c2d.strokeStyle = "rgba(239, 68, 68, 0.9)";
      c2d.fillStyle = "rgba(239, 68, 68, 0.2)";
      c2d.lineWidth = 1.5;

      const ox = obs.x * this.gridSize;
      const oy = obs.y * this.gridSize;
      c2d.fillRect(ox + 2, oy + 2, this.gridSize - 4, this.gridSize - 4);
      c2d.strokeRect(ox + 2, oy + 2, this.gridSize - 4, this.gridSize - 4);

      // Warning cross
      c2d.beginPath();
      c2d.moveTo(ox + 5, oy + 5);
      c2d.lineTo(ox + this.gridSize - 5, oy + this.gridSize - 5);
      c2d.moveTo(ox + this.gridSize - 5, oy + 5);
      c2d.lineTo(ox + 5, oy + this.gridSize - 5);
      c2d.stroke();
    });

    // Draw snake with progressive neon tail gradient
    this.snake.forEach((segment, index) => {
      const x = segment.x * this.gridSize;
      const y = segment.y * this.gridSize;
      c2d.shadowBlur = index === 0 ? 15 : 6;
      c2d.shadowColor = getColorHex(ctx.colorPreset, 0.82);

      if (index === 0) {
        c2d.fillStyle = "#ffffff"; // Head highlight
      } else {
        c2d.fillStyle = getColorHex(ctx.colorPreset, Math.max(0.2, 0.85 - index * 0.035));
      }

      c2d.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);

      // Draw shiny core details for head segment
      if (index === 0) {
        c2d.fillStyle = getColorSecondaryHex(ctx.colorPreset, 1);
        let visorX = x + 7;
        let visorY = y + 7;
        let visorW = 6;
        let visorH = 6;

        if (this.snakeDir === "LEFT") {
          visorX = x + 2; visorY = y + 5; visorW = 3; visorH = 10;
        } else if (this.snakeDir === "RIGHT") {
          visorX = x + 15; visorY = y + 5; visorW = 3; visorH = 10;
        } else if (this.snakeDir === "UP") {
          visorX = x + 5; visorY = y + 2; visorW = 10; visorH = 3;
        } else if (this.snakeDir === "DOWN") {
          visorX = x + 5; visorY = y + 15; visorW = 10; visorH = 3;
        }
        c2d.fillRect(visorX, visorY, visorW, visorH);
      }
    });

    // Draw tiny level indicator showing current difficulty speed factor
    c2d.shadowBlur = 0;
    c2d.fillStyle = "rgba(255, 255, 255, 0.25)";
    c2d.font = "bold 8px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`GRID_COMPRESSION: 1.${Math.floor(this.score / 40)}X`, 8, ctx.canvas.height - 8);
    if (this.obstacles.length > 0) {
      c2d.fillStyle = "rgba(239, 68, 68, 0.5)";
      c2d.fillText(`SPATIAL_FIRES: ${this.obstacles.length} NODES`, 120, ctx.canvas.height - 8);
    }
  }
}
