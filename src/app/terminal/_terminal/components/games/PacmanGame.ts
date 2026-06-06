import { GameEngine, GameInput, GameContext, getColorHex } from "./types";

interface Ghost {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  tx: number; // pixel coords of the tile centre we are moving toward
  ty: number;
  color: string;
  corner: { col: number; row: number };
  kind: "blinky" | "pinky" | "inky" | "clyde";
  baseSpeed: number;
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

/**
 * Tile-based Pac-Man.
 *
 * The previous version drew cosmetic walls that nothing collided with, copied
 * the buffered direction straight onto the player every frame (so turns ignored
 * the grid), and never won or lost properly. This rewrite uses a real grid:
 *   - Walls block both the player and ghosts.
 *   - Movement snaps to tile centres; turns only happen when a move into the
 *     desired direction is actually unobstructed (classic "buffered turn").
 *   - Ghosts path tile-by-tile toward per-personality targets, never reversing
 *     except at dead ends, and flee randomly while frightened.
 *   - Eating every pellet wins the round; running out of lives ends it.
 *
 * The maze is a generated lattice (border + a regular pillar grid), which is
 * guaranteed fully connected, so every pellet is always reachable.
 */
export class PacmanGame implements GameEngine {
  private readonly COLS = 21;
  private readonly ROWS = 15;
  private TILE = 26;
  private OX = 0;
  private OY = 0;

  private walls: boolean[][] = [];
  private pellets: number[][] = []; // 0 none, 1 dot, 2 power
  private pelletsLeft = 0;

  private px = 0;
  private py = 0;
  private dirX = 0;
  private dirY = 0;
  private ptx = 0; // pixel coords of the tile centre the player is moving toward
  private pty = 0;
  private wantX = 0;
  private wantY = 0;
  private faceAngle = 0;
  private startTile = { col: 10, row: 13 };

  private ghosts: Ghost[] = [];
  private homeTile = { col: 10, row: 7 };
  private spawns: { col: number; row: number }[] = [];

  private particles: Particle[] = [];
  private score = 0;
  private level = 1;
  private readonly maxLives = 3;
  private lives = 3;

  private frightenedTimer = 0;
  private modeTimer = 0;
  private globalMode: "chase" | "scatter" = "scatter";

  init(ctx: GameContext): void {
    this.score = 0;
    this.level = 1;
    this.lives = this.maxLives;
    this.particles = [];
    this.layoutForCanvas(ctx);
    this.buildMaze();
    this.resetPositions();
  }

  private layoutForCanvas(ctx: GameContext) {
    this.TILE = Math.floor(
      Math.min(ctx.canvas.width / this.COLS, ctx.canvas.height / this.ROWS)
    );
    this.OX = Math.floor((ctx.canvas.width - this.TILE * this.COLS) / 2);
    this.OY = Math.floor((ctx.canvas.height - this.TILE * this.ROWS) / 2);
  }

  private centerX(col: number) {
    return this.OX + col * this.TILE + this.TILE / 2;
  }
  private centerY(row: number) {
    return this.OY + row * this.TILE + this.TILE / 2;
  }
  private isWall(col: number, row: number) {
    if (col < 0 || col >= this.COLS || row < 0 || row >= this.ROWS) return true;
    return this.walls[row][col];
  }

