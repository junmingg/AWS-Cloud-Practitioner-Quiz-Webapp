<script lang="ts">
	import { theme } from '$lib/stores/theme';
	
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let showLabel = false;
	
	$: isDark = $theme === 'dark' || ($theme === 'system' && 
		typeof window !== 'undefined' && 
		window.matchMedia('(prefers-color-scheme: dark)').matches
	);
	
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};
</script>

<button
	on:click={theme.toggle}
	class="btn variant-ghost-surface quiz-transition hover:variant-soft-surface"
	class:btn-sm={size === 'sm'}
	class:btn-md={size === 'md'}
	class:btn-lg={size === 'lg'}
	aria-label="Toggle theme"
	title="Toggle light/dark theme"
>
	<div class="flex items-center space-x-2">
		{#if isDark}
			<!-- Moon icon for dark mode -->
			<svg class={sizeClasses[size]} fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
			</svg>
		{:else}
			<!-- Sun icon for light mode -->
			<svg class={sizeClasses[size]} fill="currentColor" viewBox="0 0 20 20">
				<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
			</svg>
		{/if}
		
		{#if showLabel}
			<span class="hidden sm:inline">
				{isDark ? 'Light' : 'Dark'}
			</span>
		{/if}
	</div>
</button>