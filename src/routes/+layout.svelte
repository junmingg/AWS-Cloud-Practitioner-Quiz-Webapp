<script lang="ts">
	import '../app.postcss';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { preferences } from '$lib/stores/preferences';
	import Settings from '$lib/components/Settings.svelte';
	import StorageDiagnostic from '$lib/components/StorageDiagnostic.svelte';
	import { fade, fly } from 'svelte/transition';
	
	let showAboutModal = false;
	
	onMount(() => {
		// Initialize theme and preferences
		theme.init();
		preferences.load();
	});
	
	function handleThemeToggle() {
		theme.toggle();
	}
	
	// Check if current path matches the nav item
	function isActive(path: string): boolean {
		if (path === '/' && $page.url.pathname === '/') return true;
		if (path !== '/' && $page.url.pathname.startsWith(path)) return true;
		return false;
	}
</script>

<div class="h-screen flex flex-col">
	<!-- Header -->
	<header class="bg-surface-100-800-token border-b border-surface-300-600-token">
		<div class="flex items-center justify-between px-6 py-4">
			<a 
				href="/" 
				class="flex items-center space-x-3 hover:opacity-80 transition-opacity quiz-transition"
			>
				<div class="w-8 h-8 flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="w-8 h-8 fill-gray-800 dark:fill-gray-200">
						<path d="M180.4 267C179.7 289.6 191 299.7 191.3 306C191.2 307.3 190.7 308.5 190 309.6C189.3 310.7 188.3 311.6 187.2 312.2L174.4 321.2C172.7 322.4 170.8 323 168.8 323.1C168.4 323.1 160.6 324.9 148.3 297.5C140.8 306.9 131.3 314.4 120.4 319.5C109.5 324.6 97.7 327.2 85.7 327C69.4 327.9 25.3 317.8 27.6 270.8C26 232.5 61.7 208.7 98.5 210.8C105.6 210.8 120.1 211.2 145.5 217.1L145.5 201.5C148.2 175 130.8 154.5 100.7 157.6C98.3 157.6 81.3 157.1 54.9 167.7C47.5 171.1 46.6 170.5 44.1 170.5C36.7 170.5 39.7 149 41.2 146.3C46.4 139.9 77.1 127.9 107.1 128.1C127.2 126.3 147.2 132.5 162.8 145.4C169.1 152.5 174 160.8 177 169.8C180 178.8 181.2 188.3 180.5 197.8L180.5 267.1zM94 299.4C126.4 298.9 140.2 279.4 143.3 268.9C145.8 258.8 145.4 252.5 145.4 241.5C135.7 239.2 121.8 236.6 105.8 236.6C90.6 235.5 63 242.2 64.1 268.9C62.9 285.7 75.2 300.3 94.1 299.4zM264.9 322.5C257 323.2 253.4 317.6 252.2 312.1L202.4 147.4C201.4 144.6 200.8 141.8 200.5 138.8C200.3 137.6 200.6 136.4 201.3 135.4C202 134.4 203.1 133.8 204.3 133.6C204.5 133.6 202.2 133.6 226.5 133.6C235.3 132.7 238.1 139.6 239.1 144L274.9 284.8L308.1 144C308.6 140.8 311 132.9 320.9 133.8L338.1 133.8C340.3 133.6 349.2 133.3 350.8 144.2L384.1 286.7L421 144.1C421.5 141.9 423.7 132.7 433.7 133.7L453.4 133.7C454.3 133.6 459.6 132.9 458.7 142.3C458.3 144.1 462.1 131.6 405.9 312.2C404.8 317.7 401.1 323.3 393.2 322.6L374.5 322.6C363.6 323.8 362 312.9 361.8 311.9L328.6 174.8L295.8 311.8C295.6 312.9 294.1 323.7 283.1 322.5L264.8 322.5L264.8 322.5zM538.4 328.1C532.5 328.1 504.5 327.8 481 315.8C478.7 314.8 476.7 313.2 475.3 311C473.9 308.8 473.2 306.4 473.2 303.9L473.2 293.2C473.2 284.7 479.4 286.3 482 287.3C492 291.4 498.5 294.4 510.8 296.9C547.5 304.4 563.6 294.6 567.5 292.4C580.7 284.6 581.7 266.7 572.8 257.5C562.3 248.7 557.3 248.4 519.7 236.5C515.1 235.2 476 222.9 475.9 184.1C475.3 155.9 500.9 127.9 545.4 128.1C558.1 128.1 591.8 132.2 601 143.7C602.4 145.8 603 148.3 602.9 150.7L602.9 160.8C602.9 165.2 601.3 167.5 598 167.5C590.3 166.6 576.6 156.3 548.8 156.7C541.9 156.3 508.9 157.6 510.4 181.7C510 200.7 537 207.8 540.1 208.6C576.6 219.6 588.7 221.4 603.2 238.2C620.3 260.4 611.1 286.5 607.5 293.6C588.4 331.1 539.1 328 538.2 328zM578.6 433C508.6 484.7 406.9 512.2 320.1 512.2C203 513 89.8 469.9 2.8 391.5C-3.7 385.6 2 377.5 10 382C106.5 437.2 215.7 466.2 326.9 466.1C409.9 465.7 492 448.8 568.5 416.6C580.3 411.6 590.3 424.4 578.6 433zM607.8 399.7C598.8 388.2 548.5 394.3 526 397C519.2 397.8 518.1 391.9 524.2 387.5C564.3 359.3 630.1 367.4 637.6 376.9C645.1 386.4 635.5 452.3 598 483.8C592.2 488.7 586.7 486.1 589.3 479.7C597.7 458.4 616.7 411.2 607.7 399.7z"/>
					</svg>
				</div>
				<div class="hidden sm:block">
					<h1 class="text-lg font-bold text-surface-900-50-token">
						Cloud Practitioner Quiz
					</h1>
					<p class="text-xs text-surface-600-300-token">Practice Exam Platform</p>
				</div>
			</a>
			
			<nav class="hidden sm:flex items-center space-x-2">
				<a 
					href="/" 
					class="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group {isActive('/') 
						? 'text-primary-600 dark:text-primary-400 bg-primary-500/10 border border-primary-500/20' 
						: 'text-surface-700-200-token hover:text-primary-600-400-token hover:bg-surface-200-700-token border border-transparent hover:border-surface-300-600-token'}"
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<span>Practice Exams</span>
					</div>
					{#if isActive('/')}
						<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
					{/if}
				</a>
				<a 
					href="/revision" 
					class="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group {isActive('/revision') 
						? 'text-primary-600 dark:text-primary-400 bg-primary-500/10 border border-primary-500/20' 
						: 'text-surface-700-200-token hover:text-primary-600-400-token hover:bg-surface-200-700-token border border-transparent hover:border-surface-300-600-token'}"
				>
					<div class="flex items-center space-x-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
						</svg>
						<span>Revision Notes</span>
					</div>
					{#if isActive('/revision')}
						<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
					{/if}
				</a>
			</nav>
			
			<div class="flex items-center space-x-2">
				<!-- About Button -->
				<button
					on:click={() => showAboutModal = true}
					class="btn btn-sm variant-soft-surface hover:variant-soft-primary transition-all duration-200 border border-surface-300-600-token"
					aria-label="About"
					title="About this app"
				>
					<svg class="w-5 h-5 text-gray-700 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</button>
				
				<!-- Theme Toggle -->
				<button
					on:click={handleThemeToggle}
					class="btn btn-sm variant-soft-surface hover:variant-soft-primary transition-all duration-200 border border-surface-300-600-token"
					aria-label="Toggle theme"
					title="Toggle light/dark theme"
				>
					{#if typeof window !== 'undefined' && (($theme === 'dark') || ($theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))}
						<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
					{:else}
						<svg class="w-5 h-5 text-gray-900 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
						</svg>
					{/if}
				</button>
				
				<!-- Settings -->
				<Settings />
				
				<!-- Navigation Menu (Mobile) -->
				<div class="flex items-center space-x-2 sm:hidden">
					<button 
						class="btn btn-sm variant-ghost-surface"
						aria-label="Menu"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Main content area -->
	<div class="flex-1 overflow-hidden bg-surface-50-900-token">
		<main class="h-full overflow-auto">
			<slot />
		</main>
	</div>
</div>

<!-- About Modal -->
{#if showAboutModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade on:click={() => showAboutModal = false}>
		<div 
			class="bg-surface-100-800-token rounded-xl max-w-md w-full p-6 space-y-4"
			transition:fly={{ y: 20, duration: 200 }}
			on:click|stopPropagation
		>
			<div class="flex items-center justify-between">
				<h3 class="text-xl font-bold text-surface-900-50-token">About</h3>
				<button
					on:click={() => showAboutModal = false}
					class="btn btn-sm variant-ghost-surface"
					aria-label="Close"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			
			<div class="space-y-3">
				<p class="text-surface-700-200-token">
					AWS Certified Cloud Practitioner Quiz Platform
				</p>
				
				<div class="bg-surface-200-700-token rounded-lg p-4">
					<h4 class="font-medium text-surface-900-50-token mb-2">Content Attribution</h4>
					<p class="text-sm text-surface-600-300-token mb-3">
						Practice exam contents were sourced from:
					</p>
					<a 
						href="https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline text-sm break-all"
					>
						https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes
					</a>
				</div>
				
				<div class="bg-surface-200-700-token rounded-lg p-4">
					<h4 class="font-medium text-surface-900-50-token mb-2">Source Code</h4>
					<p class="text-sm text-surface-600-300-token mb-3">
						Fork or contribute to this project:
					</p>
					<a 
						href="https://github.com/junmingg/AWS-Cloud-Practitioner-Quiz-Webapp"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline text-sm break-all"
					>
						https://github.com/junmingg/AWS-Cloud-Practitioner-Quiz-Webapp
					</a>
				</div>
				
				<p class="text-xs text-gray-600 dark:text-gray-300">
					Built with SvelteKit and SkeletonUI
				</p>
			</div>
		</div>
	</div>
{/if}

<!-- Debug Component - only in development -->
{#if import.meta.env.DEV}
	<StorageDiagnostic />
{/if}

<style>
	:global(html, body) {
		height: 100%;
		overflow: hidden;
	}
	
	:global(.app) {
		height: 100%;
	}
</style>