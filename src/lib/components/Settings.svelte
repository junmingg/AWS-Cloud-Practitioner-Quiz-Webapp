<script lang="ts">
	import { fade, scale, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount, createEventDispatcher } from 'svelte';
	import { results, recentResults } from '$lib/stores/results';
	import { QuizScorer } from '$lib/utils/scorer';
	import { ExamLoader } from '$lib/utils/exam-loader';
	import type { QuizResult } from '$lib/types';
	
	let showModal = false;
	let isLoading = false;
	
	const dispatch = createEventDispatcher<{
		close: void;
	}>();
	
	onMount(() => {
		results.load();
	});
	
	function openModal() {
		showModal = true;
	}
	
	function closeModal() {
		showModal = false;
		dispatch('close');
	}
	
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
	
	async function deleteResult(result: QuizResult) {
		if (!confirm(`Delete result for "${result.examTitle}" (${Math.round(result.percentage)}%)?`)) return;
		
		isLoading = true;
		try {
			// Create a unique identifier for the result
			const resultId = result.startTime.getTime().toString();
			results.delete(result.examId, resultId);
		} catch (error) {
			console.error('Failed to delete result:', error);
			alert('Failed to delete result. Please try again.');
		} finally {
			isLoading = false;
		}
	}
	
	async function deleteAllHistory() {
		if (!confirm('Are you sure you want to delete ALL quiz history AND exam statistics? This will reset all attempts, scores, and progress. This action cannot be undone.')) return;
		
		isLoading = true;
		try {
			// Clear quiz results history
			results.clear();
			
			// Clear all exam statistics (attempts, scores, etc.)
			ExamLoader.clearAllExamStats();
			
			alert('All quiz history and exam statistics have been cleared successfully.');
		} catch (error) {
			console.error('Failed to clear all history:', error);
			alert('Failed to clear history. Please try again.');
		} finally {
			isLoading = false;
		}
	}
	
	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
	
	function formatDuration(ms: number): string {
		return QuizScorer.formatDuration(ms);
	}
</script>

<!-- Settings Button -->
<button
	on:click={openModal}
	class="btn btn-sm variant-soft-surface hover:variant-soft-primary transition-all duration-200 border border-surface-300-600-token"
	aria-label="Settings"
	title="Settings"
>
	<svg class="w-5 h-5 text-surface-700-200-token" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
	</svg>
</button>

<!-- Settings Modal -->
{#if showModal}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		transition:fade={{ duration: 200 }}
		role="dialog"
		aria-labelledby="settings-title"
		aria-modal="true"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50"></div>
		
		<!-- Modal Content -->
		<div 
			class="relative bg-surface-100-800-token rounded-2xl shadow-2xl border border-surface-300-600-token max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
			transition:scale={{ duration: 300, easing: quintOut }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-surface-300-600-token">
				<div class="flex items-center space-x-3">
					<div class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
						</svg>
					</div>
					<h2 id="settings-title" class="text-xl font-bold text-surface-900-50-token">Settings</h2>
				</div>
				<button
					on:click={closeModal}
					class="btn btn-sm variant-ghost-surface hover:variant-soft-error"
					aria-label="Close settings"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			
			<!-- Content -->
			<div class="p-6 max-h-[70vh] overflow-y-auto">
				<!-- Quiz History Section -->
				<section class="mb-8">
					<h3 class="text-lg font-semibold text-surface-900-50-token mb-4 flex items-center">
						<svg class="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						Quiz History Management
					</h3>
					
					{#if $recentResults.length > 0}
						<!-- Recent Results -->
						<div class="mb-6">
							<div class="flex items-center justify-between mb-3">
								<h4 class="font-medium text-surface-900-50-token">Recent Results (Last 5)</h4>
								<span class="text-sm text-surface-600-300-token">{$recentResults.length} results</span>
							</div>
							
							<div class="space-y-3">
								{#each $recentResults as result, index}
									<div 
										class="flex items-center justify-between p-4 rounded-lg border border-surface-300-600-token hover:bg-surface-200-700-token transition-colors"
										in:slide={{ duration: 300, delay: index * 50 }}
									>
										<div class="flex-1">
											<div class="flex items-center space-x-3 mb-1">
												<h5 class="font-medium text-surface-900-50-token text-sm">
													{result.examTitle}
												</h5>
												<div 
													class="px-2 py-1 rounded-full text-xs font-medium"
													class:bg-success-100={result.percentage >= 70}
													class:text-success-700={result.percentage >= 70}
													class:dark:bg-success-800={result.percentage >= 70}
													class:dark:text-success-200={result.percentage >= 70}
													class:bg-error-100={result.percentage < 70}
													class:text-error-700={result.percentage < 70}
													class:dark:bg-error-800={result.percentage < 70}
													class:dark:text-error-200={result.percentage < 70}
												>
													{Math.round(result.percentage)}%
												</div>
											</div>
											<div class="flex items-center space-x-4 text-xs text-surface-600-300-token">
												<span>{formatDate(result.endTime)}</span>
												<span>•</span>
												<span>{result.correctAnswers}/{result.totalQuestions} correct</span>
												<span>•</span>
												<span>{formatDuration(result.timeElapsed)}</span>
											</div>
										</div>
										
										<button
											on:click={() => deleteResult(result)}
											class="btn btn-sm bg-error-100 text-error-700 border border-error-300 hover:bg-error-500 hover:text-white dark:bg-error-900 dark:text-error-300 dark:border-error-600 dark:hover:bg-error-600 dark:hover:text-white ml-4 transition-colors"
											disabled={isLoading}
											title="Delete this result"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
											</svg>
										</button>
									</div>
								{/each}
							</div>
						</div>
						
						<!-- Delete All Button -->
						<div class="pt-4 border-t border-surface-300-600-token">
							<div class="flex items-center justify-between">
								<div>
									<h4 class="font-medium text-surface-900-50-token">Clear All History</h4>
									<p class="text-sm text-surface-600-300-token">Permanently delete all quiz results and progress</p>
								</div>
								<button
									on:click={deleteAllHistory}
									class="btn bg-error-500 text-white border border-error-600 hover:bg-error-600 dark:bg-error-600 dark:text-white dark:border-error-700 dark:hover:bg-error-700 transition-colors"
									disabled={isLoading}
								>
									{#if isLoading}
										<svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Clearing...
									{:else}
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
										</svg>
										Delete All
									{/if}
								</button>
							</div>
						</div>
					{:else}
						<div class="text-center py-8">
							<svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
							<h4 class="text-lg font-medium text-surface-900-50-token mb-2">No Quiz History</h4>
							<p class="text-surface-600-300-token">Complete some practice exams to see your results here.</p>
						</div>
					{/if}
				</section>
			</div>
			
			<!-- Footer -->
			<div class="flex justify-end p-6 border-t border-surface-300-600-token bg-surface-200-700-token">
				<button
					on:click={closeModal}
					class="btn variant-filled-primary"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}