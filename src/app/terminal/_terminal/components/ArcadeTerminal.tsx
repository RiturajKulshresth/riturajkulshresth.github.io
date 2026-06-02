/* eslint-disable */
// @ts-nocheck

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

type ActiveGame = "SNAKE" | "BREAKOUT" | "SHOOTER";

export default function ArcadeTerminal({ colorPreset, initialGame, embedded = false }: ArcadeTerminalProps) {
 const [activeGame, setActiveGame] = useState<ActiveGame>(initialGame || "SNAKE");
 const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "GAMEOVER" | "VICTORY">("IDLE");
 const [score, setScore] = useState(0);
 const [highScores, setHighScores] = useState<Record<ActiveGame, number>>({
   SNAKE: 150,
   BREAKOUT: 400,
   SHOOTER: 120,
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
     mouseX = Math.min(Math.max(relativeX, 0), canvas.width);
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
     <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/15 pb-4 mb-4 gap-3 relative z-20">
       <div className="flex items-center space-x-2.5">
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

       {/* Tab Selection */}
       <div className="flex items-center space-x-1.5 bg-black/60 p-1 border border-cyan-500/15 rounded shrink-0">
         <button
           onClick={() => handleGameSelect("SNAKE")}
           className={`font-mono text-[9.5px] font-black px-2.5 py-1 rounded transition-colors uppercase ${
             activeGame === "SNAKE"
               ? "bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/35"
               : "text-cyan-400/65 hover:text-[#00f3ff] hover:bg-cyan-950/20"
           }`}
         >
           Snake.EXE
         </button>
         <button
           onClick={() => handleGameSelect("BREAKOUT")}
           className={`font-mono text-[9.5px] font-black px-2.5 py-1 rounded transition-colors uppercase ${
             activeGame === "BREAKOUT"
               ? "bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/35"
               : "text-cyan-400/65 hover:text-[#00f3ff] hover:bg-cyan-950/20"
           }`}
         >
           Firewall.SYS
         </button>
         <button
           onClick={() => handleGameSelect("SHOOTER")}
           className={`font-mono text-[9.5px] font-black px-2.5 py-1 rounded transition-colors uppercase ${
             activeGame === "SHOOTER"
               ? "bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-500/35"
               : "text-cyan-400/65 hover:text-[#00f3ff] hover:bg-cyan-950/20"
           }`}
         >
           Defense.LOG
         </button>
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
         {activeGame === "BREAKOUT" && (
           <>
             <MousePointer className="w-3 h-3 shrink-0 text-[#00f3ff]" />
             <span>MOUSE MOVEMENT / ARROW KEYS</span>
           </>
         )}
         {activeGame === "SNAKE" && (
           <>
             <Keyboard className="w-3 h-3 shrink-0 text-[#00f3ff]" />
             <span>ARROWS / WASD TO TURN</span>
           </>
         )}
         {activeGame === "SHOOTER" && (
           <>
             <Keyboard className="w-3 h-3 shrink-0 text-[#00f3ff]" />
             <span>ARROWS TO SHIP / Click OR SPACEBAR TO LAUNCH GRID</span>
           </>
         )}
       </div>
     </div>
   </div>
 );
}
