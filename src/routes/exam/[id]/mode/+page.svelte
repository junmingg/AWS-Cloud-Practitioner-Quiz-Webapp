<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { StorageManager } from '$lib/utils/storage';
	import type { PageData } from './$types';
	import type { QuizMode } from '$lib/types';
	
	export let data: PageData;
	
	let selectedMode: QuizMode | null = null;
	let rememberChoice = false;
	let isStarting = false;
	
	// Load saved preference
	onMount(() => {
		const preferences = StorageManager.getUserPreferences();
		if (preferences.defaultQuizMode) {
			selectedMode = preferences.defaultQuizMode;
			rememberChoice = true;
		}
	});
	
	function selectMode(mode: QuizMode) {
		selectedMode = mode;
	}
	
	function startQuiz() {
		if (!selectedMode || isStarting) return;
		
		isStarting = true;
		
		// Save preference if remember choice is checked
		if (rememberChoice) {
			const preferences = StorageManager.getUserPreferences();
			StorageManager.saveUserPreferences({
				...preferences,
				defaultQuizMode: selectedMode
			});
		}
		
		// Navigate to quiz with mode parameter
		goto(`/exam/${data.examId}?mode=${selectedMode}`);
	}
	
	function goBack() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Select Mode - {data.exam.title}</title>
</svelte:head>

