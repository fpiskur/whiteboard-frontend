import type { Note, CreateNoteData, UpdateNoteData, ApiError } from '$lib/types';
import { fetchNotes, createNote, updateNote, batchUpdateNotes, deleteNote, batchDeleteNotes } from '$lib/api/rails-api';

type NotesState = {
    items: Note[];
    loading: boolean;
    error: string | null;
};

export const notesState = $state<NotesState>({
    items: [],
    loading: false,
    error: null
});

export async function loadNotes() {
    notesState.loading = true;
    notesState.error = null;
    try {
        const notes = await fetchNotes();
        notesState.items = notes;
    } catch (err) {
        const e = err as ApiError;
        notesState.error = e.message;
    } finally {
        notesState.loading = false;
    }
}

export async function createNoteLocal(data: CreateNoteData) {
    const note = await createNote(data);
    notesState.items.push(note);
}

export async function updateNoteLocal(id: number, data:UpdateNoteData) {
    const updated = await updateNote(id, data);
    const idx = notesState.items.findIndex((n) => n.id === id);
    if (idx !== -1) {
        notesState.items[idx] = updated;
    }
}

export async function batchUpdateNotesLocal(updates: Array<{ id: number; data: UpdateNoteData }>) {
    const updatedNotes = await batchUpdateNotes(updates);

    // Update local state with all returned notes
    updatedNotes.forEach(updated => {
        const idx = notesState.items.findIndex((n) => n.id === updated.id);
        if (idx !== -1) {
            notesState.items[idx] = updated;
        }
    });
}

export async function deleteNoteLocal(id: number) {
    await deleteNote(id);
    notesState.items = notesState.items.filter((n) => n.id !== id);
}

export async function deleteNotesLocal(ids: number[]): Promise<void> {
    try {
        await batchDeleteNotes(ids);

        //Remove from local state
        notesState.items = notesState.items.filter(note => !ids.includes(note.id));
    } catch (error) {
        console.error('Failed to delete notes: ', error);
        throw error;
    }
}
