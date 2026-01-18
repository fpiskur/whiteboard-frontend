import { PUBLIC_API_URL } from '$env/static/public';

const API_BASE = PUBLIC_API_URL;

async function handleResponse(response: Response) {
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function fetchNotes() {
    const response = await fetch(`${API_BASE}/notes`);
    return handleResponse(response);
}

export async function createNote(noteData: any) {
    const response = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
    });
    return handleResponse(response);
}

export async function updateNote(id: number, noteData: any) {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
    });
    return handleResponse(response);
}

export async function deleteNote(id: number) {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(`Deleting note failed: ${response.status}`);
    }
}
