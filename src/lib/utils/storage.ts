import { browser } from '$app/environment';
import type { QuizState, QuizResult, UserPreferences, StorageError } from '$lib/types';

export class StorageManager {
	private static readonly QUIZ_STATE_PREFIX = 'quiz_state_';
	private static readonly QUIZ_RESULTS_KEY = 'quiz_results';
	private static readonly USER_PREFERENCES_KEY = 'user_preferences';
	private static readonly BACKUP_SUFFIX = '_backup';
	private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
	private static readonly WARNING_THRESHOLD = 0.8; // 80% of max storage

	private static errorCallbacks: ((error: StorageError) => void)[] = [];

	/**
	 * Register error callback
	 */
	static onError(callback: (error: StorageError) => void): () => void {
		this.errorCallbacks.push(callback);
		return () => {
			const index = this.errorCallbacks.indexOf(callback);
			if (index > -1) this.errorCallbacks.splice(index, 1);
		};
	}

	/**
	 * Emit storage error to callbacks
	 */
	private static emitError(error: StorageError): void {
		this.errorCallbacks.forEach(callback => {
			try {
				callback(error);
			} catch (e) {
				console.error('Error in storage error callback:', e);
			}
		});
	}

	/**
	 * Create backup of data before risky operations
	 */
	private static createBackup(key: string): boolean {
		if (!browser) return false;
		
		try {
			const data = localStorage.getItem(key);
			if (data) {
				localStorage.setItem(key + this.BACKUP_SUFFIX, data);
				return true;
			}
		} catch (error) {
			console.warn('Failed to create backup for:', key, error);
		}
		return false;
	}

	/**
	 * Restore from backup
	 */
	private static restoreFromBackup(key: string): boolean {
		if (!browser) return false;
		
		try {
			const backup = localStorage.getItem(key + this.BACKUP_SUFFIX);
			if (backup) {
				localStorage.setItem(key, backup);
				localStorage.removeItem(key + this.BACKUP_SUFFIX);
				return true;
			}
		} catch (error) {
			console.warn('Failed to restore from backup:', key, error);
		}
		return false;
	}

	/**
	 * Check storage quota and clean up if needed
	 */
	private static checkAndCleanupStorage(): boolean {
		if (!browser) return true;

		const usage = this.getStorageInfo();
		if (usage.percentage >= this.WARNING_THRESHOLD * 100) {
			// Emit warning
			this.emitError({
				type: 'quota_exceeded',
				message: `Storage usage is at ${Math.round(usage.percentage)}%. Some old data will be cleaned up.`,
				timestamp: new Date(),
				recoverable: true
			});

			// Clean up old quiz states (keep only last 10)
			try {
				const keys = Object.keys(localStorage);
				const quizStateKeys = keys
					.filter(key => key.startsWith(this.QUIZ_STATE_PREFIX))
					.sort((a, b) => {
						const timestampA = localStorage.getItem(a);
						const timestampB = localStorage.getItem(b);
						if (!timestampA || !timestampB) return 0;
						
						try {
							const stateA = JSON.parse(timestampA);
							const stateB = JSON.parse(timestampB);
							return new Date(stateB.startTime).getTime() - new Date(stateA.startTime).getTime();
						} catch {
							return 0;
						}
					});

				// Remove old quiz states beyond the limit
				quizStateKeys.slice(10).forEach(key => {
					try {
						localStorage.removeItem(key);
					} catch (e) {
						console.warn('Failed to remove old quiz state:', key);
					}
				});

				// Clean up old results (keep only last 100)
				const results = this.getQuizResults();
				if (results.length > 100) {
					const recentResults = results
						.sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
						.slice(0, 100);
					
					localStorage.setItem(this.QUIZ_RESULTS_KEY, JSON.stringify(
						recentResults.map(result => ({
							...result,
							startTime: result.startTime.toISOString(),
							endTime: result.endTime.toISOString()
						}))
					));
				}

				return true;
			} catch (error) {
				console.error('Failed to cleanup storage:', error);
				return false;
			}
		}
		return true;
	}

