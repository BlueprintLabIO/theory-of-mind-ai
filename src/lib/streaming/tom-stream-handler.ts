import type OpenAI from 'openai';

import type { ToMAgent } from '../agent/tom-agent.js';
import type { ConversationContext, ToMUpdate } from '../types/index.js';


// UI callback interface
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

// Main stream handler for ToM conversations
export class ToMStreamHandler {
  private callbacks: ToMUICallbacks;

  constructor(callbacks: ToMUICallbacks) {
    this.callbacks = callbacks;
  }

  async consume(
    agent: ToMAgent,
    message: string,
    context?: ConversationContext
  ): Promise<void> {

    try {
      // Step 1: Get ToM analysis first and update UI immediately
      const currentSnapshot = await agent.getCurrentSnapshot();
      const tomUpdates = await agent.analyzeMessage(message, context);
      const newSnapshot = await agent.getUpdatedSnapshot();
      
      // Update ToM UI immediately after analysis
      for (const update of tomUpdates) {
        this.callbacks.updateMentalState({
          type: update.type,
          status: 'complete'
        });
      }
      
      // Show confidence and reasoning from analysis
      this.callbacks.showConfidence(0.8);
      this.callbacks.showReasoning('Mental state analysis complete');
      
      // Step 2: Generate conversational response (happens after UI updates)
      const conversationResponse = await agent.generateResponse(message, newSnapshot, tomUpdates, context);
      
      // Simulate streaming for the response to maintain UI compatibility
      const chunkSize = 3; // Characters per chunk
      
      // Stream the response in chunks
      for (let i = 0; i < conversationResponse.length; i += chunkSize) {
        const chunk = conversationResponse.slice(i, i + chunkSize);
        this.callbacks.streamResponse(chunk);
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Notify completion
      this.callbacks.onComplete({
        response: conversationResponse,
        tomUpdates: tomUpdates,
        reasoning: 'Two-step analysis complete',
        confidence: 0.8
      });

    } catch (error) {
      console.error('Stream consumption failed:', error);
      throw error;
    }
  }

}