// Stream parameter extractor for ToM tool arguments
export class StreamParamExtractor {
    buffer = '';
    targetParam;
    toolName;
    constructor(targetParam, toolName) {
        this.targetParam = targetParam;
        this.toolName = toolName;
    }
    feed(delta) {
        this.buffer += delta;
    }
    getBuffer() {
        try {
            // Try to parse JSON and extract the target parameter
            const parsed = JSON.parse(`{${this.buffer}}`);
            return parsed[this.targetParam] || '';
        }
        catch {
            // If parsing fails, try to extract the parameter value manually
            const regex = new RegExp(`"${this.targetParam}"\\s*:\\s*"([^"]*)"`, 'i');
            const match = this.buffer.match(regex);
            return match ? match[1] : '';
        }
    }
    getToolName() {
        return this.toolName;
    }
    reset() {
        this.buffer = '';
    }
}
// Main stream handler for ToM conversations
export class ToMStreamHandler {
    callbacks;
    finalToolCalls = {};
    extractors = new Map();
    accumulatedChunks = [];
    constructor(callbacks) {
        this.callbacks = callbacks;
    }
    async consume(agent, message, context) {
        // Track response content internally if needed
        this.accumulatedChunks = [];
        this.finalToolCalls = {};
        this.extractors.clear();
        try {
            for await (const chunk of agent.streamConversation(message, context)) {
                this.accumulatedChunks.push(chunk);
                const delta = chunk.choices[0]?.delta;
                // Stream response content
                if (delta?.content) {
                    // responseContent += delta.content; // Tracked internally
                    this.callbacks.streamResponse(delta.content);
                }
                // Handle tool calls with real-time visualization
                if (delta?.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        this.handleToolCallDelta(toolCall);
                    }
                }
            }
            // Process final result
            const result = await agent.processStreamResult(this.accumulatedChunks);
            // Notify completion
            this.callbacks.onComplete({
                response: result.response,
                tomUpdates: result.tomUpdates,
                reasoning: this.extractReasoningFromUpdates(result.tomUpdates),
                confidence: this.calculateOverallConfidence(result.tomUpdates)
            });
        }
        catch (error) {
            console.error('Stream consumption failed:', error);
            throw error;
        }
    }
    handleToolCallDelta(toolCall) {
        if (toolCall.index === undefined)
            return;
        const index = toolCall.index;
        const toolCallId = toolCall.id || `temp_${index}`;
        // First chunk - initialize tool call
        if (!this.finalToolCalls[index]) {
            this.finalToolCalls[index] = {
                id: toolCall.id || toolCallId,
                type: 'function',
                function: {
                    name: toolCall.function?.name || '',
                    arguments: toolCall.function?.arguments || ''
                }
            };
            // Show tool starting
            if (toolCall.function?.name) {
                this.callbacks.showToolCall({
                    id: toolCallId,
                    tool: {
                        name: toolCall.function.name,
                        status: 'starting'
                    }
                });
                // Initialize parameter extractor
                this.createExtractorForTool(toolCallId, toolCall.function.name);
            }
        }
        else {
            // Accumulate arguments
            const args = toolCall.function?.arguments || '';
            if (this.finalToolCalls[index].function && args) {
                this.finalToolCalls[index].function.arguments += args;
            }
            // Feed to extractor and show streaming updates
            const extractor = this.extractors.get(toolCallId);
            if (extractor && args) {
                extractor.feed(args);
                this.handleToolParameterStream(toolCallId, extractor);
            }
            // Show delta for generic tools
            if (args) {
                this.callbacks.showToolCall({
                    id: toolCallId,
                    delta: args
                });
            }
        }
    }
    createExtractorForTool(toolId, toolName) {
        let targetParam = '';
        switch (toolName) {
            case 'update_epistemic_state':
                targetParam = 'content';
                break;
            case 'update_emotional_state':
                targetParam = 'type';
                break;
            case 'update_motivational_state':
                targetParam = 'content';
                break;
            case 'update_attentional_state':
                targetParam = 'target';
                break;
            case 'update_social_awareness':
                targetParam = 'relationship_perception';
                break;
            default:
                return; // No extractor needed
        }
        this.extractors.set(toolId, new StreamParamExtractor(targetParam, toolName));
    }
    handleToolParameterStream(_toolId, extractor) {
        const toolName = extractor.getToolName();
        const extractedContent = extractor.getBuffer();
        if (!extractedContent)
            return;
        // Update mental state visualization based on tool type
        switch (toolName) {
            case 'update_epistemic_state':
                this.callbacks.updateMentalState({
                    type: 'epistemic',
                    content: extractedContent,
                    status: 'streaming'
                });
                break;
            case 'update_emotional_state':
                this.callbacks.updateMentalState({
                    type: 'emotional',
                    content: extractedContent,
                    status: 'streaming'
                });
                break;
            case 'update_motivational_state':
                this.callbacks.updateMentalState({
                    type: 'motivational',
                    content: extractedContent,
                    status: 'streaming'
                });
                break;
            case 'update_attentional_state':
                this.callbacks.updateMentalState({
                    type: 'attentional',
                    content: extractedContent,
                    status: 'streaming'
                });
                break;
            case 'update_social_awareness':
                this.callbacks.updateMentalState({
                    type: 'social',
                    content: extractedContent,
                    status: 'streaming'
                });
                break;
        }
    }
    extractReasoningFromUpdates(updates) {
        return updates
            .map(update => update.reasoning)
            .filter(Boolean)
            .join('; ') || 'Mental state analysis completed';
    }
    calculateOverallConfidence(updates) {
        if (updates.length === 0)
            return 0.5;
        const confidences = updates
            .map(update => update.state?.confidence || 0.5)
            .filter(conf => conf > 0);
        if (confidences.length === 0)
            return 0.5;
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }
}
//# sourceMappingURL=tom-stream-handler.js.map