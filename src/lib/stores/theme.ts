import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';
import type { ThemeMode, StorageError } from '$lib/types';

const STORAGE_KEY = 'theme-preference';

// Theme store with enhanced error handling and system preference detection
function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeMode>('system');
	const errors = writable<StorageError[]>([]);
	
	// Detect system preference changes
	const systemPreference = writable<'light' | 'dark'>('light');
	
	if (browser) {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		systemPreference.set(mediaQuery.matches ? 'dark' : 'light');
		
		mediaQuery.addEventListener('change', (e) => {
			systemPreference.set(e.matches ? 'dark' : 'light');
		});
	}

	return {
		subscribe,
		errors: { subscribe: errors.subscribe },
		systemPreference: { subscribe: systemPreference.subscribe },
		
		set: (theme: ThemeMode) => {
			if (browser) {
				try {
					localStorage.setItem(STORAGE_KEY, theme);
					applyTheme(theme);
					// Clear any previous storage errors
					errors.update(errs => errs.filter(e => e.type !== 'quota_exceeded'));
				} catch (error) {
					handleStorageError(error as Error, errors);
				}
			}
			set(theme);
		},
		
		init: () => {
			if (browser) {
				try {
					const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode;
					const validThemes: ThemeMode[] = ['light', 'dark', 'system'];
					const theme = stored && validThemes.includes(stored) ? stored : 'system';
					
					applyTheme(theme);
					set(theme);
				} catch (error) {
					console.warn('Failed to load theme preference:', error);
					applyTheme('system');
					set('system');
				}
			}
		},
		
		toggle: () => {
			update(current => {
				// Smart toggle: if system, go to opposite of current system preference
				let newTheme: ThemeMode;
				if (current === 'system') {
					const currentSystem = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
					newTheme = currentSystem === 'light' ? 'dark' : 'light';
				} else {
					newTheme = current === 'light' ? 'dark' : 'light';
				}
				
				if (browser) {
					try {
						localStorage.setItem(STORAGE_KEY, newTheme);
						applyTheme(newTheme);
						errors.update(errs => errs.filter(e => e.type !== 'quota_exceeded'));
					} catch (error) {
						handleStorageError(error as Error, errors);
					}
				}
				return newTheme;
			});
		},
		
		resetToSystem: () => {
			if (browser) {
				try {
					localStorage.setItem(STORAGE_KEY, 'system');
					applyTheme('system');
				} catch (error) {
					handleStorageError(error as Error, errors);
				}
			}
			set('system');
		},
		
		clearErrors: () => {
			errors.set([]);
		}
	};
}

// Handle storage errors
function handleStorageError(error: Error, errors: any) {
	const storageError: StorageError = {
		type: error.name === 'QuotaExceededError' ? 'quota_exceeded' : 'permission_denied',
		message: error.message,
		timestamp: new Date(),
		recoverable: error.name === 'QuotaExceededError'
	};
	
	errors.update((errs: StorageError[]) => [...errs.slice(-4), storageError]);
	console.error('Theme storage error:', storageError);
}

// Apply theme to document with smooth transitions
function applyTheme(theme: ThemeMode) {
	if (!browser) return;

	const root = document.documentElement;
	
	// Add transition class for smooth theme changes
	root.classList.add('theme-transition');
	
	if (theme === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.classList.toggle('dark', prefersDark);
	} else {
		root.classList.toggle('dark', theme === 'dark');
	}

	// Update data-theme attribute for SkeletonUI with proper theme names
	const dataTheme = root.classList.contains('dark') ? 'hamlindigo' : 'skeleton';
	document.body.setAttribute('data-theme', dataTheme);
	
	// Remove transition class after animation completes
	setTimeout(() => {
		root.classList.remove('theme-transition');
	}, 200);
}

// Listen for system theme changes and update current theme if set to system
function initSystemThemeListener(themeStore: any) {
	if (!browser) return;

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		const currentTheme = localStorage.getItem(STORAGE_KEY) as ThemeMode;
		if (currentTheme === 'system') {
			applyTheme('system');
		}
	});
}

export const theme = createThemeStore();

// Derived store for computed theme values
export const computedTheme = derived(
	[theme, theme.systemPreference],
	([$theme, $systemPreference]) => {
		const effectiveTheme = $theme === 'system' ? $systemPreference : $theme;
		return {
			current: $theme,
			effective: effectiveTheme,
			isSystem: $theme === 'system',
			isDark: effectiveTheme === 'dark'
		};
	}
);

// Initialize theme system with error handling
if (browser) {
	try {
		theme.init();
		initSystemThemeListener(theme);
	} catch (error) {
		console.error('Failed to initialize theme system:', error);
	}
}