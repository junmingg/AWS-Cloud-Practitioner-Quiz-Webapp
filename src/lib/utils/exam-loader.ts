import { MarkdownParser } from './markdown-parser';
import type { Exam, ExamMetadata } from '$lib/types';
import { browser } from '$app/environment';

const EXAM_FILES = Array.from({ length: 23 }, (_, i) => `practice-exam-${i + 1}.md`);

export class ExamLoader {
	private static cache = new Map<string, Exam>();
	private static metadataCache: ExamMetadata[] | null = null;

	/**
	 * Loads a single exam by ID
	 */
	static async loadExam(examId: string): Promise<Exam | null> {
		// Check cache first
		if (this.cache.has(examId)) {
			return this.cache.get(examId)!;
		}

		try {
			const response = await fetch(`/practice-exam/${examId}.md`);
			if (!response.ok) {
				throw new Error(`Failed to load exam: ${response.status}`);
			}

			const content = await response.text();
			const exam = MarkdownParser.parseExam(content, examId);
			
			// Cache the exam
			this.cache.set(examId, exam);
			
			return exam;
		} catch (error) {
			console.error(`Error loading exam ${examId}:`, error);
			return null;
		}
	}

	/**
	 * Loads metadata for all exams (without full question content)
	 */
	static async loadExamMetadata(): Promise<ExamMetadata[]> {
		if (this.metadataCache) {
			return this.metadataCache;
		}

		const metadata: ExamMetadata[] = [];

		for (let i = 1; i <= 23; i++) {
			const examId = `practice-exam-${i}`;
			
			try {
				// Load from cache if available, otherwise load the exam
				let exam: Exam | undefined = this.cache.get(examId);
				if (!exam) {
					exam = await this.loadExam(examId) ?? undefined;
				}
				
				if (exam) {
					const examMetadata: ExamMetadata = {
						id: exam.id,
						title: exam.title,
						description: exam.description,
						questionCount: exam.questionCount,
						timeLimit: exam.timeLimit,
						attempts: this.getAttempts(examId),
						bestScore: this.getBestScore(examId),
						averageScore: this.getAverageScore(examId),
						lastAttempted: this.getLastAttempted(examId)
					};
					
					metadata.push(examMetadata);
				}
			} catch (error) {
				console.error(`Error loading metadata for ${examId}:`, error);
			}
		}

		this.metadataCache = metadata;
		return metadata;
	}

	/**
	 * Loads all exams (full content)
	 */
	static async loadAllExams(): Promise<Exam[]> {
		const exams: Exam[] = [];
		
		for (let i = 1; i <= 23; i++) {
			const examId = `practice-exam-${i}`;
			const exam = await this.loadExam(examId);
			
			if (exam) {
				exams.push(exam);
			}
		}
		
		return exams;
	}

	/**
	 * Preloads exam metadata for faster initial page load
	 */
	static async preloadMetadata(): Promise<void> {
		if (browser) {
			// Preload metadata in the background
			setTimeout(() => {
				this.loadExamMetadata().catch(console.error);
			}, 100);
		}
	}

	/**
	 * Clears the cache
	 */
	static clearCache(): void {
		this.cache.clear();
		this.metadataCache = null;
	}

	// Helper methods for getting stored user progress
	private static getAttempts(examId: string): number {
		if (!browser) return 0;
		const attempts = localStorage.getItem(`exam_${examId}_attempts`);
		return attempts ? parseInt(attempts) : 0;
	}

	private static getBestScore(examId: string): number | undefined {
		if (!browser) return undefined;
		const score = localStorage.getItem(`exam_${examId}_best_score`);
		return score ? parseFloat(score) : undefined;
	}

	private static getAverageScore(examId: string): number | undefined {
		if (!browser) return undefined;
		const scores = localStorage.getItem(`exam_${examId}_scores`);
		if (!scores) return undefined;
		
		try {
			const scoreArray = JSON.parse(scores) as number[];
			if (scoreArray.length === 0) return undefined;
			
			const sum = scoreArray.reduce((a, b) => a + b, 0);
			return sum / scoreArray.length;
		} catch {
			return undefined;
		}
	}

	private static getLastAttempted(examId: string): Date | undefined {
		if (!browser) return undefined;
		const date = localStorage.getItem(`exam_${examId}_last_attempted`);
		return date ? new Date(date) : undefined;
	}

	/**
	 * Updates exam statistics after completion
	 */
	static updateExamStats(examId: string, score: number): void {
		if (!browser) return;

		// Update attempts
		const attempts = this.getAttempts(examId) + 1;
		localStorage.setItem(`exam_${examId}_attempts`, attempts.toString());

		// Update best score
		const bestScore = this.getBestScore(examId);
		if (!bestScore || score > bestScore) {
			localStorage.setItem(`exam_${examId}_best_score`, score.toString());
		}

		// Update scores array for average calculation
		const existingScores = localStorage.getItem(`exam_${examId}_scores`);
		let scores: number[] = [];
		
		try {
			scores = existingScores ? JSON.parse(existingScores) : [];
		} catch {
			scores = [];
		}
		
		scores.push(score);
		localStorage.setItem(`exam_${examId}_scores`, JSON.stringify(scores));

		// Update last attempted
		localStorage.setItem(`exam_${examId}_last_attempted`, new Date().toISOString());

		// Clear metadata cache to force refresh
		this.metadataCache = null;
	}

	/**
	 * Clears all exam statistics for all exams
	 */
	static clearAllExamStats(): void {
		if (!browser) return;

		for (let i = 1; i <= 23; i++) {
			const examId = `practice-exam-${i}`;
			localStorage.removeItem(`exam_${examId}_attempts`);
			localStorage.removeItem(`exam_${examId}_best_score`);
			localStorage.removeItem(`exam_${examId}_scores`);
			localStorage.removeItem(`exam_${examId}_last_attempted`);
		}

		// Clear metadata cache to force refresh
		this.metadataCache = null;
	}

	/**
	 * Clears exam statistics for a specific exam
	 */
	static clearExamStats(examId: string): void {
		if (!browser) return;

		localStorage.removeItem(`exam_${examId}_attempts`);
		localStorage.removeItem(`exam_${examId}_best_score`);
		localStorage.removeItem(`exam_${examId}_scores`);
		localStorage.removeItem(`exam_${examId}_last_attempted`);

		// Clear metadata cache to force refresh
		this.metadataCache = null;
	}
}