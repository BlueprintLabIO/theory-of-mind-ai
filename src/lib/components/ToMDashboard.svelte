<script lang="ts">
	import { tomAgent } from '$lib/stores/tom-agent.svelte';
	import MentalStateCard from './MentalStateCard.svelte';
	import ConfidenceIndicator from './ConfidenceIndicator.svelte';
	
	const getEmotionalStates = () => {
		return tomAgent.currentSnapshot?.emotionalStates || [];
	};
	
	const getEpistemicStates = () => {
		return tomAgent.currentSnapshot?.epistemicStates || [];
	};
	
	const getMotivationalStates = () => {
		return tomAgent.currentSnapshot?.motivationalStates || [];
	};
	
	const getAttentionalStates = () => {
		return tomAgent.currentSnapshot?.attentionalStates || [];
	};
	
	const getSocialAwareness = () => {
		return tomAgent.currentSnapshot?.socialAwareness;
	};
</script>

<div class="h-full flex flex-col">
	<!-- Header -->
	<div class="p-3 lg:p-4 border-b border-[var(--apple-separator)]">
		<h2 class="text-base lg:text-lg font-semibold apple-text-primary mb-1">Theory of Mind</h2>
		<p class="text-xs lg:text-sm apple-text-secondary">Real-time mental state understanding</p>
	</div>
	
	<!-- Content -->
	<div class="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
		<!-- Overall Confidence -->
		<div class="apple-card p-3 lg:p-4">
			<ConfidenceIndicator confidence={tomAgent.overallConfidence} />
		</div>
		
		<!-- Processing indicator when generating -->
		{#if tomAgent.isGenerating}
			<div class="apple-card p-3 lg:p-4">
				<h3 class="text-xs lg:text-sm font-semibold apple-text-primary mb-2 lg:mb-3 flex items-center gap-2">
					<span class="w-2 h-2 rounded-full bg-[var(--apple-blue)] animate-pulse"></span>
					Analyzing mental states...
				</h3>
			</div>
		{/if}
		
		<!-- Emotional States -->
		{#if getEmotionalStates().length > 0}
			<MentalStateCard 
				title="Emotions" 
				states={getEmotionalStates()} 
				type="emotional" 
				color="var(--apple-orange)"
				icon="🎭"
			/>
		{/if}
		
		<!-- Epistemic States (Beliefs) -->
		{#if getEpistemicStates().length > 0}
			<MentalStateCard 
				title="Beliefs & Knowledge" 
				states={getEpistemicStates()} 
				type="epistemic" 
				color="var(--apple-blue)"
				icon="💭"
			/>
		{/if}
		
		<!-- Motivational States (Goals) -->
		{#if getMotivationalStates().length > 0}
			<MentalStateCard 
				title="Goals & Desires" 
				states={getMotivationalStates()} 
				type="motivational" 
				color="var(--apple-green)"
				icon="🎯"
			/>
		{/if}
		
		<!-- Attentional States -->
		{#if getAttentionalStates().length > 0}
			<MentalStateCard 
				title="Attention & Focus" 
				states={getAttentionalStates()} 
				type="attentional" 
				color="var(--apple-purple)"
				icon="👁️"
			/>
		{/if}
		
		<!-- Social Awareness -->
		{#if getSocialAwareness()}
			<div class="apple-card p-4">
				<h3 class="text-sm font-semibold apple-text-primary mb-3 flex items-center gap-2">
					<span style="color: var(--apple-gray)">🤝</span>
					Social Dynamics
				</h3>
				<div class="space-y-3">
					{#if getSocialAwareness()}
						{@const social = getSocialAwareness()!}
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="apple-text-secondary">Relationship:</span>
								<span class="apple-text-primary capitalize">{social.relationship_perception}</span>
							</div>
							<div class="flex justify-between">
								<span class="apple-text-secondary">Trust Level:</span>
								<div class="flex items-center gap-2">
									<div class="w-16 h-1.5 bg-[var(--apple-system-fill)] rounded-full overflow-hidden">
										<div 
											class="h-full bg-[var(--apple-blue)] rounded-full transition-all duration-500"
											style="width: {social.trust_level * 100}%"
										></div>
									</div>
									<span class="text-xs apple-text-tertiary">{Math.round(social.trust_level * 100)}%</span>
								</div>
							</div>
							<div class="flex justify-between">
								<span class="apple-text-secondary">Communication:</span>
								<span class="apple-text-primary capitalize">{social.communication_style}</span>
							</div>
							<div class="flex justify-between">
								<span class="apple-text-secondary">Power Dynamic:</span>
								<span class="apple-text-primary capitalize">{social.power_dynamic.replace('_', ' ')}</span>
							</div>
						</div>
						
						{#if social.shared_context && social.shared_context.length > 0}
							<div class="mt-3 pt-3 border-t border-[var(--apple-separator)]">
								<p class="text-xs apple-text-secondary mb-2">Shared Context:</p>
								<div class="flex flex-wrap gap-1">
									{#each social.shared_context as context}
										<span class="px-2 py-1 text-xs bg-[var(--apple-system-fill)] rounded apple-text-secondary">
											{context}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
		
		<!-- Current Reasoning -->
		{#if tomAgent.reasoning}
			<div class="apple-card p-4">
				<h3 class="text-sm font-semibold apple-text-primary mb-2 flex items-center gap-2">
					<span style="color: var(--apple-gray)">🧠</span>
					Current Analysis
				</h3>
				<p class="text-sm apple-text-secondary leading-relaxed">{tomAgent.reasoning}</p>
			</div>
		{/if}
		
		<!-- Recent Mental State Updates -->
		{#if tomAgent.mentalStateUpdates.length > 0}
			<div class="apple-card p-4">
				<h3 class="text-sm font-semibold apple-text-primary mb-3">Recent Updates</h3>
				<div class="space-y-2">
					{#each tomAgent.mentalStateUpdates.slice(-5) as update}
						<div class="text-xs apple-text-secondary flex items-start gap-2">
							<span class="text-[var(--apple-blue)]">•</span>
							<div class="flex-1">
								<span class="capitalize font-medium">{update.type}</span>
								{#if update.content}
									<span class="ml-1">- {update.content}</span>
								{/if}
								{#if update.confidence}
									<span class="ml-1 opacity-60">({Math.round(update.confidence * 100)}%)</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Empty State -->
		{#if !tomAgent.currentSnapshot || (
			getEmotionalStates().length === 0 && 
			getEpistemicStates().length === 0 && 
			getMotivationalStates().length === 0 && 
			getAttentionalStates().length === 0 &&
			!getSocialAwareness()
		)}
			<div class="text-center py-8">
				<div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--apple-system-fill)] flex items-center justify-center">
					<span class="text-lg opacity-50">🧠</span>
				</div>
				<p class="text-sm apple-text-secondary">Start a conversation to see</p>
				<p class="text-sm apple-text-secondary">mental state analysis</p>
			</div>
		{/if}
	</div>
</div>