import { writable, derived, get } from 'svelte/store';
import type { UserPreferences, StorageError } from '$lib/types';
import { StorageManager } from '$lib/utils/storage';

// Enhanced user preferences store with validation and error handling
function createPreferencesStore() {
	const defaultPreferences: UserPreferences = {
		theme: 'system',
		showTimer: true,
		showQuestionNumbers: true,
		autoSave: true,
		reviewMode: false,
		sound: false,
		animationsEnabled: true
	};

	const { subscribe, set, update } = writable<UserPreferences>(defaultPreferences);
	const errors = writable<StorageError[]>([]);
	const isLoading = writable<boolean>(false);

	// Validation rules for preferences
	const validatePreference = (key: keyof UserPreferences, value: any): boolean => {
		switch (key) {
			case 'theme':
				return ['light', 'dark', 'system'].includes(value);
			case 'showTimer':
			case 'showQuestionNumbers':
			case 'autoSave':
			case 'reviewMode':
			case 'sound':
			case 'animationsEnabled':
				return typeof value === 'boolean';
			default:
				return false;
		}
	};

	// Register for storage error notifications
	let errorUnsubscribe: (() => void) | null = null;
	
	if (typeof window !== 'undefined') {
		errorUnsubscribe = StorageManager.onError((error: StorageError) => {
			if (error.message.includes('preferences')) {
				errors.update(errs => [...errs.slice(-4), error]);
			}
		});
	}

	return {
		subscribe,
		errors: { subscribe: errors.subscribe },
		isLoading: { subscribe: isLoading.subscribe },
		
		// Load preferences from storage with error handling
		load: async () => {
			isLoading.set(true);
			try {
				const preferences = StorageManager.getUserPreferences();
				
				// Validate loaded preferences
				const validatedPrefs = { ...defaultPreferences };
				Object.entries(preferences).forEach(([key, value]) => {
					if (validatePreference(key as keyof UserPreferences, value)) {
						(validatedPrefs as any)[key] = value;
					}
				});
				
				set(validatedPrefs);
				errors.update(errs => errs.filter(e => !e.message.includes('preferences')));
			} catch (error) {
				console.error('Failed to load preferences:', error);
				set(defaultPreferences);
				errors.update(errs => [...errs.slice(-4), {
					type: 'corrupted_data',
					message: `Failed to load preferences: ${(error as Error).message}`,
					timestamp: new Date(),
					recoverable: true
				}]);
			} finally {
				isLoading.set(false);
			}
		},

		// Update a specific preference with validation
		updatePreference: (key: keyof UserPreferences, value: any) => {
			if (!validatePreference(key, value)) {
				console.error(`Invalid value for preference ${key}:`, value);
				errors.update(errs => [...errs.slice(-4), {
					type: 'corrupted_data',
					message: `Invalid value for preference ${key}`,
					timestamp: new Date(),
					recoverable: true
				}]);
				return false;
			}

			update(prefs => {
				const newPrefs = { ...prefs, [key]: value };
				const saved = StorageManager.saveUserPreferences(newPrefs);
				
				if (!saved) {
					errors.update(errs => [...errs.slice(-4), {
						type: 'permission_denied',
						message: `Failed to save preference ${key}`,
						timestamp: new Date(),
						recoverable: true
					}]);
				}
				
				return newPrefs;
			});
			
			return true;
		},

		// Update multiple preferences at once with validation
		updateMultiple: (updates: Partial<UserPreferences>) => {
			const validUpdates: Partial<UserPreferences> = {};
			const invalidKeys: string[] = [];

			// Validate all updates first
			Object.entries(updates).forEach(([key, value]) => {
				if (validatePreference(key as keyof UserPreferences, value)) {
					(validUpdates as any)[key] = value;
				} else {
					invalidKeys.push(key);
				}
			});

			if (invalidKeys.length > 0) {
				console.error('Invalid preferences:', invalidKeys);
				errors.update(errs => [...errs.slice(-4), {
					type: 'corrupted_data',
					message: `Invalid preferences: ${invalidKeys.join(', ')}`,
					timestamp: new Date(),
					recoverable: true
				}]);
			}

			if (Object.keys(validUpdates).length > 0) {
				update(prefs => {
					const newPrefs = { ...prefs, ...validUpdates };
					StorageManager.saveUserPreferences(newPrefs);
					return newPrefs;
				});
			}

			return Object.keys(validUpdates).length;
		},

		// Reset to defaults with confirmation
		reset: (confirm = false) => {
			if (!confirm) {
				console.warn('Preferences reset requires confirmation');
				return false;
			}
			
			const saved = StorageManager.saveUserPreferences(defaultPreferences);
			if (saved) {
				set(defaultPreferences);
				errors.set([]);
				return true;
			}
			
			return false;
		},

		// Toggle boolean preference
		toggle: (key: keyof UserPreferences) => {
			const currentPrefs = get({ subscribe });
			const currentValue = currentPrefs[key];
			
			if (typeof currentValue !== 'boolean') {
				console.error(`Cannot toggle non-boolean preference: ${key}`);
				return false;
			}
			
			return this.updatePreference(key, !currentValue);
		},

		// Get current preference value
		get: (key: keyof UserPreferences) => {
			const currentPrefs = get({ subscribe });
			return currentPrefs[key];
		},

		// Export preferences
		export: () => {
			const currentPrefs = get({ subscribe });
			return {
				preferences: currentPrefs,
				exportedAt: new Date().toISOString(),
				version: 1
			};
		},

		// Import preferences with validation
		import: (importData: any) => {
			try {
				if (!importData.preferences || !importData.version) {
					throw new Error('Invalid import format');
				}

				const imported = importData.preferences;
				const validatedPrefs = { ...defaultPreferences };
				let importedCount = 0;

				Object.entries(imported).forEach(([key, value]) => {
					if (validatePreference(key as keyof UserPreferences, value)) {
						(validatedPrefs as any)[key] = value;
						importedCount++;
					}
				});

				if (importedCount > 0) {
					const saved = StorageManager.saveUserPreferences(validatedPrefs);
					if (saved) {
						set(validatedPrefs);
						return importedCount;
					}
				}

				return 0;
			} catch (error) {
				console.error('Failed to import preferences:', error);
				errors.update(errs => [...errs.slice(-4), {
					type: 'corrupted_data',
					message: `Import failed: ${(error as Error).message}`,
					timestamp: new Date(),
					recoverable: false
				}]);
				return 0;
			}
		},

		// Clear errors
		clearErrors: () => {
			errors.set([]);
		},

		// Cleanup function
		destroy: () => {
			if (errorUnsubscribe) {
				errorUnsubscribe();
				errorUnsubscribe = null;
			}
		}
	};
}

export const preferences = createPreferencesStore();

// Load preferences when store is initialized
if (typeof window !== 'undefined') {
	preferences.load();
}