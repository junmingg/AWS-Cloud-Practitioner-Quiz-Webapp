import type { Exam, Question, Option } from '$lib/types';

export class MarkdownParser {
	/**
	 * Parses a markdown exam file and returns an Exam object
	 */
	static parseExam(content: string, examId: string): Exam {
		const lines = content.split('\n');
		let title = '';
		const questions: Question[] = [];
		
		// Extract title from the markdown
		for (const line of lines) {
			if (line.startsWith('# ')) {
				title = line.substring(2).trim();
				break;
			}
		}
		
		// Parse questions
		const questionBlocks = this.extractQuestionBlocks(content);
		
		for (let i = 0; i < questionBlocks.length; i++) {
			const question = this.parseQuestion(questionBlocks[i], i + 1);
			if (question) {
				questions.push(question);
			}
		}
		
		return {
			id: examId,
			title: title || `Practice Exam ${examId}`,
			questionCount: questions.length,
			questions
		};
	}
	
	/**
	 * Extracts individual question blocks from the markdown content
	 */
	private static extractQuestionBlocks(content: string): string[] {
		const blocks: string[] = [];
		const lines = content.split('\n');
		let currentBlock = '';
		let inQuestion = false;
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			
			// Check if this is the start of a question (number followed by period)
			if (/^\d+\.\s/.test(line)) {
				if (inQuestion && currentBlock.trim()) {
					blocks.push(currentBlock.trim());
				}
				currentBlock = line + '\n';
				inQuestion = true;
			} else if (inQuestion) {
				currentBlock += line + '\n';
				
				// If we hit the end of the answer details, this question block is complete
				if (line.includes('</details>')) {
					blocks.push(currentBlock.trim());
					currentBlock = '';
					inQuestion = false;
				}
			}
		}
		
		// Add the last block if it exists
		if (inQuestion && currentBlock.trim()) {
			blocks.push(currentBlock.trim());
		}
		
		return blocks;
	}
	
	/**
	 * Parses a single question block
	 */
	private static parseQuestion(block: string, questionNumber: number): Question | null {
		const lines = block.split('\n').map(line => line.trim());
		
		if (lines.length === 0) return null;
		
		// Extract question text (first line without the number)
		const firstLine = lines[0];
		const questionMatch = firstLine.match(/^\d+\.\s(.+)$/);
		if (!questionMatch) return null;
		
		// Clean HTML tags from question text and handle inline options
		let questionText = questionMatch[1].replace(/<br\s*\/?>/gi, ' ').trim();
		const options: Option[] = [];
		let correctAnswersText = '';
		
		// Check if question text has an inline option (e.g., "Question text    - A. Option")
		const inlineOptionMatch = questionText.match(/^(.+?)\s{2,}-\s([A-E])\.\s(.+)$/);
		if (inlineOptionMatch) {
			// Split the inline option from question text
			questionText = inlineOptionMatch[1].trim();
			const optionLetter = inlineOptionMatch[2];
			const optionText = inlineOptionMatch[3];
			
			// Add the inline option as the first option
			options.push({
				id: `${questionNumber}-${optionLetter}`,
				letter: optionLetter,
				text: optionText
			});
		}
		
		// Extract options and correct answers
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			
			// Check for options (starts with - A., - B., etc.)
			const optionMatch = line.match(/^-\s([A-E])\.\s(.+)$/);
			if (optionMatch) {
				const letter = optionMatch[1];
				const text = optionMatch[2];
				options.push({
					id: `${questionNumber}-${letter}`,
					letter,
					text
				});
			}
			
			// Check for correct answer (case insensitive)
			const answerMatch = line.match(/Correct answer:\s*(.+)$/i);
			if (answerMatch) {
				correctAnswersText = answerMatch[1];
			}
		}
		
		if (options.length === 0 || !correctAnswersText) return null;
		
		// Parse correct answers - handle both "A, B" and "AB" formats
		let correctAnswerLetters: string[];
		if (correctAnswersText.includes(',') || correctAnswersText.includes(' ')) {
			// Has separators (commas or spaces), use split logic
			correctAnswerLetters = correctAnswersText
				.split(/[,\s]+/)
				.map(s => s.trim())
				.filter(s => /^[A-E]$/.test(s));
		} else {
			// No separators, split each character for formats like "AC", "BCD"
			correctAnswerLetters = correctAnswersText
				.split('')
				.filter(s => /^[A-E]$/.test(s));
		}
		
		const correctAnswers = correctAnswerLetters.map(letter => 
			options.find(opt => opt.letter === letter)?.id || ''
		).filter(id => id !== '');
		
		// Determine question type
		const type = correctAnswers.length > 1 ? 'MCMA' : 'MCQ';
		
		return {
			id: `${questionNumber}`,
			number: questionNumber,
			type,
			text: questionText,
			options,
			correctAnswers
		};
	}
	
	/**
	 * Loads and parses all exam files from a directory
	 */
	static async loadExamsFromDirectory(examFiles: { id: string; content: string }[]): Promise<Exam[]> {
		const exams: Exam[] = [];
		
		for (const file of examFiles) {
			try {
				const exam = this.parseExam(file.content, file.id);
				if (exam.questions.length > 0) {
					exams.push(exam);
				}
			} catch (error) {
				console.error(`Error parsing exam ${file.id}:`, error);
			}
		}
		
		return exams.sort((a, b) => {
			// Sort by exam number
			const aNum = parseInt(a.id.replace('practice-exam-', ''));
			const bNum = parseInt(b.id.replace('practice-exam-', ''));
			return aNum - bNum;
		});
	}
	
	/**
	 * Validates a question object
	 */
	static validateQuestion(question: Question): boolean {
		return (
			question.text.length > 0 &&
			question.options.length >= 2 &&
			question.correctAnswers.length > 0 &&
			question.correctAnswers.every(id => 
				question.options.some(opt => opt.id === id)
			)
		);
	}
}