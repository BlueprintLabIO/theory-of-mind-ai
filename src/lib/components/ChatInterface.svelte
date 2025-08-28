<script lang="ts">
	import { tomAgent } from '$lib/stores/tom-agent.svelte';
	import { tick } from 'svelte';
	import MessageBubble from './MessageBubble.svelte';
	
	let messageInput = $state('');
	let messagesContainer: HTMLDivElement;
	
	const handleSubmit = async () => {
		if (!messageInput.trim() || tomAgent.isGenerating || !tomAgent.isReady) return;
		
		const message = messageInput.trim();
		messageInput = '';

		// Scroll to bottom after message is sent
		setTimeout(() => {
			if (messagesContainer) {
				scroll();
			}
		}, 10);
		
		await tomAgent.sendMessage(message);		
	};
	
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};
	
	// Auto-scroll to bottom when new messages arrive or during streaming
	const scrollToBottom = () => {
		if (messagesContainer) {
			const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
			const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
			
			if (isNearBottom) {
				scroll()
			}
		}
	};

	const scroll = () => {
		// console.log("scroll")
		const { scrollHeight } = messagesContainer;
		messagesContainer.scrollTop = scrollHeight;
	}

	$effect(() => {
		if (messagesContainer && tomAgent.messages.length > 0) {
			setTimeout(scrollToBottom, 50);
		}
	});

	// Additional scroll during streaming responses
	$effect(() => {
		if (tomAgent.isGenerating) {
			const interval = setInterval(scrollToBottom, 100);
			return () => clearInterval(interval);
		}
	});
</script>

<div class="flex-1 flex flex-col min-h-0">
	<!-- Messages Area -->
	<div 
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4 min-h-0"
	>
		{#if tomAgent.error}
			<div class="apple-card p-4 border border-[var(--apple-red)] border-opacity-30 bg-red-50 dark:bg-red-950">
				<div class="flex items-start gap-3">
					<span class="text-[var(--apple-red)]">⚠️</span>
					<div>
						<p class="font-medium text-[var(--apple-red)]">Configuration Error</p>
						<p class="text-sm apple-text-secondary mt-1">{tomAgent.error}</p>
						{#if tomAgent.error.includes('API key')}
							<p class="text-sm apple-text-tertiary mt-2">
								Add your OpenAI API key to <code class="apple-font-mono bg-[var(--apple-system-fill)] px-1 rounded">.env.local</code>:
							</p>
							<pre class="text-xs apple-font-mono bg-[var(--apple-system-fill)] p-2 rounded mt-1 overflow-x-auto">VITE_PUBLIC_OPENAI_API_KEY=your-api-key-here</pre>
						{/if}
					</div>
				</div>
			</div>
		{:else if tomAgent.messages.length === 0}
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center max-w-md">
					<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-purple)] flex items-center justify-center">
						<span class="text-2xl">🧠</span>
					</div>
					<h2 class="text-xl font-semibold apple-text-primary mb-2">Welcome to Theory of Mind AI</h2>
					<p class="apple-text-secondary text-sm leading-relaxed">
						Start a conversation and watch as I understand your mental states in real-time. 
						I'll track your beliefs, emotions, goals, and social perceptions as we chat.
					</p>
					<div class="mt-6 space-y-2">
						<p class="text-sm font-medium apple-text-secondary">Try asking about:</p>
						<div class="flex flex-wrap gap-2 justify-center">
							<button 
								onclick={() => messageInput = "I'm working on a challenging project"}
								class="px-3 py-1 text-xs bg-[var(--apple-system-fill)] rounded-full apple-text-secondary hover:bg-[var(--apple-secondary-system-fill)] apple-animate"
								disabled={!tomAgent.isReady}
							>
								Your work
							</button>
							<button 
								onclick={() => messageInput = "I feel frustrated with this task"}
								class="px-3 py-1 text-xs bg-[var(--apple-system-fill)] rounded-full apple-text-secondary hover:bg-[var(--apple-secondary-system-fill)] apple-animate"
								disabled={!tomAgent.isReady}
							>
								Your emotions
							</button>
							<button 
								onclick={() => messageInput = "I want to learn something new"}
								class="px-3 py-1 text-xs bg-[var(--apple-system-fill)] rounded-full apple-text-secondary hover:bg-[var(--apple-secondary-system-fill)] apple-animate"
								disabled={!tomAgent.isReady}
							>
								Your goals
							</button>
						</div>
					</div>
				</div>
			</div>
		{:else}
			{#each tomAgent.messages as message (message.id)}
				<MessageBubble {message} />
			{/each}
		{/if}
	</div>
	
	<!-- Input Area -->
	<div class="border-t border-[var(--apple-separator)] p-3 lg:p-4">
		<div class="space-y-2">
			<textarea
				bind:value={messageInput}
				onkeydown={handleKeydown}
				placeholder={tomAgent.isReady ? "Type your message..." : "Initializing..."}
				disabled={tomAgent.isGenerating || !tomAgent.isReady}
				class="w-full apple-input px-3 lg:px-4 py-2 lg:py-3 resize-none focus:ring-2 focus:ring-[var(--apple-blue)] focus:ring-opacity-20 text-sm lg:text-base"
				rows="1"
				style="height: auto; min-height: 40px; max-height: 120px;"
				oninput={(e) => {
					const target = e.target as HTMLTextAreaElement;
					target.style.height = 'auto';
					target.style.height = Math.min(target.scrollHeight, 120) + 'px';
				}}
			></textarea>
			<div class="flex justify-end">
				<button
					onclick={handleSubmit}
					disabled={!messageInput.trim() || tomAgent.isGenerating || !tomAgent.isReady}
					class="apple-button apple-button-primary px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed apple-animate flex items-center justify-center gap-1 text-sm"
				>
					{#if tomAgent.isGenerating}
						<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					{:else}
						<span class="hidden sm:inline">Send</span>
						<span class="sm:hidden">↑</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>