	/**
	 * Safe localStorage setItem with error handling and recovery
	 */
	private static safeSetItem(key: string, value: string): boolean {
		if (!browser) return false;

		// Check storage before write
		if (!this.checkAndCleanupStorage()) {
			this.emitError({
				type: 'quota_exceeded',
				message: 'Storage cleanup failed, cannot save data',
				timestamp: new Date(),
				recoverable: false
			});
			return false;
		}

		// Create backup of existing data
		this.createBackup(key);

		try {
			localStorage.setItem(key, value);
			return true;
		} catch (error) {
			console.error('Failed to save to localStorage:', key, error);

			let errorType: StorageError['type'] = 'permission_denied';
			if (error instanceof Error) {
				if (error.name === 'QuotaExceededError') {
					errorType = 'quota_exceeded';
				} else if (error.message.includes('Private')) {
					errorType = 'permission_denied';
				}
			}

			this.emitError({
				type: errorType,
				message: `Failed to save ${key}: ${(error as Error).message}`,
				timestamp: new Date(),
				recoverable: errorType === 'quota_exceeded'
			});

			// Try to restore backup if available
			this.restoreFromBackup(key);
			return false;
		}
	}

	/**
	 * Safe localStorage getItem with error handling
	 */
	private static safeGetItem(key: string): string | null {
		if (!browser) return null;

		try {
			return localStorage.getItem(key);
		} catch (error) {
			console.error('Failed to read from localStorage:', key, error);
			
			this.emitError({
				type: 'corrupted_data',
				message: `Failed to read ${key}: ${(error as Error).message}`,
				timestamp: new Date(),
				recoverable: false
			});

			// Try backup
			try {
				const backup = localStorage.getItem(key + this.BACKUP_SUFFIX);
				if (backup) {
					console.log('Using backup data for:', key);
					return backup;
				}
			} catch (backupError) {
				console.error('Backup also failed:', backupError);
			}

			return null;
		}
	}

	/**
	 * Saves quiz state to localStorage with enhanced error handling
	 */
	static saveQuizState(examId: string, state: QuizState): boolean {
		if (!browser) return false;
		
		try {
			const serializedState = {
				...state,
				answers: Array.from(state.answers.entries()),
				flaggedQuestions: Array.from(state.flaggedQuestions),
				startTime: state.startTime.toISOString(),
				endTime: state.endTime?.toISOString(),
				savedAt: new Date().toISOString(),
				version: 1
			};
			
			const key = `${this.QUIZ_STATE_PREFIX}${examId}`;
			const value = JSON.stringify(serializedState);
			
			return this.safeSetItem(key, value);
		} catch (error) {
			console.error('Error serializing quiz state:', error);
			this.emitError({
				type: 'corrupted_data',
				message: `Failed to serialize quiz state: ${(error as Error).message}`,
				timestamp: new Date(),
				recoverable: false
			});
			return false;
		}
	}
	
