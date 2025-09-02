import { error } from '@sveltejs/kit';
import { ExamLoader } from '$lib/utils/exam-loader';
import type { PageLoad } from './$types';
import type { QuizMode } from '$lib/types';

export const load: PageLoad = async ({ params, url }) => {
	const examId = params.id;
	const mode = (url.searchParams.get('mode') as QuizMode) || 'exam';
	
	if (!examId) {
		throw error(404, 'Exam not found');
	}
	
	// Validate mode
	if (mode !== 'practice' && mode !== 'exam') {
		throw error(400, 'Invalid quiz mode');
	}
	
	try {
		const exam = await ExamLoader.loadExam(examId);
		
		if (!exam) {
			throw error(404, 'Exam not found');
		}
		
		return {
			exam,
			mode
		};
	} catch (err) {
		console.error('Error loading exam:', err);
		throw error(500, 'Failed to load exam');
	}
};