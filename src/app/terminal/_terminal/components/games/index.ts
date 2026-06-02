import { GameEngine } from "./types";
import { SnakeGame } from "./SnakeGame";
import { BreakoutGame } from "./BreakoutGame";
import { ShooterGame } from "./ShooterGame";
import { PongGame } from "./PongGame";
import { AsteroidsGame } from "./AsteroidsGame";
import { FlappyGame } from "./FlappyGame";
import { FroggerGame } from "./FroggerGame";
import { PacmanGame } from "./PacmanGame";
import { HighwayGame } from "./HighwayGame";
import { DinoGame } from "./DinoGame";

export type GameID = "SNAKE" | "BREAKOUT" | "SHOOTER" | "PONG" | "ASTEROIDS" | "FLAPPY" | "FROGGER" | "PACMAN" | "HIGHWAY" | "DINO";

export function getGameEngine(id: GameID): GameEngine {
  switch (id) {
    case "SNAKE":
      return new SnakeGame();
    case "BREAKOUT":
      return new BreakoutGame();
    case "SHOOTER":
      return new ShooterGame();
    case "PONG":
      return new PongGame();
    case "ASTEROIDS":
      return new AsteroidsGame();
    case "FLAPPY":
      return new FlappyGame();
    case "FROGGER":
      return new FroggerGame();
    case "PACMAN":
      return new PacmanGame();
    case "HIGHWAY":
      return new HighwayGame();
    case "DINO":
      return new DinoGame();
    default:
      return new SnakeGame();
  }
}
export * from "./types";
