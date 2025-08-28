# Theory of Mind AI Library

A TypeScript library for building AI agents with dynamic theory of mind capabilities, featuring real-time understanding of human mental states during conversations.

## Overview

This project combines:

1. **Core Library** (`src/lib/`) - TypeScript library for tracking and updating theory of mind understanding
2. **Interactive Demo** (`src/routes/`) - Real-time SvelteKit web application with Apple HIG design

## Core Library Features

### Multi-Level Theory of Mind Tracking
- **1st Order**: "The human believes X"
- **2nd Order**: "The human thinks I believe Y" 
- **3rd Order**: "The human thinks I believe they know Z"

### State Categories (Research-Based)
- **Epistemic States**: Knowledge, beliefs, uncertainty levels
- **Motivational States**: Goals, desires, preferences, intentions
- **Emotional States**: Current emotions, emotional patterns
- **Attentional States**: Focus areas, interests, attention shifts
- **Social Awareness**: Human's understanding of the AI-human relationship

### Temporal Memory System
- Message-level granular updates
- Confidence scoring with temporal decay
- Historical state tracking
- Automatic pruning of low-confidence entries

## Demo Application Features

### Real-Time Chat Interface
- GPT-5 powered conversations with streaming responses
- Live theory of mind updates per message
- Apple HIG compliant design system with Tailwind CSS

### Visualization Components
- **Live ToM Dashboard**: Real-time state updates with smooth animations
- **Confidence Heat Maps**: Dynamic color coding using Apple's semantic colors
- **Temporal Timeline**: Historical view of belief evolution
- **Multi-Level Belief Trees**: Collapsible hierarchical mental state representation
- **Emotional Indicators**: Visual emotional state tracking

## Quick Start

### Installation & Development

```bash
# Clone and install dependencies
git clone https://github.com/your-org/theory-of-mind-ai
cd theory-of-mind-ai
npm install

# Add OpenAI API key to environment
echo "OPENAI_API_KEY=your-api-key-here" > .env.local

# Start development server
npm run dev
```

### Using the Core Library

```typescript
import { ToMAgent, ToMStreamHandler } from '$lib';

const agent = new ToMAgent({
  openaiApiKey: process.env.OPENAI_API_KEY
});

// Natural conversation with ToM analysis
const result = await agent.respondAndAnalyze("I'm feeling frustrated with this task");
console.log('AI Response:', result.response);
console.log('Detected mental states:', result.tomUpdates);

// Real-time streaming with UI callbacks
const streamHandler = new ToMStreamHandler({
  streamResponse: (delta) => console.log('Streaming:', delta),
  updateMentalState: (state) => console.log('Mental state:', state),
  showToolCall: (tool) => console.log('Tool call:', tool),
  showConfidence: (conf) => console.log('Confidence:', conf),
  showReasoning: (reasoning) => console.log('Reasoning:', reasoning),
  onComplete: (result) => console.log('Complete:', result)
});

await streamHandler.consume(agent, "I'm stuck on this problem");
```

### Example ToM Snapshot

```typescript
{
  timestamp: 1703123456789,
  confidence: 0.85,
  epistemicStates: [
    {
      type: 'belief',
      content: 'User believes the current task is challenging',
      confidence: 0.9,
      order: 1
    }
  ],
  emotionalStates: [
    {
      type: 'frustration',
      intensity: 0.7,
      confidence: 0.85,
      triggers: ['task_difficulty']
    }
  ],
  motivationalStates: [
    {
      type: 'goal',
      content: 'Complete the task efficiently',
      priority: 'high',
      confidence: 0.8
    }
  ]
}
```

## Project Structure

```
theory-of-mind-ai/
├── src/
│   ├── lib/
│   │   ├── agent/          # ToMAgent main class
│   │   ├── states/         # State type definitions
│   │   ├── memory/         # Temporal memory management
│   │   ├── analysis/       # GPT-5 integration for ToM reasoning
│   │   ├── types/          # TypeScript interfaces
│   │   └── index.ts        # Library exports
│   ├── routes/
│   │   ├── +page.svelte    # Main demo interface
│   │   └── +layout.svelte  # Apple HIG layout
│   └── app.html            # SvelteKit app template
├── static/                 # Static assets
└── package.json           # Dependencies and scripts
```

## Technical Stack

- **Framework**: SvelteKit with Svelte 5 runes
- **Styling**: Tailwind CSS with Apple HIG design tokens  
- **AI**: OpenAI GPT-5 with function calling and streaming
- **Architecture**: Tool-based natural conversations with real-time ToM updates
- **Decay System**: Message-based confidence decay (not time-based)
- **Language**: TypeScript
- **Build**: Vite

## Research Foundation

Based on current theory of mind research:

- **Baron-Cohen's Theory of Mind mechanisms**
- **Premack & Woodruff's foundational work**
- **Recent advances in computational theory of mind**
- **Multi-level belief attribution models**
- **Temporal confidence modeling in social cognition**

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type checking
npm run lint         # Code linting
npm run format       # Code formatting
```

## API Reference

### ToMAgent

#### Methods

- `updateFromMessage(message: string): Promise<ToMUpdate>`
- `getCurrentUnderstanding(): ToMSnapshot`
- `getTemporalHistory(): ToMSnapshot[]`
- `streamUpdates(): AsyncIterator<ToMUpdate>`

#### Configuration

```typescript
const agent = new ToMAgent({
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-5',
  confidenceThreshold: 0.3,
  maxHistoryLength: 100,
  temporalDecayRate: 0.95
});
```

## Environment Variables

Create a `.env.local` file with:

```bash
OPENAI_API_KEY=your-openai-api-key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for advancing AI's understanding of human cognition**
