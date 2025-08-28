import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const tomTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'update_epistemic_state',
      description: 'Update the human\'s epistemic states (beliefs, knowledge, uncertainty). Call when you infer what the human believes, knows, or is uncertain about.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['belief', 'knowledge', 'uncertainty', 'assumption'],
            description: 'Type of epistemic state'
          },
          content: {
            type: 'string',
            description: 'What the human believes, knows, or is uncertain about'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence in this inference (0-1)'
          },
          order: {
            type: 'integer',
            enum: [1, 2, 3],
            description: 'Order of belief: 1=human believes X, 2=human thinks AI believes Y, 3=human thinks AI believes human knows Z'
          },
          evidence: {
            type: 'array',
            items: { type: 'string' },
            description: 'Evidence supporting this inference'
          },
          reasoning: {
            type: 'string',
            description: 'Why you made this inference'
          }
        },
        required: ['type', 'content', 'confidence', 'order', 'reasoning']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_motivational_state',
      description: 'Update the human\'s motivational states (goals, desires, intentions). Call when you understand what the human wants to achieve or is trying to do.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['goal', 'desire', 'preference', 'intention', 'plan'],
            description: 'Type of motivational state'
          },
          content: {
            type: 'string',
            description: 'What the human wants to achieve or do'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence in this inference (0-1)'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Priority level of this goal/desire'
          },
          timeframe: {
            type: 'string',
            enum: ['immediate', 'short-term', 'long-term'],
            description: 'When they want to achieve this'
          },
          progress: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'How much progress they\'ve made (0-1)'
          },
          blockers: {
            type: 'array',
            items: { type: 'string' },
            description: 'What\'s preventing them from achieving this'
          },
          reasoning: {
            type: 'string',
            description: 'Why you made this inference'
          }
        },
        required: ['type', 'content', 'confidence', 'priority', 'reasoning']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_emotional_state',
      description: 'Update the human\'s emotional states. Call when you detect emotions in their message or infer their emotional state.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'frustration', 'excitement', 'anxiety', 'contentment', 'curiosity'],
            description: 'Type of emotion detected'
          },
          intensity: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Intensity of the emotion (0-1)'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence in detecting this emotion (0-1)'
          },
          triggers: {
            type: 'array',
            items: { type: 'string' },
            description: 'What triggered this emotion'
          },
          duration: {
            type: 'string',
            enum: ['momentary', 'sustained', 'persistent'],
            description: 'How long this emotion might last'
          },
          polarity: {
            type: 'string',
            enum: ['positive', 'negative', 'neutral'],
            description: 'Whether this is a positive, negative, or neutral emotion'
          },
          reasoning: {
            type: 'string',
            description: 'Why you detected this emotion'
          }
        },
        required: ['type', 'intensity', 'confidence', 'polarity', 'reasoning']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_attentional_state',
      description: 'Update what the human is focusing on or paying attention to. Call when you understand their current focus or interests.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['focus', 'interest', 'distraction', 'engagement'],
            description: 'Type of attentional state'
          },
          target: {
            type: 'string',
            description: 'What they are focusing on or interested in'
          },
          intensity: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'How intensely they are focused (0-1)'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence in this inference (0-1)'
          },
          competing_targets: {
            type: 'array',
            items: { type: 'string' },
            description: 'Other things competing for their attention'
          },
          reasoning: {
            type: 'string',
            description: 'Why you made this inference'
          }
        },
        required: ['type', 'target', 'intensity', 'confidence', 'reasoning']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_social_awareness',
      description: 'Update the human\'s perception of the AI-human relationship and social dynamics. Call when you understand how they view the interaction.',
      parameters: {
        type: 'object',
        properties: {
          relationship_perception: {
            type: 'string',
            enum: ['collaborative', 'adversarial', 'neutral', 'mentoring'],
            description: 'How the human perceives the relationship'
          },
          trust_level: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'How much they trust the AI (0-1)'
          },
          communication_style: {
            type: 'string',
            enum: ['formal', 'casual', 'technical', 'friendly'],
            description: 'Their preferred communication style'
          },
          power_dynamic: {
            type: 'string',
            enum: ['equal', 'human_authority', 'ai_authority', 'unclear'],
            description: 'Perceived power dynamic in the relationship'
          },
          shared_context: {
            type: 'array',
            items: { type: 'string' },
            description: 'Context or knowledge they think is shared'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence in this social inference (0-1)'
          },
          reasoning: {
            type: 'string',
            description: 'Why you made this inference about the social dynamic'
          }
        },
        required: ['confidence', 'reasoning']
      }
    }
  }
];

export interface ToMToolCall {
  function_name: string;
  arguments: Record<string, unknown>;
  reasoning: string;
}