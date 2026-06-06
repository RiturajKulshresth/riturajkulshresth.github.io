/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { synth } from "../audio";
import { useOverdrive } from "../contexts/OverdriveContext";
import { getGameEngine, GameID as ActiveGame, GameContext, GameInput } from "./games";
import { 
  Gamepad2, 
  Play, 
  RotateCcw, 
  HelpCircle, 
  Zap, 
  Award, 
  Keyboard,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface ArcadeTerminalProps {
  colorPreset: "GREEN" | "AMBER" | "COSMIC";
  initialGame?: ActiveGame;
  embedded?: boolean;
}

// Direction codes used by the on-screen D-pad. They match the `e.code` values
// the keyboard listener already understands, so the touch deck can drive every
// game by dispatching synthetic keyboard events - no per-game wiring needed.
type PadDir = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
interface ActionBtn {
  code: string;
  label: string;
  // pulse = tap (quick down/up), used for jump/flap; otherwise hold-to-press.
  pulse?: boolean;
}
interface GameControls {
  dirs: PadDir[];
  actions: ActionBtn[];
}

// Per-game on-screen control layout. Mirrors each engine's keyboard handling.
const GAME_CONTROLS: Record<ActiveGame, GameControls> = {
  SNAKE: { dirs: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], actions: [] },
  BREAKOUT: { dirs: ["ArrowLeft", "ArrowRight"], actions: [] },
  SHOOTER: { dirs: ["ArrowLeft", "ArrowRight"], actions: [{ code: "Space", label: "FIRE" }] },
  PONG: { dirs: ["ArrowUp", "ArrowDown"], actions: [] },
  ASTEROIDS: { dirs: ["ArrowLeft", "ArrowRight", "ArrowUp"], actions: [{ code: "Space", label: "FIRE" }] },
  FLAPPY: { dirs: [], actions: [{ code: "Space", label: "FLAP", pulse: true }] },
  FROGGER: { dirs: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], actions: [] },
  PACMAN: { dirs: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], actions: [] },
  HIGHWAY: { dirs: ["ArrowLeft", "ArrowRight"], actions: [{ code: "ArrowUp", label: "NITRO" }] },
  DINO: { dirs: [], actions: [{ code: "Space", label: "JUMP", pulse: true }, { code: "ArrowDown", label: "DUCK" }] },
};

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
    HIGHWAY: 200,
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
        synth.playClick(1000, 0.06);
        setTimeout(() => synth.playClick(1500, 0.06), 40);
      } else if (type === "LAUNCH") {
        synth.playClick(800, 0.1);
      } else if (type === "COLLIDE") {
        synth.playClick(440, 0.08);
      } else if (type === "CRASH") {
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

    // TOUCH TRACKING - maps a finger on the canvas to the same mouseX/Y/click
    // pipeline so paddle/aim/flap games work on phones. We only block the
    // browser's scroll/zoom while a round is PLAYING, so tap-to-start and
    // tap-to-reboot still fire the canvas onClick on idle/gameover screens.
    const setPosFromTouch = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
      const relativeY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
      mouseX = Math.min(Math.max(relativeX, 0), canvas.width);
      mouseY = Math.min(Math.max(relativeY, 0), canvas.height);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) setPosFromTouch(touch);
      mouseClicked = true;
      if (localGameState === "PLAYING") e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) setPosFromTouch(touch);
      if (localGameState === "PLAYING") e.preventDefault();
    };

    const handleTouchEnd = () => {
      mouseClicked = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchEnd);

    // Instantiate and initialize the dedicated game module
    const gameEngine = getGameEngine(activeGame);

    const gameContext: GameContext = {
      canvas,
      ctx,
      colorPreset,
      speedFactor: speedMulRef.current,
      playRetroSFX,
      setScore: (updater) => {
        setScore((prev) => {
          const next = typeof updater === "function" ? updater(prev) : updater;
          localScore = next;
          return next;
        });
      },
      setGameState: (state) => {
        setGameState(state);
        localGameState = state;
      },
      checkAndSaveHighScore,
    };

    gameEngine.init(gameContext);

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

      // Update context speedfactor in real-time from speedMulRef
      gameContext.speedFactor = speedMulRef.current;

      // UPDATE/DRAW IF PLAYING
      if (localGameState === "PLAYING") {
        const inputState: GameInput = {
          keysPressed,
          mouseX,
          mouseY,
          mouseClicked,
        };
        gameEngine.update(inputState, gameContext);
      }

      // Render the game visuals
      gameEngine.draw(gameContext);

      // ============================================
      // IDLE OVERLAY DRAW
      // ============================================
      if (localGameState === "IDLE") {
        ctx.fillStyle = "rgba(10, 15, 30, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 15;
        ctx.shadowColor = colorPreset === "GREEN" ? "rgba(16,185,129,0.5)" : colorPreset === "AMBER" ? "rgba(245,158,11,0.5)" : "rgba(0,243,255,0.5)";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SIMULATOR_CORE_STANDBY", canvas.width / 2, 160);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "11px monospace";
        ctx.fillText("Click anywhere on screen or the [LAUNCH SIM] button to boot", canvas.width / 2, 210);

        // Rotating visual chip design
        ctx.save();
        ctx.translate(canvas.width / 2, 280);
        ctx.rotate(Date.now() * 0.001);
        ctx.strokeStyle = colorPreset === "GREEN" ? "rgba(52,211,153,0.3)" : colorPreset === "AMBER" ? "rgba(251,191,36,0.3)" : "rgba(0,243,255,0.3)";
        ctx.strokeRect(-20, -20, 40, 40);
        ctx.restore();
      }

      // ============================================
      // GAMEOVER OVERLAY DRAW
      // ============================================
      else if (localGameState === "GAMEOVER") {
        ctx.fillStyle = "rgba(25, 4, 10, 0.88)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(239, 68, 68, 0.85)";
        ctx.fillStyle = "rgba(244, 63, 94, 0.99)";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CORE_DECRYPT_FAILURE", canvas.width / 2, 140);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px monospace";
        ctx.fillText(`TRANSFERRED_COMMUNICATION: ${localScore} PTS`, canvas.width / 2, 195);

        if (localScore >= highScores[activeGame]) {
          ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
          ctx.font = "bold 11px monospace";
          ctx.fillText("★ NEW RECORD DECRYPT SECURED TO SYSTEM CACHE! ★", canvas.width / 2, 240);
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "10px monospace";
        ctx.fillText("Press the REBOOT key above to reboot simulator", canvas.width / 2, 298);
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
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
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

  // The on-screen control deck drives games by dispatching the same window
  // keyboard events the engines already listen for. This keeps every game
  // engine input-source agnostic (real keys, touch deck, all funnel through
  // `keysPressed`).
  const dispatchGameKey = (type: "keydown" | "keyup", code: string) => {
    window.dispatchEvent(new KeyboardEvent(type, { code }));
  };

  // Hold-to-press: key is down while the finger/pointer is on the button.
  const holdHandlers = (code: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      dispatchGameKey("keydown", code);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      dispatchGameKey("keyup", code);
    },
    onPointerLeave: () => dispatchGameKey("keyup", code),
    onPointerCancel: () => dispatchGameKey("keyup", code),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  // Tap-to-fire: short pulse for edge-triggered actions (jump / flap).
  const pulseHandlers = (code: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      dispatchGameKey("keydown", code);
      setTimeout(() => dispatchGameKey("keyup", code), 90);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const controls = GAME_CONTROLS[activeGame];
  const padBtnClass =
    "flex items-center justify-center rounded-md border border-cyan-500/30 bg-black/40 text-cyan-200/90 backdrop-blur-sm transition-colors active:bg-cyan-500/30 active:border-cyan-300 hover:border-cyan-400/60 touch-none select-none h-12 w-12 sm:h-11 sm:w-11 md:h-10 md:w-10";
  const dpadCell = (dir: PadDir, icon: React.ReactNode) =>
    controls.dirs.includes(dir) ? (
      <button type="button" aria-label={dir.replace("Arrow", "")} {...holdHandlers(dir)} className={padBtnClass}>
        {icon}
      </button>
    ) : (
      <span className="h-12 w-12 sm:h-11 sm:w-11 md:h-10 md:w-10" />
    );

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
          <Gamepad2 className="w-5 h-5 text-fuchsia-400 animate-bounce shrink-0" style={{ animationDuration: "3s" }} />
          <div>
            <h2 className="font-mono text-xs font-black uppercase tracking-widest text-[#00f3ff] flex items-center gap-1.5 font-sans font-medium tracking-tight text-gray-900">
              {embedded ? "SECURE_GAME_VAULT" : "RETRO_CORE_ARCADE"} <span className="text-[8px] px-1.5 py-0.5 rounded bg-fuchsia-950 text-fuchsia-400 font-bold tracking-normal animate-pulse">DECRYPT_GAMES</span>
            </h2>
            <p className="font-mono text-[9px] text-cyan-200/50 uppercase mt-0.5">
              {embedded ? "Play right inside the project vault! Fully automated keys & mouse mapping." : "Nostalgic internet-era simulations mapped to cognitive server telemetry."}
            </p>
          </div>
        </div>

        {/* Game grid selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 bg-black/60 p-1.5 border border-cyan-500/15 rounded">
          {(["SNAKE", "BREAKOUT", "SHOOTER", "PONG", "ASTEROIDS", "FLAPPY", "FROGGER", "PACMAN", "HIGHWAY", "DINO"] as ActiveGame[]).map((game) => {
            const labelMap: Record<ActiveGame, string> = {
              SNAKE: "Snake.EXE",
              BREAKOUT: "Firewall.SYS",
              SHOOTER: "Defense.LOG",
              PONG: "Pong.DAT",
              ASTEROIDS: "Orbit.BIN",
              FLAPPY: "Flappy.SYS",
              FROGGER: "Frogger.NET",
              PACMAN: "Pacman.COM",
              HIGHWAY: "Highway.SYS",
              DINO: "Dino.SYS"
            };
            return (
              <button
                key={game}
                onClick={() => handleGameSelect(game)}
                className={`font-mono text-[9.5px] font-black px-2 py-1.5 rounded transition-all uppercase cursor-pointer border text-center truncate ${
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
                  <p>• Avoid crashing into margins or your own data tail! Moving obstacles blocks spawn as difficulty increases. Catch rare pink super packets!</p>
                </div>
              )}

              {activeGame === "BREAKOUT" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">PADDLE FIREWALL BREAKER:</span> Bounce the secure telemetry probe of code to disintegrate firewall registries on the ceiling.</p>
                  <p>• Slide your paddle horizontally by steering with your <span className="text-[#00f3ff] font-bold">Mouse Coordinates</span>, or press <span className="text-[#00f3ff] font-bold">Left / Right arrows</span>. Blocks slowly step down!</p>
                </div>
              )}

              {activeGame === "SHOOTER" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">NEURAL DEFENSE SHIELD:</span> Destroy hostile malware blobs falling down from the sky matrix.</p>
                  <p>• Move with <span className="text-[#00f3ff] font-bold">Mouse / Left-Right Arrows</span>. Fire cyber lasers by <span className="text-[#00f3ff] font-bold">Clicking Canvas</span> or pressing <span className="text-[#00f3ff] font-bold">Spacebar</span>! Face boss motherboards on even waves.</p>
                </div>
              )}

              {activeGame === "PONG" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">PADDLE SECURE PONG:</span> Play dual-channel ping-pong against automated AI system.</p>
                  <p>• Steer your paddle (left side) using <span className="text-[#00f3ff] font-bold">Arrow Keys / WASD</span>, or move your <span className="text-[#00f3ff] font-bold">Mouse vertically</span>. Dynamic center obstacles block and speed up the probe!</p>
                </div>
              )}

              {activeGame === "ASTEROIDS" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">COSMIC ORBIT RUNNER:</span> Navigate space-debris field using your spaceship.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Arrow Up / W</span> to engage engine thrust, <span className="text-[#00f3ff] font-bold">Left/Right or A/D</span> to rotate, and <span className="text-[#00f3ff] font-bold">Spacebar / Click</span> to fire lasers. Watch out for black holes!</p>
                </div>
              )}

              {activeGame === "FLAPPY" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">QUANTUM NODE WAVE-FLAP:</span> Guide the flying quantum node package through firewall gates.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Space / Arrow Up / W</span> or <span className="text-[#00f3ff] font-bold">Click Canvas</span> to flap upwards. Gates narrow and oscillate vertically!</p>
                </div>
              )}

              {activeGame === "FROGGER" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">NETWORK CORE CROSSING:</span> Steer the terminal frog across highway lanes and river currents.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Arrow Keys / WASD</span> to hop. Avoid red cars, float on green logs. Watch out for logs that submerge progressively!</p>
                </div>
              )}

              {activeGame === "PACMAN" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">SECURE DATABASE PAC-MAN:</span> Navigate the memory loop index to harvest active database dots.</p>
                  <p>• Steer using <span className="text-[#00f3ff] font-bold">Arrow Keys / WASD</span>. Steer clear of hostile red/pink ghost viruses. Avoid alert pings that lock onto your exact coord!</p>
                </div>
              )}

              {activeGame === "HIGHWAY" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">NETWORK SPEEDWAY RACER:</span> Drive a supercharged sports car to dodge incoming red malware traffic in a vertical lane grid.</p>
                  <p>• Avoid collisions under accelerated speeds! Press <span className="text-[#00f3ff] font-bold">Arrow Left / Right</span> or <span className="text-[#00f3ff] font-bold">A / D</span> to switch lanes, and hold <span className="text-[#00f3ff] font-bold">Arrow Up / W</span> to engage Nitro speed boost!</p>
                </div>
              )}

              {activeGame === "DINO" && (
                <div className="space-y-1">
                  <p>• <span className="text-fuchsia-300 font-bold">CHRONO T-REX RUNNER:</span> Sprint through deep desert fields and jump over thorny cactus hazards.</p>
                  <p>• Press <span className="text-[#00f3ff] font-bold">Spacebar / ArrowUp / W</span> or <span className="text-[#00f3ff] font-bold">Click Canvas</span> to leap, and <span className="text-[#00f3ff] font-bold">ArrowDown / S</span> to crouch/duck! Reverses day/night colors!</p>
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
        className="relative bg-black border border-cyan-500/20 rounded overflow-hidden flex flex-col items-center justify-center shadow-xl select-none p-4 sm:p-6 md:p-8"
      >
        <canvas
          ref={canvasRef}
          onClick={() => {
            if (gameState === "IDLE") {
              handlePlayStart();
            } else if (gameState === "GAMEOVER" || gameState === "VICTORY") {
              handleReset();
            }
          }}
          className={`w-full max-w-[600px] aspect-[3/2] block bg-black relative z-20 focus:outline-none rounded-sm border border-cyan-500/15 shadow-[0_0_20px_rgba(0,243,255,0.08)] ${
            gameState === "PLAYING" ? "cursor-crosshair" : "cursor-pointer"
          }`}
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
            {activeGame === "HIGHWAY" && "ARROW LEFT / RIGHT (SHIFT) + ARROW UP (NITRO SPEEDWAY BOOST)"}
            {activeGame === "DINO" && "SPACEBAR (JUMP) + ARROW DOWN / S (CROUCH/DUCK)"}
            <span className="text-fuchsia-400/70"> · OR USE THE PAD BELOW</span>
          </span>
        </div>

        {/* Always-visible translucent touch/click control deck. Drives every
            game through synthetic key events, so it works with mouse and touch
            alike and needs no per-game wiring. */}
        <div className="relative z-30 mt-3 flex w-full max-w-[600px] select-none items-center justify-between gap-4">
          {controls.dirs.length > 0 ? (
            <div className="grid grid-cols-3 grid-rows-3 gap-1">
              <span />
              {dpadCell("ArrowUp", <ChevronUp className="h-5 w-5" />)}
              <span />
              {dpadCell("ArrowLeft", <ChevronLeft className="h-5 w-5" />)}
              <span className="h-12 w-12 sm:h-11 sm:w-11 md:h-10 md:w-10" />
              {dpadCell("ArrowRight", <ChevronRight className="h-5 w-5" />)}
              <span />
              {dpadCell("ArrowDown", <ChevronDown className="h-5 w-5" />)}
              <span />
            </div>
          ) : (
            <span />
          )}

          {controls.actions.length > 0 && (
            <div className="flex items-center gap-2.5">
              {controls.actions.map((action) => (
                <button
                  key={action.code}
                  type="button"
                  aria-label={action.label}
                  {...(action.pulse ? pulseHandlers(action.code) : holdHandlers(action.code))}
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-fuchsia-500/40 bg-fuchsia-950/30 font-mono text-[10px] font-black uppercase tracking-wider text-fuchsia-200/90 backdrop-blur-sm transition-colors active:bg-fuchsia-500/30 active:border-fuchsia-300 hover:border-fuchsia-400/70 touch-none select-none sm:h-14 sm:w-14 md:h-12 md:w-12"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
