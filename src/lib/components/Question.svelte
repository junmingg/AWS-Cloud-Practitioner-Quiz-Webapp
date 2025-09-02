<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { Question as QuestionType, Option } from '$lib/types';
	
	export let question: QuestionType;
	export let selectedAnswers: string[] = [];
	export let showResults = false;
	export let isReviewMode = false;
	export let animated = true;
	
	const dispatch = createEventDispatcher<{
		answer: { questionId: string; selectedAnswers: string[] };
		flag: { questionId: string };
	}>();
	
	$: isMultipleChoice = question.type === 'MCMA';
	$: maxSelections = isMultipleChoice ? 2 : 1;
	
	// Local state for keyboard selections (pending until Space is pressed)
	let pendingSelections: string[] = [];
	
	// Reset pending selections when question changes or when an answer is submitted via mouse/touch
	$: if (question.id) {
		pendingSelections = [...selectedAnswers];
	}
	
	// Check if there are any pending changes
	$: hasPendingChanges = JSON.stringify(pendingSelections.sort()) !== JSON.stringify(selectedAnswers.sort());
	
	function handleOptionChange(optionId: string, checked: boolean) {
		let newSelection = [...pendingSelections];
		
		if (isMultipleChoice) {
			if (checked) {
				// Add if not at max selections
				if (newSelection.length < maxSelections && !newSelection.includes(optionId)) {
					newSelection.push(optionId);
				}
			} else {
				// Remove if unchecked
				newSelection = newSelection.filter(id => id !== optionId);
			}
		} else {
			// Single choice - replace selection
			newSelection = checked ? [optionId] : [];
		}
		
		// Update pending selections only - don't submit yet
		pendingSelections = [...newSelection];
	}
	
	function toggleFlag() {
		dispatch('flag', { questionId: question.id });
	}
	
	function handleKeyboardShortcut(event: KeyboardEvent) {
		// Only handle shortcuts if not in results/review mode and not typing in input field
		if (showResults || isReviewMode || event.target instanceof HTMLInputElement) return;
		
		// Handle Space key for submission
		if (event.code === 'Space') {
			event.preventDefault();
			submitPendingSelections();
			return;
		}
		
		// Handle keys 1-5 for options A-E (selection only, no submission)
		const keyNumber = parseInt(event.key);
		if (keyNumber >= 1 && keyNumber <= 5) {
			event.preventDefault(); // Prevent default behavior
			
			// Find the option corresponding to this number (1=A, 2=B, 3=C, 4=D, 5=E)
			const targetLetter = String.fromCharCode(64 + keyNumber); // 65 is 'A', so 64 + 1 = 65
			const targetOption = question.options.find(opt => opt.letter === targetLetter);
			
			if (targetOption) {
				const isCurrentlyInPending = pendingSelections.includes(targetOption.id);
				let newPendingSelections = [...pendingSelections];
				
				if (isMultipleChoice) {
					// MCMA: Toggle the option in pending selections
					if (isCurrentlyInPending) {
						// Remove from pending
						newPendingSelections = newPendingSelections.filter(id => id !== targetOption.id);
					} else {
						// Add to pending if we haven't reached max selections
						if (newPendingSelections.length < maxSelections) {
							newPendingSelections.push(targetOption.id);
						}
					}
				} else {
					// MCQ: Toggle or replace selection in pending
					if (isCurrentlyInPending) {
						// Clear pending selection
						newPendingSelections = [];
					} else {
						// Replace pending selection
						newPendingSelections = [targetOption.id];
					}
				}
				
				pendingSelections = newPendingSelections;
			}
		}
	}
	
	function submitPendingSelections() {
		// Only submit if there are any changes from the current selection
		if (JSON.stringify(pendingSelections.sort()) !== JSON.stringify(selectedAnswers.sort())) {
			dispatch('answer', {
				questionId: question.id,
				selectedAnswers: pendingSelections
			});
		}
	}
	
	onMount(() => {
		// Add keyboard event listener
		window.addEventListener('keydown', handleKeyboardShortcut);
	});
	
	onDestroy(() => {
		// Remove keyboard event listener
		window.removeEventListener('keydown', handleKeyboardShortcut);
	});
	
	function getOptionStatus(option: Option): 'correct' | 'incorrect' | 'neutral' {
		if (!showResults) return 'neutral';
		
		const isSelected = selectedAnswers.includes(option.id);
		const isCorrect = question.correctAnswers.includes(option.id);
		
		if (isCorrect) return 'correct';
		if (isSelected && !isCorrect) return 'incorrect';
		return 'neutral';
	}
	
	function getOptionClasses(option: Option): string {
		const status = getOptionStatus(option);
		const isSelected = selectedAnswers.includes(option.id);
		
		let classes = 'border-2 rounded-xl p-4 quiz-transition cursor-pointer select-none ';
		
		if (showResults) {
			switch (status) {
				case 'correct':
					classes += 'border-success-500 bg-success-100 dark:bg-success-900 text-success-900 dark:text-success-100';
					break;
				case 'incorrect':
					classes += 'border-error-500 bg-error-100 dark:bg-error-900 text-error-900 dark:text-error-100';
					break;
				default:
					classes += 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200';
			}
		} else {
			if (isSelected) {
				classes += 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100';
			} else {
				classes += 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900';
			}
		}
		
		return classes;
	}
	
	$: isAnswered = selectedAnswers.length > 0;
	$: isComplete = isMultipleChoice ? selectedAnswers.length === maxSelections : isAnswered;
