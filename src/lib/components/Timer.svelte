<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { QuizScorer } from '$lib/utils/scorer';
	
	export let startTime: Date;
	export let endTime: Date | undefined = undefined;
	export let showHours: boolean = true;
	export let showMilliseconds: boolean = false;
	export let variant: 'default' | 'warning' | 'danger' = 'default';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let paused: boolean = false;
	
	let currentTime = new Date();
	let interval: NodeJS.Timeout | undefined;
	
	$: elapsed = (endTime || currentTime).getTime() - startTime.getTime();
	$: formattedTime = formatTime(elapsed);
	
	$: variantClass = {
		default: 'text-surface-700-200-token',
		warning: 'text-warning-500',
		danger: 'text-error-500'
	}[variant];
	
	$: sizeClass = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg font-mono'
	}[size];
	
	function formatTime(milliseconds: number): string {
		const seconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		
		const ms = Math.floor((milliseconds % 1000) / 10); // Two digit milliseconds
		const sec = seconds % 60;
		const min = minutes % 60;
		
		if (showHours && hours > 0) {
			if (showMilliseconds) {
				return `${hours.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
			}
			return `${hours.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
		} else {
			if (showMilliseconds) {
				return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
			}
			return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
		}
	}
	
	onMount(() => {
		if (!endTime && !paused) {
			interval = setInterval(() => {
				currentTime = new Date();
			}, showMilliseconds ? 10 : 1000);
		}
	});
	
	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
	
	// Update interval when paused state changes
	$: if (paused && interval) {
		clearInterval(interval);
		interval = undefined;
	} else if (!paused && !endTime && !interval) {
		interval = setInterval(() => {
			currentTime = new Date();
		}, showMilliseconds ? 10 : 1000);
	}
</script>

<div class="flex items-center space-x-2">
	<svg class="w-4 h-4 {variantClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<circle cx="12" cy="12" r="10"></circle>
		<polyline points="12,6 12,12 16,14"></polyline>
	</svg>
	
	<span class="font-mono {sizeClass} {variantClass} tabular-nums">
		{formattedTime}
	</span>
	
	{#if paused}
		<span class="text-xs px-2 py-1 bg-warning-500/20 text-warning-700 dark:text-warning-300 rounded-full">
			Paused
		</span>
	{/if}
</div>