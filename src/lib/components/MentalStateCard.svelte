<script lang="ts">
	import type { EpistemicState, EmotionalState, MotivationalState, AttentionalState } from '$lib/index.js';
	
	type MentalState = EpistemicState | EmotionalState | MotivationalState | AttentionalState;
	
	let { 
		title, 
		states, 
		type, 
		color, 
		icon 
	}: { 
		title: string;
		states: MentalState[];
		type: 'epistemic' | 'emotional' | 'motivational' | 'attentional';
		color: string;
		icon: string;
	} = $props();
	
	const formatConfidence = (confidence: number) => Math.round(confidence * 100);
	
	const getStateDetails = (state: MentalState) => {
		switch (type) {
			case 'emotional':
				const emotional = state as EmotionalState;
				return {
					primary: emotional.type,
					secondary: `Intensity: ${Math.round(emotional.intensity * 100)}%`,
					extra: emotional.triggers?.join(', ') || ''
				};
			case 'epistemic':
				const epistemic = state as EpistemicState;
				return {
					primary: epistemic.content,
					secondary: `${epistemic.type} (${epistemic.order}${epistemic.order === 1 ? 'st' : epistemic.order === 2 ? 'nd' : 'rd'} order)`,
					extra: ''
				};
			case 'motivational':
				const motivational = state as MotivationalState;
				return {
					primary: motivational.content,
					secondary: `${motivational.type} - ${motivational.priority} priority`,
					extra: motivational.timeframe || ''
				};
			case 'attentional':
				const attentional = state as AttentionalState;
				return {
					primary: attentional.target,
					secondary: `${attentional.type} - ${Math.round(attentional.intensity * 100)}% intensity`,
					extra: attentional.competing_targets?.join(', ') || ''
				};
			default:
				return { primary: 'Unknown', secondary: '', extra: '' };
		}
	};
</script>

<div class="apple-card p-4">
	<h3 class="text-sm font-semibold apple-text-primary mb-3 flex items-center gap-2">
		<span style="color: {color}">{icon}</span>
		{title}
		<span class="text-xs apple-text-tertiary">({states.length})</span>
	</h3>
	
	<div class="space-y-3">
		{#each states as state}
			{@const details = getStateDetails(state)}
			<div class="bg-[var(--apple-tertiary-system-background)] rounded-lg p-3">
				<div class="flex items-start justify-between gap-2">
					<div class="flex-1 min-w-0">
						<p class="text-sm apple-text-primary font-medium leading-snug">
							{details.primary}
						</p>
						{#if details.secondary}
							<p class="text-xs apple-text-secondary mt-1">
								{details.secondary}
							</p>
						{/if}
						{#if details.extra}
							<p class="text-xs apple-text-tertiary mt-1">
								{details.extra}
							</p>
						{/if}
					</div>
					
					<!-- Confidence indicator -->
					<div class="flex-shrink-0 flex items-center gap-2">
						<div class="w-8 h-1.5 bg-[var(--apple-system-fill)] rounded-full overflow-hidden">
							<div 
								class="h-full rounded-full transition-all duration-500"
								style="width: {state.confidence * 100}%; background-color: {color};"
							></div>
						</div>
						<span class="text-xs apple-text-tertiary">{formatConfidence(state.confidence)}%</span>
					</div>
				</div>
				
				<!-- Source and timestamp -->
				<div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--apple-separator)]">
					<span class="text-xs apple-text-tertiary capitalize">{state.source}</span>
					<span class="text-xs apple-text-tertiary">
						{new Intl.DateTimeFormat('en-US', { 
							hour: 'numeric', 
							minute: '2-digit' 
						}).format(new Date(state.timestamp))}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>