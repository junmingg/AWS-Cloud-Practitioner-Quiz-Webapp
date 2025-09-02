<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	
	export let show = true;
	export let mode: 'practice' | 'exam' = 'exam';
</script>

{#if show}
	<div 
		class="w-72 flex-shrink-0 bg-surface-100-800-token border-l border-surface-300-600-token h-full flex flex-col"
		in:fly={{ x: 300, duration: 300, easing: quintOut }}
		out:fly={{ x: 300, duration: 300, easing: quintOut }}
	>
		<!-- Header -->
		<div class="p-4 border-b border-surface-300-600-token">
			<div class="flex items-center space-x-2 mb-2">
				<svg class="w-5 h-5 text-surface-600-300-token" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<h3 class="font-semibold text-surface-900-50-token">Keyboard Shortcuts</h3>
			</div>
			<p class="text-xs text-surface-600-300-token">
				Speed up your quiz with these keyboard shortcuts
			</p>
		</div>
		
		<!-- Shortcuts List -->
		<div class="flex-1 overflow-auto p-4 space-y-4">
			<!-- Answer Selection -->
			<div>
				<h4 class="font-medium text-gray-800 dark:text-gray-100 mb-3 text-sm">Answer Selection</h4>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Select option A</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">1</kbd>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Select option B</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">2</kbd>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Select option C</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">3</kbd>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Select option D</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">4</kbd>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Select option E</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">5</kbd>
					</div>
					<div class="flex items-center justify-between pt-2 border-t border-surface-300-600-token">
						<span class="text-sm text-surface-600-300-token">Submit answer</span>
						<kbd class="kbd kbd-sm bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-200 border border-primary-300 dark:border-primary-600">Space</kbd>
					</div>
				</div>
			</div>
			
			<!-- Navigation -->
			<div>
				<h4 class="font-medium text-gray-800 dark:text-gray-100 mb-3 text-sm">Navigation</h4>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Previous question</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">←</kbd>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Next question</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">→</kbd>
					</div>
				</div>
			</div>
			
			<!-- Actions -->
			<div>
				<h4 class="font-medium text-gray-800 dark:text-gray-100 mb-3 text-sm">Actions</h4>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Flag for review</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">F</kbd>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Toggle question sidebar</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">S</kbd>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-600-300-token">Toggle hotkey sidebar</span>
						<kbd class="kbd kbd-sm bg-surface-200-700-token text-surface-700-200-token border border-surface-300-600-token">H</kbd>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Footer -->
		<div class="p-4 border-t border-surface-300-600-token">
			<div class="text-xs text-surface-600-300-token space-y-1">
				<div class="flex items-center space-x-2">
					<div class="w-2 h-2 bg-success-500 rounded-full"></div>
					<span>Keys work when not typing in text fields</span>
				</div>
				<div class="flex items-center space-x-2">
					<div class="w-2 h-2 bg-primary-500 rounded-full"></div>
					<span>Selection + Space = Two-step submission</span>
				</div>
			</div>
		</div>
	</div>
{/if}