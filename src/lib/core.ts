// Theory of Mind AI Core Library - Pure TypeScript exports (no Svelte components)

// Core agent and analysis classes
export { ToMAgent, type ConversationResponse } from './agent/tom-agent.js';
export { TemporalMemory } from './memory/temporal-memory.js';
export { GPTAnalyzer, type ConversationAnalysis } from './analysis/gpt-analyzer.js';

// Tool definitions and types
export { tomTools, type ToMToolCall } from './analysis/tom-tools.js';

// Core streaming utilities (UI-agnostic)
export { 
  type ToMUICallbacks 
} from './streaming/tom-stream-handler.js';

// Export all type definitions
export type * from './types/index.js';