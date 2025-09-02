<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Section } from '$lib/types/index.js';

	export let section: Section;

	const dispatch = createEventDispatcher<{
		select: void;
	}>();

	function handleClick() {
		dispatch('select');
	}

	function formatWordCount(count: number): string {
		if (count < 1000) {
			return `${count} words`;
		}
		return `${Math.round(count / 100) / 10}k words`;
	}

	// Extract first paragraph for preview
	function getPreview(content: string): string {
		const textOnly = content
			.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		
		const words = textOnly.split(' ');
		if (words.length <= 30) {
			return textOnly;
		}
		
		return words.slice(0, 30).join(' ') + '...';
	}
</script>

<div 
	class="bg-surface-100-800-token rounded-xl border border-surface-300-600-token hover:border-primary-500/50 cursor-pointer transition-all duration-200 group h-full"
	role="button"
	tabindex="0"
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
	<!-- Header -->
	<div class="p-6 pb-4">
		<div class="flex items-start justify-between mb-3">
			<div class="flex-1">
				<h3 class="text-lg font-semibold text-surface-900-50-token group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
					{section.title}
				</h3>
				<div class="flex items-center gap-2 mt-2">
					<span class="px-2 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-700 dark:text-primary-300 border border-primary-500/30">
						{formatWordCount(section.wordCount)}
					</span>
				</div>
			</div>
			
			<div class="text-primary-500 group-hover:text-primary-600 transition-colors">
				<svg 
					class="w-5 h-5" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path 
						stroke-linecap="round" 
						stroke-linejoin="round" 
						stroke-width="2" 
						d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
					/>
				</svg>
			</div>
		</div>
	</div>
	
	<!-- Content Preview -->
	<div class="px-6 pb-4">
		<p class="text-sm text-surface-600-300-token line-clamp-3 leading-relaxed">
			{getPreview(section.content)}
		</p>
	</div>
	
	<!-- Footer -->
	<div class="px-6 py-4 bg-surface-200-700-token border-t border-surface-300-600-token">
		<div class="flex items-center justify-between">
			<span class="text-xs text-surface-600-300-token">
				{section.filename.replace('.md', '').replace(/_/g, ' ')}
			</span>
			<div class="flex items-center text-primary-500 group-hover:text-primary-600 transition-colors">
				<span class="text-xs font-medium mr-2">Read More</span>
				<svg 
					class="w-4 h-4" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path 
						stroke-linecap="round" 
						stroke-linejoin="round" 
						stroke-width="2" 
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	:global(.dark) .card:hover {
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
	}
</style>