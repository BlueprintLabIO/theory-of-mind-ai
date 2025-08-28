import OpenAI from 'openai';
import { TemporalMemory } from '../memory/temporal-memory.js';
import { GPTAnalyzer } from '../analysis/gpt-analyzer.js';

import type { 
  ToMSnapshot, 
  ToMUpdate, 
  ToMAgentConfig, 
  ConversationContext,
  SocialAwareness
} from '../types/index.js';

export interface ConversationResponse {
  response: string;
  tomUpdates: ToMUpdate[];
  snapshot: ToMSnapshot;
}

export class ToMAgent {
  private memory: TemporalMemory;
  private analyzer: GPTAnalyzer;
  private config: Required<ToMAgentConfig>;
  private updateStreams: Set<(update: ToMUpdate) => void> = new Set();

  constructor(config: ToMAgentConfig) {
    this.config = {
      model: 'gpt-5',
      confidenceThreshold: 0.3,
      maxHistoryLength: 100,
      temporalDecayRate: 0.95,
      analysisPrompt: '',
      enableStreaming: true,
      ...config
    };

    this.memory = new TemporalMemory(
      this.config.temporalDecayRate,
      this.config.maxHistoryLength,
      this.config.confidenceThreshold
    );

    this.analyzer = new GPTAnalyzer(
      this.config.openaiApiKey,
      this.config.model
    );
  }

  async respondAndAnalyze(
    message: string, 
    context?: ConversationContext
  ): Promise<ConversationResponse> {
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
    } catch (error) {
      console.error('Failed to respond and analyze:', error);
      throw error;
    }
  }

  async *streamResponse(
    message: string,
    snapshot: ToMSnapshot,
    tomUpdates: ToMUpdate[],
    context?: ConversationContext
  ): AsyncGenerator<string> {
    for await (const chunk of this.analyzer.streamConversationalResponse(
      message, 
      snapshot, 
      tomUpdates, 
      context
    )) {
      yield chunk;
    }
  }

  async analyzeTheoryOfMind(message: string, context?: ConversationContext): Promise<ToMUpdate[]> {
    const currentSnapshot = this.memory.getCurrentSnapshot();
    return await this.analyzer.analyzeTheoryOfMind(message, currentSnapshot, context);
  }

  createUpdatedSnapshot(currentSnapshot: ToMSnapshot | null, tomUpdates: ToMUpdate[]): ToMSnapshot {
    return this.analyzer.createUpdatedSnapshot(currentSnapshot, tomUpdates);
  }

  // Legacy method for backward compatibility
  async updateFromMessage(
    message: string, 
    context?: ConversationContext
  ): Promise<ToMUpdate[]> {
    const result = await this.respondAndAnalyze(message, context);
    return result.tomUpdates;
  }

  async *streamConversation(
    message: string,
    context?: ConversationContext
  ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk> {
    const currentSnapshot = this.memory.getCurrentSnapshot();
    
    // Just pass through the raw OpenAI stream
    for await (const chunk of this.analyzer.streamConversation(message, currentSnapshot, context)) {
      yield chunk;
    }
  }

  // Helper method to process accumulated chunks into final result
  async processStreamResult(
    chunks: OpenAI.Chat.Completions.ChatCompletionChunk[]
  ): Promise<ConversationResponse> {
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
  async *updateFromMessageStream(
    message: string,
    context?: ConversationContext
  ): AsyncGenerator<ToMUpdate, ToMUpdate[]> {
    // Collect all chunks
    const chunks: OpenAI.Chat.Completions.ChatCompletionChunk[] = [];
    
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

  getCurrentUnderstanding(): ToMSnapshot | null {
    return this.memory.getCurrentSnapshot();
  }

  getTemporalHistory(): ToMSnapshot[] {
    return this.memory.getSnapshotHistory();
  }

  getUpdateHistory(): ToMUpdate[] {
    return this.memory.getUpdateHistory();
  }

  getUnderstandingSince(timestamp: number): ToMSnapshot[] {
    return this.memory.getSnapshotsSince(timestamp);
  }

  getUpdatesSince(timestamp: number): ToMUpdate[] {
    return this.memory.getUpdatesSince(timestamp);
  }

  async *streamUpdates(): AsyncGenerator<ToMUpdate, void, unknown> {
    const updateQueue: ToMUpdate[] = [];
    let isActive = true;

    const streamHandler = (update: ToMUpdate) => {
      updateQueue.push(update);
    };

    this.updateStreams.add(streamHandler);

    try {
      while (isActive) {
        if (updateQueue.length > 0) {
          const update = updateQueue.shift()!;
          yield update;
        } else {
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } finally {
      this.updateStreams.delete(streamHandler);
    }
  }

  subscribeToUpdates(callback: (update: ToMUpdate) => void): () => void {
    this.updateStreams.add(callback);
    return () => {
      this.updateStreams.delete(callback);
    };
  }

  updateStateConfidence(stateId: string, newConfidence: number): boolean {
    const success = this.memory.updateStateConfidence(stateId, newConfidence);
    
    if (success) {
      const currentSnapshot = this.memory.getCurrentSnapshot();
      if (currentSnapshot) {
        const update: ToMUpdate = {
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

  getConfidenceStats(): {
    averageConfidence: number;
    stateDistribution: Record<string, number>;
    lowConfidenceStates: number;
  } {
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

    const lowConfidenceStates = allStates.filter(
      state => state.confidence < this.config.confidenceThreshold * 2
    ).length;

    return {
      averageConfidence,
      stateDistribution,
      lowConfidenceStates
    };
  }

  createInitialSnapshot(): ToMSnapshot {
    const now = Date.now();
    const initialSocialAwareness: SocialAwareness = {
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

    const snapshot: ToMSnapshot = {
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

  reset(): void {
    this.memory = new TemporalMemory(
      this.config.temporalDecayRate,
      this.config.maxHistoryLength,
      this.config.confidenceThreshold
    );
    
    // Create fresh initial snapshot
    this.createInitialSnapshot();
  }

  destroy(): void {
    this.memory.destroy();
    this.updateStreams.clear();
  }

  private notifyUpdateStreams(update: ToMUpdate): void {
    for (const callback of this.updateStreams) {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in update stream callback:', error);
      }
    }
  }
}