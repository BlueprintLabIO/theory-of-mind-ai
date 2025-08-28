import { TemporalMemory } from '../memory/temporal-memory.js';
import { GPTAnalyzer } from '../analysis/gpt-analyzer.js';
export class ToMAgent {
    memory;
    analyzer;
    config;
    updateStreams = new Set();
    constructor(config) {
        this.config = {
            model: 'gpt-5',
            confidenceThreshold: 0.3,
            maxHistoryLength: 100,
            temporalDecayRate: 0.95,
            analysisPrompt: '',
            enableStreaming: true,
            ...config
        };
        this.memory = new TemporalMemory(this.config.temporalDecayRate, this.config.maxHistoryLength, this.config.confidenceThreshold);
        this.analyzer = new GPTAnalyzer(this.config.openaiApiKey, this.config.model);
    }
    async respondAndAnalyze(message, context) {
        try {
            const currentSnapshot = this.memory.getCurrentSnapshot();
            const analysis = await this.analyzer.analyzeAndRespond(message, currentSnapshot, context);
            // Store the new snapshot
            this.memory.addSnapshot(analysis.new_snapshot);
            // Store individual updates
            for (const update of analysis.tomUpdates) {
                this.memory.addUpdate(update);
                this.notifyUpdateStreams(update);
            }
            return {
                response: analysis.response,
                tomUpdates: analysis.tomUpdates,
                snapshot: analysis.new_snapshot
            };
        }
        catch (error) {
            console.error('Failed to respond and analyze:', error);
            throw error;
        }
    }
    // Legacy method for backward compatibility
    async updateFromMessage(message, context) {
        const result = await this.respondAndAnalyze(message, context);
        return result.tomUpdates;
    }
    async *streamConversation(message, context) {
        const currentSnapshot = this.memory.getCurrentSnapshot();
        // Just pass through the raw OpenAI stream
        for await (const chunk of this.analyzer.streamConversation(message, currentSnapshot, context)) {
            yield chunk;
        }
    }
    // Helper method to process accumulated chunks into final result
    async processStreamResult(chunks) {
        // Extract response content
        let response = '';
        for (const chunk of chunks) {
            response += chunk.choices[0]?.delta?.content || '';
        }
        // Accumulate and process tool calls
        const toolCalls = GPTAnalyzer.accumulateToolCalls(chunks);
        const currentSnapshot = this.memory.getCurrentSnapshot();
        const tomUpdates = await this.analyzer.processToolCalls(toolCalls, currentSnapshot);
        // Create updated snapshot
        const newSnapshot = this.analyzer.createUpdatedSnapshot(currentSnapshot, tomUpdates);
        // Store results
        this.memory.addSnapshot(newSnapshot);
        for (const update of tomUpdates) {
            this.memory.addUpdate(update);
            this.notifyUpdateStreams(update);
        }
        return {
            response,
            tomUpdates,
            snapshot: newSnapshot
        };
    }
    // Legacy streaming method for backward compatibility
    async *updateFromMessageStream(message, context) {
        // Collect all chunks
        const chunks = [];
        for await (const chunk of this.streamConversation(message, context)) {
            chunks.push(chunk);
        }
        // Process final result
        const result = await this.processStreamResult(chunks);
        // Yield updates
        for (const update of result.tomUpdates) {
            yield update;
        }
        return result.tomUpdates;
    }
    getCurrentUnderstanding() {
        return this.memory.getCurrentSnapshot();
    }
    getTemporalHistory() {
        return this.memory.getSnapshotHistory();
    }
    getUpdateHistory() {
        return this.memory.getUpdateHistory();
    }
    getUnderstandingSince(timestamp) {
        return this.memory.getSnapshotsSince(timestamp);
    }
    getUpdatesSince(timestamp) {
        return this.memory.getUpdatesSince(timestamp);
    }
    async *streamUpdates() {
        const updateQueue = [];
        let isActive = true;
        const streamHandler = (update) => {
            updateQueue.push(update);
        };
        this.updateStreams.add(streamHandler);
        try {
            while (isActive) {
                if (updateQueue.length > 0) {
                    const update = updateQueue.shift();
                    yield update;
                }
                else {
                    // Wait a bit before checking again
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        }
        finally {
            this.updateStreams.delete(streamHandler);
        }
    }
    subscribeToUpdates(callback) {
        this.updateStreams.add(callback);
        return () => {
            this.updateStreams.delete(callback);
        };
    }
    updateStateConfidence(stateId, newConfidence) {
        const success = this.memory.updateStateConfidence(stateId, newConfidence);
        if (success) {
            const currentSnapshot = this.memory.getCurrentSnapshot();
            if (currentSnapshot) {
                const update = {
                    timestamp: Date.now(),
                    type: 'social', // Default, could be more specific based on state type
                    action: 'update',
                    reasoning: 'Manual confidence adjustment',
                    confidence_delta: 0 // Will be calculated by memory system
                };
                this.notifyUpdateStreams(update);
            }
        }
        return success;
    }
    getConfidenceStats() {
        const snapshot = this.memory.getCurrentSnapshot();
        if (!snapshot) {
            return {
                averageConfidence: 0,
                stateDistribution: {},
                lowConfidenceStates: 0
            };
        }
        const allStates = [
            ...snapshot.epistemicStates,
            ...snapshot.motivationalStates,
            ...snapshot.emotionalStates,
            ...snapshot.attentionalStates,
            snapshot.socialAwareness
        ];
        const totalConfidence = allStates.reduce((sum, state) => sum + state.confidence, 0);
        const averageConfidence = totalConfidence / allStates.length;
        const stateDistribution = {
            epistemic: snapshot.epistemicStates.length,
            motivational: snapshot.motivationalStates.length,
            emotional: snapshot.emotionalStates.length,
            attentional: snapshot.attentionalStates.length,
            social: 1
        };
        const lowConfidenceStates = allStates.filter(state => state.confidence < this.config.confidenceThreshold * 2).length;
        return {
            averageConfidence,
            stateDistribution,
            lowConfidenceStates
        };
    }
    createInitialSnapshot() {
        const now = Date.now();
        const initialSocialAwareness = {
            id: `social_${now}`,
            timestamp: now,
            confidence: 0.5,
            source: 'inference',
            relationship_perception: 'neutral',
            trust_level: 0.5,
            communication_style: 'casual',
            power_dynamic: 'equal',
            shared_context: []
        };
        const snapshot = {
            timestamp: now,
            confidence: 0.5,
            epistemicStates: [],
            motivationalStates: [],
            emotionalStates: [],
            attentionalStates: [],
            socialAwareness: initialSocialAwareness
        };
        this.memory.addSnapshot(snapshot);
        return snapshot;
    }
    reset() {
        this.memory = new TemporalMemory(this.config.temporalDecayRate, this.config.maxHistoryLength, this.config.confidenceThreshold);
        // Create fresh initial snapshot
        this.createInitialSnapshot();
    }
    destroy() {
        this.memory.destroy();
        this.updateStreams.clear();
    }
    notifyUpdateStreams(update) {
        for (const callback of this.updateStreams) {
            try {
                callback(update);
            }
            catch (error) {
                console.error('Error in update stream callback:', error);
            }
        }
    }
}
//# sourceMappingURL=tom-agent.js.map