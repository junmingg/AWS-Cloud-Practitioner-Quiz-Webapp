<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quadOut } from 'svelte/easing';
	import { ExamLoader } from '$lib/utils/exam-loader';
	import { results, resultStats } from '$lib/stores/results';
	import ExamCard from '$lib/components/ExamCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import type { ExamMetadata } from '$lib/types';
	// Removed SkeletonLabs imports - using custom components
	
	let examMetadata: ExamMetadata[] = [];
	let filteredExams: ExamMetadata[] = [];
	let loading = true;
	let searchTerm = '';
	let viewMode: 'grid' | 'list' = 'grid';
	let sortBy: 'title' | 'bestScore' | 'attempts' | 'lastAttempted' = 'title';
	let filterByCompletion: 'all' | 'completed' | 'incomplete' = 'all';
	
	// Search and filter functionality
	$: {
		filteredExams = examMetadata
			.filter(exam => {
				// Text search
				const matchesSearch = searchTerm === '' || 
					exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					exam.id.toLowerCase().includes(searchTerm.toLowerCase());
				
				// Completion filter
				const matchesCompletion = filterByCompletion === 'all' ||
					(filterByCompletion === 'completed' && exam.bestScore && exam.bestScore >= 70) ||
					(filterByCompletion === 'incomplete' && (!exam.bestScore || exam.bestScore < 70));
				
				return matchesSearch && matchesCompletion;
			})
			.sort((a, b) => {
				switch (sortBy) {
					case 'title':
						// Extract exam numbers for numerical sorting
						const extractNumber = (title: string) => {
							const match = title.match(/practice-exam-(\d+)/i) || title.match(/exam\s+(\d+)/i) || title.match(/(\d+)/);
							return match ? parseInt(match[1]) : 0;
						};
						const numA = extractNumber(a.id || a.title);
						const numB = extractNumber(b.id || b.title);
						return numA - numB;
					case 'bestScore':
						return (b.bestScore || 0) - (a.bestScore || 0);
					case 'attempts':
						return b.attempts - a.attempts;
					case 'lastAttempted':
						if (!a.lastAttempted && !b.lastAttempted) return 0;
						if (!a.lastAttempted) return 1;
						if (!b.lastAttempted) return -1;
						return b.lastAttempted.getTime() - a.lastAttempted.getTime();
					default:
						return 0;
				}
			});
	}
	
	onMount(async () => {
		try {
			examMetadata = await ExamLoader.loadExamMetadata();
			loading = false;
		} catch (error) {
			console.error('Error loading exam metadata:', error);
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>AWS Cloud Practitioner Quiz - Practice Exams</title>
	<meta name="description" content="Practice AWS Cloud Practitioner certification with 23 comprehensive exam simulations. Track your progress and improve your knowledge." />
</svelte:head>

<div class="h-full overflow-auto">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
		<div class="container mx-auto max-w-6xl">
			<div class="text-center mb-8" in:fly={{ y: 30, duration: 600, easing: quadOut }}>
				<h1 class="text-4xl md:text-5xl font-bold text-surface-900-50-token mb-4">
					AWS Cloud Practitioner
					<span class="text-primary-600 dark:text-primary-400">Quiz Platform</span>
				</h1>
				<p class="text-xl text-surface-700-200-token max-w-3xl mx-auto">
					Master the AWS Cloud Practitioner certification with 23 comprehensive practice exams. 
					Track your progress, identify weak areas, and build confidence for the real exam.
				</p>
			</div>
			
			<!-- Stats Overview -->
			{#if $resultStats.totalAttempts > 0}
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" in:fade={{ delay: 300, duration: 600 }}>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-primary-600 dark:text-primary-400">{$resultStats.totalAttempts}</div>
						<div class="text-sm text-surface-600-300-token">Total Attempts</div>
					</div>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{$resultStats.averageScore}%</div>
						<div class="text-sm text-surface-600-300-token">Average Score</div>
					</div>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-warning-600 dark:text-warning-300">{$resultStats.examsCovered}</div>
						<div class="text-sm text-surface-600-300-token">Exams Covered</div>
					</div>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-success-600 dark:text-success-400">{$resultStats.passRate}%</div>
						<div class="text-sm text-surface-600-300-token">Pass Rate</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Exam Browser -->
	<section class="py-8 px-6">
		<div class="container mx-auto max-w-6xl">
			<!-- Controls -->
			<div class="bg-surface-100-800-token rounded-xl p-6 mb-8 slide-up">
				<div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
					<!-- Search -->
					<div class="flex-1 max-w-md">
						<label class="label mb-2">
							<span class="text-sm font-medium text-surface-700-200-token">Search Exams</span>
						</label>
						<input
							type="text"
							class="input"
							placeholder="Search by name or number..."
							bind:value={searchTerm}
						/>
					</div>
					
					<!-- Filters and Controls -->
					<div class="flex flex-wrap gap-4 items-end">
						<!-- Completion Filter -->
						<div>
							<label class="label mb-2">
								<span class="text-sm font-medium text-surface-700-200-token">Status</span>
							</label>
							<select class="select" bind:value={filterByCompletion}>
								<option value="all">All Exams</option>
								<option value="completed">Completed</option>
								<option value="incomplete">Incomplete</option>
							</select>
						</div>
						
						<!-- Sort By -->
						<div>
							<label class="label mb-2">
								<span class="text-sm font-medium text-surface-700-200-token">Sort By</span>
							</label>
							<select class="select" bind:value={sortBy}>
								<option value="title">Title</option>
								<option value="bestScore">Best Score</option>
								<option value="attempts">Attempts</option>
								<option value="lastAttempted">Last Attempted</option>
							</select>
						</div>
						
						<!-- View Mode -->
						<div>
							<label class="label mb-2">
								<span class="text-sm font-medium text-surface-700-200-token">View</span>
							</label>
							<div class="btn-group variant-filled-surface">
								<button 
									class="btn btn-sm"
									class:variant-filled-primary={viewMode === 'grid'}
									class:variant-ghost-surface={viewMode !== 'grid'}
									on:click={() => viewMode = 'grid'}
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
									</svg>
								</button>
								<button 
									class="btn btn-sm"
									class:variant-filled-primary={viewMode === 'list'}
									class:variant-ghost-surface={viewMode !== 'list'}
									on:click={() => viewMode = 'list'}
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Results Summary -->
				<div class="mt-4 pt-4 border-t border-surface-300-600-token">
					<p class="text-sm text-surface-600-300-token">
						Showing {filteredExams.length} of {examMetadata.length} exams
					</p>
				</div>
			</div>

			<!-- Loading State -->
			{#if loading}
				<div class="flex items-center justify-center py-12" in:fade>
					<div class="text-center">
						<div class="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
						<p class="text-surface-600-300-token mt-4">Loading practice exams...</p>
					</div>
				</div>
			{:else}
				<!-- Exam Grid/List -->
				<div 
					class="grid gap-6 fade-in"
					class:grid-cols-1={viewMode === 'list'}
					class:md:grid-cols-2={viewMode === 'grid'}
					class:lg:grid-cols-3={viewMode === 'grid'}
					class:xl:grid-cols-4={viewMode === 'grid'}
				>
					{#each filteredExams as exam, index (exam.id)}
						<div 
							in:fly={{ 
								y: 30, 
								duration: 400, 
								delay: Math.min(index * 50, 1000),
								easing: quadOut 
							}}
						>
							<ExamCard 
								{exam} 
								{viewMode}
							/>
						</div>
					{/each}
				</div>
				
				<!-- Empty State -->
				{#if filteredExams.length === 0}
					<div class="text-center py-12" in:fade>
						<svg class="w-16 h-16 mx-auto text-surface-400-600-token mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.805-6.207-2.157-.97-.82-1.793-1.829-2.402-2.959C2.7 8.896 2.7 7.104 3.39 6.076 5.023 3.518 8.273 2 12 2c3.726 0 6.977 1.518 8.609 4.076.69 1.028.69 2.82-.999 3.808A7.985 7.985 0 0118 12v.5a2.5 2.5 0 11-5 0V12a3 3 0 106 0v.5z" />
						</svg>
						<h3 class="text-xl font-semibold text-surface-700-200-token mb-2">No exams found</h3>
						<p class="text-surface-600-300-token">
							Try adjusting your search criteria or filters.
						</p>
					</div>
				{/if}
			{/if}
		</div>
	</section>
</div>