</script>

<div class="space-y-6" class:opacity-75={showResults && !isAnswered}>
	<!-- Question Header -->
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1">
			<div class="flex items-center gap-3 mb-3">
				<span class="inline-flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 rounded-lg font-semibold text-sm">
					{question.number}
				</span>
				
				<!-- Question Type Badge -->
				<span 
					class="px-3 py-1 rounded-full text-xs font-medium"
					class:bg-secondary-100={isMultipleChoice}
					class:text-secondary-700={isMultipleChoice}
					class:dark:bg-secondary-800={isMultipleChoice}
					class:dark:text-secondary-100={isMultipleChoice}
					class:bg-primary-100={!isMultipleChoice}
					class:text-primary-700={!isMultipleChoice}
					class:dark:bg-primary-800={!isMultipleChoice}
					class:dark:text-primary-100={!isMultipleChoice}
				>
					{isMultipleChoice ? 'Select TWO' : 'Select ONE'}
				</span>
			</div>
			
			<h2 class="text-lg font-medium text-surface-900-50-token leading-relaxed">
				{question.text}
			</h2>
			
		</div>
		
		<!-- Flag Button -->
		<button
			class="btn btn-sm variant-ghost-surface flex-shrink-0"
			class:variant-filled-warning={question.flagged}
			on:click={toggleFlag}
			title={question.flagged ? 'Remove flag' : 'Flag for review'}
		>
			<svg class="w-4 h-4" fill={question.flagged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H10.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
			</svg>
		</button>
	</div>
	
	<!-- Selection Progress (for MCMA) -->
	{#if isMultipleChoice}
		<div class="bg-surface-100-800-token rounded-lg p-3">
			<div class="flex items-center justify-between text-sm">
				<span class="text-surface-600-300-token">
					Selected: {selectedAnswers.length} of {maxSelections}
				</span>
				<div class="flex space-x-1">
					{#each Array(maxSelections) as _, i}
						<div 
							class="w-2 h-2 rounded-full quiz-transition"
							class:bg-primary-500={i < selectedAnswers.length}
							class:bg-gray-300={i >= selectedAnswers.length}
							class:dark:bg-gray-600={i >= selectedAnswers.length}
						></div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Options -->
	<div class="space-y-3">
		{#each question.options as option, index}
			{@const isSelected = selectedAnswers.includes(option.id)}
			{@const isPending = pendingSelections.includes(option.id)}
			{@const hasChanged = isPending !== isSelected}
			{@const isDisabled = showResults || (isMultipleChoice && pendingSelections.length >= maxSelections && !isPending)}
			{@const status = getOptionStatus(option)}
			
			<div
				class={getOptionClasses(option)}
				class:opacity-50={isDisabled}
				class:cursor-not-allowed={isDisabled}
				in:fly={{ 
					x: animated ? -20 : 0, 
					duration: animated ? 300 : 0, 
					delay: animated ? index * 100 : 0,
					easing: quintOut 
				}}
			>
				<label class="flex items-start gap-4 cursor-pointer" class:cursor-not-allowed={isDisabled}>
					<!-- Checkbox/Radio -->
					<div class="flex-shrink-0 mt-1">
						{#if isMultipleChoice}
							<input
								type="checkbox"
								class="checkbox"
								checked={isPending}
								on:change={(e) => handleOptionChange(option.id, e.currentTarget.checked)}
								disabled={isDisabled}
							/>
						{:else}
							<input
								type="radio"
								name="question-{question.id}"
								class="radio"
								checked={isPending}
								on:change={() => handleOptionChange(option.id, true)}
								disabled={isDisabled}
							/>
						{/if}
					</div>
					
					<!-- Option Content -->
					<div class="flex-1">
						<div class="flex items-center gap-3">
							<span class="font-semibold text-lg" class:text-warning-600={hasChanged && !showResults} class:dark:text-warning-400={hasChanged && !showResults}>
								{option.letter}.
							</span>
							<span class="flex-1" class:text-warning-700={hasChanged && !showResults} class:dark:text-warning-300={hasChanged && !showResults}>
								{option.text}
							</span>
							
							<!-- Pending Change Indicator -->
							{#if hasChanged && !showResults && !isReviewMode}
								<div class="flex-shrink-0">
									<div class="w-2 h-2 bg-warning-500 rounded-full animate-pulse" title="Pending change - press Space to submit"></div>
								</div>
							{/if}
							
							
							<!-- Result Icons -->
							{#if showResults}
								{#if status === 'correct'}
									<div 
										class="flex-shrink-0 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center"
										in:scale={{ duration: 200, delay: 100 }}
									>
										<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
										</svg>
									</div>
								{:else if status === 'incorrect'}
									<div 
										class="flex-shrink-0 w-6 h-6 bg-error-500 rounded-full flex items-center justify-center"
										in:scale={{ duration: 200, delay: 100 }}
									>
										<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
										</svg>
									</div>
								{/if}
							{/if}
						</div>
					</div>
				</label>
			</div>
		{/each}
	</div>
	
	<!-- Submit Button -->
	{#if !showResults && !isReviewMode}
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<button
				class="btn variant-filled-primary"
				on:click={submitPendingSelections}
				disabled={pendingSelections.length === 0}
			>
				Submit
			</button>
			
			<div class="text-sm text-surface-600-300-token">
				Or press <kbd class="kbd kbd-xs bg-surface-200-700-token">Space</kbd> to submit
			</div>
		</div>
	{/if}
	
	<!-- Explanation (shown in results/review mode) -->
	{#if showResults && question.explanation}
		<div 
			class="bg-info-100 dark:bg-info-900/20 border border-info-300 dark:border-info-600 rounded-lg p-4"
			in:fly={{ y: 20, duration: 300, delay: 200 }}
		>
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0 mt-1">
					<svg class="w-5 h-5 text-info-600 dark:text-info-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<div>
					<h4 class="font-medium text-info-900 dark:text-info-100 mb-2">Explanation</h4>
					<p class="text-info-800 dark:text-info-200 leading-relaxed">
						{question.explanation}
					</p>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Answer Status Summary (shown in results) -->
	{#if showResults}
		<div class="bg-surface-100-800-token rounded-lg p-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					{#if isAnswered}
						{@const isCorrect = question.correctAnswers.length === selectedAnswers.length && 
							question.correctAnswers.every(id => selectedAnswers.includes(id))}
						{#if isCorrect}
							<div class="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							</div>
							<span class="font-medium text-success-700 dark:text-success-300">Correct!</span>
						{:else}
							<div class="w-8 h-8 bg-error-500 rounded-full flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</div>
							<span class="font-medium text-error-700 dark:text-error-300">Incorrect</span>
						{/if}
					{:else}
						<div class="w-8 h-8 bg-warning-500 rounded-full flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
							</svg>
						</div>
						<span class="font-medium text-warning-700 dark:text-warning-300">Not answered</span>
					{/if}
				</div>
				
				<div class="text-sm">
					<span class="text-gray-900 dark:text-white">Correct answer{question.correctAnswers.length > 1 ? 's' : ''}:</span>
					<span class="font-medium text-gray-900 dark:text-white ml-1">
						{question.correctAnswers.map(id => {
							const option = question.options.find(opt => opt.id === id);
							return option?.letter;
						}).join(', ')}
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>