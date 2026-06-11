/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared TypeScript contracts for the terminal HUD data layer.
 * Defines shapes for the live log stream, project/skill nodes, and AEGIS chat messages.
 */

export interface SystemLog {
    id: string;
    timestamp: string;
    category: "SYSTEM" | "SECURE" | "QUANTUM" | "NETWORK" | "COGNITION" | "TELEMETRY";
    message: string;
    status: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  }
  
  export interface ProjectNode {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    status: "ONLINE" | "STANDBY" | "DORMANT";
    efficiency: number; // 0-100
    description: string;
    quantumCost: string;
    specs: string[];
    blueprints: string[]; // BlueprintModal schematic codes (GRID_SPIN, LORENZ_ATTRACT, etc.)
    link?: string; // Optional external link (GitHub, LinkedIn, etc.)
    year?: string;
  }
  
  export interface SkillNode {
    id: string;
    name: string;
    field: "NEURAL" | "QUANTUM" | "CORE" | "HYPER";
    level: number; // 0-100
    overclocked: boolean;
    frequency: number; // Hz representation for synth
    description: string;
  }
  
  export interface ChatMessage {
    id: string;
    sender: "USER" | "AI" | "SYSTEM";
    text: string;
    timestamp: string;
  }
  