/**
 * Game engine factory registry for ArcadeTerminal.
 * Maps each GameID string to a fresh GameEngine instance when a cabinet is selected.
 *
 * Each engine is fetched via dynamic import() so the ~190 KB arcade isn't shipped
 * in the initial /terminal chunk. Only the selected game's code is downloaded,
 * and only when a cabinet is launched.
 */
import { GameEngine } from "./types";

export type GameID = "SNAKE" | "BREAKOUT" | "SHOOTER" | "PONG" | "ASTEROIDS" | "FLAPPY" | "FROGGER" | "PACMAN" | "HIGHWAY" | "DINO";

export async function getGameEngine(id: GameID): Promise<GameEngine> {
  switch (id) {
    case "SNAKE":
      return new (await import("./SnakeGame")).SnakeGame();
    case "BREAKOUT":
      return new (await import("./BreakoutGame")).BreakoutGame();
    case "SHOOTER":
      return new (await import("./ShooterGame")).ShooterGame();
    case "PONG":
      return new (await import("./PongGame")).PongGame();
    case "ASTEROIDS":
      return new (await import("./AsteroidsGame")).AsteroidsGame();
    case "FLAPPY":
      return new (await import("./FlappyGame")).FlappyGame();
    case "FROGGER":
      return new (await import("./FroggerGame")).FroggerGame();
    case "PACMAN":
      return new (await import("./PacmanGame")).PacmanGame();
    case "HIGHWAY":
      return new (await import("./HighwayGame")).HighwayGame();
    case "DINO":
      return new (await import("./DinoGame")).DinoGame();
    default:
      return new (await import("./SnakeGame")).SnakeGame();
  }
}
export * from "./types";
