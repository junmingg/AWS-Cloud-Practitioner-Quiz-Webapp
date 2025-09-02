<script lang="ts">
	export let value: number = 0;
	export let max: number = 100;
	export let showPercentage: boolean = true;
	export let showNumbers: boolean = false;
	export let label: string = '';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'error' = 'primary';
	export let animated: boolean = true;
	
	$: percentage = Math.round((value / max) * 100);
	$: percentageWidth = Math.min(percentage, 100);
	
	const sizeClasses = {
		sm: 'h-2',
		md: 'h-3',
		lg: 'h-4'
	};
	
	const variantClasses = {
		primary: 'bg-primary-500',
		secondary: 'bg-secondary-500', 
		tertiary: 'bg-tertiary-500',
		warning: 'bg-warning-500',
		error: 'bg-error-500'
	};
</script>

<div class="w-full">
	{#if label || showNumbers || showPercentage}
		<div class="flex justify-between items-center mb-2">
			{#if label}
				<span class="text-sm font-medium text-surface-700-200-token">{label}</span>
			{/if}
			
			<div class="flex items-center space-x-2 text-sm text-surface-600-300-token">
				{#if showNumbers}
					<span>{value} / {max}</span>
				{/if}
				{#if showPercentage}
					<span class="font-medium">{percentage}%</span>
				{/if}
			</div>
		</div>
	{/if}
	
	<div class="w-full bg-surface-300-600-token rounded-full {sizeClasses[size]} overflow-hidden">
		<div 
			class="h-full {variantClasses[variant]} rounded-full quiz-transition"
			class:transition-all={animated}
			class:duration-500={animated}
			class:ease-out={animated}
			style="width: {percentageWidth}%"
		>
			{#if size === 'lg'}
				<div class="h-full w-full bg-gradient-to-r from-transparent to-white/20 rounded-full"></div>
			{/if}
		</div>
	</div>
</div>