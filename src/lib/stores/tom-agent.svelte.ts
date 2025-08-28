import { ToMAgent, type ToMSnapshot, type ToMUpdate } from '$lib/index.js';
import { browser } from '$app/environment';

interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
	streaming?: boolean;
	tomUpdates?: ToMUpdate[];
}

interface MentalStateUpdate {
	type: 'epistemic' | 'emotional' | 'motivational' | 'attentional' | 'social';
	content?: string;
	confidence?: number;
	intensity?: number;
	status: 'complete';
	timestamp: number;
}

class ToMAgentStore {
	private agent: ToMAgent | null = $state(null);
	
	// Chat state
	messages = $state<ChatMessage[]>([]);
	isGenerating = $state(false);
	currentMessage = $state('');
	
	// ToM state  
	currentSnapshot = $state<ToMSnapshot | null>(null);
	mentalStateUpdates = $state<MentalStateUpdate[]>([]);
	overallConfidence = $state(0.5);
	reasoning = $state('');
	
	// Error state
	error = $state<string | null>(null);
	
	initialize() {
		if (!browser) return;
		
		// Using proxy endpoint - no real API key needed
		const apiKey = 'dummy-key'; // Using proxy endpoint
		
		try {
			this.agent = new ToMAgent({
				openaiApiKey: apiKey,
				model: 'gpt-4o',
				enableStreaming: true
			});
			
			// Create initial snapshot
			this.currentSnapshot = this.agent.createInitialSnapshot();
			
			this.error = null;
			
		} catch (err) {
			this.error = `Failed to initialize ToM Agent: ${err instanceof Error ? err.message : 'Unknown error'}`;
		}
	}
	
	async sendMessage(content: string) {
		if (!this.agent || this.isGenerating) return;
		
		this.isGenerating = true;
		this.error = null;
		
		// Add user message
		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content,
			timestamp: Date.now()
		};
		this.messages.push(userMessage);
		
		// Add streaming assistant message
		const assistantMessageId = crypto.randomUUID();
		const assistantMessage: ChatMessage = {
			id: assistantMessageId,
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
			streaming: true
		};
		this.messages.push(assistantMessage);
		
		try {
			// Build conversation context
			const context = {
				messageHistory: this.messages.slice(-10).map(msg => ({
					role: msg.role,
					content: msg.content,
					timestamp: msg.timestamp
				}))
			};
			
			// Step 1: Get ToM analysis first (non-streaming)
			const tomUpdates = await this.agent.analyzeTheoryOfMind(content, context);
			const newSnapshot = this.agent.createUpdatedSnapshot(this.currentSnapshot, tomUpdates);
			
			// Update ToM UI immediately after analysis
			this.currentSnapshot = newSnapshot;
			this.reasoning = tomUpdates.map((u: ToMUpdate) => u.reasoning).filter(Boolean).join('; ') || '';
			this.overallConfidence = 0.8;
			
			// Process ToM updates
			for (const update of tomUpdates) {
				this.mentalStateUpdates.push({
					type: update.type,
					content: update.reasoning,
					status: 'complete',
					timestamp: Date.now()
				});
			}
			
			// Step 2: Stream the conversational response
			let accumulatedResponse = '';
			for await (const chunk of this.agent.streamResponse(content, newSnapshot, tomUpdates, context)) {
				accumulatedResponse += chunk;
				
				// Update the streaming message with accumulated content
				const msgIndex = this.messages.findIndex(msg => msg.id === assistantMessageId);
				if (msgIndex !== -1) {
					this.messages[msgIndex] = {
						...this.messages[msgIndex],
						content: accumulatedResponse,
						streaming: true
					};
				}
			}
			
			// Mark streaming as complete
			const msgIndex = this.messages.findIndex(msg => msg.id === assistantMessageId);
			if (msgIndex !== -1) {
				this.messages[msgIndex] = {
					...this.messages[msgIndex],
					streaming: false,
					tomUpdates: tomUpdates
				};
			}
			
		} catch (err) {
			this.error = `Conversation failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
			
			// Update assistant message with error
			const msgIndex = this.messages.findIndex(msg => msg.id === assistantMessageId);
			if (msgIndex !== -1) {
				this.messages[msgIndex] = {
					...this.messages[msgIndex],
					content: 'Sorry, I encountered an error. Please try again.',
					streaming: false
				};
			}
		}
		
		this.isGenerating = false;
	}
	
	
	clearConversation() {
		this.messages = [];
		this.mentalStateUpdates = [];
		this.reasoning = '';
		this.overallConfidence = 0.5;
		this.error = null;
		
		// Reset to initial snapshot
		if (this.agent) {
			this.agent.reset();
			this.currentSnapshot = this.agent.getCurrentUnderstanding();
		}
	}
	
	get hasConversation() {
		return this.messages.length > 0;
	}
	
	get isReady() {
		return this.agent !== null && !this.error;
	}
}

export const tomAgent = new ToMAgentStore();