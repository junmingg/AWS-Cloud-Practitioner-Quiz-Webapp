<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quadOut } from 'svelte/easing';
	import { page } from '$app/stores';
	import type { Section } from '$lib/types/index.js';
	import RevisionCard from '$lib/components/RevisionCard.svelte';
	import { loadSections } from '$lib/utils/section-loader.js';

	let sections: Section[] = [];
	let loading = true;
	let error: string | null = null;
	let searchTerm = '';
	let selectedSection: Section | null = null;
	let sortBy: 'title' | 'wordCount' | 'filename' = 'title';

	$: filteredSections = sections
		.filter(section =>
			section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			section.content.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) => {
			switch (sortBy) {
				case 'title':
					return a.title.localeCompare(b.title);
				case 'wordCount':
					return b.wordCount - a.wordCount;
				case 'filename':
					return a.filename.localeCompare(b.filename);
				default:
					return 0;
			}
		});

	$: totalWords = sections.reduce((sum, section) => sum + section.wordCount, 0);
	$: averageWords = sections.length > 0 ? Math.round(totalWords / sections.length) : 0;

	onMount(async () => {
		try {
			sections = await loadSections();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load sections';
		} finally {
			loading = false;
		}
	});

	function selectSection(section: Section) {
		selectedSection = section;
	}

	function clearSelection() {
		selectedSection = null;
	}
</script>

<svelte:head>
	<title>AWS Cloud Practitioner - Revision Notes</title>
	<meta name="description" content="Study AWS Cloud Practitioner concepts with comprehensive revision notes" />
</svelte:head>

