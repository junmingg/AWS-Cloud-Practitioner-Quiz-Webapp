<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { NavigationItem, QuestionFilter } from '$lib/types';
	
	export let items: NavigationItem[] = [];
	export let filter: QuestionFilter = 'all';
	export let showCompact = false;
	export let totalQuestions = 0;
	
	const dispatch = createEventDispatcher<{
		navigate: { index: number };
		filterChange: { filter: QuestionFilter };
	}>();
	
	$: filteredItems = items.filter(item => {
		switch (filter) {
			case 'answered':
				return item.isAnswered;
			case 'unanswered':
				return !item.isAnswered;
			case 'flagged':
				return item.isFlagged;
			default:
				return true;
		}
	});
	
	$: stats = {
		answered: items.filter(item => item.isAnswered).length,
		unanswered: items.filter(item => !item.isAnswered).length,
		flagged: items.filter(item => item.isFlagged).length,
		current: items.findIndex(item => item.isActive) + 1
	};
	
	function handleItemClick(index: number) {
		dispatch('navigate', { index });
	}
	
	function handleFilterChange(newFilter: QuestionFilter) {
		filter = newFilter;
		dispatch('filterChange', { filter: newFilter });
	}
	
	function getItemClasses(item: NavigationItem): string {
		let classes = 'w-10 h-10 flex items-center justify-center rounded-lg font-medium text-sm quiz-transition cursor-pointer border-2 ';
		
		if (item.isActive) {
			classes += 'border-primary-500 bg-primary-500 text-white shadow-lg';
		} else if (item.isAnswered) {
			if (item.isCorrect === true) {
				classes += 'border-success-300 bg-success-100 text-success-700 dark:border-success-600 dark:bg-success-900/30 dark:text-success-300 hover:border-success-400';
			} else if (item.isCorrect === false) {
				classes += 'border-error-300 bg-error-100 text-error-700 dark:border-error-600 dark:bg-error-900/30 dark:text-error-300 hover:border-error-400';
			} else {
				// Fallback for when correctness is undefined (shouldn't happen but just in case)
				classes += 'border-warning-300 bg-warning-100 text-warning-700 dark:border-warning-600 dark:bg-warning-900/30 dark:text-warning-300 hover:border-warning-400';
			}
		} else {
			classes += 'border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 hover:border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
		}
		
		return classes;
	}
</script>

