<script lang="ts">
	interface ToolCallDisplay {
		id: string;
		tool?: {
			name: string;
			args?: Record<string, unknown>;
			status: 'starting' | 'streaming' | 'complete';
		};
		delta?: string;
		timestamp: number;
	}
	
	let { toolCalls }: { toolCalls: ToolCallDisplay[] } = $props();
	
	const getToolIcon = (name: string) => {
		switch (name) {
			case 'update_epistemic_state': return '💭';
			case 'update_emotional_state': return '🎭';
			case 'update_motivational_state': return '🎯';
			case 'update_attentional_state': return '👁️';
			case 'update_social_awareness': return '🤝';
			default: return '🔧';
		}
	};
	
	const getToolDisplayName = (name: string) => {
		switch (name) {
			case 'update_epistemic_state': return 'Analyzing beliefs';
			case 'update_emotional_state': return 'Detecting emotions';
			case 'update_motivational_state': return 'Understanding goals';
			case 'update_attentional_state': return 'Tracking attention';
			case 'update_social_awareness': return 'Assessing relationship';
			default: return name.replace(/_/g, ' ');
		}
	};
</script>

<div class="space-y-3">
	{#each toolCalls as toolCall}
		<div class="bg-[var(--apple-tertiary-system-background)] rounded-lg p-3">
			<div class="flex items-center gap-3">
				<!-- Tool icon -->
				<div class="w-6 h-6 rounded bg-[var(--apple-blue)] bg-opacity-10 flex items-center justify-center text-xs">
					{#if toolCall.tool?.name}
						{getToolIcon(toolCall.tool.name)}
					{:else}
						🔧
					{/if}
				</div>
				
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium apple-text-primary">
						{#if toolCall.tool?.name}
							{getToolDisplayName(toolCall.tool.name)}
						{:else}
							Processing...
						{/if}
					</p>
					
					<!-- Status indicator -->
					<div class="flex items-center gap-2 mt-1">
						{#if toolCall.tool?.status === 'starting'}
							<div class="w-1.5 h-1.5 rounded-full bg-[var(--apple-orange)] animate-pulse"></div>
							<span class="text-xs apple-text-secondary">Starting...</span>
						{:else if toolCall.tool?.status === 'streaming'}
							<div class="w-1.5 h-1.5 rounded-full bg-[var(--apple-blue)] animate-pulse"></div>
							<span class="text-xs apple-text-secondary">Analyzing...</span>
						{:else if toolCall.tool?.status === 'complete'}
							<div class="w-1.5 h-1.5 rounded-full bg-[var(--apple-green)]"></div>
							<span class="text-xs apple-text-secondary">Complete</span>
						{:else}
							<div class="w-1.5 h-1.5 rounded-full bg-[var(--apple-gray)] animate-pulse"></div>
							<span class="text-xs apple-text-secondary">Processing...</span>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Streaming content -->
			{#if toolCall.delta}
				<div class="mt-2 pt-2 border-t border-[var(--apple-separator)]">
					<pre class="text-xs apple-font-mono apple-text-tertiary whitespace-pre-wrap break-all">{toolCall.delta}</pre>
				</div>
			{/if}
			
			<!-- Arguments preview (for completed tools) -->
			{#if toolCall.tool?.args && toolCall.tool.status === 'complete'}
				<div class="mt-2 pt-2 border-t border-[var(--apple-separator)]">
					<div class="space-y-1">
						{#each Object.entries(toolCall.tool.args) as [key, value]}
							{#if key !== 'reasoning' && value && typeof value === 'string' && value.length < 100}
								<div class="flex gap-2 text-xs">
									<span class="apple-text-tertiary capitalize">{key.replace(/_/g, ' ')}:</span>
									<span class="apple-text-secondary font-medium">{value}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>