<div class="h-full overflow-auto">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-secondary-50 via-secondary-100 to-tertiary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
		<div class="container mx-auto max-w-6xl">
			<div class="text-center mb-8" in:fly={{ y: 30, duration: 600, easing: quadOut }}>
				<h1 class="text-4xl md:text-5xl font-bold text-surface-900-50-token mb-4">
					AWS Cloud Practitioner
					<span class="text-primary-600 dark:text-primary-400">Revision Notes</span>
				</h1>
				<p class="text-xl text-surface-700-200-token max-w-3xl mx-auto">
					Comprehensive study notes covering all AWS Cloud Practitioner domains. 
					Master key concepts, services, and best practices with our detailed revision materials.
				</p>
			</div>
			
			<!-- Stats Overview -->
			{#if !loading && sections.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" in:fade={{ delay: 300, duration: 600 }}>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{sections.length}</div>
						<div class="text-sm text-surface-600-300-token">Study Sections</div>
					</div>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-tertiary-600 dark:text-tertiary-400">{Math.round(totalWords / 1000)}k</div>
						<div class="text-sm text-surface-600-300-token">Total Words</div>
					</div>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-primary-600 dark:text-primary-400">{averageWords}</div>
						<div class="text-sm text-surface-600-300-token">Avg per Section</div>
					</div>
					<div class="bg-surface-100-800-token rounded-xl p-6 text-center">
						<div class="text-2xl font-bold text-success-600 dark:text-success-400">{Math.round(totalWords / 200)}</div>
						<div class="text-sm text-surface-600-300-token">Est. Read Time (min)</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Content Section -->
	<section class="py-8 px-6">
		<div class="container mx-auto max-w-6xl">
			{#if loading}
				<div class="flex items-center justify-center py-12" in:fade>
					<div class="text-center">
						<div class="w-8 h-8 border-4 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mx-auto"></div>
						<p class="text-surface-600-300-token mt-4">Loading revision notes...</p>
					</div>
				</div>
			{:else if error}
				<div class="bg-error-500/10 border border-error-500/20 rounded-xl p-6 text-center">
					<svg class="w-12 h-12 text-error-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<h3 class="text-xl font-semibold text-error-700 dark:text-error-300 mb-2">Error Loading Sections</h3>
					<p class="text-error-600 dark:text-error-400">{error}</p>
				</div>
			{:else if selectedSection}
				<div class="bg-surface-100-800-token rounded-xl border border-surface-300-600-token p-6 mb-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-3xl font-bold text-surface-900-50-token">{selectedSection.title}</h2>
						<button
							class="btn variant-soft-secondary"
							on:click={clearSelection}
						>
							← Back to All Sections
						</button>
					</div>
					<div class="prose prose-lg max-w-none">
						{@html selectedSection.content}
					</div>
				</div>
			{:else}
				<!-- Controls -->
				<div class="bg-surface-100-800-token rounded-xl p-6 mb-8">
					<div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
						<!-- Search -->
						<div class="flex-1 max-w-md">
							<label class="label mb-2">
								<span class="text-sm font-medium text-surface-700-200-token">Search Sections</span>
							</label>
							<input
								type="text"
								class="input"
								placeholder="Search by title or content..."
								bind:value={searchTerm}
							/>
						</div>
						
						<!-- Sort -->
						<div>
							<label class="label mb-2">
								<span class="text-sm font-medium text-surface-700-200-token">Sort By</span>
							</label>
							<select class="select" bind:value={sortBy}>
								<option value="title">Title</option>
								<option value="wordCount">Word Count</option>
								<option value="filename">Filename</option>
							</select>
						</div>
					</div>
					
					<!-- Results Summary -->
					<div class="mt-4 pt-4 border-t border-surface-300-600-token">
						<p class="text-sm text-surface-600-300-token">
							Showing {filteredSections.length} of {sections.length} sections
						</p>
					</div>
				</div>

				{#if filteredSections.length === 0}
					<div class="text-center py-12" in:fade>
						<svg class="w-16 h-16 mx-auto text-surface-400-600-token mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
						<h3 class="text-xl font-semibold text-surface-700-200-token mb-2">No sections found</h3>
						<p class="text-surface-600-300-token">
							Try adjusting your search criteria.
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each filteredSections as section, index (section.id)}
							<div 
								in:fly={{ 
									y: 30, 
									duration: 400, 
									delay: Math.min(index * 50, 1000),
									easing: quadOut 
								}}
							>
								<RevisionCard
									{section}
									on:select={() => selectSection(section)}
								/>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</section>
</div>

<style>
	/* Header Styles */
	:global(.section-h1) {
		font-size: 2.5rem;
		font-weight: 800;
		color: #1f2937;
		margin: 2rem 0 1.5rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 3px solid #3b82f6;
		line-height: 1.2;
	}
	
	:global(.dark .section-h1) {
		color: #f9fafb;
		border-bottom-color: #60a5fa;
	}
	
	:global(.section-h2) {
		font-size: 2rem;
		font-weight: 700;
		color: #374151;
		margin: 2rem 0 1rem 0;
		padding: 0.5rem 0;
		border-left: 4px solid #10b981;
		padding-left: 1rem;
		background: linear-gradient(90deg, #ecfdf5 0%, transparent 100%);
		line-height: 1.3;
	}
	
	:global(.dark .section-h2) {
		color: #e5e7eb;
		background: linear-gradient(90deg, #064e3b 0%, transparent 100%);
		border-left-color: #34d399;
	}
	
	:global(.section-h3) {
		font-size: 1.5rem;
		font-weight: 600;
		color: #4b5563;
		margin: 1.5rem 0 1rem 0;
		padding-left: 1rem;
		border-left: 3px solid #f59e0b;
		line-height: 1.4;
	}
	
	:global(.dark .section-h3) {
		color: #d1d5db;
		border-left-color: #fbbf24;
	}
	
	:global(.section-h4) {
		font-size: 1.25rem;
		font-weight: 600;
		color: #6b7280;
		margin: 1.25rem 0 0.75rem 0;
		line-height: 1.4;
	}
	
	:global(.dark .section-h4) {
		color: #9ca3af;
	}
	
	/* Paragraph Styles */
	:global(.content-paragraph) {
		margin-bottom: 1.5rem;
		line-height: 1.8;
		color: #374151;
		font-size: 1rem;
	}
	
	:global(.dark .content-paragraph) {
		color: #d1d5db;
	}
	
	/* List Styles */
	:global(.content-list) {
		margin: 1.5rem 0;
		padding-left: 2rem;
		color: #374151;
	}
	
	:global(.dark .content-list) {
		color: #d1d5db;
	}
	
	:global(.content-list li) {
		margin-bottom: 0.75rem;
		line-height: 1.7;
		position: relative;
	}
	
	:global(.content-list ul li::before) {
		content: "•";
		color: #3b82f6;
		font-size: 1.25rem;
		position: absolute;
		left: -1.5rem;
	}
	
	:global(.content-list ol) {
		counter-reset: list-counter;
	}
	
	:global(.content-list ol li) {
		counter-increment: list-counter;
	}
	
	:global(.content-list ol li::before) {
		content: counter(list-counter) ".";
		color: #3b82f6;
		font-weight: 600;
		position: absolute;
		left: -2rem;
	}
	
	/* Table Styles */
	:global(.table-container) {
		margin: 2rem 0;
		overflow-x: auto;
		border-radius: 0.75rem;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}
	
	:global(.dark .table-container) {
		border-color: #4b5563;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
	}
	
	:global(.content-table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95rem;
	}
	
	:global(.content-table th) {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		color: #1e293b;
		font-weight: 600;
		padding: 1rem;
		text-align: left;
		border-bottom: 2px solid #cbd5e1;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	:global(.dark .content-table th) {
		background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
		color: #f1f5f9;
		border-bottom-color: #64748b;
	}
	
	:global(.content-table td) {
		padding: 1rem;
		border-bottom: 1px solid #f1f5f9;
		color: #374151;
		line-height: 1.6;
		vertical-align: top;
	}
	
	:global(.dark .content-table td) {
		border-bottom-color: #374151;
		color: #d1d5db;
	}
	
	:global(.content-table tr:nth-child(even) td) {
		background-color: #f9fafb;
	}
	
	:global(.dark .content-table tr:nth-child(even) td) {
		background-color: #1f2937;
	}
	
	/* Code Styles */
	:global(.code-block) {
		margin: 2rem 0;
		border-radius: 0.75rem;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}
	
	:global(.dark .code-block) {
		border-color: #4b5563;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
	}
	
	:global(.code-block pre) {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		color: #e2e8f0;
		padding: 1.5rem;
		margin: 0;
		overflow-x: auto;
		font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
	}
	
	:global(.inline-code) {
		background-color: #f1f5f9;
		color: #e11d48;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.85rem;
		font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
		border: 1px solid #e2e8f0;
		font-weight: 500;
	}
	
	:global(.dark .inline-code) {
		background-color: #1e293b;
		color: #fbbf24;
		border-color: #475569;
	}
	
	/* Blockquote Styles */
	:global(.content-blockquote) {
		border-left: 4px solid #3b82f6;
		background: linear-gradient(90deg, #dbeafe 0%, transparent 100%);
		padding: 1.5rem;
		margin: 2rem 0;
		border-radius: 0 0.5rem 0.5rem 0;
		font-style: italic;
		color: #1e40af;
		position: relative;
		box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
	}
	
	:global(.dark .content-blockquote) {
		background: linear-gradient(90deg, #1e3a8a 0%, transparent 100%);
		color: #93c5fd;
		box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
	}
	
	:global(.content-blockquote::before) {
		content: '"';
		font-size: 4rem;
		color: #3b82f6;
		position: absolute;
		left: 1rem;
		top: -0.5rem;
		line-height: 1;
		opacity: 0.3;
	}
	
	/* Link Styles */
	:global(.content-link) {
		color: #2563eb;
		text-decoration: underline;
		text-decoration-color: #93c5fd;
		text-underline-offset: 3px;
		transition: all 0.2s ease;
		font-weight: 500;
	}
	
	:global(.content-link:hover) {
		color: #1d4ed8;
		text-decoration-color: #2563eb;
	}
	
	:global(.dark .content-link) {
		color: #60a5fa;
		text-decoration-color: #3b82f6;
	}
	
	:global(.dark .content-link:hover) {
		color: #93c5fd;
		text-decoration-color: #60a5fa;
	}
	
	/* General spacing improvements */
	:global(.prose) {
		max-width: none;
		line-height: 1.7;
	}
	
	:global(.prose > *:first-child) {
		margin-top: 0;
	}
	
	:global(.prose > *:last-child) {
		margin-bottom: 0;
	}
</style>