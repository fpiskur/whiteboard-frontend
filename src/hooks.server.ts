import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ resolve, event }) => {
	// Handle preflight requests for CORS
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			}
		});
	}

	const response = await resolve(event);

	// Add CORS headers to all responses
	response.headers.append('Access-Control-Allow-Origin', '*');

	return response;
};
