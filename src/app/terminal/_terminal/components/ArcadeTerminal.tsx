/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { 
  Gamepad2, 
  Play, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  Zap, 
  Award, 
  Skull, 
  Maximize2,
  ChevronRight,
  Shield,
  MousePointer,
  Keyboard
} from "lucide-react";

interface ArcadeTerminalProps {
  colorPreset: "GREEN" | "AMBER" | "COSMIC";
  initialGame?: ActiveGame;
  embedded?: boolean;
}

type ActiveGame = "SNAKE" | "BREAKOUT" | "SHOOTER" | "PONG" | "ASTEROIDS" | "FLAPPY" | "FROGGER" | "PACMAN" | "CHOPPER" | "DINO";

export default function ArcadeTerminal({ colorPreset, initialGame, embedded = false }: ArcadeTerminalProps) {
  const [activeGame, setActiveGame] = useState<ActiveGame>(initialGame || "SNAKE");
  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER" | "VICTORY">("IDLE");
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<Record<ActiveGame, number>>({
    SNAKE: 150,
    BREAKOUT: 400,
    SHOOTER: 120,
    PONG: 50,
    ASTEROIDS: 250,
    FLAPPY: 80,
    FROGGER: 100,
    PACMAN: 150,
    CHOPPER: 300,
    DINO: 180,
  });
  const [showInstructions, setShowInstructions] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  
  const { speedMul } = useOverdrive();
  const speedMulRef = useRef(speedMul);
  useEffect(() => {
    speedMulRef.current = speedMul;
  }, [speedMul]);

  // Load high scores from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cyberspace_arcade_high_scores");
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch (e) {
      // Ignored
    }
  }, []);

  // Soft warning or play sound upon tab selection
  const handleGameSelect = (gameId: ActiveGame) => {
    setActiveGame(gameId);
    setGameState("IDLE");
    setScore(0);
    if (synth.isAudioEnabled()) {
      synth.playClick(600, 0.08);
    }
  };

  // Sound effects wrapper for retro games
  const playRetroSFX = (type: "EAT" | "COLLIDE" | "LAUNCH" | "CRASH" | "LEVELUP" | "SECURE") => {
    if (!synth.isAudioEnabled()) return;
    try {
      if (type === "EAT") {
        // High ascending chip sound
        synth.playClick(1000, 0.06);
        setTimeout(() => synth.playClick(1500, 0.06), 40);
      } else if (type === "LAUNCH") {
        synth.playClick(800, 0.1);
      } else if (type === "COLLIDE") {
        synth.playClick(440, 0.08);
      } else if (type === "CRASH") {
        // Exploding sweep
        synth.playOverclock(180);
      } else if (type === "LEVELUP") {
        synth.playStartup();
      } else if (type === "SECURE") {
        synth.playClick(2000, 0.03);
      }
    } catch (e) {
      // Ignored
    }
  };

  // Save score if it beat high score
  const checkAndSaveHighScore = (finalScore: number) => {
    const currentHigh = highScores[activeGame];
    if (finalScore > currentHigh) {
      const updated = { ...highScores, [activeGame]: finalScore };
      setHighScores(updated);
      try {
        localStorage.setItem("cyberspace_arcade_high_scores", JSON.stringify(updated));
      } catch (e) {
        // Ignored
      }
      playRetroSFX("LEVELUP");
    }
  };

  // Get current color values for styling
  const getColorHex = (op = 1) => {
    if (colorPreset === "GREEN") return `rgba(16, 185, 129, ${op})`;
    if (colorPreset === "AMBER") return `rgba(245, 158, 11, ${op})`;
    return `rgba(0, 243, 255, ${op})`;
  };

  const getColorSecondaryHex = (op = 1) => {
    if (colorPreset === "GREEN") return `rgba(52, 211, 153, ${op})`;
    if (colorPreset === "AMBER") return `rgba(251, 191, 36, ${op})`;
    return `rgba(217, 70, 239, ${op})`; // Fuchsia accents for cosmic
  };

  // Game Rendering Loop & Engines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed aspect ratio of 3:2 (600x400) for consistent pixel maths
    canvas.width = 600;
    canvas.height = 400;

    let localGameState = gameState;
    let localScore = 0;

    // INPUT TRACKING
    const keysPressed: Record<string, boolean> = {};
    let mouseX = 300;
    let mouseY = 200;
    let mouseClicked = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.code] = true;
      // Prevent browser default scroll behaviors for gaming
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const relativeY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      mouseX = Math.min(Math.max(relativeX, 0), canvas.width);
      mouseY = Math.min(Math.max(relativeY, 0), canvas.height);
    };

    const handleMouseDown = () => {
      mouseClicked = true;
    };

    const handleMouseUp = () => {
      mouseClicked = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    // ============================================
    // 1. SNAKE ENGINE VARIABLES
    // ============================================
    const gridSize = 20;
    let snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    let snakeDir = "RIGHT";
    let snakeNextDir = "RIGHT";
    let dataPacket = { x: 18, y: 10 };
    let superPacket = { x: -1, y: -1, duration: 0 };
    let snakeTimer = 0;
    const getBaseSnakeSpeed = () => {
      // Moves every X frames. Slower means higher value, faster means lower value
      return Math.max(2, 8 - Math.floor(localScore / 50));
    };

    // ============================================
    // 2. BREAKOUT ENGINE VARIABLES
    // ============================================
    const paddleWidth = 90;
    const paddleHeight = 12;
    let paddleX = (canvas.width - paddleWidth) / 2;
    
    let ballX = canvas.width / 2;
    let ballY = canvas.height - 40;
    let ballSpeedX = 4;
    let ballSpeedY = -4;
    const ballRadius = 6;
    
    interface Brick {
      x: number;
      y: number;
      width: number;
      height: number;
      durability: number;
      type: "normal" | "fortified" | "quantum";
    }
    let bricks: Brick[] = [];
    const colorRows = 5;
    const bricksPerRow = 9;
    const brickWidth = 56;
    const brickHeight = 16;
    const brickPadding = 6;
    const offsetTop = 45;
    const offsetLeft = 24;

    const initBricks = () => {
      bricks = [];
      for (let r = 0; r < colorRows; r++) {
        for (let c = 0; c < bricksPerRow; c++) {
          const type = Math.random() > 0.85 ? "quantum" : r === 0 ? "fortified" : "normal";
          bricks.push({
            x: c * (brickWidth + brickPadding) + offsetLeft,
            y: r * (brickHeight + brickPadding) + offsetTop,
            width: brickWidth,
            height: brickHeight,
            durability: type === "fortified" ? 2 : 1,
            type: type
          });
        }
      }
    };
    initBricks();

    // ============================================
    // 3. SHOOTER ENGINE VARIABLES
    // ============================================
    let playerShipX = canvas.width / 2;
    const playerShipY = canvas.height - 35;
    const shipWidth = 36;
    const shipHeight = 22;
    
    interface Bullet {
      x: number;
      y: number;
      speedY: number;
      isEnemy: boolean;
    }
    let bullets: Bullet[] = [];
    
    interface Invader {
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
      hp: number;
      scoreVal: number;
      type: number;
    }
    let invaders: Invader[] = [];
    let invaderDirection = 1; // 1 = right, -1 = left
    let shooterLevel = 1;
    let shootCooldown = 0;

    // ============================================
    // 4. PONG VARIABLES
    // ============================================
    let pongPlayerY = 170;
    let pongCpuY = 170;
    let pongBallX = 300;
    let pongBallY = 200;
    let pongBallSpeedX = 4;
    let pongBallSpeedY = 2;

    // ============================================
    // 5. ASTEROIDS VARIABLES
    // ============================================
    let astShipX = 300;
    let astShipY = 200;
    let astShipAngle = -Math.PI / 2;
    let astShipVx = 0;
    let astShipVy = 0;
    interface Laser {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }
    let astLasers: Laser[] = [];
    interface Asteroid {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      hp: number;
    }
    let astAsteroids: Asteroid[] = [];
    const initAsteroids = () => {
      astAsteroids = [];
      for (let i = 0; i < 5; i++) {
        astAsteroids.push({
          x: Math.random() * 600,
          y: Math.random() * 150, // leave middle space safe
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: Math.random() * 15 + 15,
          hp: 1
        });
      }
    };

    // ============================================
    // 6. FLAPPY (QUANTUM_FLAP) VARIABLES
    // ============================================
    let flapY = 200;
    let flapVelocity = 0;
    interface Pillar {
      x: number;
      gapY: number; // Y position of center gap
      gapHeight: number;
      width: number;
      passed: boolean;
    }
    let flapPillars: Pillar[] = [];
    const initPillars = () => {
      flapPillars = [];
      for (let i = 0; i < 3; i++) {
        flapPillars.push({
          x: 400 + i * 220,
          gapY: 120 + Math.random() * 160,
          gapHeight: 110,
          width: 50,
          passed: false
        });
      }
    };

    // ============================================
    // 7. FROGGER VARIABLES
    // ============================================
    let frogX = 300;
    let frogY = 370;
    interface VehicleLog {
      x: number;
      y: number;
      speed: number;
      width: number;
      isLog: boolean; // if log, frog can float. if car, col is fatal
    }
    let frogObstacles: VehicleLog[] = [];
    const initFrogger = () => {
      frogObstacles = [];
      // Row 1: Cars moving Left
      frogObstacles.push({ x: 100, y: 320, speed: -1.8, width: 45, isLog: false });
      frogObstacles.push({ x: 350, y: 320, speed: -1.8, width: 45, isLog: false });
      // Row 2: Rapid Cars moving Right
      frogObstacles.push({ x: 50, y: 270, speed: 2.2, width: 35, isLog: false });
      frogObstacles.push({ x: 300, y: 270, speed: 2.2, width: 35, isLog: false });
      // Row 3: River Logs moving Left
      frogObstacles.push({ x: 200, y: 200, speed: -1.2, width: 90, isLog: true });
      frogObstacles.push({ x: 500, y: 200, speed: -1.2, width: 90, isLog: true });
      // Row 4: Rapid River Logs moving Right
      frogObstacles.push({ x: 100, y: 150, speed: 1.5, width: 75, isLog: true });
      frogObstacles.push({ x: 400, y: 150, speed: 1.5, width: 75, isLog: true });
    };

    // ============================================
    // 8. PACMAN VARIABLES
    // ============================================
    let pacX = 300;
    let pacY = 200;
    let pacDx = 0;
    let pacDy = 0;
    interface MazeDot {
      x: number;
      y: number;
      isSuper: boolean;
      active: boolean;
    }
    let pacDots: MazeDot[] = [];
    interface Ghost {
      x: number;
      y: number;
      color: string;
      speed: number;
    }
    let pacGhosts: Ghost[] = [];
    const initPacman = () => {
      pacDots = [];
      pacGhosts = [];
      // Simple loop grid dots
      for (let x = 60; x <= 540; x += 60) {
        for (let y = 60; y <= 340; y += 60) {
          pacDots.push({
            x,
            y,
            isSuper: Math.random() > 0.9,
            active: true
          });
        }
      }
      pacGhosts.push({ x: 100, y: 100, color: "rgba(239, 68, 68, 0.95)", speed: 1.4 });
      pacGhosts.push({ x: 500, y: 300, color: "rgba(236, 72, 153, 0.95)", speed: 1.2 });
    };

    // ============================================
    // 9. CHOPPER (CHOPPER_CAVE) VARIABLES
    // ============================================
    let copY = 200;
    let copVelocity = 0;
    interface CavernBar {
      x: number;
      topHeight: number;
      bottomHeight: number;
    }
    let copBars: CavernBar[] = [];
    const initChopper = () => {
      copBars = [];
      for (let i = 0; i < 6; i++) {
        copBars.push({
          x: 150 + i * 110,
          topHeight: 40 + Math.random() * 80,
          bottomHeight: 40 + Math.random() * 80
        });
      }
    };

    // ============================================
    // 10. DINO (CHRONO_RUNNER) VARIABLES
    // ============================================
    let dinoY = 320;
    let dinoVy = 0;
    let dinoOnGround = true;
    interface Hurdle {
      x: number;
      width: number;
      height: number;
      speed: number;
    }
    let dinoObstacles: Hurdle[] = [];
    const initDino = () => {
      dinoObstacles = [];
      dinoObstacles.push({ x: 500, width: 14, height: 28, speed: 4.5 });
      dinoObstacles.push({ x: 850, width: 18, height: 35, speed: 4.5 });
    };

    const initInvaders = () => {
      invaders = [];
      const rows = 3;
      const cols = 8;
      let idCounter = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          invaders.push({
            id: idCounter++,
            x: c * 50 + 60,
            y: r * 40 + 50,
            width: 32,
            height: 24,
            hp: r === 0 ? 2 : 1,
            scoreVal: (3 - r) * 10,
            type: r
          });
        }
      }
    };
    initInvaders();

    // Reset loop attributes based on selected games when starting
    if (activeGame === "BREAKOUT") {
      initBricks();
      ballX = canvas.width / 2;
      ballY = canvas.height - 40;
      const angle = (Math.random() * 0.4 + 0.3) * Math.PI; // elegant vector Launch
      ballSpeedX = Math.cos(angle) * 5 * (Math.random() > 0.5 ? 1 : -1);
      ballSpeedY = -5;
      localScore = 0;
    } else if (activeGame === "SNAKE") {
      snake = [
        { x: 12, y: 10 },
        { x: 11, y: 10 },
        { x: 10, y: 10 },
      ];
      snakeDir = "RIGHT";
      snakeNextDir = "RIGHT";
      dataPacket = { x: 18, y: 10 };
      superPacket = { x: -1, y: -1, duration: 0 };
      localScore = 0;
    } else if (activeGame === "SHOOTER") {
      bullets = [];
      playerShipX = canvas.width / 2;
      shooterLevel = 1;
      initInvaders();
      localScore = 0;
    } else if (activeGame === "PONG") {
      pongPlayerY = 170;
      pongCpuY = 170;
      pongBallX = 300;
      pongBallY = 200;
      pongBallSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
      pongBallSpeedY = (Math.random() - 0.5) * 4;
      localScore = 0;
    } else if (activeGame === "ASTEROIDS") {
      astShipX = 300;
      astShipY = 200;
      astShipAngle = -Math.PI / 2;
      astShipVx = 0;
      astShipVy = 0;
      astLasers = [];
      initAsteroids();
      localScore = 0;
    } else if (activeGame === "FLAPPY") {
      flapY = 200;
      flapVelocity = 0;
      initPillars();
      localScore = 0;
    } else if (activeGame === "FROGGER") {
      frogX = 300;
      frogY = 370;
      initFrogger();
      localScore = 0;
    } else if (activeGame === "PACMAN") {
      pacX = 300;
      pacY = 200;
      pacDx = 0;
      pacDy = 0;
      initPacman();
      localScore = 0;
    } else if (activeGame === "CHOPPER") {
      copY = 200;
      copVelocity = 0;
      initChopper();
      localScore = 0;
    } else if (activeGame === "DINO") {
      dinoY = 320;
      dinoVy = 0;
      dinoOnGround = true;
      initDino();
      localScore = 0;
    }

    // ============================================
    // MASTER RENDERING FRAME STEP
    // ============================================
    const step = () => {
      if (!ctx || !canvas) return;

      // CLEAR MATRIX
      ctx.fillStyle = "#020206";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // RETRO VECTOR GRID BACKGROUND
      ctx.strokeStyle = "rgba(100, 200, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // SPEED MULTIPLIER FROM OVERDRIVE
      const speedFactor = speedMulRef.current;

      // ============================================
      // PLAYING LOOP: SNAKE
      // ============================================
      if (activeGame === "SNAKE") {
        if (localGameState === "PLAYING") {
          // Process keystrokes
          if ((keysPressed["ArrowLeft"] || keysPressed["KeyA"]) && snakeDir !== "RIGHT") snakeNextDir = "LEFT";
          if ((keysPressed["ArrowRight"] || keysPressed["KeyD"]) && snakeDir !== "LEFT") snakeNextDir = "RIGHT";
          if ((keysPressed["ArrowUp"] || keysPressed["KeyW"]) && snakeDir !== "DOWN") snakeNextDir = "UP";
          if ((keysPressed["ArrowDown"] || keysPressed["KeyS"]) && snakeDir !== "UP") snakeNextDir = "DOWN";

          // Process tick timing
          snakeTimer += speedFactor;
          const gameSpeed = getBaseSnakeSpeed();
          
          if (snakeTimer >= gameSpeed) {
            snakeTimer = 0;
            snakeDir = snakeNextDir;

            // Move body
            const head = { ...snake[0] };
            if (snakeDir === "LEFT") head.x -= 1;
            else if (snakeDir === "RIGHT") head.x += 1;
            else if (snakeDir === "UP") head.y -= 1;
            else if (snakeDir === "DOWN") head.y += 1;

            // Wall collide rules
            const colsCount = canvas.width / gridSize;
            const rowsCount = canvas.height / gridSize;

            if (head.x < 0 || head.x >= colsCount || head.y < 0 || head.y >= rowsCount) {
              setGameState("GAMEOVER");
              localGameState = "GAMEOVER";
              playRetroSFX("CRASH");
              checkAndSaveHighScore(localScore);
            }

            // Body collide rules
            for (let i = 0; i < snake.length; i++) {
              if (snake[i].x === head.x && snake[i].y === head.y) {
                setGameState("GAMEOVER");
                localGameState = "GAMEOVER";
                playRetroSFX("CRASH");
                checkAndSaveHighScore(localScore);
              }
            }

            if (localGameState === "PLAYING") {
              snake.unshift(head);

              // Eat data packet
              if (head.x === dataPacket.x && head.y === dataPacket.y) {
                localScore += 10;
                setScore(localScore);
                playRetroSFX("EAT");

                // Generate new packet (avoiding body)
                let attempts = 0;
                while (attempts < 100) {
                  const rx = Math.floor(Math.random() * colsCount);
                  const ry = Math.floor(Math.random() * rowsCount);
                  if (!snake.some(seg => seg.x === rx && seg.y === ry)) {
                    dataPacket = { x: rx, y: ry };
                    break;
                  }
                  attempts++;
                }

                // Super packet chance
                if (Math.random() > 0.75 && superPacket.duration <= 0) {
                  let attemptsSuper = 0;
                  while (attemptsSuper < 100) {
                    const rx = Math.floor(Math.random() * colsCount);
                    const ry = Math.floor(Math.random() * rowsCount);
                    if (!snake.some(seg => seg.x === rx && seg.y === ry) && (dataPacket.x !== rx || dataPacket.y !== ry)) {
                      superPacket = { x: rx, y: ry, duration: 15 }; // lives for 15 moves
                      break;
                    }
                    attemptsSuper++;
                  }
                }
              } else if (superPacket.duration > 0 && head.x === superPacket.x && head.y === superPacket.y) {
                localScore += 50;
                setScore(localScore);
                playRetroSFX("SECURE");
                superPacket = { x: -1, y: -1, duration: 0 };
              } else {
                // Shrink tail
                snake.pop();
              }

              // Tick down super packet
              if (superPacket.duration > 0) {
                superPacket.duration--;
                if (superPacket.duration <= 0) {
                  superPacket = { x: -1, y: -1, duration: 0 };
                }
              }
            }
          }
        }

        // Draw super packet (if active)
        if (superPacket.duration > 0) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(236,72,153, 0.8)";
          ctx.fillStyle = "rgba(236,72,153, 0.95)";
          ctx.beginPath();
          ctx.arc(
            superPacket.x * gridSize + gridSize / 2,
            superPacket.y * gridSize + gridSize / 2,
            gridSize / 2 - 2,
            0,
            2 * Math.PI
          );
          ctx.fill();

          // pulse rings
          ctx.strokeStyle = "rgba(236,72,153, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(
            superPacket.x * gridSize + gridSize / 2,
            superPacket.y * gridSize + gridSize / 2,
            (gridSize / 2 - 2) * (1.5 + 0.3 * Math.sin(Date.now() * 0.01)),
            0,
            2 * Math.PI
          );
          ctx.stroke();
        }

        // Draw standard food
        ctx.shadowBlur = 10;
        ctx.shadowColor = getColorSecondaryHex(0.8);
        ctx.fillStyle = getColorSecondaryHex(0.9);
        ctx.beginPath();
        ctx.arc(
          dataPacket.x * gridSize + gridSize / 2,
          dataPacket.y * gridSize + gridSize / 2,
          gridSize / 2 - 3,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Draw snake
        snake.forEach((segment, index) => {
          const x = segment.x * gridSize;
          const y = segment.y * gridSize;
          ctx.shadowBlur = index === 0 ? 12 : 5;
          ctx.shadowColor = getColorHex(0.8);

          if (index === 0) {
            ctx.fillStyle = "#ffffff"; // head highlight
          } else {
            ctx.fillStyle = getColorHex(0.8 - index * 0.03);
          }

          // rounded corners on snake body segments
          ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

          // Head scanning visor/eyes on retro green/cosmic models
          if (index === 0) {
            ctx.fillStyle = getColorSecondaryHex();
            ctx.fillRect(
              x + (snakeDir === "LEFT" || snakeDir === "UP" ? 2 : 12),
              y + (snakeDir === "UP" || snakeDir === "LEFT" ? 2 : 12),
              6,
              6
            );
          }
        });
      }

      // ============================================
      // PLAYING LOOP: BREAKOUT (FIREWALL BREAKER)
      // ============================================
      else if (activeGame === "BREAKOUT") {
        if (localGameState === "PLAYING") {
          // Track inputs
          if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
            paddleX = Math.max(paddleX - 7 * speedFactor, 0);
          } else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
            paddleX = Math.min(paddleX + 7 * speedFactor, canvas.width - paddleWidth);
          } else {
            // Smooth mouse lock tracking
            const targetX = mouseX - paddleWidth / 2;
            paddleX += (targetX - paddleX) * 0.25;
            paddleX = Math.min(Math.max(paddleX, 0), canvas.width - paddleWidth);
          }

          // Ball physics
          ballX += ballSpeedX * speedFactor;
          ballY += ballSpeedY * speedFactor;

          // Wall bounces
          if (ballX - ballRadius <= 0) {
            ballX = ballRadius;
            ballSpeedX = -ballSpeedX;
            playRetroSFX("COLLIDE");
          } else if (ballX + ballRadius >= canvas.width) {
            ballX = canvas.width - ballRadius;
            ballSpeedX = -ballSpeedX;
            playRetroSFX("COLLIDE");
          }

          if (ballY - ballRadius <= 0) {
            ballY = ballRadius;
            ballSpeedY = -ballSpeedY;
            playRetroSFX("COLLIDE");
          }

          // Bottom screen bounds (Dead / Fail check)
          if (ballY + ballRadius >= canvas.height - 10) {
            // Did it hit paddle?
            if (ballX >= paddleX && ballX <= paddleX + paddleWidth) {
              ballSpeedY = -Math.abs(ballSpeedY);
              // Influence angle based on hit location
              const hitOffset = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
              ballSpeedX = hitOffset * 6.5; 
              playRetroSFX("LAUNCH");
            } else {
              // Dead
              setGameState("GAMEOVER");
              localGameState = "GAMEOVER";
              playRetroSFX("CRASH");
              checkAndSaveHighScore(localScore);
            }
          }

          // Block collisions
          for (let i = 0; i < bricks.length; i++) {
            const b = bricks[i];
            if (b.durability > 0) {
              if (
                ballX + ballRadius >= b.x &&
                ballX - ballRadius <= b.x + b.width &&
                ballY + ballRadius >= b.y &&
                ballY - ballRadius <= b.y + b.height
              ) {
                // bounce math
                ballSpeedY = -ballSpeedY;
                b.durability--;
                
                let scoreMultiplier = 10;
                if (b.type === "fortified") scoreMultiplier = 20;
                if (b.type === "quantum") scoreMultiplier = 50;

                localScore += scoreMultiplier;
                setScore(localScore);
                playRetroSFX("EAT");

                if (b.type === "quantum") {
                  // triggers particle or audio alerts
                  playRetroSFX("SECURE");
                }

                // Stage completion test
                const activeBricks = bricks.filter(item => item.durability > 0);
                if (activeBricks.length === 0) {
                  setGameState("VICTORY");
                  localGameState = "VICTORY";
                  playRetroSFX("LEVELUP");
                  checkAndSaveHighScore(localScore);
                }
                break;
              }
            }
          }
        }

        // DRAW DESIGN ELEMENTS
        // Draw bricks
        bricks.forEach(b => {
          if (b.durability <= 0) return;
          ctx.shadowBlur = 4;
          
          if (b.type === "quantum") {
            ctx.shadowColor = "rgba(236,72,153,0.7)";
            ctx.fillStyle = `rgba(236, 72, 15 Pink, ${b.durability === 1 ? 0.45 : 0.9})`;
            // rainbow effect
            ctx.fillStyle = `hsl(${Math.floor(Date.now() / 10) % 360}, 85%, 60%)`;
          } else if (b.type === "fortified") {
            ctx.shadowColor = "#ffffff";
            ctx.fillStyle = b.durability === 1 ? getColorHex(0.6) : "#ffffff";
          } else {
            ctx.shadowColor = getColorHex(0.4);
            ctx.fillStyle = getColorHex(0.5);
          }

          ctx.strokeRect(b.x, b.y, b.width, b.height);
          ctx.fillRect(b.x + 1, b.y + 1, b.width - 2, b.height - 2);
        });

        // Draw paddle with grid scanlines
        ctx.shadowBlur = 12;
        ctx.shadowColor = getColorHex(0.9);
        ctx.fillStyle = getColorHex(0.85);
        ctx.fillRect(paddleX, canvas.height - 25, paddleWidth, paddleHeight);

        // Paddle visual accents
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(paddleX + 3, canvas.height - 23, 4, 8);
        ctx.fillRect(paddleX + paddleWidth - 7, canvas.height - 23, 4, 8);

        // Draw ball
        ctx.shadowBlur = 14;
        ctx.shadowColor = getColorSecondaryHex(0.9);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
        ctx.fill();
      }

      // ============================================
      // PLAYING LOOP: SHOOTER (MALWARE INTRUDER)
      // ============================================
      else if (activeGame === "SHOOTER") {
        if (localGameState === "PLAYING") {
          // Cooldown reduction
          if (shootCooldown > 0) shootCooldown -= speedFactor;

          // Process ship movement
          if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
            playerShipX = Math.max(playerShipX - 6.5 * speedFactor, shipWidth / 2);
          } else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
            playerShipX = Math.min(playerShipX + 6.5 * speedFactor, canvas.width - shipWidth / 2);
          } else {
            // Optional mouse tracker override
            const targetX = mouseX;
            playerShipX += (targetX - playerShipX) * 0.22;
            playerShipX = Math.min(Math.max(playerShipX, shipWidth / 2), canvas.width - shipWidth / 2);
          }

          // Shoot trigger (Space or Mouse click)
          if ((keysPressed["Space"] || keysPressed["KeyW"] || mouseClicked) && shootCooldown <= 0) {
            bullets.push({
              x: playerShipX,
              y: playerShipY - 15,
              speedY: -7,
              isEnemy: false
            });
            // Cooldown of 14 frames between rounds
            shootCooldown = 15;
            playRetroSFX("LAUNCH");
          }

          // Invaders logic and horizontal sweeps
          let reachedEdge = false;
          invaders.forEach(inv => {
            inv.x += invaderDirection * 0.9 * shooterLevel * speedFactor;
            if (inv.x + inv.width >= canvas.width - 20 || inv.x <= 20) {
              reachedEdge = true;
            }
          });

          if (reachedEdge) {
            invaderDirection = -invaderDirection;
            invaders.forEach(inv => {
              inv.y += 18;
              // Check ground touch Gameover
              if (inv.y + inv.height >= playerShipY - 5) {
                setGameState("GAMEOVER");
                localGameState = "GAMEOVER";
                playRetroSFX("CRASH");
                checkAndSaveHighScore(localScore);
              }
            });
          }

          // Invader randomly shoots bullet down
          if (Math.random() < 0.015 * shooterLevel && invaders.length > 0) {
            const randomSource = invaders[Math.floor(Math.random() * invaders.length)];
            bullets.push({
              x: randomSource.x + randomSource.width / 2,
              y: randomSource.y + randomSource.height,
              speedY: 4,
              isEnemy: true
            });
          }

          // Update active Bullets
          for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.y += bullet.speedY * speedFactor;

            // Boundary removal
            if (bullet.y < 0 || bullet.y > canvas.height) {
              bullets.splice(i, 1);
              continue;
            }

            // Bullet <-> Shield / Player collisions
            if (bullet.isEnemy) {
              if (
                bullet.x >= playerShipX - shipWidth / 2 &&
                bullet.x <= playerShipX + shipWidth / 2 &&
                bullet.y >= playerShipY - shipHeight / 2 &&
                bullet.y <= playerShipY + 10
              ) {
                // Hit player! Game Over
                setGameState("GAMEOVER");
                localGameState = "GAMEOVER";
                playRetroSFX("CRASH");
                checkAndSaveHighScore(localScore);
                break;
              }
            } else {
              // Bullet <-> Invaders
              for (let n = invaders.length - 1; n >= 0; n--) {
                const inv = invaders[n];
                if (
                  bullet.x >= inv.x &&
                  bullet.x <= inv.x + inv.width &&
                  bullet.y >= inv.y &&
                  bullet.y <= inv.y + inv.height
                ) {
                  // Destruct invader
                  inv.hp--;
                  bullets.splice(i, 1);

                  if (inv.hp <= 0) {
                    localScore += inv.scoreVal;
                    setScore(localScore);
                    playRetroSFX("EAT");
                    invaders.splice(n, 1);
                  } else {
                    playRetroSFX("COLLIDE");
                  }

                  // Wave complete?
                  if (invaders.length === 0) {
                    shooterLevel++;
                    initInvaders();
                    bullets = [];
                    playRetroSFX("LEVELUP");
                    localScore += 100; // Complete wave bonus
                    setScore(localScore);
                  }
                  break;
                }
              }
            }
          }
        }

        // DESIGN DRAW: SHOOTER OBJECTS
        // Draw Invaders
        invaders.forEach(inv => {
          ctx.shadowBlur = 6;
          ctx.strokeStyle = getColorHex(0.6);
          ctx.lineWidth = 1.5;

          if (inv.type === 0) {
            ctx.shadowColor = "rgba(239, 68, 68, 0.7)"; // Red Alert virus
            ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
          } else if (inv.hp > 1) {
            ctx.shadowColor = "#ffffff";
            ctx.strokeStyle = "#ffffff";
          } else {
            ctx.shadowColor = getColorHex(0.5);
          }

          // Invader retro geometric wireframe
          ctx.beginPath();
          ctx.moveTo(inv.x + 6, inv.y);
          ctx.lineTo(inv.x + inv.width - 6, inv.y);
          ctx.lineTo(inv.x + inv.width, inv.y + inv.height / 2);
          ctx.lineTo(inv.x + inv.width - 6, inv.y + inv.height);
          ctx.lineTo(inv.x + 6, inv.y + inv.height);
          ctx.lineTo(inv.x, inv.y + inv.height / 2);
          ctx.closePath();
          ctx.stroke();

          // Core chip dot
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(inv.x + inv.width / 2 - 2, inv.y + inv.height / 2 - 2, 4, 4);

          // Moving logic legs
          const pulsePhase = Math.sin(Date.now() * 0.01 + inv.id);
          ctx.beginPath();
          ctx.moveTo(inv.x + 8, inv.y + inv.height);
          ctx.lineTo(inv.x + 4 + pulsePhase * 3, inv.y + inv.height + 6);
          ctx.moveTo(inv.x + inv.width - 8, inv.y + inv.height);
          ctx.lineTo(inv.x + inv.width - 4 - pulsePhase * 3, inv.y + inv.height + 6);
          ctx.stroke();
        });

        // Draw Player Ship (vector spacecraft fighter)
        ctx.shadowBlur = 15;
        ctx.shadowColor = getColorSecondaryHex(0.95);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.fillStyle = getColorHex(0.25);

        ctx.beginPath();
        // Nose pointer
        ctx.moveTo(playerShipX, playerShipY - 14);
        // Wings
        ctx.lineTo(playerShipX + shipWidth / 2, playerShipY + 6);
        ctx.lineTo(playerShipX + 8, playerShipY);
        ctx.lineTo(playerShipX - 8, playerShipY);
        ctx.lineTo(playerShipX - shipWidth / 2, playerShipY + 6);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // Engine flame thruster
        if (keysPressed["ArrowLeft"] || coinsPressed() || keysPressed["ArrowRight"]) {
          ctx.fillStyle = "rgba(244, 63, 94, 0.9)";
          ctx.beginPath();
          ctx.moveTo(playerShipX - 4, playerShipY + 4);
          ctx.lineTo(playerShipX, playerShipY + 12 + Math.random() * 6);
          ctx.lineTo(playerShipX + 4, playerShipY + 4);
          ctx.closePath();
          ctx.fill();
        }

        // Draw Bullets
        bullets.forEach(bullet => {
          ctx.shadowBlur = 8;
          if (bullet.isEnemy) {
            ctx.shadowColor = "rgba(239, 68, 68, 0.9)";
            ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
            ctx.fillRect(bullet.x - 2, bullet.y - 4, 4, 8);
          } else {
            ctx.shadowColor = getColorSecondaryHex(0.9);
            ctx.fillStyle = getColorSecondaryHex(0.9);
            ctx.fillRect(bullet.x - 1.5, bullet.y - 7, 3, 9);
            // double highlights
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(bullet.x - 0.5, bullet.y - 7, 1, 3);
          }
        });
      }

      // ============================================
      // PLAYING LOOP: PONG (DUAL SECURE CHANNELS)
      // ============================================
      else if (activeGame === "PONG") {
        if (localGameState === "PLAYING") {
          // Player controls
          if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) {
            pongPlayerY = Math.max(10, pongPlayerY - 6 * speedFactor);
          } else if (keysPressed["ArrowDown"] || keysPressed["KeyS"]) {
            pongPlayerY = Math.min(canvas.height - 60, pongPlayerY + 6 * speedFactor);
          } else {
            // Smoothly float towards mouseY
            pongPlayerY += (mouseY - pongPlayerY - 25) * 0.25;
            pongPlayerY = Math.min(Math.max(pongPlayerY, 10), canvas.height - 60);
          }

          // CPU Tracking Ball Y position
          const cpuTargetY = pongBallY - 25;
          const cpuSpeed = 3.5 * speedFactor;
          if (pongCpuY < cpuTargetY) {
            pongCpuY = Math.min(canvas.height - 60, pongCpuY + cpuSpeed);
          } else if (pongCpuY > cpuTargetY) {
            pongCpuY = Math.max(10, pongCpuY - cpuSpeed);
          }

          // Ball movement
          pongBallX += pongBallSpeedX * speedFactor;
          pongBallY += pongBallSpeedY * speedFactor;

          // Ball boundary collisions
          if (pongBallY <= 10) {
            pongBallY = 10;
            pongBallSpeedY = Math.abs(pongBallSpeedY);
            playRetroSFX("COLLIDE");
          } else if (pongBallY >= canvas.height - 10) {
            pongBallY = canvas.height - 10;
            pongBallSpeedY = -Math.abs(pongBallSpeedY);
            playRetroSFX("COLLIDE");
          }

          // Ball/Paddle hits
          // Left paddle
          if (pongBallX <= 34 && pongBallX >= 20) {
            if (pongBallY >= pongPlayerY && pongBallY <= pongPlayerY + 50) {
              pongBallSpeedX = Math.abs(pongBallSpeedX) + 0.15; // slow speed up
              const relativeY = (pongBallY - (pongPlayerY + 25)) / 25;
              pongBallSpeedY = relativeY * 5;
              localScore += 5;
              setScore(localScore);
              playRetroSFX("EAT");
            }
          }
          // Right paddle
          if (pongBallX >= 566 && pongBallX <= 580) {
            if (pongBallY >= pongCpuY && pongBallY <= pongCpuY + 50) {
              pongBallSpeedX = -Math.abs(pongBallSpeedX) - 0.15;
              const relativeY = (pongBallY - (pongCpuY + 25)) / 25;
              pongBallSpeedY = relativeY * 5;
              playRetroSFX("COLLIDE");
            }
          }

          // Dead margins
          if (pongBallX < 0) {
            // Player lost
            setGameState("GAMEOVER");
            localGameState = "GAMEOVER";
            playRetroSFX("CRASH");
            checkAndSaveHighScore(localScore);
          } else if (pongBallX > canvas.width) {
            // CPU lost, award point, bounce back
            localScore += 20;
            setScore(localScore);
            playRetroSFX("SECURE");
            pongBallX = canvas.width / 2;
            pongBallY = canvas.height / 2;
            pongBallSpeedX = -4;
            pongBallSpeedY = (Math.random() - 0.5) * 4;
          }
        }

        // Draw paddles & center dots
        ctx.strokeStyle = getColorHex(0.12);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        // Left Player Paddle
        ctx.fillStyle = getColorHex(0.9);
        ctx.fillRect(24, pongPlayerY, 10, 50);
        // CPU Paddle
        ctx.fillStyle = getColorSecondaryHex(0.8);
        ctx.fillRect(566, pongCpuY, 10, 50);
        // Ball
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(pongBallX - 4, pongBallY - 4, 8, 8);
      }

      // ============================================
      // PLAYING LOOP: ASTEROIDS
      // ============================================
      else if (activeGame === "ASTEROIDS") {
        if (localGameState === "PLAYING") {
          // Rotation input
          if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) {
            astShipAngle -= 0.08 * speedFactor;
          }
          if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) {
            astShipAngle += 0.08 * speedFactor;
          }
          // Thrust input
          if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) {
            astShipVx += Math.cos(astShipAngle) * 0.15 * speedFactor;
            astShipVy += Math.sin(astShipAngle) * 0.15 * speedFactor;
            playRetroSFX("LAUNCH");
          }
          // Dampen
          astShipVx *= Math.pow(0.985, speedFactor);
          astShipVy *= Math.pow(0.985, speedFactor);

          // Apply movement
          astShipX += astShipVx * speedFactor;
          astShipY += astShipVy * speedFactor;

          // Toroidal wrap
          if (astShipX < 0) astShipX = canvas.width;
          if (astShipX > canvas.width) astShipX = 0;
          if (astShipY < 0) astShipY = canvas.height;
          if (astShipY > canvas.height) astShipY = 0;

          // Shooting input
          if (shootCooldown > 0) shootCooldown -= speedFactor;
          if ((keysPressed["Space"] || mouseClicked) && shootCooldown <= 0) {
            astLasers.push({
              x: astShipX + Math.cos(astShipAngle) * 12,
              y: astShipY + Math.sin(astShipAngle) * 12,
              vx: Math.cos(astShipAngle) * 7.5,
              vy: Math.sin(astShipAngle) * 7.5,
              life: 45
            });
            shootCooldown = 12;
            playRetroSFX("SECURE");
          }

          // Update lasers
          for (let l = astLasers.length - 1; l >= 0; l--) {
            const laser = astLasers[l];
            laser.x += laser.vx * speedFactor;
            laser.y += laser.vy * speedFactor;
            // Toroidal wrap
            if (laser.x < 0) laser.x = canvas.width;
            if (laser.x > canvas.width) laser.x = 0;
            if (laser.y < 0) laser.y = canvas.height;
            if (laser.y > canvas.height) laser.y = 0;

            laser.life -= speedFactor;
            if (laser.life <= 0) {
              astLasers.splice(l, 1);
              continue;
            }

            // Check collision with asteroids
            for (let a = astAsteroids.length - 1; a >= 0; a--) {
              const ast = astAsteroids[a];
              const distSq = Math.pow(laser.x - ast.x, 2) + Math.pow(laser.y - ast.y, 2);
              if (distSq < Math.pow(ast.radius, 2)) {
                // Hit asteroid!
                playRetroSFX("EAT");
                astLasers.splice(l, 1);
                localScore += 25;
                setScore(localScore);

                if (ast.radius > 16) {
                  // Split it!
                  astAsteroids.push({
                    x: ast.x,
                    y: ast.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: ast.radius / 2,
                    hp: 1
                  });
                  astAsteroids.push({
                    x: ast.x,
                    y: ast.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: ast.radius / 2,
                    hp: 1
                  });
                }
                astAsteroids.splice(a, 1);

                // All cleared? Wave up
                if (astAsteroids.length === 0) {
                  initAsteroids();
                  localScore += 100;
                  setScore(localScore);
                  playRetroSFX("LEVELUP");
                }
                break;
              }
            }
          }

          // Update asteroids
          for (let a = 0; a < astAsteroids.length; a++) {
            const ast = astAsteroids[a];
            ast.x += ast.vx * speedFactor;
            ast.y += ast.vy * speedFactor;

            if (ast.x < -30) ast.x = canvas.width + 30;
            if (ast.x > canvas.width + 30) ast.x = -30;
            if (ast.y < -30) ast.y = canvas.height + 30;
            if (ast.y > canvas.height + 30) ast.y = -30;

            // Collide ship
            const distSq = Math.pow(astShipX - ast.x, 2) + Math.pow(astShipY - ast.y, 2);
            if (distSq < Math.pow(ast.radius + 8, 2)) {
              setGameState("GAMEOVER");
              localGameState = "GAMEOVER";
              playRetroSFX("CRASH");
              checkAndSaveHighScore(localScore);
              break;
            }
          }
        }

        // Draw asteroids
        astAsteroids.forEach(ast => {
          ctx.strokeStyle = getColorHex(0.6);
          ctx.shadowBlur = 8;
          ctx.shadowColor = getColorHex(0.4);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ast.x, ast.y, ast.radius, 0, 2 * Math.PI);
          ctx.stroke();
          // internal wire lines
          ctx.beginPath();
          ctx.moveTo(ast.x, ast.y - ast.radius);
          ctx.lineTo(ast.x + ast.radius / 2, ast.y + ast.radius / 2);
          ctx.stroke();
        });

        // Draw ship
        ctx.save();
        ctx.translate(astShipX, astShipY);
        ctx.rotate(astShipAngle);
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = getColorHex(0.25);
        ctx.lineWidth = 2;
        ctx.shadowColor = getColorSecondaryHex(0.8);
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.restore();

        // Draw lasers
        astLasers.forEach(laser => {
          ctx.fillStyle = getColorSecondaryHex(0.9);
          ctx.shadowColor = getColorSecondaryHex(0.9);
          ctx.shadowBlur = 6;
          ctx.fillRect(laser.x - 2, laser.y - 2, 4, 4);
        });
      }

      // ============================================
      // PLAYING LOOP: FLAPPY (QUANTUM_FLAP)
      // ============================================
      else if (activeGame === "FLAPPY") {
        if (localGameState === "PLAYING") {
          // Physics
          flapVelocity += 0.28 * speedFactor; // gravity
          flapY += flapVelocity * speedFactor;

          // Up flap input (key/click)
          if (shootCooldown > 0) shootCooldown -= speedFactor;
          if ((keysPressed["Space"] || keysPressed["ArrowUp"] || keysPressed["KeyW"] || mouseClicked) && shootCooldown <= 0) {
            flapVelocity = -5.4;
            shootCooldown = 15;
            playRetroSFX("LAUNCH");
          }

          // Floor and Ceiling bounds
          if (flapY <= 0 || flapY >= canvas.height - 12) {
            setGameState("GAMEOVER");
            localGameState = "GAMEOVER";
            playRetroSFX("CRASH");
            checkAndSaveHighScore(localScore);
          }

          // Pillars scrolling
          flapPillars.forEach(p => {
            p.x -= 2.2 * speedFactor;

            // Reset when scrolling off boundary
            if (p.x < -p.width) {
              p.x = canvas.width + 50;
              p.gapY = 120 + Math.random() * 160;
              p.passed = false;
            }

            // Add score on success cross
            if (!p.passed && p.x + p.width < 150) {
              p.passed = true;
              localScore += 10;
              setScore(localScore);
              playRetroSFX("EAT");
            }

            // Collision checks
            const birdLeft = 150 - 8;
            const birdRight = 150 + 8;
            const birdTop = flapY - 8;
            const birdBottom = flapY + 8;

            if (birdRight >= p.x && birdLeft <= p.x + p.width) {
              if (birdTop <= p.gapY - p.gapHeight / 2 || birdBottom >= p.gapY + p.gapHeight / 2) {
                setGameState("GAMEOVER");
                localGameState = "GAMEOVER";
                playRetroSFX("CRASH");
                checkAndSaveHighScore(localScore);
              }
            }
          });
        }

        // Draw pillars
        flapPillars.forEach(p => {
          ctx.fillStyle = getColorHex(0.15);
          ctx.strokeStyle = getColorHex(0.85);
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 4;
          ctx.shadowColor = getColorHex(0.45);

          // Top pillar rectangular wireframe
          ctx.fillRect(p.x, 0, p.width, p.gapY - p.gapHeight / 2);
          ctx.strokeRect(p.x, 0, p.width, p.gapY - p.gapHeight / 2);

          // Bottom pillar rectangular wireframe
          ctx.fillRect(p.x, p.gapY + p.gapHeight / 2, p.width, canvas.height - (p.gapY + p.gapHeight / 2));
          ctx.strokeRect(p.x, p.gapY + p.gapHeight / 2, p.width, canvas.height - (p.gapY + p.gapHeight / 2));
        });

        // Draw Flappy bird (Holographic flying pixel node)
        ctx.shadowColor = getColorSecondaryHex(0.9);
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(150, flapY, 8, 0, 2 * Math.PI);
        ctx.fill();

        // small wing
        ctx.fillStyle = getColorSecondaryHex(0.95);
        ctx.beginPath();
        ctx.arc(146, flapY + 1, 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      // ============================================
      // PLAYING LOOP: FROGGER (NETWORK_CROSSING)
      // ============================================
      else if (activeGame === "FROGGER") {
        if (localGameState === "PLAYING") {
          let dx = 0;
          let dy = 0;
          if (shootCooldown > 0) shootCooldown -= speedFactor;

          if (shootCooldown <= 0) {
            if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) { dx = -20; }
            else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) { dx = 20; }
            else if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) { dy = -20; }
            else if (keysPressed["ArrowDown"] || keysPressed["KeyS"]) { dy = 20; }

            if (dx !== 0 || dy !== 0) {
              frogX = Math.min(Math.max(frogX + dx, 15), canvas.width - 15);
              frogY = Math.min(Math.max(frogY + dy, 15), canvas.height - 15);
              shootCooldown = 12; // move frequency rate
              playRetroSFX("LAUNCH");
            }
          }

          // Scroll obstacles
          let onLog = false;
          frogObstacles.forEach(ob => {
            ob.x += ob.speed * speedFactor;
            if (ob.speed < 0 && ob.x < -ob.width) ob.x = canvas.width + 30;
            if (ob.speed > 0 && ob.x > canvas.width) ob.x = -ob.width - 10;

            // check collisions
            if (frogY >= ob.y && frogY <= ob.y + 20) {
              if (frogX + 8 >= ob.x && frogX - 8 <= ob.x + ob.width) {
                if (ob.isLog) {
                  onLog = true;
                  frogX += ob.speed * speedFactor; // floats along log!
                } else {
                  // Hot Car!
                  playRetroSFX("CRASH");
                  frogX = 300;
                  frogY = 370;
                }
              }
            }
          });

          // If in river lanes (Y = 140 to 220) and not on log, frog drowns
          if (frogY >= 140 && frogY <= 220 && !onLog) {
            playRetroSFX("COLLIDE");
            frogX = 300;
            frogY = 370;
          }

          // Reached system portal core (Top)
          if (frogY < 80) {
            localScore += 50;
            setScore(localScore);
            playRetroSFX("SECURE");
            frogX = 300;
            frogY = 370;
          }
        }

        // Draw River background block lanes
        ctx.fillStyle = "rgba(0, 100, 255, 0.08)";
        ctx.fillRect(0, 140, canvas.width, 80);

        // Draw obstacles
        frogObstacles.forEach(ob => {
          ctx.shadowBlur = 6;
          if (ob.isLog) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
            ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
            ctx.shadowColor = "rgba(16, 185, 129, 0.5)";
            ctx.fillRect(ob.x, ob.y, ob.width, 20);
            ctx.strokeRect(ob.x, ob.y, ob.width, 20);
          } else {
            ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
            ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
            ctx.shadowColor = "rgba(239, 68, 68, 0.7)";
            ctx.fillRect(ob.x, ob.y, ob.width, 20);
            ctx.strokeRect(ob.x, ob.y, ob.width, 20);
          }
        });

        // Draw Safe landing zones at top
        ctx.fillStyle = "rgba(167, 139, 250, 0.15)";
        ctx.fillRect(0, 40, canvas.width, 40);

        // Draw core green frog
        ctx.shadowColor = getColorSecondaryHex(0.95);
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(frogX, frogY + 10, 8, 0, 2 * Math.PI);
        ctx.fill();
      }

      // ============================================
      // PLAYING LOOP: PACMAN (MAZE_RUNNER)
      // ============================================
      else if (activeGame === "PACMAN") {
        if (localGameState === "PLAYING") {
          // Steer Pacman
          let speed = 2.4 * speedFactor;
          if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) { pacDx = -speed; pacDy = 0; }
          else if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) { pacDx = speed; pacDy = 0; }
          else if (keysPressed["ArrowUp"] || keysPressed["KeyW"]) { pacDy = -speed; pacDx = 0; }
          else if (keysPressed["ArrowDown"] || keysPressed["KeyS"]) { pacDy = speed; pacDx = 0; }

          pacX = Math.min(Math.max(pacX + pacDx, 20), canvas.width - 20);
          pacY = Math.min(Math.max(pacY + pacDy, 20), canvas.height - 20);

          // Dots eat
          pacDots.forEach(d => {
            if (d.active) {
              const distSq = Math.pow(pacX - d.x, 2) + Math.pow(pacY - d.y, 2);
              if (distSq < 150) {
                d.active = false;
                localScore += d.isSuper ? 30 : 10;
                setScore(localScore);
                playRetroSFX("EAT");
                
                if (d.isSuper) {
                  playRetroSFX("SECURE");
                }

                // check stage completion
                const remaining = pacDots.some(dot => dot.active);
                if (!remaining) {
                  localScore += 200;
                  setScore(localScore);
                  initPacman();
                  playRetroSFX("LEVELUP");
                }
              }
            }
          });

          // Ghosts hunting Pacman
          pacGhosts.forEach(g => {
            const dx = pacX - g.x;
            const dy = pacY - g.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
              g.x += (dx / dist) * g.speed * speedFactor;
              g.y += (dy / dist) * g.speed * speedFactor;
            }

            // collide check
            if (dist < 18) {
              setGameState("GAMEOVER");
              localGameState = "GAMEOVER";
              playRetroSFX("CRASH");
              checkAndSaveHighScore(localScore);
            }
          });
        }

        // Draw dots
        pacDots.forEach(d => {
          if (!d.active) return;
          ctx.shadowBlur = d.isSuper ? 12 : 3;
          ctx.shadowColor = d.isSuper ? "rgba(236,72,153, 0.8)" : getColorHex(0.6);
          ctx.fillStyle = d.isSuper ? "rgba(236,72,153, 0.9)" : getColorHex(0.6);
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.isSuper ? 6 : 3, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Draw Ghosts
        pacGhosts.forEach(g => {
          ctx.shadowBlur = 10;
          ctx.shadowColor = g.color;
          ctx.fillStyle = g.color;
          ctx.beginPath();
          ctx.arc(g.x, g.y - 1, 9, Math.PI, 0, false);
          ctx.lineTo(g.x + 9, g.y + 11);
          ctx.lineTo(g.x + 5, g.y + 7);
          ctx.lineTo(g.x, g.y + 11);
          ctx.lineTo(g.x - 5, g.y + 7);
          ctx.lineTo(g.x - 9, g.y + 11);
          ctx.closePath();
          ctx.fill();

          // highlight eye markers
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(g.x - 4, g.y - 3, 3, 3);
          ctx.fillRect(g.x + 2, g.y - 3, 3, 3);
        });

        // Draw PAC-MAN Collector node
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        const mouthAngle = 0.22 * Math.sin(Date.now() * 0.012) + 0.25;
        ctx.arc(pacX, pacY, 11, mouthAngle, 2 * Math.PI - mouthAngle);
        ctx.lineTo(pacX, pacY);
        ctx.closePath();
        ctx.fill();
      }

      // ============================================
      // PLAYING LOOP: CHOPPER (CHOPPER_CAVE)
      // ============================================
      else if (activeGame === "CHOPPER") {
        if (localGameState === "PLAYING") {
          // Gravity physics
          copVelocity += 0.22 * speedFactor;
          copY += copVelocity * speedFactor;

          // input thrust
          if (shootCooldown > 0) shootCooldown -= speedFactor;
          if ((keysPressed["Space"] || keysPressed["ArrowUp"] || keysPressed["KeyW"] || mouseClicked) && shootCooldown <= 0) {
            copVelocity = -4.2;
            shootCooldown = 12;
            playRetroSFX("LAUNCH");
          }

          // Ceiling Floor hits
          if (copY >= canvas.height - 30 || copY <= 30) {
            setGameState("GAMEOVER");
            localGameState = "GAMEOVER";
            playRetroSFX("CRASH");
            checkAndSaveHighScore(localScore);
          }

          // Scroll barriers
          copBars.forEach(b => {
            b.x -= 2.5 * speedFactor;

            if (b.x < -60) {
              b.x = canvas.width + 60;
              b.topHeight = 40 + Math.random() * 85;
              b.bottomHeight = 40 + Math.random() * 85;
              localScore += 15;
              setScore(localScore);
              playRetroSFX("EAT");
            }

            // Check collision
            const copLeft = 150 - 15;
            const copRight = 150 + 15;
            const copTop = copY - 10;
            const copBottom = copY + 10;

            if (copRight >= b.x && copLeft <= b.x + 40) {
              if (copTop <= b.topHeight || copBottom >= canvas.height - b.bottomHeight) {
                setGameState("GAMEOVER");
                localGameState = "GAMEOVER";
                playRetroSFX("CRASH");
                checkAndSaveHighScore(localScore);
              }
            }
          });
        }

        // Draw Cavern Bars
        copBars.forEach(b => {
          ctx.fillStyle = "rgba(0,243,255,0.12)";
          ctx.strokeStyle = getColorHex(0.6);
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 5;
          ctx.shadowColor = getColorHex(0.4);

          // top spikes
          ctx.fillRect(b.x, 0, 40, b.topHeight);
          ctx.strokeRect(b.x, 0, 40, b.topHeight);

          // bottom spikes
          ctx.fillRect(b.x, canvas.height - b.bottomHeight, 40, b.bottomHeight);
          ctx.strokeRect(b.x, canvas.height - b.bottomHeight, 40, b.bottomHeight);
        });

        // draw chopper block wireframe
        ctx.save();
        ctx.translate(150, copY);
        ctx.strokeStyle = getColorSecondaryHex(0.9);
        ctx.lineWidth = 2;
        ctx.fillStyle = getColorHex(0.3);
        ctx.shadowColor = getColorSecondaryHex(0.9);
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // rotor tail
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-24, -4);
        ctx.lineTo(-24, -8);
        ctx.stroke();

        // rotor blade
        const rotorAngle = Date.now() * 0.05;
        ctx.beginPath();
        ctx.moveTo(-16 * Math.sin(rotorAngle), -11);
        ctx.lineTo(16 * Math.sin(rotorAngle), -11);
        ctx.stroke();

        ctx.restore();
      }

      // ============================================
      // PLAYING LOOP: DINO (CHRONO_RUNNER)
      // ============================================
      else if (activeGame === "DINO") {
        if (localGameState === "PLAYING") {
          // gravity pull
          if (!dinoOnGround) {
            dinoVy += 0.3 * speedFactor;
            dinoY += dinoVy * speedFactor;
            if (dinoY >= 320) {
              dinoY = 320;
              dinoVy = 0;
              dinoOnGround = true;
            }
          }

          // click/up jumps
          if ((keysPressed["Space"] || keysPressed["ArrowUp"] || keysPressed["KeyW"] || mouseClicked) && dinoOnGround) {
            dinoVy = -6.8;
            dinoOnGround = false;
            playRetroSFX("LAUNCH");
          }

          // scroll hurdles
          dinoObstacles.forEach(ob => {
            ob.x -= ob.speed * speedFactor;

            if (ob.x < -30) {
              ob.x = canvas.width + 100 + Math.random() * 200;
              ob.width = 12 + Math.floor(Math.random() * 10);
              ob.height = 20 + Math.floor(Math.random() * 20);
              ob.speed = 4.5 + Math.min(2, localScore / 300); // progressive speed up
              localScore += 10;
              setScore(localScore);
              playRetroSFX("EAT");
            }

            // Check hits
            const dinoLeft = 100;
            const dinoRight = 100 + 15;
            const dinoBottom = dinoY + 25;

            if (dinoRight >= ob.x && dinoLeft <= ob.x + ob.width) {
              if (dinoBottom >= 345 - ob.height) {
                setGameState("GAMEOVER");
                localGameState = "GAMEOVER";
                playRetroSFX("CRASH");
                checkAndSaveHighScore(localScore);
              }
            }
          });
        }

        // Draw Ground level line
        ctx.strokeStyle = getColorHex(0.25);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 345);
        ctx.lineTo(canvas.width, 345);
        ctx.stroke();

        // Draw hurdles (Cactus wireframes)
        dinoObstacles.forEach(ob => {
          ctx.strokeStyle = "rgba(239,68,68,0.9)";
          ctx.fillStyle = "rgba(239,68,68,0.2)";
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(239,68,68,0.7)";
          ctx.shadowBlur = 8;

          ctx.fillRect(ob.x, 345 - ob.height, ob.width, ob.height);
          ctx.strokeRect(ob.x, 345 - ob.height, ob.width, ob.height);
        });

        // Draw Running Dino box character
        ctx.shadowColor = getColorSecondaryHex(0.95);
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = getColorHex(0.35);
        ctx.lineWidth = 2;

        ctx.fillRect(100, dinoY, 15, 25);
        ctx.strokeRect(100, dinoY, 15, 25);

        // moving legs
        if (dinoOnGround && localGameState === "PLAYING") {
          const legPhase = Math.sin(Date.now() * 0.02) >= 0;
          ctx.fillStyle = "#ffffff";
          if (legPhase) {
            ctx.fillRect(100, dinoY + 25, 4, 4);
          } else {
            ctx.fillRect(110, dinoY + 25, 4, 4);
          }
        }
      }

      function coinsPressed() {
        return keysPressed["KeyA"] || keysPressed["KeyD"];
      }

      // ============================================
      // IDLE OVERLAY DRAW (Drawn over grids)
      // ============================================
      if (localGameState === "IDLE") {
        ctx.fillStyle = "rgba(5, 5, 12, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Holographic framing ring
        ctx.strokeStyle = getColorHex(0.15);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 130, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = getColorSecondaryHex(0.15);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 137, 0, 2 * Math.PI);
        ctx.stroke();

        // Retro prompt text decoration
        ctx.shadowBlur = 0;
        ctx.fillStyle = getColorHex(0.9);
        ctx.font = "italic bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("MATRIX ARCADES ENCRYPT [DECRYPT_SUCCESS]", canvas.width / 2, 110);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 25px monospace";
        let titleName = "CYBERNETIC_SNAKE";
        if (activeGame === "BREAKOUT") titleName = "FIREWALL_PADDLE";
        if (activeGame === "SHOOTER") titleName = "NEURAL_DEFENSE";

        ctx.shadowBlur = 10;
        ctx.shadowColor = getColorHex(0.8);
        ctx.fillText(titleName, canvas.width / 2, 155);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = "11px monospace";
        let subStr = "Use arrow keys & collect secure packets.";
        if (activeGame === "BREAKOUT") subStr = "Move paddle with mouse / keys & protect system files.";
        if (activeGame === "SHOOTER") subStr = "Fire with click or SPACEBAR. Wipe out malware drops!";
        ctx.fillText(subStr, canvas.width / 2, 185);

        // Flickering "START COGNITION" line
        const isFlicker = Math.floor(Date.now() / 350) % 2 === 0;
        ctx.fillStyle = isFlicker ? getColorSecondaryHex(0.95) : getColorSecondaryHex(0.3);
        ctx.font = "bold 14px monospace";
        ctx.fillText(">> CLICK THE PLAY BUTTON TO ENGAGE COGNITIVE NODE <<", canvas.width / 2, 235);

        ctx.fillStyle = getColorHex(0.4);
        ctx.font = "8px monospace";
        ctx.fillText("HIGH SCORE SYSTEM STATUS: SECURE_LOCAL_STORAGE_ONLINE", canvas.width / 2, 330);
      }

      // ============================================
      // GAMEOVER OVERLAY DRAW
      // ============================================
      else if (localGameState === "GAMEOVER") {
        ctx.fillStyle = "rgba(10, 0, 5, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
        ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CONNECTION_TERMINATED", canvas.width / 2, 160);

        // Score display
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px monospace";
        ctx.fillText(`TOTAL RECOVERED BYTE_CODE: ${localScore} PTS`, canvas.width / 2, 210);

        // record check
        if (localScore >= highScores[activeGame]) {
          ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
          ctx.font = "bold 11px monospace";
          ctx.fillText("★ NEW RECORD DECRYPT SECURED TO SYSTEM CACHE! ★", canvas.width / 2, 240);
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "10px monospace";
        ctx.fillText("Press the RELOAD key above to reboot simulator", canvas.width / 2, 298);
      }

      // ============================================
      // VICTORY OVERLAY DRAW (ONLY FOR BREAKOUT STAGES)
      // ============================================
      else if (localGameState === "VICTORY") {
        ctx.fillStyle = "rgba(0, 10, 5, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(16, 185, 129, 0.85)";
        ctx.fillStyle = "rgba(52, 211, 153, 0.99)";
        ctx.font = "bold 34px monospace";
        ctx.textAlign = "center";
        ctx.fillText("FIREWALL_SUCCESSFULLY_BREACHED", canvas.width / 2, 160);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "15px monospace";
        ctx.fillText(`TOTAL CAPTURED CODE: ${localScore} PTS`, canvas.width / 2, 210);

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "11px monospace";
        ctx.fillText("Reinitialize the terminal to proceed.", canvas.width / 2, 280);
      }

      // REQUEST REANIMATION
      requestRef.current = requestAnimationFrame(step);
    };

    // BEGIN LOOP ANIMATION
    requestRef.current = requestAnimationFrame(step);

    // CLEANUP ACCUMULATOR
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeGame, gameState, colorPreset]);

  // Handle manual starting
  const handlePlayStart = () => {
    setGameState("PLAYING");
    setScore(0);
    playRetroSFX("LAUNCH");
  };

  const handleReset = () => {
    setGameState("IDLE");
    setScore(0);
    playRetroSFX("LAUNCH");
  };

  // Border and glow stylers based on active themed options
  const containerStyler = () => {
    if (colorPreset === "GREEN") {
      return {
        border: "border-emerald-500/30",
        bg: "bg-[#020d04]/85",
        text: "text-emerald-400",
        glow: "shadow-[inset_0_0_15px_rgba(16,185,129,0.15)]",
      };
    }
    if (colorPreset === "AMBER") {
      return {
        border: "border-amber-500/30",
        bg: "bg-[#0c0701]/85",
        text: "text-amber-400",
        glow: "shadow-[inset_0_0_15px_rgba(245,158,11,0.15)]",
      };
    }
    return {
      border: "border-cyan-500/30",
      bg: "bg-[#010912]/85",
      text: "text-cyan-400",
      glow: "shadow-[inset_0_0_15px_rgba(0,243,255,0.15)]",
    };
  };

  const currentStyle = containerStyler();

  return (
    <div 
      id="retro-gaming-arcades"
      className={embedded ? "relative overflow-hidden w-full select-none" : `border ${currentStyle.border} p-5 rounded relative overflow-hidden backdrop-blur-md ${currentStyle.bg} ${currentStyle.glow} transition-colors duration-500`}
    >
      {/* Absolute CRT Screen curve & overlay details from late 90s */}
      <div className="absolute inset-0 pointer-events-none rounded overflow-hidden select-none z-10">
        {/* Curvaceous glass shadow and CRT overlay scanlines */}
        <div className="absolute inset-0 bg-radial-gradient-crt pointer-events-none opacity-[0.22]" />
        {/* Scan lines layout */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px] pointer-events-none" />
      </div>

      {/* Title & Game selection layout */}
      <div className="border-b border-cyan-500/15 pb-4 mb-4 relative z-20">
        <div className="flex items-center space-x-2.5 mb-3">
          <Gamepad2 className="w-5 h-5 text-fuchsia-500 animate-bounce shrink-0" style={{ animationDuration: "3s" }} />
          <div>
            <h2 className="font-mono text-xs font-black uppercase tracking-widest text-[#00f3ff] flex items-center gap-1.5 font-sans font-medium tracking-tight text-gray-900">
              {embedded ? "SECURE_GAME_VAULT" : "RETRO_CORE_ARCADE"} <span className="text-[8px] px-1.5 py-0.5 rounded bg-fuchsia-950 text-fuchsia-400 font-bold tracking-normal animate-pulse">DECRYPT_GAMES</span>
            </h2>
            <p className="font-mono text-[9px] text-cyan-200/50 uppercase mt-0.5">
              {embedded ? "Play right inside the project vault! Fully automated keys & mouse mapping." : "Nostalgic internet-era simulations mapped to cognitive server telemetry."}
            </p>
          </div>
        </div>

        {/* Game selection grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 bg-black/60 p-1.5 border border-cyan-500/15 rounded">
          {(["SNAKE", "BREAKOUT", "SHOOTER", "PONG", "ASTEROIDS", "FLAPPY", "FROGGER", "PACMAN", "CHOPPER", "DINO"] as ActiveGame[]).map((game) => {
            const labelMap: Record<ActiveGame, string> = {
              SNAKE: "Snake.EXE",
              BREAKOUT: "Firewall.SYS",
              SHOOTER: "Defense.LOG",
              PONG: "Pong.DAT",
              ASTEROIDS: "Orbit.BIN",
              FLAPPY: "Flappy.SYS",
              FROGGER: "Frogger.NET",
              PACMAN: "Pacman.COM",
              CHOPPER: "Chopper.EXE",
              DINO: "Dino.SYS"
            };
            return (
              <button
                key={game}
                onClick={() => handleGameSelect(game)}
                className={`w-full font-mono text-[9.5px] font-black px-2 py-1.5 rounded transition-all uppercase cursor-pointer border text-center truncate ${
                  activeGame === game
                    ? "bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-500/35 shadow-[0_0_8px_rgba(240,46,170,0.25)]"
                    : "text-cyan-400/65 border-cyan-500/10 hover:text-[#00f3ff] hover:bg-cyan-950/20 hover:border-cyan-500/25"
                }`}
              >
                {labelMap[game]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions toggle panel */}
      {showInstructions && (
        <div className="mb-4 bg-cyan-950/25 border border-[#00f3ff]/20 rounded p-3 text-xs font-mono text-cyan-100/90 relative max-h-[140px] overflow-y-auto scroller-cyan">
          <button 
            onClick={() => setShowInstructions(false)}
            className="absolute top-2 right-3 text-[10px] text-fuchsia-400 hover:text-fuchsia-300 transition-colors cursor-pointer uppercase font-bold"
          >
            [ DISMISS ]
          </button>
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className="font-bold text-[#00f3ff] uppercase text-[10px]">COGNITIVE INSTRUCTION ARRAY:</span>
              
              {activeGame === "SNAKE" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">CYBER-GRID SNAKE:</span> Steer and collect flickering quantum data packets using your keypad's <span className="text-[#00f3ff] font-bold">Arrow Keys</span> or <span className="text-[#00f3ff] font-bold">WASD</span>.</p>
                  <p>• Avoid crashing into margins or your own data tail! Speed scales up with score. Catch rare pink super packets for bonus points!</p>
                </div>
              )}

              {activeGame === "BREAKOUT" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">PADDLE FIREWALL BREAKER:</span> Bounce the secure telemetry probe of code to disintegrate firewall registries on the ceiling.</p>
                  <p>• Slide your paddle horizontally by steering with your <span className="text-[#00f3ff] font-bold">Mouse Coordinates</span>, or press the <span className="text-[#00f3ff] font-bold">Left / Right arrow keys</span> to manual steer!</p>
                </div>
              )}

              {activeGame === "SHOOTER" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">NEURAL DEFENSE SHIELD:</span> Destroy hostile malware blobs falling down from the sky matrix.</p>
                  <p>• Move horizontally with your <span className="text-[#00f3ff] font-bold">Mouse / Left-Right Arrows</span>. Fire cyber lasers by <span className="text-[#00f3ff] font-bold">Clicking inside Canvas</span> or pressing the <span className="text-[#00f3ff] font-bold">Spacebar</span>!</p>
                </div>
              )}

              {activeGame === "PONG" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">PADDLE SECURE PONG:</span> Play dual-channel ping-pong against automated AI system.</p>
                  <p>• Steer your paddle (left side) up or down using <span className="text-[#00f3ff] font-bold">Arrow Keys / WASD</span>, or move your <span className="text-[#00f3ff] font-bold">Mouse vertically</span>. Don't let the packet slip pass!</p>
                </div>
              )}

              {activeGame === "ASTEROIDS" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">COSMIC ORBIT RUNNER:</span> Navigate space-debris field using your spaceship.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Arrow Up / W</span> to engage engine thrust, <span className="text-[#00f3ff] font-bold">Left/Right or A/D</span> to rotate, and <span className="text-[#00f3ff] font-bold">Spacebar / Click</span> to fire photon disintegrators!</p>
                </div>
              )}

              {activeGame === "FLAPPY" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">QUANTUM NODE WAVE-FLAP:</span> Guide the flying quantum node package through firewall gates.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Spacebar / Arrow Up / W</span> or <span className="text-[#00f3ff] font-bold">Click inside Canvas</span> to flap upwards and resist falling gravity!</p>
                </div>
              )}

              {activeGame === "FROGGER" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">NETWORK CORE CROSSING:</span> Steer the terminal frog across highway lanes and river currents.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Arrow Keys / WASD</span> to hop. Avoid red cars, float on green logs, and reach safe purple slots at the top core!</p>
                </div>
              )}

              {activeGame === "PACMAN" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">SECURE DATABASE PAC-MAN:</span> Navigate the memory loop index to harvest all active database dots.</p>
                  <p>• Steer using <span className="text-[#00f3ff] font-bold">Arrow Keys / WASD</span>. Steer clear of hostile red and pink AI ghost viruses tracking your positions!</p>
                </div>
              )}

              {activeGame === "CHOPPER" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">CAVERN CHOPPER FLIGHT:</span> Fly a tactical hacker drone through high-risk cyber caverns.</p>
                  <p>• Hold or press <span className="text-[#00f3ff] font-bold">Spacebar / ArrowUp / W</span> or <span className="text-[#00f3ff] font-bold">Click inside Canvas</span> to ascend. Avoid crash landing on top/bottom spikes!</p>
                </div>
              )}

              {activeGame === "DINO" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">CHRONO T-REX RUNNER:</span> Sprint through deep desert fields and jump over thorny cactus hazards.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Spacebar / ArrowUp / W</span> or <span className="text-[#00f3ff] font-bold">Click inside Canvas</span> to leap over arriving obstacles while running!</p>
                </div>
              )}

              {speedMul > 1 && (
                <div className="flex items-center gap-1.5 text-[9px] text-fuchsia-400 font-bold animate-pulse pt-0.5 border-t border-cyan-500/10 mt-1.5">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>OVERDRIVE REGISTER DETECTED: Game simulation speeds scaled by {speedMul.toFixed(1)}x overdrive multiplier! Engage caution.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Score Header telemetry */}
      <div className="grid grid-cols-3 gap-2.5 bg-black/40 border border-cyan-500/10 p-3 rounded mb-3 text-center text-xs font-mono relative z-20">
        <div className="flex flex-col items-center justify-center">
          <span className="text-cyan-500/60 text-[9px] uppercase">COGNITIVE_SCORE</span>
          <span className="text-base font-bold text-cyan-200 tracking-wider font-mono">{score} <span className="text-[10px] text-cyan-500/40">PTS</span></span>
        </div>
        <div className="flex flex-col items-center justify-center border-x border-cyan-500/15">
          <span className="text-cyan-500/60 text-[9px] uppercase">CABINET_RECORD</span>
          <span className="text-base font-bold text-fuchsia-400 tracking-wider font-mono flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
            {highScores[activeGame]}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-cyan-500/60 text-[9px] uppercase">SIMULATOR_STATE</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            gameState === "PLAYING" 
              ? "text-emerald-400 animate-pulse" 
              : gameState === "GAMEOVER" 
              ? "text-rose-500" 
              : gameState === "VICTORY" 
              ? "text-cyan-300 font-black shrink-0" 
              : "text-amber-500"
          }`}>
            {gameState}
          </span>
        </div>
      </div>

      {/* Main interactive container with canvas */}
      <div 
        ref={containerRef}
        className="relative bg-black border border-cyan-500/20 rounded overflow-hidden flex flex-col items-center justify-center shadow-xl select-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full max-w-full aspect-[3/2] block cursor-crosshair bg-black relative z-20 focus:outline-none"
          tabIndex={0}
        />

        {/* Quick controls bar below or on side */}
        <div className="absolute top-2 left-2 flex items-center space-x-2 z-30">
          {gameState === "IDLE" ? (
            <button
              onClick={handlePlayStart}
              className={`p-1.5 rounded-full border border-cyan-500/40 bg-black/90 hover:border-emerald-400 text-cyan-300 hover:text-emerald-300 hover:scale-105 transition-all text-xs flex items-center space-x-1 cursor-pointer font-bold font-mono`}
              title="Start Simulation Game"
            >
              <Play className="w-3.5 h-3.5 shrink-0" />
              <span className="px-1 text-[9px]">LAUNCH SIM</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-full border border-cyan-500/40 bg-black/90 hover:border-rose-400 text-cyan-300 hover:text-rose-400 hover:scale-105 transition-all text-xs flex items-center space-x-1 cursor-pointer font-bold font-mono"
              title="Reboot Simulation Game"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="px-1 text-[9px]">REBOOT</span>
            </button>
          )}

          {!showInstructions && (
            <button
              onClick={() => setShowInstructions(true)}
              className="p-1.5 rounded-full border border-cyan-500/40 bg-black/90 hover:border-[#00f3ff] text-cyan-300 hover:text-[#00f3ff] hover:scale-105 transition-all text-xs flex items-center justify-center cursor-pointer"
              title="Show Instructions"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>

        {/* HUD control layout overlays for helper cues when on phone/touch */}
        <div className="absolute bottom-2 right-2 pointer-events-none opacity-40 hover:opacity-100 transition-opacity z-30 flex items-center gap-1.5 text-[8.5px] font-mono text-cyan-500 bg-black/80 px-2 py-1 rounded border border-cyan-500/15">
          <Keyboard className="w-3" />
          <span>
            {activeGame === "BREAKOUT" && "MOUSE / ARROW KEYS (STEER)"}
            {activeGame === "SNAKE" && "ARROWS / WASD TO TURN"}
            {activeGame === "SHOOTER" && "MOUSE / ARROWS (SHIP SPEED) + CLICK / SPACE (FIRE)"}
            {activeGame === "PONG" && "MOUSE VERTICAL / ARROW KEYS (PADDLE)"}
            {activeGame === "ASTEROIDS" && "ARROWS / WASD (ROTATE & THRUST) + CLICK / SPACE (LASERS)"}
            {activeGame === "FLAPPY" && "SPACEBAR / CLICK ON CANVAS (QUANTUM FLAP)"}
            {activeGame === "FROGGER" && "ARROW KEYS / WASD (STEPPING HOP)"}
            {activeGame === "PACMAN" && "ARROW KEYS / WASD (MAZE STEERING)"}
            {activeGame === "CHOPPER" && "SPACEBAR / CLICK (CAVERN GLIDER ASCENT)"}
            {activeGame === "DINO" && "SPACEBAR / CLICK / ARROW UP (LEAP)"}
          </span>
        </div>
      </div>
    </div>
  );
}
