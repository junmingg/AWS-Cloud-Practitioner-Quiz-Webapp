<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import ProgressBar from './ProgressBar.svelte';
	import { StorageManager } from '$lib/utils/storage';
	import type { ExamMetadata } from '$lib/types';
	
	export let exam: ExamMetadata;
	export let viewMode: 'grid' | 'list' = 'grid';
	
	$: completionProgress = exam.bestScore !== undefined && exam.bestScore !== null ? Math.min(exam.bestScore, 100) : 0;
	$: isPassed = exam.bestScore !== undefined && exam.bestScore !== null && exam.bestScore >= 70;
	
	// Check for active quiz state to determine if truly in progress
	$: hasActiveQuizState = (() => {
		if (typeof window === 'undefined') return false;
		const quizState = StorageManager.loadQuizState(exam.id);
		return quizState && !quizState.submitted;
	})();
	
	// Enhanced status logic
	$: isFailed = exam.attempts > 0 && exam.bestScore !== undefined && exam.bestScore < 70 && !hasActiveQuizState;
	$: isInProgress = hasActiveQuizState;
	$: isNotStarted = exam.attempts === 0 && !hasActiveQuizState;
	
	function startExam() {
		goto(`/exam/${exam.id}/mode`);
	}
	
	function formatLastAttempted(date: Date | undefined): string {
		if (!date) return 'Never';
		
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
		
		if (diffInHours < 1) {
			return 'Just now';
		} else if (diffInHours < 24) {
			return `${Math.floor(diffInHours)} hours ago`;
		} else if (diffInHours < 168) { // 7 days
			return `${Math.floor(diffInHours / 24)} days ago`;
		} else {
			return date.toLocaleDateString();
		}
	}
	
	function getBestScoreVariant(): 'primary' | 'secondary' | 'tertiary' | 'warning' | 'error' {
		if (exam.bestScore === undefined || exam.bestScore === null) return 'tertiary';
		if (exam.bestScore >= 90) return 'primary';
		if (exam.bestScore >= 80) return 'secondary';
		if (exam.bestScore >= 70) return 'tertiary';
		if (exam.bestScore >= 60) return 'warning';
		return 'error';
	}
	
	function getStatusBadge(): { text: string; classes: string } {
		if (isPassed) {
			return {
				text: 'Passed',
				classes: 'bg-success-500/20 text-success-700 dark:text-success-300 border-success-500/30'
			};
		} else if (isInProgress) {
			return {
				text: 'In Progress',
				classes: 'bg-warning-500/20 text-warning-700 dark:text-warning-300 border-warning-500/30'
			};
		} else if (isFailed) {
			return {
				text: 'Failed',
				classes: 'bg-error-500/20 text-error-700 dark:text-error-300 border-error-500/30'
			};
		} else {
			return {
				text: 'Not Started',
				classes: 'bg-gray-500/20 text-gray-700 dark:text-gray-200 border-gray-500/30'
			};
		}
	}
	
	$: statusBadge = getStatusBadge();
</script>

{#if viewMode === 'grid'}
	<!-- Grid View -->
	<div 
		class="bg-surface-100-800-token rounded-xl border border-surface-300-600-token hover:border-primary-500/50 quiz-card-hover quiz-transition group cursor-pointer"
		on:click={startExam}
		on:keydown={(e) => e.key === 'Enter' && startExam()}
		role="button"
		tabindex="0"
		in:fade={{ duration: 300 }}
	>
		<!-- Header -->
		<div class="p-6 pb-4">
			<div class="flex items-start justify-between mb-3">
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-surface-900-50-token group-hover:text-primary-600 dark:group-hover:text-primary-400 quiz-transition">
						{exam.title}
					</h3>
					<p class="text-sm text-surface-600-300-token mt-1">
						{exam.questionCount} questions
					</p>
				</div>
				
				<span class="px-2 py-1 rounded-full text-xs font-medium border {statusBadge.classes}">
					{statusBadge.text}
				</span>
			</div>
			
			<!-- Progress -->
			{#if exam.bestScore !== undefined && exam.bestScore !== null}
				<div class="mb-4">
					<ProgressBar 
						value={completionProgress}
						variant={getBestScoreVariant()}
						size="sm"
						showPercentage={true}
						animated={true}
					/>
				</div>
			{/if}
		</div>
		
		<!-- Stats -->
		<div class="px-6 py-4 bg-surface-200-700-token border-t border-surface-300-600-token">
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div class="text-center">
					<div class="font-semibold text-surface-900-50-token">
						{exam.bestScore ? `${Math.round(exam.bestScore)}%` : '—'}
					</div>
					<div class="text-surface-600-300-token text-xs">Best Score</div>
				</div>
				<div class="text-center">
					<div class="font-semibold text-surface-900-50-token">
						{exam.attempts}
					</div>
					<div class="text-surface-600-300-token text-xs">Attempts</div>
				</div>
			</div>
			
			{#if exam.lastAttempted}
				<div class="mt-3 pt-3 border-t border-surface-300-600-token text-center">
					<div class="text-xs text-surface-600-300-token">
						Last: {formatLastAttempted(exam.lastAttempted)}
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Action Footer -->
		<div class="px-6 py-4 bg-surface-50-850-token border-t border-surface-300-600-token">
			<button 
				class="btn variant-filled-primary w-full quiz-transition"
				on:click|stopPropagation={startExam}
			>
				{isInProgress ? 'Continue' : (exam.attempts > 0 ? 'Retake' : 'Start Exam')}
				<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
				</svg>
			</button>
		</div>
	</div>
{:else}
	<!-- List View -->
	<div 
		class="bg-surface-100-800-token rounded-xl border border-surface-300-600-token hover:border-primary-500/50 quiz-transition group cursor-pointer p-6"
		on:click={startExam}
		on:keydown={(e) => e.key === 'Enter' && startExam()}
		role="button"
		tabindex="0"
		in:fade={{ duration: 300 }}
	>
		<div class="flex items-center justify-between">
			<!-- Left Content -->
			<div class="flex-1">
				<div class="flex items-center space-x-4">
					<div class="flex-1">
						<h3 class="text-lg font-semibold text-surface-900-50-token group-hover:text-primary-600 dark:group-hover:text-primary-400 quiz-transition">
							{exam.title}
						</h3>
						<div class="flex items-center space-x-4 mt-2 text-sm text-surface-600-300-token">
							<span>{exam.questionCount} questions</span>
							<span>•</span>
							<span>{exam.attempts} attempts</span>
							{#if exam.lastAttempted}
								<span>•</span>
								<span>Last: {formatLastAttempted(exam.lastAttempted)}</span>
							{/if}
						</div>
					</div>
					
					<!-- Progress Bar (List view) -->
					{#if exam.bestScore !== undefined && exam.bestScore !== null}
						<div class="w-32">
							<ProgressBar 
								value={completionProgress}
								variant={getBestScoreVariant()}
								size="sm"
								showPercentage={false}
								animated={true}
							/>
							<div class="text-xs text-center mt-1 text-surface-600-300-token">
								{Math.round(completionProgress)}%
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Right Content -->
			<div class="flex items-center space-x-4">
				<span class="px-3 py-1 rounded-full text-xs font-medium border {statusBadge.classes}">
					{statusBadge.text}
				</span>
				
				<button 
					class="btn variant-filled-primary quiz-transition"
					on:click|stopPropagation={startExam}
				>
					{isInProgress ? 'Continue' : (exam.attempts > 0 ? 'Retake' : 'Start Exam')}
					<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}