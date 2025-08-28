import OpenAI from 'openai';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import { tomTools } from './tom-tools.js';
import type { 
  ToMSnapshot, 
  ToMUpdate, 
  ConversationContext, 
  // AnalysisResult,
  EpistemicState,
  MotivationalState,
  EmotionalState,
  AttentionalState,
  SocialAwareness
} from '../types/index.js';

export interface ConversationAnalysis {
  response: string;
  tomUpdates: ToMUpdate[];
  reasoning: string;
  confidence: number;
  new_snapshot: ToMSnapshot;
}

export class GPTAnalyzer {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ 
      apiKey: "dummy",
      baseURL: 'https://llm-proxy-735482512776.us-west1.run.app',
      dangerouslyAllowBrowser: true
    });
    this.model = model;
    this.systemPrompt = this.buildSystemPrompt();
  }

  async analyzeAndRespond(
    message: string, 
    currentSnapshot: ToMSnapshot | null,
    context?: ConversationContext
  ): Promise<ConversationAnalysis> {
    try {
      // Step 1: Always run ToM analysis first
      const tomUpdates = await this.analyzeTheoryOfMind(message, currentSnapshot, context);
      const newSnapshot = this.createUpdatedSnapshot(currentSnapshot, tomUpdates);
      
      // Step 2: Generate conversational response informed by ToM analysis
      const conversationResponse = await this.generateConversationalResponse(
        message, 
        newSnapshot, 
        tomUpdates,
        context
      );

      // console.log(conversationResponse);

      return {
        response: conversationResponse,
        tomUpdates,
        reasoning: this.extractReasoningFromUpdates(tomUpdates),
        confidence: this.calculateOverallConfidence(tomUpdates),
        new_snapshot: newSnapshot
      };
    } catch (error) {
      console.error('GPT Analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeTheoryOfMind(
    message: string,
    currentSnapshot: ToMSnapshot | null,
    context?: ConversationContext
  ): Promise<ToMUpdate[]> {
    const messages = this.buildToMAnalysisMessages(message, currentSnapshot, context);
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: tomTools,
      tool_choice: 'required',
      parallel_tool_calls: true
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error('No ToM analysis response from GPT');
    }

    const toolCalls = assistantMessage.tool_calls || [];
    return await this.processToolCalls(toolCalls, currentSnapshot);
  }

  private async generateConversationalResponse(
    message: string,
    updatedSnapshot: ToMSnapshot,
    tomUpdates: ToMUpdate[],
    context?: ConversationContext
  ): Promise<string> {
    const messages = this.buildConversationalMessages(message, updatedSnapshot, tomUpdates, context);
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage?.content) {
      throw new Error('No conversational response from GPT');
    }

    return assistantMessage.content;
  }

  async *streamConversationalResponse(
    message: string,
    updatedSnapshot: ToMSnapshot,
    tomUpdates: ToMUpdate[],
    context?: ConversationContext
  ): AsyncGenerator<string> {
    const messages = this.buildConversationalMessages(message, updatedSnapshot, tomUpdates, context);
    
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }

  async *streamConversation(
    message: string,
    currentSnapshot: ToMSnapshot | null,
    context?: ConversationContext
  ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk> {
    const messages = this.buildToMAnalysisMessages(message, currentSnapshot, context);
    
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: tomTools,
        tool_choice: 'required',
        // temperature: 0.7,
        // max_tokens: 2000,
        parallel_tool_calls: true,
        stream: true
      });

      // Just yield the raw OpenAI chunks - let UI handle accumulation
      for await (const chunk of stream) {
        yield chunk;
      }
      
    } catch (error) {
      console.error('Streaming conversation failed:', error);
      throw new Error(`Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to accumulate tool calls from stream chunks
  static accumulateToolCalls(chunks: OpenAI.Chat.Completions.ChatCompletionChunk[]): ChatCompletionMessageToolCall[] {
    const toolCallsMap: Record<number, any> = {};
    
    for (const chunk of chunks) {
      const toolCalls = chunk.choices[0]?.delta?.tool_calls || [];
      
      for (const toolCall of toolCalls) {
        if (toolCall.index === undefined) continue;
        
        const index = toolCall.index!;
        
        if (!toolCallsMap[index]) {
          toolCallsMap[index] = {
            id: toolCall.id!,
            type: 'function',
            function: {
              name: toolCall.function?.name || '',
              arguments: toolCall.function?.arguments || ''
            }
          };
        } else {
          // Accumulate arguments
          if (toolCallsMap[index].function && toolCall.function?.arguments) {
            toolCallsMap[index].function.arguments += toolCall.function.arguments;
          }
        }
      }
    }
    
    return Object.values(toolCallsMap);
  }

  private buildSystemPrompt(): string {
    return `You are an expert conversational AI with advanced theory of mind capabilities.`;
  }

  private buildToMSystemPrompt(): string {
    return `You are a specialized theory of mind analyzer. Your ONLY job is to analyze the human's mental states from their message and call the appropriate analysis tools.

Analyze their message and use the available tools to identify:
- Emotional states (what they're feeling)
- Epistemic states (what they believe/know)  
- Motivational states (what they want/desire)
- Attentional states (what they're focused on)
- Social awareness (relationship dynamics)

You MUST call the appropriate analysis tools for every message.`;
  }

  private buildConversationalSystemPrompt(snapshot: ToMSnapshot, updates: ToMUpdate[]): string {
    const analysisContext = this.formatAnalysisForConversation(snapshot, updates);
    
    return `You are a helpful conversational AI. Respond naturally and helpfully to the human's message.

Here's your analysis of their current mental state:
${analysisContext}

Use this understanding to provide an empathetic, contextually appropriate response. Be natural and conversational - don't explicitly mention the mental state analysis unless relevant.`;
  }

  private buildToMAnalysisMessages(
    message: string,
    currentSnapshot: ToMSnapshot | null,
    context?: ConversationContext
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    let systemContent = this.buildToMSystemPrompt();
    
    if (currentSnapshot) {
      const snapshotSummary = this.summarizeSnapshot(currentSnapshot);
      systemContent += `\n\nPrevious understanding: ${snapshotSummary}`;
    }
    
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemContent }
    ];

    // Add conversation history for context
    if (context?.messageHistory && context.messageHistory.length > 0) {
      const recentHistory = context.messageHistory.slice(-5); // Fewer messages for analysis
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the user's current message
    messages.push({ role: 'user', content: message });

    return messages;
  }

  private buildConversationalMessages(
    message: string,
    updatedSnapshot: ToMSnapshot,
    tomUpdates: ToMUpdate[],
    context?: ConversationContext
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: this.buildConversationalSystemPrompt(updatedSnapshot, tomUpdates) }
    ];

    // Add conversation history for context
    if (context?.messageHistory && context.messageHistory.length > 0) {
      const recentHistory = context.messageHistory.slice(-8); // Recent context
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the user's current message
    messages.push({ role: 'user', content: message });

    return messages;
  }

  private formatAnalysisForConversation(snapshot: ToMSnapshot, updates: ToMUpdate[]): string {
    const parts: string[] = [];
    
    // Recent updates
    if (updates.length > 0) {
      const updateSummary = updates.map(u => `${u.type}: ${u.reasoning || 'Updated'}`).join(', ');
      parts.push(`Recent insights: ${updateSummary}`);
    }
    
    // Current state summary  
    const snapshotSummary = this.summarizeSnapshot(snapshot);
    if (snapshotSummary) {
      parts.push(`Overall state: ${snapshotSummary}`);
    }
    
    return parts.join('\n');
  }

  private summarizeSnapshot(snapshot: ToMSnapshot): string {
    const parts: string[] = [];
    
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

  async processToolCalls(
    toolCalls: ChatCompletionMessageToolCall[],
    currentSnapshot: ToMSnapshot | null
  ): Promise<ToMUpdate[]> {
    const updates: ToMUpdate[] = [];
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
      } catch (error) {
        console.warn('Failed to process tool call:', toolCall, error);
      }
    }

    return updates;
  }

  createToMUpdateFromToolCall(
    functionName: string,
    args: Record<string, unknown>,
    timestamp: number
  ): ToMUpdate | null {
    const baseUpdate: Partial<ToMUpdate> = {
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
            type: typeof args.type === 'string' ? args.type as any : 'belief',
            content: typeof args.content === 'string' ? args.content : '',
            order: typeof args.order === 'number' ? args.order as any : 1,
            evidence: Array.isArray(args.evidence) ? args.evidence as string[] : []
          } as EpistemicState
        } as ToMUpdate;

      case 'update_motivational_state':
        return {
          ...baseUpdate,
          type: 'motivational',
          state: {
            id: this.generateStateId(),
            timestamp,
            confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
            source: 'inference',
            type: typeof args.type === 'string' ? args.type as any : 'goal',
            content: typeof args.content === 'string' ? args.content : '',
            priority: typeof args.priority === 'string' ? args.priority as any : 'medium',
            timeframe: typeof args.timeframe === 'string' ? args.timeframe as any : undefined,
            progress: typeof args.progress === 'number' ? args.progress : undefined,
            blockers: Array.isArray(args.blockers) ? args.blockers as string[] : []
          } as MotivationalState
        } as ToMUpdate;

      case 'update_emotional_state':
        return {
          ...baseUpdate,
          type: 'emotional',
          state: {
            id: this.generateStateId(),
            timestamp,
            confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
            source: 'inference',
            type: typeof args.type === 'string' ? args.type as any : 'neutral',
            intensity: typeof args.intensity === 'number' ? args.intensity : 0.5,
            triggers: Array.isArray(args.triggers) ? args.triggers as string[] : [],
            duration: typeof args.duration === 'string' ? args.duration as any : undefined,
            polarity: typeof args.polarity === 'string' ? args.polarity as any : 'neutral'
          } as EmotionalState
        } as ToMUpdate;

      case 'update_attentional_state':
        return {
          ...baseUpdate,
          type: 'attentional',
          state: {
            id: this.generateStateId(),
            timestamp,
            confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
            source: 'inference',
            type: typeof args.type === 'string' ? args.type as any : 'focus',
            target: typeof args.target === 'string' ? args.target : '',
            intensity: typeof args.intensity === 'number' ? args.intensity : 0.5,
            competing_targets: Array.isArray(args.competing_targets) ? args.competing_targets as string[] : []
          } as AttentionalState
        } as ToMUpdate;

      case 'update_social_awareness':
        return {
          ...baseUpdate,
          type: 'social',
          state: {
            id: this.generateStateId(),
            timestamp,
            confidence: typeof args.confidence === 'number' ? args.confidence : 0.5,
            source: 'inference',
            relationship_perception: typeof args.relationship_perception === 'string' ? args.relationship_perception as any : 'neutral',
            trust_level: typeof args.trust_level === 'number' ? args.trust_level : 0.5,
            communication_style: typeof args.communication_style === 'string' ? args.communication_style as any : 'casual',
            power_dynamic: typeof args.power_dynamic === 'string' ? args.power_dynamic as any : 'equal',
            shared_context: Array.isArray(args.shared_context) ? args.shared_context as string[] : []
          } as SocialAwareness
        } as ToMUpdate;

      default:
        console.warn('Unknown tool function:', functionName);
        return null;
    }
  }

  createUpdatedSnapshot(
    currentSnapshot: ToMSnapshot | null,
    updates: ToMUpdate[]
  ): ToMSnapshot {
    const now = Date.now();
    
    // Start with current snapshot or create initial one
    const newSnapshot: ToMSnapshot = currentSnapshot ? {
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
      if (!update.state) continue;

      switch (update.type) {
        case 'epistemic':
          newSnapshot.epistemicStates = [...newSnapshot.epistemicStates, update.state as EpistemicState];
          break;
        case 'motivational':
          newSnapshot.motivationalStates = [...newSnapshot.motivationalStates, update.state as MotivationalState];
          break;
        case 'emotional':
          newSnapshot.emotionalStates = [...newSnapshot.emotionalStates, update.state as EmotionalState];
          break;
        case 'attentional':
          newSnapshot.attentionalStates = [...newSnapshot.attentionalStates, update.state as AttentionalState];
          break;
        case 'social':
          newSnapshot.socialAwareness = update.state as SocialAwareness;
          break;
      }
    }

    return newSnapshot;
  }

  private extractReasoningFromUpdates(updates: ToMUpdate[]): string {
    const reasonings = updates
      .map(update => update.reasoning)
      .filter(Boolean)
      .join('; ');
    
    return reasonings || 'Mental state analysis completed';
  }

  private calculateOverallConfidence(updates: ToMUpdate[]): number {
    if (updates.length === 0) return 0.5;
    
    const confidences = updates
      .map(update => update.state?.confidence || 0.5)
      .filter(conf => conf > 0);
    
    if (confidences.length === 0) return 0.5;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  private generateStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}