<div class="min-h-screen bg-surface-50-900-token">
	<!-- Header -->
	<header class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-8">
		<div class="container mx-auto max-w-4xl px-6">
			<div class="text-center" in:fly={{ y: 30, duration: 600, easing: quintOut }}>
				<h1 class="text-3xl font-bold mb-2">Choose Your Study Mode</h1>
				<p class="text-xl opacity-90 mb-1">
					{data.exam.title}
				</p>
				<p class="text-sm opacity-75">
					{data.exam.questionCount} questions
					{#if data.exam.timeLimit}
						• {Math.round(data.exam.timeLimit / 60)} minutes
					{/if}
				</p>
			</div>
		</div>
	</header>
	
	<!-- Content -->
	<div class="container mx-auto max-w-4xl px-6 py-12">
		<!-- Mode Selection Cards -->
		<div class="grid md:grid-cols-2 gap-8 mb-8" in:fly={{ y: 30, duration: 600, delay: 200 }}>
			<!-- Practice Mode -->
			<div 
				class="relative bg-surface-100-800-token rounded-2xl p-8 border-2 cursor-pointer transition-all duration-300 hover:scale-105"
				class:border-success-500={selectedMode === 'practice'}
				class:bg-success-50={selectedMode === 'practice'}
				class:dark:bg-success-900={selectedMode === 'practice'}
				class:border-surface-300-600-token={selectedMode !== 'practice'}
				on:click={() => selectMode('practice')}
				on:keydown={(e) => e.key === 'Enter' && selectMode('practice')}
				tabindex="0"
				role="button"
			>
				{#if selectedMode === 'practice'}
					<div class="absolute top-4 right-4 w-8 h-8 bg-success-500 rounded-full flex items-center justify-center" transition:scale={{ duration: 200 }}>
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
				{/if}
				
				<div class="flex items-center mb-6">
					<div class="w-16 h-16 bg-success-100 dark:bg-success-800 rounded-2xl flex items-center justify-center mr-4">
						<svg class="w-8 h-8 text-success-600 dark:text-success-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
						</svg>
					</div>
					<div>
						<h3 class="text-2xl font-bold text-surface-900-50-token mb-2">Practice Mode</h3>
						<p class="text-sm text-success-600 dark:text-success-400 font-medium">Learn as you go</p>
					</div>
				</div>
				
				<div class="space-y-3 mb-6">
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Immediate feedback after each answer
					</div>
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						See correct answers and explanations
					</div>
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						No time pressure - learn at your pace
					</div>
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Perfect for studying and understanding concepts
					</div>
				</div>
				
				<p class="text-sm text-surface-600-300-token">
					Great for first-time study sessions and understanding weak areas.
				</p>
			</div>
			
			<!-- Exam Mode -->
			<div 
				class="relative bg-surface-100-800-token rounded-2xl p-8 border-2 cursor-pointer transition-all duration-300 hover:scale-105"
				class:border-primary-500={selectedMode === 'exam'}
				class:bg-primary-50={selectedMode === 'exam'}
				class:dark:bg-primary-900={selectedMode === 'exam'}
				class:border-surface-300-600-token={selectedMode !== 'exam'}
				on:click={() => selectMode('exam')}
				on:keydown={(e) => e.key === 'Enter' && selectMode('exam')}
				tabindex="0"
				role="button"
			>
				{#if selectedMode === 'exam'}
					<div class="absolute top-4 right-4 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center" transition:scale={{ duration: 200 }}>
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
				{/if}
				
				<div class="flex items-center mb-6">
					<div class="w-16 h-16 bg-primary-100 dark:bg-primary-800 rounded-2xl flex items-center justify-center mr-4">
						<svg class="w-8 h-8 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.805-6.207-2.157-.97-.82-1.793-1.829-2.402-2.959C2.391 8.896 2.391 7.104 3.081 6.076 4.714 3.518 7.964 2 12 2c4.036 0 7.286 1.518 8.919 4.076.69 1.028.69 2.82-.999 3.808A7.985 7.985 0 0118 12v.5a2.5 2.5 0 11-5 0V12a3 3 0 106 0v.5z"></path>
						</svg>
					</div>
					<div>
						<h3 class="text-2xl font-bold text-surface-900-50-token mb-2">Exam Mode</h3>
						<p class="text-sm text-primary-600 dark:text-primary-400 font-medium">Test your knowledge</p>
					</div>
				</div>
				
				<div class="space-y-3 mb-6">
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Realistic exam simulation
					</div>
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Results shown only at the end
					</div>
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						{#if data.exam.timeLimit}
							Timed exam ({Math.round(data.exam.timeLimit / 60)} minutes)
						{:else}
							Track your completion time
						{/if}
					</div>
					<div class="flex items-center text-surface-700-200-token">
						<svg class="w-5 h-5 mr-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Detailed review after completion
					</div>
				</div>
				
				<p class="text-sm text-surface-600-300-token">
					Perfect for assessing your readiness and exam practice.
				</p>
			</div>
		</div>
		
		<!-- Remember Choice -->
		<div class="flex justify-center mb-8" in:fly={{ y: 20, duration: 500, delay: 400 }}>
			<label class="flex items-center cursor-pointer">
				<input 
					type="checkbox" 
					class="checkbox checkbox-sm mr-3"
					bind:checked={rememberChoice}
				/>
				<span class="text-surface-700-200-token">Remember my choice for future exams</span>
			</label>
		</div>
		
		<!-- Action Buttons -->
		<div class="flex justify-center space-x-4" in:fly={{ y: 20, duration: 500, delay: 500 }}>
			<button 
				class="btn variant-ghost-surface"
				on:click={goBack}
				disabled={isStarting}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
				</svg>
				Back to Exams
			</button>
			
			<button 
				class="btn variant-filled-primary min-w-[150px]"
				class:variant-filled-success={selectedMode === 'practice'}
				disabled={!selectedMode || isStarting}
				on:click={startQuiz}
			>
				{#if isStarting}
					<svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Starting...
				{:else}
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M6 6l12 12M6 18L18 6"></path>
					</svg>
					Start {selectedMode === 'practice' ? 'Practice' : 'Exam'}
				{/if}
			</button>
		</div>
		
		<!-- Help Text -->
		<div class="text-center mt-8" in:fly={{ y: 20, duration: 500, delay: 600 }}>
			<p class="text-sm text-surface-600-300-token">
				Not sure which mode to choose? Start with <strong>Practice Mode</strong> to learn, then use <strong>Exam Mode</strong> to test yourself.
			</p>
		</div>
	</div>
</div>