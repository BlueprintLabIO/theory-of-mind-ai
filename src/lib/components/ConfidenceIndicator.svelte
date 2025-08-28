<script lang="ts">
	let { confidence }: { confidence: number } = $props();
	
	const getConfidenceColor = (conf: number) => {
		if (conf >= 0.8) return 'var(--apple-green)';
		if (conf >= 0.6) return 'var(--apple-blue)';
		if (conf >= 0.4) return 'var(--apple-orange)';
		return 'var(--apple-red)';
	};
	
	const getConfidenceLabel = (conf: number) => {
		if (conf >= 0.8) return 'High Confidence';
		if (conf >= 0.6) return 'Good Confidence';
		if (conf >= 0.4) return 'Medium Confidence';
		return 'Low Confidence';
	};
</script>

<div>
	<div class="flex items-center justify-between mb-3">
		<h3 class="text-sm font-semibold apple-text-primary">Overall Confidence</h3>
		<span class="text-sm apple-text-secondary">{Math.round(confidence * 100)}%</span>
	</div>
	
	<!-- Confidence ring -->
	<div class="flex items-center gap-4">
		<div class="relative w-16 h-16">
			<svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 32 32">
				<!-- Background circle -->
				<circle
					cx="16" cy="16" r="12"
					fill="none"
					stroke="var(--apple-quaternary-system-fill)"
					stroke-width="3"
				/>
				<!-- Progress circle -->
				<circle
					cx="16" cy="16" r="12"
					fill="none"
					stroke={getConfidenceColor(confidence)}
					stroke-width="3"
					stroke-linecap="round"
					stroke-dasharray={`${confidence * 75.4} 75.4`}
					class="transition-all duration-1000 ease-out"
				/>
			</svg>
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-xs font-semibold apple-text-primary">
					{Math.round(confidence * 100)}
				</span>
			</div>
		</div>
		
		<div class="flex-1">
			<p class="text-sm font-medium apple-text-primary">{getConfidenceLabel(confidence)}</p>
			<p class="text-xs apple-text-secondary mt-1">
				Based on conversation context and inference strength
			</p>
		</div>
	</div>
	
	<!-- Confidence scale -->
	<div class="mt-4">
		<div class="flex justify-between text-xs apple-text-tertiary mb-1">
			<span>Low</span>
			<span>Medium</span>
			<span>High</span>
		</div>
		<div class="h-1.5 bg-[var(--apple-quaternary-system-fill)] rounded-full overflow-hidden">
			<div 
				class="h-full rounded-full transition-all duration-1000 ease-out"
				style="width: {confidence * 100}%; background-color: {getConfidenceColor(confidence)};"
			></div>
		</div>
	</div>
</div>