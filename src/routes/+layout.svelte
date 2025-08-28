<script lang="ts">
	import '../app.css';
	import '$lib/styles/apple-design.css';
	import favicon from '$lib/assets/icon.png';

	let { children } = $props();
</script>

<svelte:head>
	<title>Theory of Mind AI Demo</title>
	<meta name="description" content="Interactive demonstration of AI theory of mind capabilities with real-time mental state visualization" />
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen apple-surface-grouped apple-font">
	{@render children?.()}
</div>
