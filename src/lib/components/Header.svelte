<script lang="ts">
	import { tomAgent } from '$lib/stores/tom-agent.svelte';
</script>

<header class="apple-surface border-b border-[var(--apple-separator)] px-6 py-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--apple-blue)] to-[var(--apple-purple)] flex items-center justify-center">
					<span class="text-white font-bold text-sm">🧠</span>
				</div>
				<div>
					<h1 class="text-xl font-semibold apple-text-primary">Theory of Mind Demo</h1>
				</div>
			</div>
		</div>
		
		<div class="flex items-center gap-3">
			<!-- GitHub Link -->
			<a 
				href="https://github.com/BlueprintDesignLab/theory-of-mind-ai" 
				target="_blank" 
				rel="noopener noreferrer"
				class="flex items-center gap-2 px-3 py-2 text-sm apple-text-secondary hover:apple-text-primary apple-animate rounded-lg hover:bg-[var(--apple-system-fill)]"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
				</svg>
				<span class="hidden sm:inline">GitHub</span>
			</a>
			
			<!-- Status indicator -->
			<div class="flex items-center gap-2">
				{#if tomAgent.error}
					<div class="w-2 h-2 rounded-full bg-[var(--apple-red)]"></div>
					<span class="text-sm apple-text-secondary">Error</span>
				{:else if !tomAgent.isReady}
					<div class="w-2 h-2 rounded-full bg-[var(--apple-orange)] animate-pulse"></div>
					<span class="text-sm apple-text-secondary">Initializing...</span>
				{:else if tomAgent.isGenerating}
					<div class="w-2 h-2 rounded-full bg-[var(--apple-blue)] animate-pulse"></div>
					<span class="text-sm apple-text-secondary">Thinking...</span>
				{:else}
					<div class="w-2 h-2 rounded-full bg-[var(--apple-green)]"></div>
					<span class="text-sm apple-text-secondary">Ready</span>
				{/if}
			</div>
			
			<!-- Clear button -->
			{#if tomAgent.hasConversation}
				<button
					onclick={() => tomAgent.clearConversation()}
					class="apple-button apple-button-secondary px-4 py-2 text-sm apple-animate"
					disabled={tomAgent.isGenerating}
				>
					Clear
				</button>
			{/if}
		</div>
	</div>
</header>