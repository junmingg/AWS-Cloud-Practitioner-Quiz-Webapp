import { writable, derived, get } from 'svelte/store';
import type { QuizResult, QuizAnalytics, NavigationPattern, StorageError } from '$lib/types';
import { StorageManager } from '$lib/utils/storage';

// Enhanced results store with advanced analytics and history tracking
function createResultsStore() {
	const { subscribe, set, update } = writable<QuizResult[]>([]);
	const errors = writable<StorageError[]>([]);
	const isLoading = writable<boolean>(false);

	return {
		subscribe,
		errors: { subscribe: errors.subscribe },
		isLoading: { subscribe: isLoading.subscribe },
		
		// Load all results from storage with error handling
		load: async () => {
			isLoading.set(true);
			try {
				const results = StorageManager.getQuizResults();
				set(results);
				errors.update(errs => errs.filter(e => e.type !== 'corrupted_data'));
			} catch (error) {
				const storageError: StorageError = {
					type: 'corrupted_data',
					message: `Failed to load results: ${(error as Error).message}`,
					timestamp: new Date(),
					recoverable: false
				};
				errors.update(errs => [...errs.slice(-4), storageError]);
				set([]);
			} finally {
				isLoading.set(false);
			}
		},

		// Add new result with validation and deduplication
		add: (result: QuizResult) => {
			try {
				// Validate result data
				if (!result.examId || !result.examTitle || result.percentage < 0 || result.percentage > 100) {
					throw new Error('Invalid result data');
				}

				StorageManager.saveQuizResult(result);
				
				update(results => {
					// Check for duplicate results (same exam, same timestamp within 1 second)
					const isDuplicate = results.some(existing => 
						existing.examId === result.examId &&
						Math.abs(existing.endTime.getTime() - result.endTime.getTime()) < 1000
					);
					
					if (isDuplicate) {
						console.warn('Duplicate result detected, skipping');
						return results;
					}

					const newResults = [result, ...results];
					return newResults
						.sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
						.slice(0, 500); // Keep only latest 500 results
				});
				
				errors.update(errs => errs.filter(e => e.type !== 'quota_exceeded'));
			} catch (error) {
				const storageError: StorageError = {
					type: error instanceof Error && error.name === 'QuotaExceededError' ? 'quota_exceeded' : 'corrupted_data',
					message: (error as Error).message,
					timestamp: new Date(),
					recoverable: true
				};
				errors.update(errs => [...errs.slice(-4), storageError]);
			}
		},

		// Update existing result (for corrections or additional data)
		update: (examId: string, resultId: string, updatedData: Partial<QuizResult>) => {
			update(results => {
				return results.map(result => {
					if (result.examId === examId && result.startTime.getTime().toString() === resultId) {
						const updated = { ...result, ...updatedData };
						StorageManager.saveQuizResult(updated);
						return updated;
					}
					return result;
				});
			});
		},

		// Delete specific result
		delete: (examId: string, resultId: string) => {
			update(results => {
				const filtered = results.filter(result => 
					!(result.examId === examId && result.startTime.getTime().toString() === resultId)
				);
				
				// Re-save all results to storage
				StorageManager.clearAllData();
				filtered.forEach(result => StorageManager.saveQuizResult(result));
				
				return filtered;
			});
		},

		// Clear all results with confirmation
		clear: () => {
			try {
				StorageManager.clearAllData();
				set([]);
				errors.set([]);
			} catch (error) {
				const storageError: StorageError = {
					type: 'permission_denied',
					message: `Failed to clear data: ${(error as Error).message}`,
					timestamp: new Date(),
					recoverable: false
				};
				errors.update(errs => [...errs.slice(-4), storageError]);
			}
		},

		// Get results for specific exam with sorting options
		getExamResults: (examId: string, sortBy: 'date' | 'score' = 'date') => {
			const examResults = StorageManager.getExamResults(examId);
			
			return examResults.sort((a, b) => {
				if (sortBy === 'score') {
					return b.percentage - a.percentage;
				}
				return b.endTime.getTime() - a.endTime.getTime();
			});
		},

		// Search results by exam title or date range
		search: (query: string, dateFrom?: Date, dateTo?: Date) => {
			const allResults = get({ subscribe });
			
			return allResults.filter(result => {
				const matchesQuery = !query || 
					result.examTitle.toLowerCase().includes(query.toLowerCase()) ||
					result.examId.toLowerCase().includes(query.toLowerCase());
					
				const matchesDateRange = (!dateFrom || result.endTime >= dateFrom) &&
					(!dateTo || result.endTime <= dateTo);
					
				return matchesQuery && matchesDateRange;
			});
		},

		// Export results as CSV or JSON
		export: (format: 'csv' | 'json' = 'json') => {
			const results = get({ subscribe });
			
			if (format === 'csv') {
				const headers = ['Exam ID', 'Exam Title', 'Score (%)', 'Correct Answers', 'Total Questions', 'Time Elapsed (ms)', 'Start Time', 'End Time'];
				const csvData = results.map(result => [
					result.examId,
					result.examTitle,
					result.percentage.toString(),
					result.correctAnswers.toString(),
					result.totalQuestions.toString(),
					result.timeElapsed.toString(),
					result.startTime.toISOString(),
					result.endTime.toISOString()
				]);
				
				return [headers, ...csvData].map(row => row.join(',')).join('\n');
			}
			
			return JSON.stringify(results, null, 2);
		},

		// Get trending performance data
		getTrends: (examId?: string, days = 30) => {
			const results = get({ subscribe });
			const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
			
			const recentResults = results.filter(result => {
				const matchesExam = !examId || result.examId === examId;
				const isRecent = result.endTime >= cutoffDate;
				return matchesExam && isRecent;
			});
			
			return recentResults
				.sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
				.map(result => ({
					date: result.endTime,
					score: result.percentage,
					examId: result.examId,
					examTitle: result.examTitle
				}));
		},

		// Clear errors
		clearErrors: () => {
			errors.set([]);
		}
	};
}

