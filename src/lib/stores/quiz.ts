import { writable, derived, get } from 'svelte/store';
import type { 
	QuizState, 
	Question, 
	Exam, 
	NavigationItem, 
	AnswerHistoryEntry, 
	QuizStateSnapshot, 
	QuizAnalytics, 
	NavigationPattern, 
	StateManagerConfig 
} from '$lib/types';
import { StorageManager } from '$lib/utils/storage';

const DEFAULT_CONFIG: StateManagerConfig = {
	autoSaveInterval: 5000,
	maxHistorySize: 50,
	offlineRetryAttempts: 3,
	storageQuotaWarningThreshold: 80,
	enableAnalytics: true
};

// Quiz state store with enhanced functionality
function createQuizStore(config: StateManagerConfig = DEFAULT_CONFIG) {
	const defaultState: QuizState = {
		examId: '',
		mode: 'exam',
		currentQuestionIndex: 0,
		answers: new Map(),
		flaggedQuestions: new Set(),
		startTime: new Date(),
		submitted: false
	};

	const { subscribe, set, update } = writable<QuizState>(defaultState);
	
	// History management for undo/redo
	const answerHistory = writable<AnswerHistoryEntry[]>([]);
	const stateSnapshots = writable<QuizStateSnapshot[]>([]);
	const currentSnapshotIndex = writable<number>(-1);
	
	// Analytics tracking
	const analytics = writable<QuizAnalytics>({
		totalTimeSpent: 0,
		averageQuestionTime: 0,
		questionsRevisited: 0,
		flagsUsed: 0,
		navigationPatterns: []
	});
	
	let autoSaveTimer: NodeJS.Timeout | null = null;

	// Helper functions
	const createSnapshot = (state: QuizState): QuizStateSnapshot => ({
		state: JSON.parse(JSON.stringify({
			...state,
			answers: Array.from(state.answers.entries()),
			flaggedQuestions: Array.from(state.flaggedQuestions)
		})),
		timestamp: new Date(),
		version: 1
	});
	
	const restoreFromSnapshot = (snapshot: QuizStateSnapshot): QuizState => ({
		...snapshot.state,
		answers: new Map(snapshot.state.answers),
		flaggedQuestions: new Set(snapshot.state.flaggedQuestions),
		startTime: new Date(snapshot.state.startTime),
		endTime: snapshot.state.endTime ? new Date(snapshot.state.endTime) : undefined
	});
	
	const trackNavigation = (from: number, to: number, reason?: NavigationPattern['reason']) => {
		if (!config.enableAnalytics) return;
		
		analytics.update(current => ({
			...current,
			navigationPatterns: [
				...current.navigationPatterns.slice(-49), // Keep last 50
				{ fromQuestion: from, toQuestion: to, timestamp: new Date(), reason }
			]
		}));
	};
	
	const startAutoSave = (examId: string) => {
		if (autoSaveTimer) clearInterval(autoSaveTimer);
		
		autoSaveTimer = setInterval(() => {
			const currentState = get({ subscribe });
			if (!currentState.submitted) {
				StorageManager.saveQuizState(examId, currentState);
			}
		}, config.autoSaveInterval);
	};

	return {
		subscribe,
		answerHistory: { subscribe: answerHistory.subscribe },
		analytics: { subscribe: analytics.subscribe },
		
		// Initialize quiz with exam and analytics
		init: (exam: Exam, mode: 'practice' | 'exam' = 'exam') => {
			const savedState = StorageManager.loadQuizState(exam.id);
			
			if (savedState && !savedState.submitted) {
				set(savedState);
				// Initialize analytics from saved data
				analytics.set({
					totalTimeSpent: savedState.timeElapsed || 0,
					averageQuestionTime: 0,
					questionsRevisited: 0,
					flagsUsed: savedState.flaggedQuestions.size,
					navigationPatterns: []
				});
			} else {
				const newState: QuizState = {
					examId: exam.id,
					mode,
					currentQuestionIndex: 0,
					answers: new Map(),
					flaggedQuestions: new Set(),
					startTime: new Date(),
					submitted: false
				};
				set(newState);
				StorageManager.saveQuizState(exam.id, newState);
				
				// Reset analytics
				analytics.set({
					totalTimeSpent: 0,
					averageQuestionTime: 0,
					questionsRevisited: 0,
					flagsUsed: 0,
					navigationPatterns: []
				});
			}
			
			// Create initial snapshot and start auto-save
			const currentState = get({ subscribe });
			stateSnapshots.set([createSnapshot(currentState)]);
			currentSnapshotIndex.set(0);
			answerHistory.set([]);
			startAutoSave(exam.id);
		},

		// Navigate to question with analytics
		goToQuestion: (index: number) => {
			update(state => {
				trackNavigation(state.currentQuestionIndex, index, 'jump');
				
				// Track revisits
				if (config.enableAnalytics && index < state.currentQuestionIndex) {
					analytics.update(current => ({
						...current,
						questionsRevisited: current.questionsRevisited + 1
					}));
				}
				
				const newState = { ...state, currentQuestionIndex: index };
				StorageManager.saveQuizState(state.examId, newState);
				return newState;
			});
		},

		// Go to next question with tracking
		nextQuestion: () => {
			update(state => {
				const newIndex = Math.min(state.currentQuestionIndex + 1, 999);
				trackNavigation(state.currentQuestionIndex, newIndex, 'next');
				
				const newState = { 
					...state, 
					currentQuestionIndex: newIndex
				};
				StorageManager.saveQuizState(state.examId, newState);
				return newState;
			});
		},

		// Go to previous question with tracking
		previousQuestion: () => {
			update(state => {
				const newIndex = Math.max(state.currentQuestionIndex - 1, 0);
				trackNavigation(state.currentQuestionIndex, newIndex, 'previous');
				
				if (config.enableAnalytics) {
					analytics.update(current => ({
						...current,
						questionsRevisited: current.questionsRevisited + 1
					}));
				}
				
				const newState = { 
					...state, 
					currentQuestionIndex: newIndex
				};
				StorageManager.saveQuizState(state.examId, newState);
				return newState;
			});
		},

		// Answer question with undo/redo support
		answerQuestion: (questionId: string, selectedAnswers: string[]) => {
			update(state => {
				const previousAnswers = state.answers.get(questionId) || [];
				
				// Add to answer history for undo functionality
				answerHistory.update(history => [
					...history.slice(-config.maxHistorySize + 1),
					{
						questionId,
						previousAnswers,
						newAnswers: selectedAnswers,
						timestamp: new Date()
					}
				]);
				
				// Create new state
				const newAnswers = new Map(state.answers);
				if (selectedAnswers.length > 0) {
					newAnswers.set(questionId, selectedAnswers);
				} else {
					newAnswers.delete(questionId);
				}
				
				const newState = { ...state, answers: newAnswers };
				
				// Create snapshot for undo/redo
				stateSnapshots.update(snapshots => [
					...snapshots.slice(-config.maxHistorySize + 1),
					createSnapshot(newState)
				]);
				currentSnapshotIndex.update(index => index + 1);
				
				StorageManager.saveQuizState(state.examId, newState);
				return newState;
			});
		},

		// Toggle question flag with tracking
		toggleFlag: (questionId: string) => {
			update(state => {
				const newFlagged = new Set(state.flaggedQuestions);
				const wasRemoved = newFlagged.has(questionId);
				
				if (wasRemoved) {
					newFlagged.delete(questionId);
				} else {
					newFlagged.add(questionId);
				}
				
				// Update flag usage analytics
				if (config.enableAnalytics) {
					analytics.update(current => ({
						...current,
						flagsUsed: wasRemoved ? current.flagsUsed - 1 : current.flagsUsed + 1
					}));
				}
				
				const newState = { ...state, flaggedQuestions: newFlagged };
				StorageManager.saveQuizState(state.examId, newState);
				return newState;
			});
		},

		// Undo last answer change
		undoAnswer: () => {
			const history = get(answerHistory);
			const snapshots = get(stateSnapshots);
			const currentIndex = get(currentSnapshotIndex);
			
			if (history.length === 0 || currentIndex <= 0) return false;
			
			const lastEntry = history[history.length - 1];
			
			update(state => {
				const newAnswers = new Map(state.answers);
				if (lastEntry.previousAnswers.length > 0) {
					newAnswers.set(lastEntry.questionId, lastEntry.previousAnswers);
				} else {
					newAnswers.delete(lastEntry.questionId);
				}
				
				const newState = { ...state, answers: newAnswers };
				StorageManager.saveQuizState(state.examId, newState);
				return newState;
			});
			
			// Update history and snapshot index
			answerHistory.update(history => history.slice(0, -1));
			currentSnapshotIndex.update(index => Math.max(0, index - 1));
			
			return true;
		},

		// Redo last undone answer
		redoAnswer: () => {
			const snapshots = get(stateSnapshots);
			const currentIndex = get(currentSnapshotIndex);
			
			if (currentIndex >= snapshots.length - 1) return false;
			
			const nextSnapshot = snapshots[currentIndex + 1];
			const restoredState = restoreFromSnapshot(nextSnapshot);
			
			set(restoredState);
			currentSnapshotIndex.update(index => index + 1);
			StorageManager.saveQuizState(restoredState.examId, restoredState);
			
			return true;
		},

		// Submit quiz with final analytics
		submit: () => {
			update(state => {
				const endTime = new Date();
				const totalTime = endTime.getTime() - state.startTime.getTime();
				
				// Update final analytics
				analytics.update(current => ({
					...current,
					totalTimeSpent: totalTime,
					averageQuestionTime: state.answers.size > 0 ? totalTime / state.answers.size : 0
				}));
				
				const newState = { 
					...state, 
					submitted: true, 
					endTime,
					timeElapsed: totalTime
				};
				
				// Clear auto-save timer
				if (autoSaveTimer) {
					clearInterval(autoSaveTimer);
					autoSaveTimer = null;
				}
				
				StorageManager.clearQuizState(state.examId);
				return newState;
			});
		},

		// Clear quiz state and reset everything
		clear: () => {
			if (autoSaveTimer) {
				clearInterval(autoSaveTimer);
				autoSaveTimer = null;
			}
			
			set(defaultState);
			answerHistory.set([]);
			stateSnapshots.set([]);
			currentSnapshotIndex.set(-1);
			analytics.set({
				totalTimeSpent: 0,
				averageQuestionTime: 0,
				questionsRevisited: 0,
				flagsUsed: 0,
				navigationPatterns: []
			});
		},

		// Enable review mode
		enableReview: (examId: string) => {
			update(state => ({
				...state,
				isReview: true,
				examId
			}));
		},
		
		// Get current analytics snapshot
		getAnalytics: () => get(analytics),
		
		// Check if undo is available
		canUndo: () => get(answerHistory).length > 0 && get(currentSnapshotIndex) > 0,
		
		// Check if redo is available
		canRedo: () => {
			const snapshots = get(stateSnapshots);
			const currentIndex = get(currentSnapshotIndex);
			return currentIndex < snapshots.length - 1;
		},
		
		// Export session data for recovery
		exportSession: () => {
			const currentState = get({ subscribe });
			const currentAnalytics = get(analytics);
			const history = get(answerHistory);
			
			return {
				state: currentState,
				analytics: currentAnalytics,
				history,
				timestamp: new Date()
			};
		}
	};
}