	/**
	 * Loads quiz state from localStorage with validation and error recovery
	 */
	static loadQuizState(examId: string): QuizState | null {
		if (!browser) return null;
		
		const key = `${this.QUIZ_STATE_PREFIX}${examId}`;
		const stored = this.safeGetItem(key);
		
		if (!stored) return null;
		
		try {
			const parsed = JSON.parse(stored);
			
			// Validate the parsed data structure
			if (!parsed.examId || !parsed.startTime) {
				throw new Error('Invalid quiz state structure');
			}
			
			// Ensure version compatibility
			const version = parsed.version || 0;
			if (version > 1) {
				console.warn('Quiz state version is newer than supported, attempting to load anyway');
			}
			
			return {
				...parsed,
				answers: new Map(parsed.answers || []),
				flaggedQuestions: new Set(parsed.flaggedQuestions || []),
				startTime: new Date(parsed.startTime),
				endTime: parsed.endTime ? new Date(parsed.endTime) : undefined
			};
		} catch (error) {
			console.error('Error parsing quiz state:', error);
			
			this.emitError({
				type: 'corrupted_data',
				message: `Corrupted quiz state for exam ${examId}: ${(error as Error).message}`,
				timestamp: new Date(),
				recoverable: true
			});

			// Try to recover from backup
			try {
				const backup = localStorage.getItem(key + this.BACKUP_SUFFIX);
				if (backup) {
					console.log('Attempting recovery from backup for:', examId);
					const parsed = JSON.parse(backup);
					
					return {
						...parsed,
						answers: new Map(parsed.answers || []),
						flaggedQuestions: new Set(parsed.flaggedQuestions || []),
						startTime: new Date(parsed.startTime),
						endTime: parsed.endTime ? new Date(parsed.endTime) : undefined
					};
				}
			} catch (backupError) {
				console.error('Backup recovery also failed:', backupError);
			}
			
			return null;
		}
	}
	
	/**
	 * Removes quiz state from localStorage
	 */
	static clearQuizState(examId: string): void {
		if (!browser) return;
		localStorage.removeItem(`${this.QUIZ_STATE_PREFIX}${examId}`);
	}
	
	/**
	 * Saves quiz result
	 */
	static saveQuizResult(result: QuizResult): void {
		if (!browser) return;
		
		try {
			const results = this.getQuizResults();
			results.push({
				...result,
				startTime: result.startTime.toISOString(),
				endTime: result.endTime.toISOString()
			} as any);
			
			// Keep only the last 50 results to prevent storage bloat
			const recentResults = results.slice(-50);
			
			localStorage.setItem(this.QUIZ_RESULTS_KEY, JSON.stringify(recentResults));
		} catch (error) {
			console.error('Error saving quiz result:', error);
		}
	}
	
	/**
	 * Gets all quiz results
	 */
	static getQuizResults(): QuizResult[] {
		if (!browser) return [];
		
		try {
			const stored = localStorage.getItem(this.QUIZ_RESULTS_KEY);
			if (!stored) return [];
			
			const results = JSON.parse(stored);
			return results.map((result: any) => ({
				...result,
				startTime: new Date(result.startTime),
				endTime: new Date(result.endTime)
			}));
		} catch (error) {
			console.error('Error loading quiz results:', error);
			return [];
		}
	}
	
	/**
	 * Gets quiz results for a specific exam
	 */
	static getExamResults(examId: string): QuizResult[] {
		return this.getQuizResults().filter(result => result.examId === examId);
	}
	
	/**
	 * Saves user preferences
	 */
	static saveUserPreferences(preferences: UserPreferences): void {
		if (!browser) return;
		
		try {
			localStorage.setItem(this.USER_PREFERENCES_KEY, JSON.stringify(preferences));
		} catch (error) {
			console.error('Error saving user preferences:', error);
		}
	}
	
	/**
	 * Loads user preferences with defaults
	 */
	static getUserPreferences(): UserPreferences {
		if (!browser) {
			return this.getDefaultPreferences();
		}
		
		try {
			const stored = localStorage.getItem(this.USER_PREFERENCES_KEY);
			if (!stored) {
				return this.getDefaultPreferences();
			}
			
			const preferences = JSON.parse(stored);
			// Merge with defaults to handle new preference keys
			return {
				...this.getDefaultPreferences(),
				...preferences
			};
		} catch (error) {
			console.error('Error loading user preferences:', error);
			return this.getDefaultPreferences();
		}
	}
	
	/**
	 * Gets default user preferences
	 */
	private static getDefaultPreferences(): UserPreferences {
		return {
			theme: 'system',
			showTimer: true,
			showQuestionNumbers: true,
			autoSave: true,
			reviewMode: false,
			sound: false,
			animationsEnabled: true
		};
	}
	
