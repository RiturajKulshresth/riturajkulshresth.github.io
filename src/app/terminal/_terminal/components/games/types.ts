export interface GameInput {
  keysPressed: Record<string, boolean>;
  mouseX: number;
  mouseY: number;
  mouseClicked: boolean;
}

export interface GameContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  colorPreset: "GREEN" | "AMBER" | "COSMIC";
  speedFactor: number; // Speed multiplier based on Overdrive context (overclock)
  playRetroSFX: (type: "EAT" | "COLLIDE" | "LAUNCH" | "CRASH" | "LEVELUP" | "SECURE") => void;
  setScore: (updater: number | ((prev: number) => number)) => void;
  setGameState: (state: "IDLE" | "PLAYING" | "GAMEOVER" | "VICTORY") => void;
  checkAndSaveHighScore: (finalScore: number) => void;
}

export interface GameEngine {
  init(ctx: GameContext): void;
  update(input: GameInput, ctx: GameContext): void;
  draw(ctx: GameContext): void;
}

// Utility to get main theme colors dynamically inside individual game files
export function getColorHex(colorPreset: "GREEN" | "AMBER" | "COSMIC", op = 1) {
  if (colorPreset === "GREEN") return `rgba(16, 185, 129, ${op})`;
  if (colorPreset === "AMBER") return `rgba(245, 158, 11, ${op})`;
  return `rgba(0, 243, 255, ${op})`;
}

export function getColorSecondaryHex(colorPreset: "GREEN" | "AMBER" | "COSMIC", op = 1) {
  if (colorPreset === "GREEN") return `rgba(52, 211, 153, ${op})`;
  if (colorPreset === "AMBER") return `rgba(251, 191, 36, ${op})`;
  return `rgba(217, 70, 239, ${op})`; // Fuchsia accents for cosmic
}
