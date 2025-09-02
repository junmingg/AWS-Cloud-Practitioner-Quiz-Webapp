import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const examId = params.id;
	
	if (!examId) {
		throw error(404, 'Results not found');
	}
	
	return {
		examId
	};
};