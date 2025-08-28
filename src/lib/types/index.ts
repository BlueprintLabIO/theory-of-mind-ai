export type ToMOrder = 1 | 2 | 3;

export interface BaseState {
  id: string;
  timestamp: number;
  confidence: number;
  source: 'inference' | 'explicit' | 'contextual';
}

export interface EpistemicState extends BaseState {
  type: 'belief' | 'knowledge' | 'uncertainty' | 'assumption';
  content: string;
  order: ToMOrder;
  evidence?: string[];
  contradictions?: string[];
}

export interface MotivationalState extends BaseState {
  type: 'goal' | 'desire' | 'preference' | 'intention' | 'plan';
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeframe?: 'immediate' | 'short-term' | 'long-term';
  progress?: number; // 0-1
  blockers?: string[];
}

export interface EmotionalState extends BaseState {
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 
        'frustration' | 'excitement' | 'anxiety' | 'contentment' | 'curiosity';
  intensity: number; // 0-1
  triggers?: string[];
  duration?: 'momentary' | 'sustained' | 'persistent';
  polarity: 'positive' | 'negative' | 'neutral';
}

export interface AttentionalState extends BaseState {
  type: 'focus' | 'interest' | 'distraction' | 'engagement';
  target: string;
  intensity: number; // 0-1
  duration?: number; // milliseconds
  competing_targets?: string[];
}

export interface SocialAwareness extends BaseState {
  relationship_perception: 'collaborative' | 'adversarial' | 'neutral' | 'mentoring';
  trust_level: number; // 0-1
  communication_style: 'formal' | 'casual' | 'technical' | 'friendly';
  power_dynamic: 'equal' | 'human_authority' | 'ai_authority' | 'unclear';
  shared_context: string[];
}

export interface ToMSnapshot {
  timestamp: number;
  confidence: number;
  epistemicStates: EpistemicState[];
  motivationalStates: MotivationalState[];
  emotionalStates: EmotionalState[];
  attentionalStates: AttentionalState[];
  socialAwareness: SocialAwareness;
}

export interface ToMUpdate {
  timestamp: number;
  type: 'epistemic' | 'motivational' | 'emotional' | 'attentional' | 'social';
  action: 'add' | 'update' | 'remove' | 'confidence_decay';
  state?: BaseState;
  previous_state?: BaseState;
  reasoning?: string;
  confidence_delta?: number;
}

export interface ToMAgentConfig {
  openaiApiKey: string;
  model?: string;
  confidenceThreshold?: number;
  maxHistoryLength?: number;
  temporalDecayRate?: number;
  analysisPrompt?: string;
  enableStreaming?: boolean;
}

export interface ConversationContext {
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  sessionMetadata?: Record<string, unknown>;
  environmentContext?: string;
}

export interface AnalysisResult {
  updates: ToMUpdate[];
  reasoning: string;
  confidence: number;
  new_snapshot: ToMSnapshot;
}