	/**
	 * Exports all data as JSON
	 */
	static exportData(): string {
		const data = {
			quizResults: this.getQuizResults(),
			userPreferences: this.getUserPreferences(),
			timestamp: new Date().toISOString()
		};
		
		return JSON.stringify(data, null, 2);
	}
	
	/**
	 * Imports data from JSON
	 */
	static importData(jsonData: string): boolean {
		if (!browser) return false;
		
		try {
			const data = JSON.parse(jsonData);
			
			if (data.quizResults) {
				localStorage.setItem(this.QUIZ_RESULTS_KEY, JSON.stringify(data.quizResults));
			}
			
			if (data.userPreferences) {
				this.saveUserPreferences(data.userPreferences);
			}
			
			return true;
		} catch (error) {
			console.error('Error importing data:', error);
			return false;
		}
	}
	
	/**
	 * Clears all stored data
	 */
	static clearAllData(): void {
		if (!browser) return;
		
		// Clear quiz states
		const keys = Object.keys(localStorage);
		keys.forEach(key => {
			if (key.startsWith(this.QUIZ_STATE_PREFIX)) {
				localStorage.removeItem(key);
			}
		});
		
		// Clear results and preferences
		localStorage.removeItem(this.QUIZ_RESULTS_KEY);
		localStorage.removeItem(this.USER_PREFERENCES_KEY);
	}
	
	/**
	 * Gets storage usage information with detailed breakdown
	 */
	static getStorageInfo(): { 
		used: number; 
		available: number; 
		percentage: number;
		breakdown: { [category: string]: number };
		warnings: string[];
	} {
		if (!browser) return { 
			used: 0, 
			available: 0, 
			percentage: 0,
			breakdown: {},
			warnings: []
		};
		
		try {
			let used = 0;
			const breakdown: { [category: string]: number } = {
				quizStates: 0,
				results: 0,
				preferences: 0,
				backups: 0,
				other: 0
			};
			const warnings: string[] = [];
			
			for (const key in localStorage) {
				if (localStorage.hasOwnProperty(key)) {
					const size = (localStorage[key]?.length || 0) + key.length;
					used += size;
					
					if (key.startsWith(this.QUIZ_STATE_PREFIX)) {
						breakdown.quizStates += size;
					} else if (key === this.QUIZ_RESULTS_KEY) {
						breakdown.results += size;
					} else if (key === this.USER_PREFERENCES_KEY) {
						breakdown.preferences += size;
					} else if (key.endsWith(this.BACKUP_SUFFIX)) {
						breakdown.backups += size;
					} else {
						breakdown.other += size;
					}
				}
			}
			
			const available = this.MAX_STORAGE_SIZE;
			const percentage = (used / available) * 100;
			
			// Generate warnings
			if (percentage > 90) {
				warnings.push('Storage is critically low (>90%). Consider clearing old data.');
			} else if (percentage > this.WARNING_THRESHOLD * 100) {
				warnings.push('Storage is running low. Some cleanup may be needed.');
			}
			
			if (breakdown.backups > available * 0.1) {
				warnings.push('Backup files are taking up significant space.');
			}
			
			return { used, available, percentage, breakdown, warnings };
		} catch (error) {
			console.error('Error calculating storage info:', error);
			return { 
				used: 0, 
				available: this.MAX_STORAGE_SIZE, 
				percentage: 0,
				breakdown: {},
				warnings: ['Unable to calculate storage usage']
			};
		}
	}

