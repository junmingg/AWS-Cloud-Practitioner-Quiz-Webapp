<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Error {$page.status} - Cloud Practitioner Quiz</title>
</svelte:head>

<div class="min-h-screen bg-surface-50-900-token flex items-center justify-center px-6">
	<div class="max-w-md w-full text-center">
		<!-- Error Icon -->
		<div class="mb-8">
			<div class="w-20 h-20 mx-auto bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center">
				<svg class="w-10 h-10 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
				</svg>
			</div>
		</div>
		
		<!-- Error Content -->
		<div class="mb-8">
			<h1 class="text-6xl font-bold text-error-600 dark:text-error-400 mb-4">
				{$page.status}
			</h1>
			
			<h2 class="text-2xl font-semibold text-surface-900-50-token mb-4">
				{#if $page.status === 404}
					Page Not Found
				{:else if $page.status === 500}
					Server Error
				{:else if $page.status === 400}
					Bad Request
				{:else}
					Something went wrong
				{/if}
			</h2>
			
			<p class="text-surface-600-300-token leading-relaxed mb-8">
				{#if $page.error?.message}
					<span class="text-surface-700-200-token">{$page.error.message}</span>
				{:else if $page.status === 404}
					The page you're looking for doesn't exist or has been moved.
				{:else if $page.status === 500}
					We're experiencing technical difficulties. Please try again later.
				{:else if $page.status === 400}
					The request could not be processed due to invalid parameters.
				{:else}
					An unexpected error occurred. Please try again.
				{/if}
			</p>
		</div>
		
		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<button 
				class="btn variant-filled-primary"
				on:click={() => goto('/')}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
				</svg>
				Go Home
			</button>
			
			<button 
				class="btn variant-ghost-surface"
				on:click={() => history.back()}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
				</svg>
				Go Back
			</button>
		</div>
		
		<!-- Help Text -->
		<div class="mt-8 pt-6 border-t border-surface-300-600-token">
			<p class="text-sm text-surface-600-300-token">
				If this problem persists, please try refreshing the page or clearing your browser cache.
			</p>
		</div>
	</div>
</div>