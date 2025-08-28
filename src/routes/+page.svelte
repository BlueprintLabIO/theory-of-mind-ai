<script lang="ts">
	import ChatInterface from '$lib/components/ChatInterface.svelte';
	import ToMDashboard from '$lib/components/ToMDashboard.svelte';
	import Header from '$lib/components/Header.svelte';
	import { tomAgent } from '$lib/stores/tom-agent.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		// Initialize ToM agent
		tomAgent.initialize();
	});
</script>

<div class="h-screen flex flex-col max-h-screen">
	<Header />
	
	<main class="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
		<!-- Theory of Mind Dashboard -->
		<div class="h-1/2 lg:h-full lg:w-96 border-b lg:border-b-0 lg:border-l border-[var(--apple-separator)] apple-surface-secondary lg:order-2">
			<ToMDashboard />
		</div>
		
		<!-- Chat Interface -->
		<div class="h-1/2 lg:h-full flex-1 flex flex-col min-h-0 lg:order-1">
			<ChatInterface />
		</div>
	</main>
</div>