// Current quiz result (for displaying after submission)
export const currentResult = writable<QuizResult | null>(null);

// All quiz results
export const results = createResultsStore();

// Derived stores for analytics
export const resultStats = derived(
	results,
	($results) => {
		if ($results.length === 0) {
			return {
				totalAttempts: 0,
				averageScore: 0,
				bestScore: 0,
				worstScore: 0,
				totalTimeSpent: 0,
				examsCovered: 0,
				passRate: 0
			};
		}

		const totalAttempts = $results.length;
		const scores = $results.map(r => r.percentage);
		const averageScore = scores.reduce((a, b) => a + b, 0) / totalAttempts;
		const bestScore = Math.max(...scores);
		const worstScore = Math.min(...scores);
		const totalTimeSpent = $results.reduce((total, result) => total + result.timeElapsed, 0);
		const examsCovered = new Set($results.map(r => r.examId)).size;
		const passedAttempts = $results.filter(r => r.percentage >= 70).length;
		const passRate = (passedAttempts / totalAttempts) * 100;

		return {
			totalAttempts,
			averageScore: Math.round(averageScore * 10) / 10,
			bestScore: Math.round(bestScore * 10) / 10,
			worstScore: Math.round(worstScore * 10) / 10,
			totalTimeSpent,
			examsCovered,
			passRate: Math.round(passRate * 10) / 10
		};
	}
);

export const recentResults = derived(
	results,
	($results) => $results.slice(0, 5)
);

export const examPerformance = derived(
	results,
	($results) => {
		const performanceMap = new Map<string, {
			examId: string;
			examTitle: string;
			attempts: number;
			bestScore: number;
			averageScore: number;
			lastAttempt: Date;
		}>();

		$results.forEach(result => {
			const existing = performanceMap.get(result.examId);
			
			if (existing) {
				existing.attempts++;
				existing.bestScore = Math.max(existing.bestScore, result.percentage);
				existing.averageScore = (existing.averageScore + result.percentage) / 2;
				if (result.endTime > existing.lastAttempt) {
					existing.lastAttempt = result.endTime;
				}
			} else {
				performanceMap.set(result.examId, {
					examId: result.examId,
					examTitle: result.examTitle,
					attempts: 1,
					bestScore: result.percentage,
					averageScore: result.percentage,
					lastAttempt: result.endTime
				});
			}
		});

		return Array.from(performanceMap.values())
			.sort((a, b) => b.lastAttempt.getTime() - a.lastAttempt.getTime());
	}
);

// Load results when store is initialized
if (typeof window !== 'undefined') {
	results.load();
}