  private buildMaze() {
    this.walls = [];
    this.pellets = [];
    this.pelletsLeft = 0;

    for (let r = 0; r < this.ROWS; r++) {
      const wallRow: boolean[] = [];
      const pelletRow: number[] = [];
      for (let c = 0; c < this.COLS; c++) {
        const border = r === 0 || r === this.ROWS - 1 || c === 0 || c === this.COLS - 1;
        const pillar = c % 2 === 0 && r % 2 === 0;
        const wall = border || pillar;
        wallRow.push(wall);
        pelletRow.push(wall ? 0 : 1);
      }
      this.walls.push(wallRow);
      this.pellets.push(pelletRow);
    }

    // Power pellets in the four inner corners.
    const corners = [
      { col: 1, row: 1 },
      { col: this.COLS - 2, row: 1 },
      { col: 1, row: this.ROWS - 2 },
      { col: this.COLS - 2, row: this.ROWS - 2 },
    ];
    corners.forEach((p) => {
      if (!this.isWall(p.col, p.row)) this.pellets[p.row][p.col] = 2;
    });

    // Ghost spawn zone + player start are kept pellet-free.
    this.spawns = [
      { col: 10, row: 7 },
      { col: 9, row: 7 },
      { col: 11, row: 7 },
      { col: 10, row: 5 },
    ];
    [this.startTile, this.homeTile, ...this.spawns].forEach((t) => {
      if (!this.isWall(t.col, t.row)) this.pellets[t.row][t.col] = 0;
    });

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.pellets[r][c] > 0) this.pelletsLeft++;
      }
    }
  }

  private resetPositions() {
    this.px = this.centerX(this.startTile.col);
    this.py = this.centerY(this.startTile.row);
    this.ptx = this.px;
    this.pty = this.py;
    this.dirX = 0;
    this.dirY = 0;
    this.wantX = 0;
    this.wantY = 0;
    this.faceAngle = 0;
    this.frightenedTimer = 0;
    this.modeTimer = 0;
    this.globalMode = "scatter";

    const defs: { color: string; kind: Ghost["kind"]; corner: { col: number; row: number }; baseSpeed: number }[] = [
      { color: "rgba(239, 68, 68, 0.95)", kind: "blinky", corner: { col: this.COLS - 2, row: 1 }, baseSpeed: 2.1 },
      { color: "rgba(236, 72, 153, 0.95)", kind: "pinky", corner: { col: 1, row: 1 }, baseSpeed: 2.0 },
      { color: "rgba(6, 182, 212, 0.95)", kind: "inky", corner: { col: this.COLS - 2, row: this.ROWS - 2 }, baseSpeed: 1.9 },
      { color: "rgba(245, 158, 11, 0.95)", kind: "clyde", corner: { col: 1, row: this.ROWS - 2 }, baseSpeed: 1.8 },
    ];
    this.ghosts = defs.map((d, i) => {
      const t = this.spawns[i] ?? this.homeTile;
      const x = this.centerX(t.col);
      const y = this.centerY(t.row);
      return {
        x,
        y,
        dirX: 0,
        dirY: 0,
        tx: x,
        ty: y,
        color: d.color,
        corner: d.corner,
        kind: d.kind,
        baseSpeed: d.baseSpeed,
      };
    });
  }

  private tileOf(x: number, y: number) {
    return {
      col: Math.round((x - this.OX - this.TILE / 2) / this.TILE),
      row: Math.round((y - this.OY - this.TILE / 2) / this.TILE),
    };
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
        decay: Math.random() * 0.05 + 0.03,
      });
    }
  }

  private loseLife(ctx: GameContext) {
    this.lives--;
    this.createParticles(this.px, this.py, "rgba(239, 68, 68, 0.95)", 20);
    ctx.playRetroSFX("CRASH");
    if (this.lives <= 0) {
      ctx.setGameState("GAMEOVER");
      ctx.checkAndSaveHighScore(this.score);
    } else {
      this.resetPositions();
    }
  }

  update(input: GameInput, ctx: GameContext): void {
    const { keysPressed } = input;
    const speedFactor = ctx.speedFactor;
    const levelScale = 1 + Math.min(0.6, (this.level - 1) * 0.15);

    if (this.frightenedTimer > 0) this.frightenedTimer -= speedFactor;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Buffer the desired direction from the most recent input.
    if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) { this.wantX = -1; this.wantY = 0; }
    else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) { this.wantX = 1; this.wantY = 0; }
    else if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) { this.wantX = 0; this.wantY = -1; }
    else if (keysPressed["ArrowDown"] || keysPressed["KeyS"]) { this.wantX = 0; this.wantY = 1; }

    const playerSpeed = 2.4 * speedFactor * levelScale;
    this.movePlayer(playerSpeed);

    // Eat pellet under the player.
    const t = this.tileOf(this.px, this.py);
    if (!this.isWall(t.col, t.row) && this.pellets[t.row][t.col] > 0) {
      const kind = this.pellets[t.row][t.col];
      this.pellets[t.row][t.col] = 0;
      this.pelletsLeft--;
      if (kind === 2) {
        this.score += 50;
        this.frightenedTimer = 360;
        ctx.playRetroSFX("SECURE");
        this.createParticles(this.px, this.py, "rgba(236,72,153,0.95)", 8);
      } else {
        this.score += 10;
        ctx.playRetroSFX("EAT");
      }
      ctx.setScore(this.score);

      if (this.pelletsLeft <= 0) {
        // Cleared the board: a clean win.
        this.score += 500;
        ctx.setScore(this.score);
        ctx.playRetroSFX("LEVELUP");
        ctx.checkAndSaveHighScore(this.score);
        ctx.setGameState("VICTORY");
        return;
      }
    }

    // Global scatter/chase cadence (paused while frightened).
    if (this.frightenedTimer <= 0) {
      this.modeTimer += speedFactor;
      if (this.globalMode === "scatter" && this.modeTimer > 350) {
        this.globalMode = "chase";
        this.modeTimer = 0;
      } else if (this.globalMode === "chase" && this.modeTimer > 700) {
        this.globalMode = "scatter";
        this.modeTimer = 0;
      }
    }

    this.updateGhosts(speedFactor, levelScale, ctx);
  }

  private movePlayer(speed: number) {
    // Reached the tile centre we were heading for: snap exactly, then decide
    // the next tile. Anchoring to a destination tile (instead of testing the
    // current tile centre each frame) avoids snapping back and stalling.
    if (Math.abs(this.px - this.ptx) <= speed && Math.abs(this.py - this.pty) <= speed) {
      this.px = this.ptx;
      this.py = this.pty;
      const t = this.tileOf(this.px, this.py);

      // Apply a buffered turn only if that direction is open.
      if ((this.wantX !== 0 || this.wantY !== 0) && !this.isWall(t.col + this.wantX, t.row + this.wantY)) {
        this.dirX = this.wantX;
        this.dirY = this.wantY;
      }
      // Stop dead if the current heading is blocked.
      if (this.isWall(t.col + this.dirX, t.row + this.dirY)) {
        this.dirX = 0;
        this.dirY = 0;
      }
      // Lock onto the next tile centre in our heading.
      this.ptx = this.centerX(t.col + this.dirX);
      this.pty = this.centerY(t.row + this.dirY);
    }

    this.px += this.dirX * speed;
    this.py += this.dirY * speed;
    if (this.dirX !== 0 || this.dirY !== 0) this.faceAngle = Math.atan2(this.dirY, this.dirX);
  }

  private updateGhosts(speedFactor: number, levelScale: number, ctx: GameContext) {
    const frightened = this.frightenedTimer > 0;
    const playerTile = this.tileOf(this.px, this.py);

    this.ghosts.forEach((g) => {
      const speed = (frightened ? g.baseSpeed * 0.6 : g.baseSpeed * levelScale) * speedFactor;

      if (Math.abs(g.x - g.tx) <= speed && Math.abs(g.y - g.ty) <= speed) {
        g.x = g.tx;
        g.y = g.ty;
        const t = this.tileOf(g.x, g.y);

        // Candidate moves: any open neighbour, no reversing (unless trapped).
        const dirs = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];
        let options = dirs.filter(
          (d) => !this.isWall(t.col + d.x, t.row + d.y) && !(d.x === -g.dirX && d.y === -g.dirY)
        );
        if (options.length === 0) {
          options = dirs.filter((d) => !this.isWall(t.col + d.x, t.row + d.y));
        }

        if (options.length > 0) {
          if (frightened) {
            const pick = options[Math.floor(Math.random() * options.length)];
            g.dirX = pick.x;
            g.dirY = pick.y;
          } else {
            const target = this.ghostTarget(g, playerTile);
            let best = options[0];
            let bestDist = Infinity;
            for (const d of options) {
              const nc = t.col + d.x;
              const nr = t.row + d.y;
              const dist = (nc - target.col) ** 2 + (nr - target.row) ** 2;
              if (dist < bestDist) {
                bestDist = dist;
                best = d;
              }
            }
            g.dirX = best.x;
            g.dirY = best.y;
          }
        } else {
          g.dirX = 0;
          g.dirY = 0;
        }

        // Lock onto the chosen neighbour's centre.
        g.tx = this.centerX(t.col + g.dirX);
        g.ty = this.centerY(t.row + g.dirY);
      }

      g.x += g.dirX * speed;
      g.y += g.dirY * speed;

      // Collision with the player.
      const dist = Math.hypot(this.px - g.x, this.py - g.y);
      if (dist < this.TILE * 0.55) {
        if (frightened) {
          this.score += 200;
          ctx.setScore(this.score);
          ctx.playRetroSFX("SECURE");
          this.createParticles(g.x, g.y, "#ffffff", 15);
          g.x = this.centerX(this.homeTile.col);
          g.y = this.centerY(this.homeTile.row);
          g.tx = g.x;
          g.ty = g.y;
          g.dirX = 0;
          g.dirY = 0;
        } else {
          this.loseLife(ctx);
        }
      }
    });
  }

  private ghostTarget(g: Ghost, playerTile: { col: number; row: number }) {
    if (this.globalMode === "scatter") return g.corner;
    switch (g.kind) {
      case "pinky":
        return { col: playerTile.col + this.dirX * 4, row: playerTile.row + this.dirY * 4 };
      case "clyde": {
        const far = Math.hypot(playerTile.col - this.tileOf(g.x, g.y).col, playerTile.row - this.tileOf(g.x, g.y).row) > 5;
        return far ? playerTile : g.corner;
      }
      default:
        return playerTile;
    }
  }

  draw(ctx: GameContext): void {
    const c2d = ctx.ctx;
    const theme = ctx.colorPreset;

    // Walls.
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (!this.walls[r][c]) continue;
        const x = this.OX + c * this.TILE;
        const y = this.OY + r * this.TILE;
        c2d.fillStyle = getColorHex(theme, 0.12);
        c2d.fillRect(x + 1, y + 1, this.TILE - 2, this.TILE - 2);
        c2d.strokeStyle = getColorHex(theme, 0.4);
        c2d.lineWidth = 1;
        c2d.strokeRect(x + 1.5, y + 1.5, this.TILE - 3, this.TILE - 3);
      }
    }

    // Pellets.
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const kind = this.pellets[r][c];
        if (kind === 0) continue;
        const x = this.centerX(c);
        const y = this.centerY(r);
        c2d.save();
        if (kind === 2) {
          const pulse = 5.5 + Math.sin(Date.now() * 0.008) * 1.5;
          c2d.shadowBlur = 10;
          c2d.shadowColor = "rgba(236,72,153,0.85)";
          c2d.fillStyle = "rgba(236,72,153,0.95)";
          c2d.beginPath();
          c2d.arc(x, y, pulse, 0, Math.PI * 2);
          c2d.fill();
        } else {
          c2d.fillStyle = getColorHex(theme, 0.6);
          c2d.fillRect(x - 2, y - 2, 4, 4);
        }
        c2d.restore();
      }
    }

    // Particles.
    this.particles.forEach((p) => {
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

    // Ghosts.
    const frightened = this.frightenedTimer > 0;
    this.ghosts.forEach((g) => {
      c2d.save();
      c2d.shadowBlur = 8;
      let drawColor = g.color;
      if (frightened) {
        const blinking = this.frightenedTimer < 100 && Math.floor(Date.now() / 150) % 2 === 0;
        drawColor = blinking ? "#ffffff" : "rgba(59, 130, 246, 0.95)";
      }
      c2d.shadowColor = drawColor;
      c2d.strokeStyle = drawColor;
      c2d.fillStyle = "rgba(0,0,0,0.45)";
      c2d.lineWidth = 1.8;
      const rad = this.TILE * 0.4;
      c2d.beginPath();
      c2d.arc(g.x, g.y, rad, Math.PI, 0, false);
      c2d.lineTo(g.x + rad, g.y + rad);
      c2d.lineTo(g.x + rad * 0.5, g.y + rad * 0.7);
      c2d.lineTo(g.x, g.y + rad);
      c2d.lineTo(g.x - rad * 0.5, g.y + rad * 0.7);
      c2d.lineTo(g.x - rad, g.y + rad);
      c2d.closePath();
      c2d.stroke();
      c2d.fill();
      c2d.fillStyle = frightened ? "#ff66ff" : "#ffffff";
      c2d.fillRect(g.x - rad * 0.5, g.y - rad * 0.25, 3, 3);
      c2d.fillRect(g.x + rad * 0.2, g.y - rad * 0.25, 3, 3);
      c2d.restore();
    });

    // Player (chomping wedge oriented along faceAngle).
    c2d.save();
    c2d.shadowBlur = 12;
    c2d.shadowColor = "rgba(251, 191, 36, 0.95)";
    c2d.fillStyle = "rgba(251, 191, 36, 0.95)";
    const bite = 0.28 * Math.abs(Math.sin(Date.now() * 0.012));
    const rad = this.TILE * 0.42;
    c2d.beginPath();
    c2d.arc(this.px, this.py, rad, this.faceAngle + bite, this.faceAngle + Math.PI * 2 - bite, false);
    c2d.lineTo(this.px, this.py);
    c2d.closePath();
    c2d.fill();
    c2d.restore();

    // HUD.
    c2d.fillStyle = "rgba(255, 255, 255, 0.3)";
    c2d.font = "bold 9px monospace";
    c2d.textAlign = "left";
    c2d.fillText(`LIVES: ${Math.max(0, this.lives)}/${this.maxLives}`, 8, ctx.canvas.height - 8);
    c2d.fillText(`PACKETS_LEFT: ${this.pelletsLeft}`, 120, ctx.canvas.height - 8);
    if (frightened) {
      c2d.fillStyle = "rgba(59, 130, 246, 0.75)";
      c2d.fillText(`VIRUS_FRIGHT: ${(this.frightenedTimer / 60).toFixed(0)}s`, 260, ctx.canvas.height - 8);
    }
  }
}