// Current exam store
export const currentExam = writable<Exam | null>(null);

// Quiz store
export const quiz = createQuizStore();

// Derived stores for computed values
export const currentQuestion = derived(
	[quiz, currentExam],
	([$quiz, $currentExam]) => {
		if (!$currentExam || $quiz.currentQuestionIndex >= $currentExam.questions.length) {
			return null;
		}
		return $currentExam.questions[$quiz.currentQuestionIndex];
	}
);

export const quizProgress = derived(
	[quiz, currentExam],
	([$quiz, $currentExam]) => {
		if (!$currentExam) return { answered: 0, total: 0, percentage: 0 };
		
		const total = $currentExam.questions.length;
		const answered = $quiz.answers.size;
		const percentage = total > 0 ? (answered / total) * 100 : 0;
		
		return { answered, total, percentage };
	}
);

export const navigationItems = derived(
	[quiz, currentExam],
	([$quiz, $currentExam]): NavigationItem[] => {
		if (!$currentExam) return [];
		
		return $currentExam.questions.map((question, index) => {
			const isAnswered = $quiz.answers.has(question.id);
			let isCorrect: boolean | undefined = undefined;
			
			if (isAnswered) {
				const userAnswers = $quiz.answers.get(question.id) || [];
				const correctAnswers = question.correctAnswers || [];
				
				// Check if user answers match correct answers exactly
				const userAnswersSet = new Set(userAnswers.sort());
				const correctAnswersSet = new Set(correctAnswers.sort());
				
				isCorrect = userAnswersSet.size === correctAnswersSet.size && 
					[...userAnswersSet].every(answer => correctAnswersSet.has(answer));
			}
			
			return {
				questionNumber: index + 1,
				isAnswered,
				isFlagged: $quiz.flaggedQuestions.has(question.id),
				isActive: index === $quiz.currentQuestionIndex,
				isCorrect
			};
		});
	}
);

export const timeElapsed = derived(
	quiz,
	($quiz) => {
		if ($quiz.submitted && $quiz.endTime) {
			return $quiz.endTime.getTime() - $quiz.startTime.getTime();
		}
		return Date.now() - $quiz.startTime.getTime();
	}
);