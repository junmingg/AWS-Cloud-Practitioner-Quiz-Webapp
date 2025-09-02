import type { PageLoad } from './$types';
import { ExamLoader } from '$lib/utils/exam-loader';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const examId = params.id;
	
	try {
		const exam = await ExamLoader.loadExam(examId);
		
		if (!exam) {
			throw error(404, 'Exam not found');
		}

		return {
			examId,
			exam: {
				id: exam.id,
				title: exam.title,
				questionCount: exam.questionCount,
				timeLimit: exam.timeLimit
			}
		};
	} catch (err) {
		console.error('Error loading exam for mode selection:', err);
		throw error(500, 'Failed to load exam');
	}
};