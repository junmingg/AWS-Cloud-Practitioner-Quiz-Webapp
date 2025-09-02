<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade, fly, slide, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { 
		quiz, 
		currentExam, 
		currentQuestion, 
		quizProgress, 
		navigationItems,
		timeElapsed 
	} from '$lib/stores/quiz';
	import { results, currentResult } from '$lib/stores/results';
	import { preferences } from '$lib/stores/preferences';
	import { QuizScorer } from '$lib/utils/scorer';
	import { ExamLoader } from '$lib/utils/exam-loader';
	import Question from '$lib/components/Question.svelte';
	import QuestionNav from '$lib/components/QuestionNav.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import HotkeySidebar from '$lib/components/HotkeySidebar.svelte';
	import type { PageData } from './$types';
	import type { QuestionFilter } from '$lib/types';
	// Removed SkeletonLabs imports - using custom modals
	
	export let data: PageData;
	
	let showSidebar = true;
	let showHotkeySidebar = true;
	let questionFilter: QuestionFilter = 'all';
	let showSubmitModal = false;
	let isSubmitting = false;
	let autoSaveInterval: NodeJS.Timeout;
	
	// Initialize exam
	$: if (data.exam) {
		currentExam.set(data.exam);
		quiz.init(data.exam, data.mode);
	}
	
	// Reactive values
	$: canGoPrevious = $quiz.currentQuestionIndex > 0;
	$: canGoNext = $currentExam && $quiz.currentQuestionIndex < $currentExam.questions.length - 1;
	$: currentAnswer = $currentQuestion ? ($quiz.answers.get($currentQuestion.id) || []) : [];
	$: isQuestionAnswered = currentAnswer.length > 0;
	$: allQuestionsAnswered = $currentExam && $quiz.answers.size === $currentExam.questions.length;
	
	function handleAnswer(event: CustomEvent) {
		const { questionId, selectedAnswers } = event.detail;
		quiz.answerQuestion(questionId, selectedAnswers);
	}
	
	function handleFlag(event: CustomEvent) {
		const { questionId } = event.detail;
		quiz.toggleFlag(questionId);
	}
	
	function handleNavigation(event: CustomEvent) {
		const { index } = event.detail;
		quiz.goToQuestion(index);
	}
	
	function handleFilterChange(event: CustomEvent) {
		questionFilter = event.detail.filter;
	}
	
	function goToPrevious() {
		if (canGoPrevious) {
			quiz.previousQuestion();
		}
	}
	
	function goToNext() {
		if (canGoNext) {
			quiz.nextQuestion();
		}
	}
	
	function toggleSidebar() {
		showSidebar = !showSidebar;
	}
	
	function toggleHotkeySidebar() {
		showHotkeySidebar = !showHotkeySidebar;
	}
	
	function handleSubmit() {
		showSubmitModal = true;
	}
	
	async function confirmSubmit() {
		if (!$currentExam || isSubmitting) return;
		
		isSubmitting = true;
		
		try {
			// Calculate results
			const result = QuizScorer.calculateResult(
				$currentExam.id,
				$currentExam.title,
				$currentExam.questions,
				$quiz.answers,
				$quiz.startTime,
				new Date()
			);
			
			// Save result
			results.add(result);
			currentResult.set(result);
			
			// Update exam stats
			ExamLoader.updateExamStats($currentExam.id, result.percentage);
			
			// Submit quiz
			quiz.submit();
			
			// Navigate to results
			goto(`/results/${$currentExam.id}`);
			
		} catch (error) {
			console.error('Error submitting quiz:', error);
			// Handle error - maybe show a toast
		} finally {
			isSubmitting = false;
			showSubmitModal = false;
		}
	}
	
	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) return;
		
		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				goToPrevious();
				break;
			case 'ArrowRight':
				event.preventDefault();
				goToNext();
				break;
			case 'f':
			case 'F':
				if ($currentQuestion && !event.ctrlKey && !event.metaKey) {
					event.preventDefault();
					quiz.toggleFlag($currentQuestion.id);
				}
				break;
			case 's':
			case 'S':
				if (!event.ctrlKey && !event.metaKey) {
					event.preventDefault();
					toggleSidebar();
				}
				break;
			case 'h':
			case 'H':
				if (!event.ctrlKey && !event.metaKey) {
					event.preventDefault();
					toggleHotkeySidebar();
				}
				break;
		}
	}
	
	// Auto-save functionality
	onMount(() => {
		if ($preferences.autoSave) {
			autoSaveInterval = setInterval(() => {
				// Auto-save is handled in the quiz store
			}, 30000); // Save every 30 seconds
		}
		
		// Add keyboard listeners
		document.addEventListener('keydown', handleKeydown);
		
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
	
	onDestroy(() => {
		if (autoSaveInterval) {
			clearInterval(autoSaveInterval);
		}
	});
</script>

<svelte:head>
	<title>{data.exam?.title || 'Quiz'} - AWS Cloud Practitioner</title>
</svelte:head>

{#if $currentExam && $currentQuestion}
	<div class="h-full flex overflow-hidden" in:fade={{ duration: 300 }}>
		<!-- Question Navigation Sidebar -->
		{#if showSidebar}
			<div 
				class="w-80 flex-shrink-0 bg-surface-50-900-token" 
				in:fly={{ x: -320, duration: 300, easing: quintOut }}
				out:fly={{ x: -320, duration: 300, easing: quintOut }}
			>
				<QuestionNav 
					items={$navigationItems}
					totalQuestions={$currentExam.questions.length}
					bind:filter={questionFilter}
					on:navigate={handleNavigation}
					on:filterChange={handleFilterChange}
				/>
			</div>
		{/if}
		
		<!-- Main Content -->
		<div class="flex-1 flex flex-col overflow-hidden">
			<!-- Header -->
			<header class="bg-surface-100-800-token border-b border-surface-300-600-token px-6 py-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<!-- Sidebar Toggle -->
						<button 
							class="btn btn-sm variant-ghost-surface"
							on:click={toggleSidebar}
							title="Toggle sidebar (S)"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if showSidebar}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
								{:else}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
								{/if}
							</svg>
						</button>
						
						<!-- Hotkey Sidebar Toggle -->
						<button 
							class="btn btn-sm variant-ghost-surface"
							on:click={toggleHotkeySidebar}
							title="Toggle shortcuts (H)"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							{#if showHotkeySidebar}
								<span class="ml-1 text-xs">Hide</span>
							{:else}
								<span class="ml-1 text-xs">Help</span>
							{/if}
						</button>
						
						<!-- Exam Title -->
						<div>
							<div class="flex items-center space-x-3">
								<h1 class="text-xl font-bold text-surface-900-50-token">
									{$currentExam.title}
								</h1>
								<span 
									class="px-3 py-1 rounded-full text-xs font-medium"
									class:bg-success-100={data.mode === 'practice'}
									class:text-success-700={data.mode === 'practice'}
									class:dark:bg-success-800={data.mode === 'practice'}
									class:dark:text-success-200={data.mode === 'practice'}
									class:bg-primary-100={data.mode === 'exam'}
									class:text-primary-700={data.mode === 'exam'}
									class:dark:bg-primary-800={data.mode === 'exam'}
									class:dark:text-primary-200={data.mode === 'exam'}
								>
									{data.mode === 'practice' ? 'Practice Mode' : 'Exam Mode'}
								</span>
							</div>
							<p class="text-sm text-surface-600-300-token">
								Question {$quiz.currentQuestionIndex + 1} of {$currentExam.questions.length}
							</p>
						</div>
					</div>
					
					<div class="flex items-center space-x-6">
						<!-- Progress -->
						<div class="hidden md:block min-w-32">
							<ProgressBar 
								value={$quizProgress.answered}
								max={$quizProgress.total}
								variant="primary"
								size="sm"
								showNumbers={true}
								animated={true}
							/>
						</div>
						
						<!-- Timer -->
						{#if $preferences.showTimer}
							<Timer 
								startTime={$quiz.startTime}
								size="md"
								variant="default"
							/>
						{/if}
						
						<!-- Submit Button -->
						<button 
							class="btn variant-filled-primary"
							class:variant-filled-success={allQuestionsAnswered}
							on:click={handleSubmit}
							disabled={$quiz.submitted}
						>
							{#if allQuestionsAnswered}
								<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
								</svg>
							{/if}
							Submit Quiz
						</button>
					</div>
				</div>
			</header>
			
			<!-- Question Content -->
			<main class="flex-1 overflow-auto">
				<div class="max-w-4xl mx-auto py-3 px-4" in:fly={{ x: 20, duration: 400, easing: quintOut }}>
					<Question 
						question={$currentQuestion}
						selectedAnswers={currentAnswer}
						showResults={data.mode === 'practice' && isQuestionAnswered}
						on:answer={handleAnswer}
						on:flag={handleFlag}
						animated={true}
					/>
				</div>
			</main>
			
			<!-- Navigation Footer -->
			<footer class="bg-surface-100-800-token border-t border-surface-300-600-token px-6 py-3">
				<div class="flex items-center justify-between">
					<!-- Previous Button -->
					<button 
						class="btn variant-ghost-surface"
						disabled={!canGoPrevious}
						on:click={goToPrevious}
						title="Previous question (←)"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
						</svg>
						Previous
					</button>
					
					<!-- Question Status -->
					<div class="flex items-center space-x-4 text-sm text-surface-600-300-token">
						<div class="flex items-center space-x-2">
							{#if isQuestionAnswered}
								<div class="w-2 h-2 bg-success-500 rounded-full" transition:scale></div>
								<span>Answered</span>
							{:else}
								<div class="w-2 h-2 bg-surface-400 rounded-full"></div>
								<span>Not answered</span>
							{/if}
						</div>
						
						{#if $currentQuestion.flagged}
							<div class="flex items-center space-x-2 text-warning-600">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" />
								</svg>
								<span>Flagged</span>
							</div>
						{/if}
						
					</div>
					
					<!-- Next Button -->
					<button 
						class="btn variant-filled-surface"
						disabled={!canGoNext}
						on:click={goToNext}
						title="Next question (→)"
					>
						Next
						<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
						</svg>
					</button>
				</div>
			</footer>
		</div>
		
		<!-- Hotkey Sidebar -->
		<HotkeySidebar 
			show={showHotkeySidebar}
			mode={data.mode}
		/>
	</div>
{:else}
	<!-- Loading State -->
	<div class="h-full flex items-center justify-center bg-surface-50-900-token">
		<div class="text-center">
			<div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
			<h2 class="text-xl font-semibold text-surface-900-50-token mb-2">Loading Exam</h2>
			<p class="text-surface-600-300-token">Please wait while we prepare your quiz...</p>
		</div>
	</div>
{/if}

<!-- Submit Confirmation Modal -->
{#if showSubmitModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade>
		<div 
			class="bg-surface-100-800-token rounded-xl max-w-md w-full p-6 space-y-4"
			transition:fly={{ y: 20, duration: 200 }}
		>
			<div class="text-center">
				<div class="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
					</svg>
				</div>
				
				<h3 class="text-xl font-bold text-surface-900-50-token mb-2">Submit Quiz?</h3>
				<p class="text-surface-600-300-token mb-4">
					Are you sure you want to submit your quiz? This action cannot be undone.
				</p>
				
				<!-- Summary -->
				<div class="bg-surface-200-700-token rounded-lg p-4 text-left">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div class="text-center">
							<div class="font-semibold text-surface-900-50-token">{$quizProgress.answered}</div>
							<div class="text-surface-600-300-token">Answered</div>
						</div>
						<div class="text-center">
							<div class="font-semibold text-surface-900-50-token">{$quizProgress.total - $quizProgress.answered}</div>
							<div class="text-surface-600-300-token">Unanswered</div>
						</div>
					</div>
					
					{#if !allQuestionsAnswered}
						<div class="mt-3 pt-3 border-t border-surface-300-600-token">
							<p class="text-warning-600 dark:text-warning-400 text-sm">
								⚠️ You have unanswered questions. They will be marked as incorrect.
							</p>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Actions -->
			<div class="flex space-x-3">
				<button 
					class="btn variant-ghost-surface flex-1"
					on:click={() => showSubmitModal = false}
					disabled={isSubmitting}
				>
					Continue Quiz
				</button>
				<button 
					class="btn variant-filled-primary flex-1"
					on:click={confirmSubmit}
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
					{/if}
					Submit Quiz
				</button>
			</div>
		</div>
	</div>
{/if}