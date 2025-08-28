import type { ChatCompletionTool } from 'openai/resources/chat/completions';
export declare const tomTools: ChatCompletionTool[];
export interface ToMToolCall {
    function_name: string;
    arguments: Record<string, unknown>;
    reasoning: string;
}
//# sourceMappingURL=tom-tools.d.ts.map