	/**
	 * Validate storage health and attempt repairs
	 */
	static validateAndRepair(): { isHealthy: boolean; repairsAttempted: string[]; errors: string[] } {
		if (!browser) return { isHealthy: true, repairsAttempted: [], errors: [] };

		const repairsAttempted: string[] = [];
		const errors: string[] = [];
		let isHealthy = true;

		try {
			// Check for orphaned backups
			const keys = Object.keys(localStorage);
			const backupKeys = keys.filter(key => key.endsWith(this.BACKUP_SUFFIX));
			const mainKeys = new Set(keys.filter(key => !key.endsWith(this.BACKUP_SUFFIX)));

			backupKeys.forEach(backupKey => {
				const mainKey = backupKey.replace(this.BACKUP_SUFFIX, '');
				if (!mainKeys.has(mainKey)) {
					// Orphaned backup - try to restore or remove
					try {
						const backupData = localStorage.getItem(backupKey);
						if (backupData) {
							// Validate backup data
							JSON.parse(backupData);
							localStorage.setItem(mainKey, backupData);
							repairsAttempted.push(`Restored ${mainKey} from backup`);
						}
						localStorage.removeItem(backupKey);
						repairsAttempted.push(`Removed orphaned backup: ${backupKey}`);
					} catch (error) {
						errors.push(`Failed to restore backup ${backupKey}: ${(error as Error).message}`);
						isHealthy = false;
					}
				}
			});

			// Validate quiz states
			const quizStateKeys = keys.filter(key => key.startsWith(this.QUIZ_STATE_PREFIX));
			quizStateKeys.forEach(key => {
				try {
					const data = localStorage.getItem(key);
					if (data) {
						const parsed = JSON.parse(data);
						if (!parsed.examId || !parsed.startTime) {
							localStorage.removeItem(key);
							repairsAttempted.push(`Removed corrupted quiz state: ${key}`);
						}
					}
				} catch (error) {
					localStorage.removeItem(key);
					repairsAttempted.push(`Removed corrupted quiz state: ${key}`);
				}
			});

			// Validate results
			try {
				const results = this.getQuizResults();
				const validResults = results.filter(result => {
					return result.examId && result.examTitle && 
						   typeof result.percentage === 'number' &&
						   result.percentage >= 0 && result.percentage <= 100;
				});

				if (validResults.length !== results.length) {
					// Re-save only valid results
					localStorage.setItem(this.QUIZ_RESULTS_KEY, JSON.stringify(
						validResults.map(result => ({
							...result,
							startTime: result.startTime.toISOString(),
							endTime: result.endTime.toISOString()
						}))
					));
					repairsAttempted.push(`Cleaned up ${results.length - validResults.length} corrupted results`);
				}
			} catch (error) {
				errors.push(`Failed to validate results: ${(error as Error).message}`);
				isHealthy = false;
			}

		} catch (error) {
			errors.push(`Storage validation failed: ${(error as Error).message}`);
			isHealthy = false;
		}

		return { isHealthy, repairsAttempted, errors };
	}

	/**
	 * Create a complete backup of all data
	 */
	static createFullBackup(): string | null {
		if (!browser) return null;

		try {
			const backup = {
				version: 1,
				timestamp: new Date().toISOString(),
				data: {} as { [key: string]: any }
			};

			// Backup all localStorage data
			for (const key in localStorage) {
				if (localStorage.hasOwnProperty(key)) {
					backup.data[key] = localStorage[key];
				}
			}

			return JSON.stringify(backup, null, 2);
		} catch (error) {
			console.error('Failed to create full backup:', error);
			this.emitError({
				type: 'corrupted_data',
				message: `Backup creation failed: ${(error as Error).message}`,
				timestamp: new Date(),
				recoverable: false
			});
			return null;
		}
	}

	/**
	 * Restore from a complete backup
	 */
	static restoreFullBackup(backupData: string): boolean {
		if (!browser) return false;

		try {
			const backup = JSON.parse(backupData);
			
			if (!backup.version || !backup.data) {
				throw new Error('Invalid backup format');
			}

			// Clear existing data
			localStorage.clear();

			// Restore data
			for (const [key, value] of Object.entries(backup.data)) {
				localStorage.setItem(key, value as string);
			}

			console.log('Full backup restored successfully');
			return true;
		} catch (error) {
			console.error('Failed to restore backup:', error);
			this.emitError({
				type: 'corrupted_data',
				message: `Backup restoration failed: ${(error as Error).message}`,
				timestamp: new Date(),
				recoverable: false
			});
			return false;
		}
	}
}