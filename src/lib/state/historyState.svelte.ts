import { createNoteLocal, deleteNotesLocal, updateNoteLocal, batchUpdateNotesLocal } from './notesState.svelte';
import { toastState } from './toastState.svelte';
import type { Note } from '$lib/types';

// Action types
type HistoryAction =
    | { type: 'CREATE_NOTE'; noteId: number; noteData: Omit<Note, 'id'> }
    | { type: 'DELETE_NOTES'; noteIds: number[]; notesData: Note[] }
    | { type: 'UPDATE_NOTE_CONTENT'; noteId: number; oldContent: string; newContent: string }
    | { type: 'MOVE_NOTES'; updates: Array<{ id: number; oldPos: { x: number; y: number }; newPos: { x: number; y: number } }> }
    | { type: 'RESIZE_NOTE'; noteId: number; oldSize: { width: number; height: number }; newSize: { width: number; height: number } };

const MAX_HISTORY_SIZE = 50;

// State
let undoStack = $state<HistoryAction[]>([]);
let redoStack = $state<HistoryAction[]>([]);
let isProcessing = $state(false);
let processingQueue: Promise<void> = Promise.resolve();

// Derived state
const canUndo = $derived(undoStack.length > 0 && !isProcessing);
const canRedo = $derived(redoStack.length > 0 && !isProcessing);

// Record a new action
function recordAction(action: HistoryAction): void {
    // Add to undo stack
    undoStack.push(action);

    // Limit stack size
    if (undoStack.length > MAX_HISTORY_SIZE) {
        undoStack.shift();  // Remove oldest
    }

    // Clear redo stack when new action is performed
    redoStack = [];
}

// Perform undo with queuing
function undo(): void {
    if (!canUndo) return;

    processingQueue = processingQueue.then(async () => {
        if (undoStack.length === 0) return;

        isProcessing = true;
        const action = undoStack.pop()!;

        try {
            await performUndo(action);
            redoStack.push(action);

            const actionMessage = getUndoActionMessage(action);
            toastState.showSuccess(actionMessage);
        } catch (error) {
            console.error('Undo failed: ', error);
            // Re-add action to undo stack on failure
            undoStack.push(action);

            // Show toast notification
            toastState.showError('Failed to undo action. Please check your connection.');
        } finally {
            isProcessing = false;
        }
    }).catch(err => {
        // Catch any unhandled promise rejections
        console.error('Undo queue error: ', err);
        isProcessing = false;
    });
}

// Perform redo with queuing
function redo(): void {
    if (!canRedo) return;

    processingQueue = processingQueue.then(async () => {
        if (redoStack.length === 0) return;

        isProcessing = true;
        const action = redoStack.pop()!;

        try {
            await performRedo(action);
            undoStack.push(action);

            const actionMessage = getRedoActionMessage(action);
            toastState.showSuccess(actionMessage);
        } catch (error) {
            console.error('Redo failed: ', error);
            // Re-add action to redo stack on failure
            redoStack.push(action);

            // Show toast notification
            toastState.showError('Failed to redo action. Please check your connection.');
        } finally {
            isProcessing = false;
        }
    }).catch(err => {
        // Catch any unhandled promise rejections
        console.error('Redo queue error: ', err);
        isProcessing = false;
    });
}

// Execute undo operation
async function performUndo(action: HistoryAction): Promise<void> {
    switch (action.type) {
        case 'CREATE_NOTE':
            // Undo create = delete the note
            await deleteNotesLocal([action.noteId]);
            break;

        case 'DELETE_NOTES':
            // Undo delete = recreate all notes
            for (const noteData of action.notesData) {
                await createNoteLocal({
                    content: noteData.content,
                    pos_x: noteData.pos_x,
                    pos_y: noteData.pos_y,
                    width: noteData.width,
                    height: noteData.height,
                    bg_color: noteData.bg_color
                });  // Pass original ID to maintain consistency
            }
            break;

        case 'UPDATE_NOTE_CONTENT':
            // Restore old content
            await updateNoteLocal(action.noteId, { content: action.oldContent });
            break;

        case 'MOVE_NOTES':
            // Restore old positions
            const undoMoveUpdates = action.updates.map(u => ({
                id: u.id,
                data: { pos_x: u.oldPos.x, pos_y: u.oldPos.y }
            }));
            await batchUpdateNotesLocal(undoMoveUpdates);
            break;

        case 'RESIZE_NOTE':
            // Restore old size
            await updateNoteLocal(action.noteId, {
                width: action.oldSize.width,
                height: action.oldSize.height
            });
            break;
    }
}

// Execute redo operation
async function performRedo(action: HistoryAction): Promise<void> {
    switch (action.type) {
        case 'CREATE_NOTE':
            // Redo create = recreate the note with same data
            await createNoteLocal(action.noteData);
            break;

        case 'DELETE_NOTES':
            // Redo delete = delete delete the notes again
            await deleteNotesLocal(action.noteIds);
            break;

        case 'UPDATE_NOTE_CONTENT':
            // Apply new content
            await updateNoteLocal(action.noteId, { content: action.newContent });
            break;

        case 'MOVE_NOTES':
            // Apply new positions
            const redoMoveUpdates = action.updates.map(u => ({
                id: u.id,
                data: { pos_x: u.newPos.x, pos_y: u.newPos.y }
            }));
            await batchUpdateNotesLocal(redoMoveUpdates);
            break;

        case 'RESIZE_NOTE':
            // Apply new size
            await updateNoteLocal(action.noteId, {
                width: action.newSize.width,
                height: action.newSize.height
            });
            break;
    }
}

function getUndoActionMessage(action: HistoryAction): string {
    switch (action.type) {
        case 'CREATE_NOTE': return 'Note removed';
        case 'DELETE_NOTES':
            const count = action.noteIds.length;
            return `${count} note${count > 1 ? 's' : ''} recreated`;
        case 'UPDATE_NOTE_CONTENT': return 'Note content changed';
        case 'MOVE_NOTES':
            const moveCount = action.updates.length;
            return `Position changed for ${moveCount} note${moveCount > 1 ? 's' : ''}`
        case 'RESIZE_NOTE': return 'Note size changed'
    }
}

function getRedoActionMessage(action: HistoryAction): string {
    switch (action.type) {
        case 'CREATE_NOTE': return 'Note recreated';
        case 'DELETE_NOTES':
            const count = action.noteIds.length;
            return `${count} note${count > 1 ? 's' : ''} deleted`;
        case 'UPDATE_NOTE_CONTENT': return 'Note content changed';
        case 'MOVE_NOTES':
            const moveCount = action.updates.length;
            return `Position changed for ${moveCount} note${moveCount > 1 ? 's' : ''}`
        case 'RESIZE_NOTE': return 'Note size changed'
    }
}

// Export state and functions
export const historyState = {
    get canUndo() { return canUndo; },
    get canRedo() { return canRedo; },
    get undoStackSize() { return undoStack.length; },
    get redoStackSize() { return redoStack.length; },
    recordAction,
    undo,
    redo
};
