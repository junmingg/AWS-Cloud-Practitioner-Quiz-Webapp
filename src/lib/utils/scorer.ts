import type { Question, QuizResult, QuestionResult } from '$lib/types';

export class QuizScorer {
	/**
	 * Calculates the quiz result based on answers
	 */
	static calculateResult(
		examId: string,
		examTitle: string,
		questions: Question[],
		answers: Map<string, string[]>,
		startTime: Date,
		endTime: Date
	): QuizResult {
		const questionResults: QuestionResult[] = [];
		let correctCount = 0;
		let incorrectCount = 0;
		let skippedCount = 0;

		// Calculate results for each question
		questions.forEach(question => {
			const userAnswers = answers.get(question.id) || [];
			const isCorrect = this.isAnswerCorrect(question, userAnswers);
			
			const questionResult: QuestionResult = {
				questionId: question.id,
				questionNumber: question.number,
				questionText: question.text,
				type: question.type,
				userAnswers,
				correctAnswers: question.correctAnswers,
				isCorrect,
				explanation: question.explanation,
				options: question.options
			};
			
			questionResults.push(questionResult);
			
			// Count the results
			if (userAnswers.length === 0) {
				skippedCount++;
			} else if (isCorrect) {
				correctCount++;
			} else {
				incorrectCount++;
			}
		});

		const totalQuestions = questions.length;
		const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
		const timeElapsed = endTime.getTime() - startTime.getTime();

		return {
			examId,
			examTitle,
			score: correctCount,
			percentage,
			totalQuestions,
			correctAnswers: correctCount,
			incorrectAnswers: incorrectCount,
			skippedAnswers: skippedCount,
			timeElapsed,
			startTime,
			endTime,
			questionResults
		};
	}

	/**
	 * Checks if the user's answers are correct for a given question
	 */
	static isAnswerCorrect(question: Question, userAnswers: string[]): boolean {
		// If no answer provided, it's incorrect
		if (userAnswers.length === 0) {
			return false;
		}

		// Sort both arrays for comparison
		const sortedUserAnswers = [...userAnswers].sort();
		const sortedCorrectAnswers = [...question.correctAnswers].sort();

		// Check if arrays are equal
		if (sortedUserAnswers.length !== sortedCorrectAnswers.length) {
			return false;
		}

		return sortedUserAnswers.every((answer, index) => 
			answer === sortedCorrectAnswers[index]
		);
	}

	/**
	 * Calculates pass/fail status based on percentage
	 */
	static calculatePassStatus(percentage: number, passingScore: number = 70): {
		passed: boolean;
		grade: string;
		message: string;
	} {
		const passed = percentage >= passingScore;
		let grade: string;
		let message: string;

		if (percentage >= 90) {
			grade = 'A';
			message = 'Excellent work! You have a strong understanding of AWS Cloud Practitioner concepts.';
		} else if (percentage >= 80) {
			grade = 'B';
			message = 'Great job! You have a good grasp of the material with room for minor improvements.';
		} else if (percentage >= 70) {
			grade = 'C';
			message = 'Good work! You passed, but consider reviewing some topics to strengthen your knowledge.';
		} else if (percentage >= 60) {
			grade = 'D';
			message = 'You\'re close! Review the incorrect answers and try again to improve your score.';
		} else {
			grade = 'F';
			message = 'Don\'t give up! Focus on studying the areas where you struggled and retake the exam.';
		}

		return { passed, grade, message };
	}

	/**
	 * Calculates detailed analytics for the quiz result
	 */
	static calculateAnalytics(result: QuizResult): {
		timePerQuestion: number;
		accuracyByType: { MCQ: number; MCMA: number };
		strongAreas: string[];
		weakAreas: string[];
		recommendedStudy: string[];
	} {
		const timePerQuestion = result.timeElapsed / result.totalQuestions;
		
		// Calculate accuracy by question type
		const mcqQuestions = result.questionResults.filter(q => q.type === 'MCQ');
		const mcmaQuestions = result.questionResults.filter(q => q.type === 'MCMA');
		
		const mcqCorrect = mcqQuestions.filter(q => q.isCorrect).length;
		const mcmaCorrect = mcmaQuestions.filter(q => q.isCorrect).length;
		
		const mcqAccuracy = mcqQuestions.length > 0 ? (mcqCorrect / mcqQuestions.length) * 100 : 0;
		const mcmaAccuracy = mcmaQuestions.length > 0 ? (mcmaCorrect / mcmaQuestions.length) * 100 : 0;

		// Identify strong and weak areas (simplified - you could enhance this with topic categorization)
		const strongAreas: string[] = [];
		const weakAreas: string[] = [];
		const recommendedStudy: string[] = [];

		// Basic recommendations based on common AWS topics
		const incorrectQuestions = result.questionResults.filter(q => !q.isCorrect);
		const incorrectTexts = incorrectQuestions.map(q => q.questionText.toLowerCase());

		if (incorrectTexts.some(text => text.includes('iam') || text.includes('security') || text.includes('permission'))) {
			weakAreas.push('Identity & Access Management (IAM)');
			recommendedStudy.push('Review IAM policies, roles, and security best practices');
		}

		if (incorrectTexts.some(text => text.includes('ec2') || text.includes('instance'))) {
			weakAreas.push('Amazon EC2');
			recommendedStudy.push('Study EC2 instance types, pricing, and scaling');
		}

		if (incorrectTexts.some(text => text.includes('s3') || text.includes('storage'))) {
			weakAreas.push('Amazon S3 & Storage');
			recommendedStudy.push('Review S3 storage classes and durability features');
		}

		if (incorrectTexts.some(text => text.includes('vpc') || text.includes('network'))) {
			weakAreas.push('Networking & VPC');
			recommendedStudy.push('Study VPC components, subnets, and security groups');
		}

		// Identify strong areas (topics with high accuracy)
		if (result.percentage >= 80) {
			strongAreas.push('Overall AWS Knowledge');
		}

		if (mcqAccuracy >= 85) {
			strongAreas.push('Single-Choice Questions');
		}

		if (mcmaAccuracy >= 85) {
			strongAreas.push('Multiple-Choice Questions');
		}

		return {
			timePerQuestion,
			accuracyByType: { MCQ: mcqAccuracy, MCMA: mcmaAccuracy },
			strongAreas,
			weakAreas,
			recommendedStudy
		};
	}

	/**
	 * Formats time duration in a human-readable format
	 */
	static formatDuration(milliseconds: number): string {
		const seconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		} else {
			return `${seconds}s`;
		}
	}

	/**
	 * Calculates estimated completion time based on current progress
	 */
	static estimateCompletionTime(
		currentQuestionIndex: number,
		totalQuestions: number,
		timeElapsed: number
	): number {
		if (currentQuestionIndex === 0) return 0;
		
		const averageTimePerQuestion = timeElapsed / currentQuestionIndex;
		const remainingQuestions = totalQuestions - currentQuestionIndex;
		
		return Math.round(remainingQuestions * averageTimePerQuestion);
	}
}