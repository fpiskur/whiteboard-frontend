import { PUBLIC_API_URL } from '$env/static/public';
import type { Note, CreateNoteData, UpdateNoteData, ApiError } from '$lib/types';

const API_BASE = PUBLIC_API_URL;

class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error: ApiError = {
                    message: `API Error: ${response.statusText}`,
                    status: response.status,
                };
                throw error;
            }

            // Handle empty responses (like DELETE)
            if (response.status === 204) {
                return {} as T;
            }

            return await response.json();
        } catch (error) {
            if ((error as ApiError). status) {
                throw error;
            }
            // Network or other errors
            throw {
                message: 'Network error: Unable to connect to API',
                status: 0,
            } as ApiError;
        }
    }

    // Get all notes
    async fetchNotes(): Promise<Note[]> {
        return this.request<Note[]>('/notes');
    }

    // Get single note
    async fetchNote(id: number): Promise<Note> {
        return this.request<Note>(`/notes/${id}`);
    }

    // Create note
    async createNote(data: CreateNoteData): Promise<Note> {
        return this.request<Note>('/notes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Update note
    async updateNote(id: number, data: UpdateNoteData): Promise<Note> {
        return this.request<Note>(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Delete note
    async deleteNote(id: number): Promise<void> {
        return this.request<void>(`/notes/${id}`, {
            method: 'DELETE'
        })
    }

    // Batch update (pos_x, pos_y)
    async batchUpdateNotes(updates: Array<{ id: number; data: UpdateNoteData }>): Promise<Note[]> {
        return this.request<Note[]>('/notes/bulk_update', {
            method: 'PATCH',
            body: JSON.stringify({ updates }),
        });
    }

    // Batch delete
    async batchDeleteNotes(ids: number[]): Promise<void> {
        return this.request<void>('notes/bulk_delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids }),
        });
    }
}

// Export singleton instance
export const api = new ApiClient();

// Export individual wrapper functions for convenience
export async function fetchNotes() {
    return api.fetchNotes();
}

export async function fetchNote(id: number) {
    return api.fetchNote(id);
}

export async function createNote(data: CreateNoteData) {
    return api.createNote(data);
}

export async function updateNote(id: number, data: UpdateNoteData) {
    return api.updateNote(id, data);
}

export async function delteNote(id: number) {
    return api.deleteNote(id);
}

export async function batchUpdateNotes(updates: Array<{ id: number; data: UpdateNoteData }>) {
    return api.batchUpdateNotes(updates);
}

export async function batchDeleteNotes(ids: number[]) {
    return api.batchDeleteNotes(ids);
}