<div class="bg-surface-100-800-token border-r border-surface-300-600-token h-full flex flex-col">
	<!-- Header -->
	<div class="p-4 border-b border-surface-300-600-token">
		<div class="flex items-center justify-between mb-4">
			<h3 class="font-semibold text-surface-900-50-token">Questions</h3>
			<span class="text-sm text-surface-600-300-token">
				{stats.current} / {totalQuestions}
			</span>
		</div>
		
		<!-- Filter Buttons -->
		<div class="space-y-2">
			<button
				class="btn btn-sm w-full justify-start"
				class:variant-filled-primary={filter === 'all'}
				class:variant-ghost-surface={filter !== 'all'}
				on:click={() => handleFilterChange('all')}
			>
				<span class="flex-1 text-left">All</span>
				<span class="text-xs opacity-75">{items.length}</span>
			</button>
			
			<button
				class="btn btn-sm w-full justify-start"
				class:variant-filled-success={filter === 'answered'}
				class:variant-ghost-surface={filter !== 'answered'}
				on:click={() => handleFilterChange('answered')}
			>
				<span class="flex-1 text-left">Answered</span>
				<span class="text-xs opacity-75">{stats.answered}</span>
			</button>
			
			<button
				class="btn btn-sm w-full justify-start"
				class:variant-filled-warning={filter === 'unanswered'}
				class:variant-ghost-surface={filter !== 'unanswered'}
				on:click={() => handleFilterChange('unanswered')}
			>
				<span class="flex-1 text-left">Unanswered</span>
				<span class="text-xs opacity-75">{stats.unanswered}</span>
			</button>
			
			{#if stats.flagged > 0}
				<button
					class="btn btn-sm w-full justify-start"
					class:variant-filled-tertiary={filter === 'flagged'}
					class:variant-ghost-surface={filter !== 'flagged'}
					on:click={() => handleFilterChange('flagged')}
				>
					<span class="flex-1 text-left">Flagged</span>
					<span class="text-xs opacity-75">{stats.flagged}</span>
				</button>
			{/if}
		</div>
	</div>
	
	<!-- Question Grid -->
	<div class="flex-1 overflow-auto p-4">
		{#if showCompact}
			<!-- Compact List View -->
			<div class="space-y-2">
				{#each filteredItems as item, index (item.questionNumber)}
					<div
						class="flex items-center justify-between p-2 rounded-lg cursor-pointer quiz-transition"
						class:bg-primary-100={item.isActive}
						class:hover:bg-surface-200={!item.isActive}
						class:dark:hover:bg-surface-700={!item.isActive}
						on:click={() => handleItemClick(item.questionNumber - 1)}
						on:keydown={(e) => e.key === 'Enter' && handleItemClick(item.questionNumber - 1)}
						role="button"
						tabindex="0"
						in:fly={{ x: -20, duration: 200, delay: index * 20, easing: quintOut }}
					>
						<span class="font-medium text-surface-900-50-token">
							Q{item.questionNumber}
						</span>
						
						<div class="flex items-center space-x-1">
							{#if item.isAnswered}
								<div class="w-2 h-2 bg-success-500 rounded-full"></div>
							{/if}
							{#if item.isFlagged}
								<svg class="w-3 h-3 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" />
								</svg>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Grid View -->
			<div class="grid grid-cols-5 gap-2">
				{#each filteredItems as item, index (item.questionNumber)}
					<div
						class="relative"
						in:fly={{ scale: 0.8, duration: 200, delay: index * 30, easing: quintOut }}
					>
						<div
							class={getItemClasses(item)}
							on:click={() => handleItemClick(item.questionNumber - 1)}
							on:keydown={(e) => e.key === 'Enter' && handleItemClick(item.questionNumber - 1)}
							role="button"
							tabindex="0"
							title="Question {item.questionNumber}"
						>
							{item.questionNumber}
						</div>
						
						<!-- Flag Indicator -->
						{#if item.isFlagged}
							<div 
								class="absolute -top-1 -right-1 w-4 h-4 bg-warning-500 rounded-full flex items-center justify-center"
								title="Flagged for review"
							>
								<svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" />
								</svg>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		
		<!-- Empty State -->
		{#if filteredItems.length === 0}
			<div class="text-center py-8" in:fly={{ y: 20, duration: 300 }}>
				<svg class="w-12 h-12 mx-auto text-surface-400-600-token mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.805-6.207-2.157-.97-.82-1.793-1.829-2.402-2.959C2.7 8.896 2.7 7.104 3.39 6.076 5.023 3.518 8.273 2 12 2c3.726 0 6.977 1.518 8.609 4.076.69 1.028.69 2.82-.999 3.808A7.985 7.985 0 0118 12v.5a2.5 2.5 0 11-5 0V12a3 3 0 106 0v.5z" />
				</svg>
				<p class="text-surface-600-300-token text-sm">
					{#if filter === 'answered'}
						No answered questions yet
					{:else if filter === 'unanswered'}
						All questions answered!
					{:else if filter === 'flagged'}
						No flagged questions
					{:else}
						No questions available
					{/if}
				</p>
			</div>
		{/if}
	</div>
	
	<!-- Progress Summary -->
	<div class="p-4 border-t border-surface-300-600-token">
		<div class="space-y-3">
			<!-- Progress Bar -->
			<div>
				<div class="flex justify-between text-xs text-surface-600-300-token mb-1">
					<span>Progress</span>
					<span>{Math.round((stats.answered / totalQuestions) * 100)}%</span>
				</div>
				<div class="w-full bg-surface-300-600-token rounded-full h-2 overflow-hidden">
					<div 
						class="h-full bg-success-500 quiz-transition duration-500"
						style="width: {(stats.answered / totalQuestions) * 100}%"
					></div>
				</div>
			</div>
			
			<!-- Legend -->
			<div class="grid grid-cols-2 gap-2 text-xs">
				<div class="flex items-center space-x-2">
					<div class="w-2 h-2 bg-success-500 rounded-full"></div>
					<span class="text-surface-600-300-token">Answered</span>
				</div>
				{#if stats.flagged > 0}
					<div class="flex items-center space-x-2">
						<div class="w-2 h-2 bg-warning-500 rounded-full"></div>
						<span class="text-surface-600-300-token">Flagged</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>