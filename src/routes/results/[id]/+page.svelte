<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly, scale } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';
	import { currentResult } from '$lib/stores/results';
	import { quiz, currentExam } from '$lib/stores/quiz';
	import { ExamLoader } from '$lib/utils/exam-loader';
	import { QuizScorer } from '$lib/utils/scorer';
	import Question from '$lib/components/Question.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import type { PageData } from './$types';
	import type { QuizResult } from '$lib/types';
	
	export let data: PageData;
	
	let result: QuizResult | null = null;
	let analytics: any = null;
	let loading = true;
	let reviewMode = 'summary'; // 'summary' | 'all' | 'incorrect' | 'flagged'
	let currentReviewIndex = 0;
	let showCelebration = false;
	
	$: filteredQuestions = result?.questionResults.filter(q => {
		switch (reviewMode) {
			case 'incorrect':
				return !q.isCorrect;
			case 'flagged':
				return false; // We don't have flag data in results yet - would need to store it
			case 'all':
				return true;
			default:
				return false;
		}
	}) || [];
	
	$: currentReviewQuestion = filteredQuestions[currentReviewIndex];
	$: passStatus = result ? QuizScorer.calculatePassStatus(result.percentage) : null;
	
	onMount(async () => {
		// Get result from store first
		if ($currentResult && $currentResult.examId === data.examId) {
			result = $currentResult;
			analytics = QuizScorer.calculateAnalytics(result);
			
			// Show celebration for passing scores
			if (result.percentage >= 70) {
				setTimeout(() => {
					showCelebration = true;
					setTimeout(() => showCelebration = false, 3000);
				}, 1000);
			}
		}
		
		loading = false;
	});
	
	function goToReviewQuestion(index: number) {
		currentReviewIndex = index;
	}
	
	function nextReviewQuestion() {
		if (currentReviewIndex < filteredQuestions.length - 1) {
			currentReviewIndex++;
		}
	}
	
	function previousReviewQuestion() {
		if (currentReviewIndex > 0) {
			currentReviewIndex--;
		}
	}
	
	function retakeExam() {
		goto(`/exam/${data.examId}`);
	}
	
	function goHome() {
		goto('/');
	}
	
	function exportResults() {
		if (!result) return;
		
		const exportData = {
			exam: result.examTitle,
			score: result.percentage,
			date: result.endTime.toISOString(),
			duration: QuizScorer.formatDuration(result.timeElapsed),
			questions: result.questionResults.map(q => ({
				number: q.questionNumber,
				question: q.questionText,
				correct: q.isCorrect,
				userAnswers: q.userAnswers,
				correctAnswers: q.correctAnswers
			}))
		};
		
		const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
			type: 'application/json' 
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${result.examTitle}_results_${result.endTime.toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Results - {result?.examTitle || 'Quiz'}</title>
</svelte:head>

{#if loading}
	<!-- Loading State -->
	<div class="h-screen flex items-center justify-center bg-surface-50-900-token">
		<div class="text-center">
			<div class="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
			<h2 class="text-xl font-semibold text-surface-900-50-token mb-2">Loading Results</h2>
			<p class="text-surface-600-300-token">Please wait while we prepare your results...</p>
		</div>
	</div>
{:else if result}
	<div class="min-h-screen bg-surface-50-900-token">
		<!-- Celebration Animation -->
		{#if showCelebration}
			<div 
				class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
				transition:fade={{ duration: 500 }}
			>
				<div 
					class="text-6xl animate-pulse"
					transition:scale={{ duration: 1000, easing: elasticOut }}
				>
					🎉
				</div>
			</div>
		{/if}
		
		<!-- Header -->
		<header class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-12">
			<div class="container mx-auto max-w-6xl px-6">
				<div class="text-center" in:fly={{ y: 30, duration: 600, easing: quintOut }}>
					<h1 class="text-4xl font-bold mb-4">Quiz Complete!</h1>
					<p class="text-xl opacity-90">
						{result.examTitle}
					</p>
				</div>
				
				<!-- Score Display -->
				<div class="mt-8 text-center" in:fly={{ y: 30, duration: 600, delay: 200, easing: quintOut }}>
					<div class="inline-block">
						<div 
							class="text-6xl font-bold mb-2"
							class:text-green-200={passStatus?.passed}
							class:text-red-200={!passStatus?.passed}
						>
							{Math.round(result.percentage)}%
						</div>
						<div class="text-lg opacity-90">
							{result.correctAnswers} of {result.totalQuestions} correct
						</div>
					</div>
				</div>
				
				<!-- Status Badge -->
				<div class="text-center mt-6" in:scale={{ duration: 500, delay: 400, easing: elasticOut }}>
					<span 
						class="inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold"
						class:bg-green-500={passStatus?.passed}
						class:text-white={passStatus?.passed}
						class:bg-red-500={!passStatus?.passed}
					>
						{#if passStatus?.passed}
							<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
							</svg>
							PASSED - Grade: {passStatus.grade}
						{:else}
							<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
							FAILED - Grade: {passStatus?.grade || 'F'}
						{/if}
					</span>
				</div>
			</div>
		</header>
		
		<!-- Content -->
		<div class="container mx-auto max-w-6xl px-6 py-8">
			<!-- Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" in:fly={{ y: 30, duration: 600, delay: 300 }}>
				<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
					<div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
						{result.correctAnswers}
					</div>
					<div class="text-surface-600-300-token">Correct</div>
				</div>
				
				<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
					<div class="text-3xl font-bold text-error-600 dark:text-error-400 mb-2">
						{result.incorrectAnswers}
					</div>
					<div class="text-surface-600-300-token">Incorrect</div>
				</div>
				
				<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
					<div class="text-3xl font-bold text-warning-600 dark:text-warning-400 mb-2">
						{result.skippedAnswers}
					</div>
					<div class="text-surface-600-300-token">Skipped</div>
				</div>
				
				<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
					<div class="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mb-2">
						{QuizScorer.formatDuration(result.timeElapsed)}
					</div>
					<div class="text-surface-600-300-token">Time</div>
				</div>
			</div>
			
			<!-- Performance Message -->
			{#if passStatus}
				<div 
					class="bg-surface-100-800-token rounded-xl p-6 mb-8 text-center"
					in:fly={{ y: 30, duration: 600, delay: 400 }}
				>
					<h3 class="text-xl font-semibold text-surface-900-50-token mb-3">
						Performance Summary
					</h3>
					<p class="text-surface-700-200-token leading-relaxed max-w-2xl mx-auto">
						{passStatus.message}
					</p>
				</div>
			{/if}
			
			<!-- Analytics -->
			{#if analytics}
				<div class="bg-surface-100-800-token rounded-xl p-6 mb-8" in:fly={{ y: 30, duration: 600, delay: 500 }}>
					<h3 class="text-xl font-semibold text-surface-900-50-token mb-6">Detailed Analytics</h3>
					
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<!-- Question Type Performance -->
						<div>
							<h4 class="font-medium text-surface-900-50-token mb-4">Question Type Performance</h4>
							<div class="space-y-4">
								<div>
									<div class="flex justify-between text-sm mb-2">
										<span class="text-surface-700-200-token">Multiple Choice (MCQ)</span>
										<span class="font-medium text-surface-900-50-token">{Math.round(analytics.accuracyByType.MCQ)}%</span>
									</div>
									<ProgressBar 
										value={analytics.accuracyByType.MCQ}
										variant="primary"
										size="sm"
									/>
								</div>
								<div>
									<div class="flex justify-between text-sm mb-2">
										<span class="text-surface-700-200-token">Multi-Answer (MCMA)</span>
										<span class="font-medium text-surface-900-50-token">{Math.round(analytics.accuracyByType.MCMA)}%</span>
									</div>
									<ProgressBar 
										value={analytics.accuracyByType.MCMA}
										variant="secondary"
										size="sm"
									/>
								</div>
							</div>
						</div>
						
						<!-- Study Recommendations -->
						<div>
							<h4 class="font-medium text-surface-900-50-token mb-4">Study Recommendations</h4>
							{#if analytics.weakAreas.length > 0}
								<div class="mb-4">
									<h5 class="text-sm font-medium text-error-600 dark:text-error-400 mb-2">Focus Areas</h5>
									<ul class="text-sm text-surface-600-300-token space-y-1">
										{#each analytics.weakAreas as area}
											<li>• {area}</li>
										{/each}
									</ul>
								</div>
							{/if}
							
							{#if analytics.strongAreas.length > 0}
								<div>
									<h5 class="text-sm font-medium text-success-600 dark:text-success-400 mb-2">Strong Areas</h5>
									<ul class="text-sm text-surface-600-300-token space-y-1">
										{#each analytics.strongAreas as area}
											<li>• {area}</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Review Options -->
			<div class="bg-surface-100-800-token rounded-xl p-6 mb-8" in:fly={{ y: 30, duration: 600, delay: 600 }}>
				<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
					<h3 class="text-xl font-semibold text-surface-900-50-token">Review Questions</h3>
					
					<!-- Review Mode Selector -->
					<div class="btn-group variant-ghost-surface">
						<button 
							class="btn btn-sm"
							class:variant-filled-primary={reviewMode === 'summary'}
							on:click={() => reviewMode = 'summary'}
						>
							Summary
						</button>
						<button 
							class="btn btn-sm"
							class:variant-filled-primary={reviewMode === 'all'}
							on:click={() => reviewMode = 'all'}
						>
							All ({result.totalQuestions})
						</button>
						<button 
							class="btn btn-sm"
							class:variant-filled-primary={reviewMode === 'incorrect'}
							on:click={() => reviewMode = 'incorrect'}
						>
							Incorrect ({result.incorrectAnswers})
						</button>
					</div>
				</div>
				
				{#if reviewMode === 'summary'}
					<!-- Summary View -->
					<div class="grid gap-4">
						{#each result.questionResults as question, index}
							<div 
								class="flex items-center justify-between p-4 rounded-lg border"
								class:bg-success-50={question.isCorrect}
								class:dark:bg-success-800={question.isCorrect}
								class:border-success-300={question.isCorrect}
								class:dark:border-success-600={question.isCorrect}
								class:bg-error-50={!question.isCorrect}
								class:dark:bg-error-800={!question.isCorrect}
								class:border-error-300={!question.isCorrect}
								class:dark:border-error-600={!question.isCorrect}
								in:fly={{ x: -20, duration: 300, delay: index * 50 }}
							>
								<div class="flex-1">
									<div class="flex items-center space-x-3 mb-2">
										<span class="font-semibold text-surface-900-50-token">
											Q{question.questionNumber}
										</span>
										<span class="text-xs px-2 py-1 rounded-full bg-surface-200-700-token text-surface-700-200-token">
											{question.type}
										</span>
										{#if question.isCorrect}
											<svg class="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
											</svg>
										{:else}
											<svg class="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
											</svg>
										{/if}
									</div>
									<p class="text-surface-700-200-token text-sm line-clamp-2">
										{question.questionText}
									</p>
								</div>
								
								<button 
									class="btn btn-sm variant-ghost-surface"
									on:click={() => {
										reviewMode = 'all';
										currentReviewIndex = index;
									}}
								>
									Review
								</button>
							</div>
						{/each}
					</div>
				{:else if filteredQuestions.length > 0}
					<!-- Detailed Review -->
					<div>
						<!-- Navigation -->
						<div class="flex items-center justify-between mb-6">
							<div class="flex items-center space-x-4">
								<button 
									class="btn btn-sm variant-ghost-surface"
									disabled={currentReviewIndex === 0}
									on:click={previousReviewQuestion}
								>
									← Previous
								</button>
								<span class="text-surface-600-300-token">
									{currentReviewIndex + 1} of {filteredQuestions.length}
								</span>
								<button 
									class="btn btn-sm variant-ghost-surface"
									disabled={currentReviewIndex === filteredQuestions.length - 1}
									on:click={nextReviewQuestion}
								>
									Next →
								</button>
							</div>
						</div>
						
						<!-- Question Review -->
						{#if currentReviewQuestion}
							<div key={currentReviewQuestion.questionId}>
								<Question 
									question={{
										id: currentReviewQuestion.questionId,
										number: currentReviewQuestion.questionNumber,
										text: currentReviewQuestion.questionText,
										type: currentReviewQuestion.type,
										options: currentReviewQuestion.options,
										correctAnswers: currentReviewQuestion.correctAnswers,
										explanation: currentReviewQuestion.explanation
									}}
									selectedAnswers={currentReviewQuestion.userAnswers}
									showResults={true}
									isReviewMode={true}
									on:answer={() => {}} 
									on:flag={() => {}}
								/>
							</div>
						{/if}
					</div>
				{:else}
					<div class="text-center py-8">
						<p class="text-surface-600-300-token">No questions to review in this category.</p>
					</div>
				{/if}
			</div>
			
			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center" in:fly={{ y: 30, duration: 600, delay: 700 }}>
				<button 
					class="btn variant-filled-primary"
					on:click={retakeExam}
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
					Retake Exam
				</button>
				
				<button 
					class="btn variant-ghost-surface"
					on:click={exportResults}
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
					</svg>
					Export Results
				</button>
				
				<button 
					class="btn variant-ghost-surface"
					on:click={goHome}
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
					</svg>
					Back to Home
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- No Results Found -->
	<div class="h-screen flex items-center justify-center bg-surface-50-900-token">
		<div class="text-center">
			<svg class="w-16 h-16 mx-auto text-surface-400-600-token mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.805-6.207-2.157-.97-.82-1.793-1.829-2.402-2.959C2.7 8.896 2.7 7.104 3.39 6.076 5.023 3.518 8.273 2 12 2c3.726 0 6.977 1.518 8.609 4.076.69 1.028.69 2.82-.999 3.808A7.985 7.985 0 0118 12v.5a2.5 2.5 0 11-5 0V12a3 3 0 106 0v.5z" />
			</svg>
			<h2 class="text-xl font-semibold text-surface-900-50-token mb-2">No Results Found</h2>
			<p class="text-surface-600-300-token mb-4">
				We couldn't find results for this exam. Try taking the quiz first.
			</p>
			<button class="btn variant-filled-primary" on:click={goHome}>
				Go Home
			</button>
		</div>
	</div>
{/if}