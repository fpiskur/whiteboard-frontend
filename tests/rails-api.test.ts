import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNote, deleteNote, fetchNotes, updateNote } from '$lib/api/rails-api';
import type { ApiError } from '$lib/types';
import { makeApiNote } from './fixtures/notes';

const API_BASE = 'http://localhost:3000/api';

/** Build a minimal Response-like object for the mocked fetch. */
function jsonResponse(body: unknown, init: Partial<Response> = {}): Response {
	return {
		ok: true,
		status: 200,
		statusText: 'OK',
		json: async () => body,
		...init
	} as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('normalization (via fetchNotes)', () => {
	it('coerces the decimal-string fields to numbers', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse([makeApiNote({ pos_x: '10.5', pos_y: '20.25', width: '300', height: '150' })])
		);

		const notes = await fetchNotes();

		expect(notes[0]).toMatchObject({ pos_x: 10.5, pos_y: 20.25, width: 300, height: 150 });
		expect(typeof notes[0].pos_x).toBe('number');
	});
});

describe('request URLs, methods, and bodies', () => {
	it('GETs /notes', async () => {
		fetchMock.mockResolvedValue(jsonResponse([]));
		await fetchNotes();
		expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/notes`, expect.any(Object));
	});

	it('POSTs a JSON body to /notes on create', async () => {
		fetchMock.mockResolvedValue(jsonResponse(makeApiNote()));
		await createNote({ pos_x: 1, pos_y: 2, content: 'hi' });

		const [url, config] = fetchMock.mock.calls[0];
		expect(url).toBe(`${API_BASE}/notes`);
		expect(config.method).toBe('POST');
		expect(JSON.parse(config.body)).toEqual({ pos_x: 1, pos_y: 2, content: 'hi' });
		expect(config.headers['Content-Type']).toBe('application/json');
	});

	it('PUTs to /notes/:id on update', async () => {
		fetchMock.mockResolvedValue(jsonResponse(makeApiNote({ id: 7 })));
		await updateNote(7, { content: 'changed' });

		const [url, config] = fetchMock.mock.calls[0];
		expect(url).toBe(`${API_BASE}/notes/7`);
		expect(config.method).toBe('PUT');
	});
});

describe('request error handling', () => {
	it('throws a structured ApiError on a non-ok response', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(null, { ok: false, status: 404, statusText: 'Not Found' })
		);

		await expect(fetchNotes()).rejects.toMatchObject<Partial<ApiError>>({
			message: 'API Error: Not Found',
			status: 404
		});
	});

	it('resolves an empty object on a 204 (delete path)', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(undefined, { ok: true, status: 204, statusText: 'No Content' })
		);

		await expect(deleteNote(3)).resolves.toEqual({});
	});

	it('wraps a network failure as a status-0 ApiError', async () => {
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

		await expect(fetchNotes()).rejects.toMatchObject<Partial<ApiError>>({
			message: 'Network error: Unable to connect to API',
			status: 0
		});
	});
});
