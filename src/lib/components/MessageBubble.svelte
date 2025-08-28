<script lang="ts">
	import type { ToMUpdate } from '$lib/index.js';
	
	interface ChatMessage {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: number;
		streaming?: boolean;
		tomUpdates?: ToMUpdate[];
	}
	
	let { message }: { message: ChatMessage } = $props();
	
	const formatTime = (timestamp: number) => {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(new Date(timestamp));
	};
</script>

<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}" data-message data-message-role={message.role}>
	<div class="max-w-[70%] {message.role === 'user' ? 'order-2' : 'order-1'}">
		<!-- Message bubble -->
		<div 
			class="
				px-4 py-3 rounded-2xl apple-animate
				{message.role === 'user' 
					? 'bg-[var(--apple-blue)] text-white ml-auto' 
					: 'apple-surface-secondary apple-text-primary'
				}
				{message.streaming ? 'animate-pulse' : ''}
			"
		>
			<p class="text-sm leading-relaxed whitespace-pre-wrap">
				{message.content}
				{#if message.streaming}
					<span class="inline-block w-2 h-4 bg-current animate-pulse ml-1">|</span>
				{/if}
			</p>
		</div>
		
		<!-- Metadata -->
		<div class="mt-1 px-2 flex items-center justify-between text-xs apple-text-tertiary">
			<span>{formatTime(message.timestamp)}</span>
			
			{#if message.role === 'assistant' && message.tomUpdates && message.tomUpdates.length > 0}
				<span class="flex items-center gap-1">
					<span class="w-1.5 h-1.5 rounded-full bg-[var(--apple-blue)]"></span>
					{message.tomUpdates.length} insight{message.tomUpdates.length === 1 ? '' : 's'}
				</span>
			{/if}
		</div>
		
		<!-- ToM Updates Summary -->
		{#if message.role === 'assistant' && message.tomUpdates && message.tomUpdates.length > 0 && !message.streaming}
			<div class="mt-2 space-y-1">
				{#each message.tomUpdates as update}
					<div class="text-xs apple-surface-grouped rounded-lg px-2 py-1 apple-text-secondary">
						<span class="font-medium capitalize">{update.type}</span>
						{#if update.reasoning}
							<span class="ml-1">• {update.reasoning.slice(0, 60)}{update.reasoning.length > 60 ? '...' : ''}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>