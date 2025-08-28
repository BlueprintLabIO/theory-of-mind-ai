import OpenAI from 'openai';
import type { ToMSnapshot, ToMUpdate, ToMAgentConfig, ConversationContext } from '../types/index.js';
export interface ConversationResponse {
    response: string;
    tomUpdates: ToMUpdate[];
    snapshot: ToMSnapshot;
}
export declare class ToMAgent {
    private memory;
    private analyzer;
    private config;
    private updateStreams;
    constructor(config: ToMAgentConfig);
    respondAndAnalyze(message: string, context?: ConversationContext): Promise<ConversationResponse>;
    streamResponse(message: string, snapshot: ToMSnapshot, tomUpdates: ToMUpdate[], context?: ConversationContext): AsyncGenerator<string>;
    analyzeTheoryOfMind(message: string, context?: ConversationContext): Promise<ToMUpdate[]>;
    createUpdatedSnapshot(currentSnapshot: ToMSnapshot | null, tomUpdates: ToMUpdate[]): ToMSnapshot;
    updateFromMessage(message: string, context?: ConversationContext): Promise<ToMUpdate[]>;
    streamConversation(message: string, context?: ConversationContext): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk>;
    processStreamResult(chunks: OpenAI.Chat.Completions.ChatCompletionChunk[]): Promise<ConversationResponse>;
    updateFromMessageStream(message: string, context?: ConversationContext): AsyncGenerator<ToMUpdate, ToMUpdate[]>;
    getCurrentUnderstanding(): ToMSnapshot | null;
    getTemporalHistory(): ToMSnapshot[];
    getUpdateHistory(): ToMUpdate[];
    getUnderstandingSince(timestamp: number): ToMSnapshot[];
    getUpdatesSince(timestamp: number): ToMUpdate[];
    streamUpdates(): AsyncGenerator<ToMUpdate, void, unknown>;
    subscribeToUpdates(callback: (update: ToMUpdate) => void): () => void;
    updateStateConfidence(stateId: string, newConfidence: number): boolean;
    getConfidenceStats(): {
        averageConfidence: number;
        stateDistribution: Record<string, number>;
        lowConfidenceStates: number;
    };
    createInitialSnapshot(): ToMSnapshot;
    reset(): void;
    destroy(): void;
    private notifyUpdateStreams;
}
//# sourceMappingURL=tom-agent.d.ts.map