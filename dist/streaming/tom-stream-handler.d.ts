import type { ToMAgent } from '../agent/tom-agent.js';
import type { ConversationContext, ToMUpdate } from '../types/index.js';
export interface ToMUICallbacks {
    streamResponse: (delta: string) => void;
    showToolCall: (payload: {
        id: string;
        tool?: {
            name: string;
            args?: Record<string, unknown>;
            status: 'starting' | 'streaming' | 'complete';
        };
        delta?: string;
    }) => void;
    updateMentalState: (payload: {
        type: 'epistemic' | 'emotional' | 'motivational' | 'attentional' | 'social';
        content?: string;
        confidence?: number;
        intensity?: number;
        status: 'streaming' | 'complete';
    }) => void;
    showConfidence: (confidence: number) => void;
    showReasoning: (reasoning: string) => void;
    onComplete: (result: {
        response: string;
        tomUpdates: ToMUpdate[];
        reasoning: string;
        confidence: number;
    }) => void;
}
export declare class ToMStreamHandler {
    private callbacks;
    constructor(callbacks: ToMUICallbacks);
    consume(agent: ToMAgent, message: string, context?: ConversationContext): Promise<void>;
}
//# sourceMappingURL=tom-stream-handler.d.ts.map