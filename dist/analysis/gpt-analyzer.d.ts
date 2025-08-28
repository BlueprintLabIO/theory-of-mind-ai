import OpenAI from 'openai';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import type { ToMSnapshot, ToMUpdate, ConversationContext } from '../types/index.js';
export interface ConversationAnalysis {
    response: string;
    tomUpdates: ToMUpdate[];
    reasoning: string;
    confidence: number;
    new_snapshot: ToMSnapshot;
}
export declare class GPTAnalyzer {
    private client;
    private model;
    private systemPrompt;
    constructor(apiKey: string, model?: string);
    analyzeAndRespond(message: string, currentSnapshot: ToMSnapshot | null, context?: ConversationContext): Promise<ConversationAnalysis>;
    streamConversation(message: string, currentSnapshot: ToMSnapshot | null, context?: ConversationContext): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk>;
    static accumulateToolCalls(chunks: OpenAI.Chat.Completions.ChatCompletionChunk[]): ChatCompletionMessageToolCall[];
    private buildSystemPrompt;
    private buildConversationMessages;
    private summarizeSnapshot;
    processToolCalls(toolCalls: ChatCompletionMessageToolCall[], currentSnapshot: ToMSnapshot | null): Promise<ToMUpdate[]>;
    createToMUpdateFromToolCall(functionName: string, args: Record<string, unknown>, timestamp: number): ToMUpdate | null;
    createUpdatedSnapshot(currentSnapshot: ToMSnapshot | null, updates: ToMUpdate[]): ToMSnapshot;
    private extractReasoningFromUpdates;
    private calculateOverallConfidence;
    private generateStateId;
}
//# sourceMappingURL=gpt-analyzer.d.ts.map