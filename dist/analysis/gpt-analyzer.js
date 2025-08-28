import OpenAI from 'openai';
import { tomTools } from './tom-tools.js';
export class GPTAnalyzer {
    client;
    model;
    systemPrompt;
    constructor(apiKey, model = 'gpt-4o') {
        this.client = new OpenAI({
            apiKey,
            baseURL: 'https://llm-proxy-735482512776.us-west1.run.app',
            dangerouslyAllowBrowser: true
        });
        this.model = model;
        this.systemPrompt = this.buildSystemPrompt();
    }
    async analyzeAndRespond(message, currentSnapshot, context) {
        const messages = this.buildConversationMessages(message, currentSnapshot, context);
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                tools: tomTools,
                tool_choice: 'auto',
                // temperature: 0.7,
                // max_tokens: 2000,
                // parallel_tool_calls: true
            });
            const assistantMessage = response.choices[0]?.message;
            if (!assistantMessage) {
                throw new Error('No response from GPT');
            }
            const conversationResponse = assistantMessage.content || '';
            const toolCalls = assistantMessage.tool_calls || [];
            // Process tool calls to create ToM updates
            const tomUpdates = await this.processToolCalls(toolCalls, currentSnapshot);
            // Create updated snapshot
            const newSnapshot = this.createUpdatedSnapshot(currentSnapshot, tomUpdates);
            return {
                response: conversationResponse,
                tomUpdates,
                reasoning: this.extractReasoningFromUpdates(tomUpdates),
                confidence: this.calculateOverallConfidence(tomUpdates),
                new_snapshot: newSnapshot
            };
        }
        catch (error) {
            console.error('GPT Analysis failed:', error);
            throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async *streamConversation(message, currentSnapshot, context) {
        const messages = this.buildConversationMessages(message, currentSnapshot, context);
        try {
            const stream = await this.client.chat.completions.create({
                model: this.model,
                messages,
                tools: tomTools,
                tool_choice: 'auto',
                // temperature: 0.7,
                // max_tokens: 2000,
                stream: true
            });
            // Just yield the raw OpenAI chunks - let UI handle accumulation
            for await (const chunk of stream) {
                console.log(chunk);
                yield chunk;
            }
        }
        catch (error) {
            console.error('Streaming conversation failed:', error);
            throw new Error(`Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Helper method to accumulate tool calls from stream chunks
    static accumulateToolCalls(chunks) {
        const toolCallsMap = {};
        for (const chunk of chunks) {
            const toolCalls = chunk.choices[0]?.delta?.tool_calls || [];
            for (const toolCall of toolCalls) {
                if (toolCall.index === undefined)
                    continue;
                const index = toolCall.index;
                if (!toolCallsMap[index]) {
                    toolCallsMap[index] = {
                        id: toolCall.id,
                        type: 'function',
                        function: {
                            name: toolCall.function?.name || '',
                            arguments: toolCall.function?.arguments || ''
                        }
                    };
                }
                else {
                    // Accumulate arguments
                    if (toolCallsMap[index].function && toolCall.function?.arguments) {
                        toolCallsMap[index].function.arguments += toolCall.function.arguments;
                    }
                }
            }
        }
        return Object.values(toolCallsMap);
    }
    buildSystemPrompt() {
        return `You are an expert conversational AI with advanced theory of mind capabilities. 

CRITICAL INSTRUCTIONS:
1. FIRST: Always write a helpful, natural conversational response to the human in plain text
2. SECOND: Call the appropriate theory of mind tools to analyze their mental states
3. NEVER respond with only tool calls - you must include conversational text

RESPONSE FORMAT:
Your response must contain BOTH:
- Plain text conversation addressing the human's message
- Function calls to analyze their mental states (parallel to the text)

CONVERSATION REQUIREMENTS:
- Write natural, helpful text that directly addresses their message
- Be empathetic, engaging, and provide value
- Answer questions, offer insights, or provide assistance
- Use a warm, conversational tone
- Do NOT mention mental state analysis in your text

THEORY OF MIND ANALYSIS:
- Use the provided functions when you detect mental states
- Be conservative with confidence scores (0.6-0.9 typically)
- Analyze: emotions, beliefs, goals, attention, social dynamics
- Consider conversation history and context

EXAMPLE FLOW:
Human: "I'm stuck on this math problem"
✓ Your text: "I'd be happy to help you with that math problem! What specific part is giving you trouble?"
✓ Your tools: update_emotional_state(frustration), update_motivational_state(learning goal)

✗ WRONG: Only calling tools without conversational text
✓ CORRECT: Both conversational text AND mental state tools

Always provide the human with a meaningful conversational response alongside the analysis!`;
    }
    buildConversationMessages(message, currentSnapshot, context) {
        const messages = [
            { role: 'system', content: this.systemPrompt }
        ];
        // Add conversation history for context
        if (context?.messageHistory && context.messageHistory.length > 0) {
            const recentHistory = context.messageHistory.slice(-10); // Last 10 messages
            for (const msg of recentHistory) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }
        // Add current snapshot as context (but don't make it too verbose)
        if (currentSnapshot) {
            const snapshotSummary = this.summarizeSnapshot(currentSnapshot);
            messages.push({
                role: 'system',
                content: `Current understanding of human's mental state: ${snapshotSummary}`
            });
        }
        // Add the user's current message
        messages.push({ role: 'user', content: message });
        return messages;
    }
    summarizeSnapshot(snapshot) {
        const parts = [];
        if (snapshot.epistemicStates.length > 0) {
            parts.push(`Beliefs: ${snapshot.epistemicStates.map(s => s.content).join('; ')}`);
        }
        if (snapshot.emotionalStates.length > 0) {
            parts.push(`Emotions: ${snapshot.emotionalStates.map(s => `${s.type}(${s.intensity})`).join('; ')}`);
        }
        if (snapshot.motivationalStates.length > 0) {
            parts.push(`Goals: ${snapshot.motivationalStates.map(s => s.content).join('; ')}`);
        }
        if (snapshot.attentionalStates.length > 0) {
            parts.push(`Focus: ${snapshot.attentionalStates.map(s => s.target).join('; ')}`);
        }
        parts.push(`Trust: ${snapshot.socialAwareness.trust_level}, Style: ${snapshot.socialAwareness.communication_style}`);
        return parts.join(' | ');
    }
    async processToolCalls(toolCalls, currentSnapshot) {
        const updates = [];
        const now = Date.now();
        for (const toolCall of toolCalls) {
            // Type guard to ensure we have a function tool call
            if (toolCall.type !== 'function' || !('function' in toolCall) || !toolCall.function) {
                continue;
            }
            try {
                const args = JSON.parse(toolCall.function.arguments);
                const update = this.createToMUpdateFromToolCall(toolCall.function.name, args, now);
                if (update) {
                    updates.push(update);
                }
            }
            catch (error) {
                console.warn('Failed to process tool call:', toolCall, error);
            }
        }
        return updates;
    }
    createToMUpdateFromToolCall(functionName, args, timestamp) {
        const baseUpdate = {
            timestamp,
            action: 'add',
            reasoning: typeof args.reasoning === 'string' ? args.reasoning : undefined
        };
        switch (functionName) {
            case 'update_epistemic_state':
                return {
                    ...baseUpdate,
                    type: 'epistemic',
                    state: {
                        id: this.generateStateId(),
                        timestamp,
                        confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
                        source: 'inference',
                        type: typeof args.type === 'string' ? args.type : 'belief',
                        content: typeof args.content === 'string' ? args.content : '',
                        order: typeof args.order === 'number' ? args.order : 1,
                        evidence: Array.isArray(args.evidence) ? args.evidence : []
                    }
                };
            case 'update_motivational_state':
                return {
                    ...baseUpdate,
                    type: 'motivational',
                    state: {
                        id: this.generateStateId(),
                        timestamp,
                        confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
                        source: 'inference',
                        type: typeof args.type === 'string' ? args.type : 'goal',
                        content: typeof args.content === 'string' ? args.content : '',
                        priority: typeof args.priority === 'string' ? args.priority : 'medium',
                        timeframe: typeof args.timeframe === 'string' ? args.timeframe : undefined,
                        progress: typeof args.progress === 'number' ? args.progress : undefined,
                        blockers: Array.isArray(args.blockers) ? args.blockers : []
                    }
                };
            case 'update_emotional_state':
                return {
                    ...baseUpdate,
                    type: 'emotional',
                    state: {
                        id: this.generateStateId(),
                        timestamp,
                        confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
                        source: 'inference',
                        type: typeof args.type === 'string' ? args.type : 'neutral',
                        intensity: typeof args.intensity === 'number' ? args.intensity : 0.5,
                        triggers: Array.isArray(args.triggers) ? args.triggers : [],
                        duration: typeof args.duration === 'string' ? args.duration : undefined,
                        polarity: typeof args.polarity === 'string' ? args.polarity : 'neutral'
                    }
                };
            case 'update_attentional_state':
                return {
                    ...baseUpdate,
                    type: 'attentional',
                    state: {
                        id: this.generateStateId(),
                        timestamp,
                        confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
                        source: 'inference',
                        type: typeof args.type === 'string' ? args.type : 'focus',
                        target: typeof args.target === 'string' ? args.target : '',
                        intensity: typeof args.intensity === 'number' ? args.intensity : 0.5,
                        competing_targets: Array.isArray(args.competing_targets) ? args.competing_targets : []
                    }
                };
            case 'update_social_awareness':
                return {
                    ...baseUpdate,
                    type: 'social',
                    state: {
                        id: this.generateStateId(),
                        timestamp,
                        confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
                        source: 'inference',
                        relationship_perception: typeof args.relationship_perception === 'string' ? args.relationship_perception : 'neutral',
                        trust_level: typeof args.trust_level === 'number' ? args.trust_level : 0.5,
                        communication_style: typeof args.communication_style === 'string' ? args.communication_style : 'casual',
                        power_dynamic: typeof args.power_dynamic === 'string' ? args.power_dynamic : 'equal',
                        shared_context: Array.isArray(args.shared_context) ? args.shared_context : []
                    }
                };
            default:
                console.warn('Unknown tool function:', functionName);
                return null;
        }
    }
    createUpdatedSnapshot(currentSnapshot, updates) {
        const now = Date.now();
        // Start with current snapshot or create initial one
        const newSnapshot = currentSnapshot ? {
            ...currentSnapshot,
            timestamp: now
        } : {
            timestamp: now,
            confidence: 0.5,
            epistemicStates: [],
            motivationalStates: [],
            emotionalStates: [],
            attentionalStates: [],
            socialAwareness: {
                id: this.generateStateId(),
                timestamp: now,
                confidence: 0.5,
                source: 'inference',
                relationship_perception: 'neutral',
                trust_level: 0.5,
                communication_style: 'casual',
                power_dynamic: 'equal',
                shared_context: []
            }
        };
        // Apply updates
        for (const update of updates) {
            if (!update.state)
                continue;
            switch (update.type) {
                case 'epistemic':
                    newSnapshot.epistemicStates = [...newSnapshot.epistemicStates, update.state];
                    break;
                case 'motivational':
                    newSnapshot.motivationalStates = [...newSnapshot.motivationalStates, update.state];
                    break;
                case 'emotional':
                    newSnapshot.emotionalStates = [...newSnapshot.emotionalStates, update.state];
                    break;
                case 'attentional':
                    newSnapshot.attentionalStates = [...newSnapshot.attentionalStates, update.state];
                    break;
                case 'social':
                    newSnapshot.socialAwareness = update.state;
                    break;
            }
        }
        return newSnapshot;
    }
    extractReasoningFromUpdates(updates) {
        const reasonings = updates
            .map(update => update.reasoning)
            .filter(Boolean)
            .join('; ');
        return reasonings || 'Mental state analysis completed';
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
    generateStateId() {
        return `state_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}
//# sourceMappingURL=gpt-analyzer.js.map