<script lang="ts">
	import { onMount } from 'svelte';
	import { StorageManager } from '$lib/utils/storage';
	import { ExamLoader } from '$lib/utils/exam-loader';
	
	let diagnosticData: any = {};
	let showDiagnostic = false;
	
	onMount(() => {
		// Only run this in development or when manually triggered
		if (typeof window !== 'undefined') {
			collectDiagnosticData();
		}
	});
	
	function collectDiagnosticData() {
		const data: any = {
			timestamp: new Date().toISOString(),
			localStorage: {},
			examMetadata: [],
			quizResults: []
		};
		
		// Collect localStorage data
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.includes('exam_')) {
				data.localStorage[key] = localStorage.getItem(key);
			}
		}
		
		// Collect StorageManager quiz results
		try {
			data.quizResults = StorageManager.getQuizResults();
		} catch (error) {
			data.quizResultsError = error.message;
		}
		
		// Test ExamLoader getBestScore for a few exams
		for (let i = 1; i <= 5; i++) {
			const examId = `practice-exam-${i}`;
			
			// Check if localStorage has data for this exam
			const attempts = localStorage.getItem(`exam_${examId}_attempts`);
			const bestScore = localStorage.getItem(`exam_${examId}_best_score`);
			const scores = localStorage.getItem(`exam_${examId}_scores`);
			const lastAttempted = localStorage.getItem(`exam_${examId}_last_attempted`);
			
			if (attempts || bestScore || scores || lastAttempted) {
				data.examMetadata.push({
					examId,
					rawData: {
						attempts,
						bestScore,
						scores,
						lastAttempted
					},
					parsedData: {
						attempts: attempts ? parseInt(attempts) : 0,
						bestScore: bestScore ? parseFloat(bestScore) : undefined,
						bestScoreType: bestScore ? typeof parseFloat(bestScore) : 'undefined',
						bestScoreTruthy: bestScore ? !!parseFloat(bestScore) : false,
						scores: scores ? JSON.parse(scores) : null
					}
				});
			}
		}
		
		diagnosticData = data;
		console.log('🔍 Storage Diagnostic Data:', data);
	}
	
	function downloadDiagnostic() {
		const blob = new Blob([JSON.stringify(diagnosticData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `storage-diagnostic-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
	
	function clearSpecificExam() {
		const examId = prompt('Enter exam ID to clear (e.g., practice-exam-1):');
		if (examId) {
			ExamLoader.clearExamStats(examId);
			collectDiagnosticData();
			alert(`Cleared stats for ${examId}`);
		}
	}
	
	// Add a test score
	function addTestScore() {
		const examId = prompt('Enter exam ID (e.g., practice-exam-1):');
		const score = prompt('Enter test score (e.g., 75):');
		
		if (examId && score) {
			const numScore = parseFloat(score);
			ExamLoader.updateExamStats(examId, numScore);
			collectDiagnosticData();
			alert(`Added score ${numScore}% for ${examId}`);
		}
	}
</script>

{#if showDiagnostic}
	<div class="fixed bottom-4 right-4 bg-surface-100-800-token border border-surface-300-600-token rounded-lg p-4 shadow-lg max-w-md z-50">
		<div class="flex justify-between items-center mb-3">
			<h3 class="font-semibold">Storage Diagnostic</h3>
			<button 
				class="btn btn-sm variant-ghost-surface" 
				on:click={() => showDiagnostic = false}
			>
				×
			</button>
		</div>
		
		<div class="space-y-2 text-xs">
			<div>
				<strong>Total localStorage keys:</strong> 
				{Object.keys(diagnosticData.localStorage || {}).length}
			</div>
			
			<div>
				<strong>Exams with data:</strong> 
				{diagnosticData.examMetadata?.length || 0}
			</div>
			
			<div>
				<strong>Quiz results:</strong> 
				{diagnosticData.quizResults?.length || 0}
			</div>
			
			{#if diagnosticData.examMetadata?.length > 0}
				<div class="mt-3">
					<strong>Score Analysis:</strong>
					{#each diagnosticData.examMetadata as exam}
						<div class="ml-2 mt-1">
							<div>{exam.examId}: {exam.parsedData.bestScore}%</div>
							<div class="text-gray-500">
								Raw: "{exam.rawData.bestScore}" | 
								Type: {exam.parsedData.bestScoreType} |
								Truthy: {exam.parsedData.bestScoreTruthy}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		
		<div class="flex gap-2 mt-4">
			<button class="btn btn-sm variant-filled-secondary" on:click={downloadDiagnostic}>
				Download
			</button>
			<button class="btn btn-sm variant-filled-primary" on:click={collectDiagnosticData}>
				Refresh
			</button>
			<button class="btn btn-sm variant-filled-warning" on:click={addTestScore}>
				Add Test
			</button>
			<button class="btn btn-sm variant-filled-error" on:click={clearSpecificExam}>
				Clear
			</button>
		</div>
	</div>
{/if}

<!-- Debug trigger button (only show in development) -->
{#if typeof window !== 'undefined'}
	<button 
		class="fixed bottom-4 left-4 btn btn-sm variant-ghost-surface opacity-50 hover:opacity-100 z-40"
		on:click={() => showDiagnostic = !showDiagnostic}
		title="Storage Diagnostic"
	>
		🔍
	</button>
{/if}

<style>
	/* Make sure the diagnostic doesn't interfere with the main UI */
	:global(.diagnostic-mode) {
		pointer-events: auto;
	}
</style>