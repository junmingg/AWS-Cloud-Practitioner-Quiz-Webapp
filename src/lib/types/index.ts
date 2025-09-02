export interface Option {
	id: string;
	text: string;
	letter: string; // A, B, C, D, etc.
}

export interface Question {
	id: string;
	number: number;
	type: 'MCQ' | 'MCMA';
	text: string;
	options: Option[];
	correctAnswers: string[];
	explanation?: string;
	flagged?: boolean;
}

export interface Exam {
	id: string;
	title: string;
	description?: string;
	questionCount: number;
	timeLimit?: number;
	questions: Question[];
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ExamMetadata {
	id: string;
	title: string;
	description?: string;
	questionCount: number;
	timeLimit?: number;
	difficulty?: 'Easy' | 'Medium' | 'Hard';
	tags?: string[];
	lastAttempted?: Date;
	bestScore?: number;
	attempts: number;
	averageScore?: number;
}

export type QuizMode = 'practice' | 'exam';

export interface QuizState {
	examId: string;
	mode: QuizMode;
	currentQuestionIndex: number;
	answers: Map<string, string[]>;
	flaggedQuestions: Set<string>;
	startTime: Date;
	endTime?: Date;
	submitted: boolean;
	timeElapsed?: number;
	isReview?: boolean;
}

export interface QuizResult {
	examId: string;
	examTitle: string;
	score: number;
	percentage: number;
	totalQuestions: number;
	correctAnswers: number;
	incorrectAnswers: number;
	skippedAnswers: number;
	timeElapsed: number;
	startTime: Date;
	endTime: Date;
	questionResults: QuestionResult[];
}

export interface QuestionResult {
	questionId: string;
	questionNumber: number;
	questionText: string;
	type: 'MCQ' | 'MCMA';
	userAnswers: string[];
	correctAnswers: string[];
	isCorrect: boolean;
	explanation?: string;
	options: Option[];
}

export interface UserPreferences {
	theme: 'light' | 'dark' | 'system';
	showTimer: boolean;
	showQuestionNumbers: boolean;
	autoSave: boolean;
	reviewMode: boolean;
	sound: boolean;
	animationsEnabled: boolean;
	defaultQuizMode?: QuizMode;
}

export interface QuizSession {
	id: string;
	examId: string;
	state: QuizState;
	createdAt: Date;
	lastSaved: Date;
	isCompleted: boolean;
}

export interface NavigationItem {
	questionNumber: number;
	isAnswered: boolean;
	isFlagged: boolean;
	isActive: boolean;
	isCorrect?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type QuestionFilter = 'all' | 'answered' | 'unanswered' | 'flagged';

export interface AnswerHistoryEntry {
	questionId: string;
	previousAnswers: string[];
	newAnswers: string[];
	timestamp: Date;
}

export interface QuizStateSnapshot {
	state: QuizState;
	timestamp: Date;
	version: number;
}

export interface OfflineState {
	isOnline: boolean;
	pendingActions: PendingAction[];
	lastSyncTime?: Date;
}

export interface PendingAction {
	id: string;
	type: 'answer' | 'flag' | 'navigation' | 'submit';
	data: any;
	timestamp: Date;
	retryCount: number;
}

export interface TimerState {
	isRunning: boolean;
	isPaused: boolean;
	startTime?: Date;
	pausedTime: number;
	remainingTime?: number;
	warnings: TimerWarning[];
}

export interface TimerWarning {
	type: 'half' | 'quarter' | 'final' | 'overtime';
	message: string;
	triggered: boolean;
}

export interface StorageError {
	type: 'quota_exceeded' | 'corrupted_data' | 'network_error' | 'permission_denied';
	message: string;
	timestamp: Date;
	recoverable: boolean;
}

export interface QuizAnalytics {
	totalTimeSpent: number;
	averageQuestionTime: number;
	questionsRevisited: number;
	flagsUsed: number;
	navigationPatterns: NavigationPattern[];
}

export interface NavigationPattern {
	fromQuestion: number;
	toQuestion: number;
	timestamp: Date;
	reason?: 'next' | 'previous' | 'jump' | 'review';
}

export interface StateManagerConfig {
	autoSaveInterval: number;
	maxHistorySize: number;
	offlineRetryAttempts: number;
	storageQuotaWarningThreshold: number;
	enableAnalytics: boolean;
}

export interface Section {
	id: string;
	title: string;
	filename: string;
	content: string;
	wordCount: number;
	lastModified?: Date;
}