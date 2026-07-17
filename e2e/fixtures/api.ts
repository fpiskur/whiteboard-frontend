import type { Page, Route } from '@playwright/test';

// The Rails API as the app sees it: decimal fields come back as strings.
export interface ApiNote {
	id: number;
	pos_x: string;
	pos_y: string;
	width: string;
	height: string;
	content: string;
	color_index: string;
	created_at?: string;
	updated_at?: string;
}

export interface SeedNote {
	id?: number;
	pos_x?: number;
	pos_y?: number;
	width?: number;
	height?: number;
	content: string;
	color_index?: string;
}

export interface MockApi {
	/** Current in-memory notes (API shape). */
	notes: ApiNote[];
	/** Bodies of every POST /notes create request, in order. */
	created: Array<Record<string, unknown>>;
	/** Bodies of every PATCH /notes/bulk_update request, in order. */
	bulkUpdated: Array<Record<string, unknown>>;
}

function toApiNote(seed: SeedNote, id: number): ApiNote {
	return {
		id,
		pos_x: String(seed.pos_x ?? 0),
		pos_y: String(seed.pos_y ?? 0),
		width: String(seed.width ?? 300),
		height: String(seed.height ?? 150),
		content: seed.content,
		color_index: seed.color_index ?? 'default'
	};
}

/**
 * Intercept every Rails API call for a page and serve it from an in-memory store,
 * so end-to-end tests run without a backend. Pass `{ error: 500 }` to make the
 * initial notes load fail. Returns a handle whose `notes`/`created`/`bulkUpdated`
 * fields can be asserted after interactions.
 */
export async function mockNotesApi(
	page: Page,
	seed: SeedNote[] = [],
	options: { error?: number } = {}
): Promise<MockApi> {
	let nextId = Math.max(0, ...seed.map((n) => n.id ?? 0)) + 1;
	const state: MockApi = {
		notes: seed.map((n, i) => toApiNote(n, n.id ?? i + 1)),
		created: [],
		bulkUpdated: []
	};

	const json = (route: Route, body: unknown, status = 200) =>
		route.fulfill({
			status,
			contentType: 'application/json',
			body: JSON.stringify(body)
		});

	await page.route('**/api/notes**', async (route) => {
		const request = route.request();
		const method = request.method();
		const path = new URL(request.url()).pathname;

		if (options.error && method === 'GET' && path.endsWith('/notes')) {
			return route.fulfill({ status: options.error, contentType: 'application/json', body: '{}' });
		}

		// GET /notes
		if (method === 'GET' && path.endsWith('/notes')) {
			return json(route, state.notes);
		}

		// POST /notes
		if (method === 'POST' && path.endsWith('/notes')) {
			const data = request.postDataJSON() as Record<string, unknown>;
			state.created.push(data);
			const created = toApiNote(data as SeedNote, nextId++);
			state.notes.push(created);
			return json(route, created, 201);
		}

		// PATCH /notes/bulk_update
		if (method === 'PATCH' && path.endsWith('/bulk_update')) {
			const { updates } = request.postDataJSON() as {
				updates: Array<{ id: number; data: Record<string, unknown> }>;
			};
			state.bulkUpdated.push(...updates);
			const returned: ApiNote[] = [];
			for (const u of updates) {
				const note = state.notes.find((n) => n.id === u.id);
				if (note) {
					Object.assign(note, coerce(u.data));
					returned.push(note);
				}
			}
			return json(route, returned);
		}

		// DELETE /notes/bulk_delete
		if (method === 'DELETE' && path.endsWith('/bulk_delete')) {
			const { ids } = request.postDataJSON() as { ids: number[] };
			state.notes = state.notes.filter((n) => !ids.includes(n.id));
			return route.fulfill({ status: 204, body: '' });
		}

		// PUT /notes/:id
		if (method === 'PUT') {
			const id = Number(path.split('/').pop());
			const note = state.notes.find((n) => n.id === id);
			if (note) Object.assign(note, coerce(request.postDataJSON()));
			return json(route, note);
		}

		// DELETE /notes/:id
		if (method === 'DELETE') {
			const id = Number(path.split('/').pop());
			state.notes = state.notes.filter((n) => n.id !== id);
			return route.fulfill({ status: 204, body: '' });
		}

		return route.continue();
	});

	return state;
}

// Numeric fields must be echoed back as strings (Rails decimal columns).
function coerce(data: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = { ...data };
	for (const k of ['pos_x', 'pos_y', 'width', 'height']) {
		if (out[k] !== undefined) out[k] = String(out[k]);
	}
	return out;
}
