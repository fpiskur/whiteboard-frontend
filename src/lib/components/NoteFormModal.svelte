<script lang="ts">
    import type { Note } from '$lib/types';

    let {
        isOpen = $bindable(false),
        editNote = $bindable<Note | null>(null),
        onSubmit
    }: {
        isOpen: boolean;
        editNote?: Note | null;
        onSubmit: (content: string, noteId?: number) => void;
    } = $props();

    let content = $state('');

    // Sync content when editing
    $effect(() => {
        if (editNote) {
            content = editNote.content;
        } else {
            content = '';
        }
    });

    $effect(() => {
        if (!isOpen) return;

        // Close on Escape key
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    // Action to focus element when it's added to DOM
    function autofocus(node: HTMLElement) {
        node.focus();
        return {
            destroy() {
                // No cleanup needed - focus() is a one-time DOM operation
            }
        };
    }

    const isEditMode = $derived(editNote !== null);
    const modalTitle = $derived(isEditMode ? 'Edit Note' : 'Create a New Note');
    const submitButtonText = $derived(isEditMode ? 'Save Changes' : 'Create Note');

    function handleSubmit(e: Event) {
        e.preventDefault();
        if (content.trim()) {
            onSubmit(content.trim(), editNote?.id);
            content = ''; // Reset form
            editNote = null;
            isOpen = false;
        }
    }

    function handleCancel() {
        content = '';
        editNote = null;
        isOpen = false;
    }
</script>

{#if isOpen}
    <div
        class="modal-backdrop"
        onclick={handleCancel}
        role="presentation"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="modal-content"
            onclick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="note-content"
            tabindex="-1"
        >
            <h2 id="modal-title">{modalTitle}</h2>
            <form onsubmit={handleSubmit}>
                <label for="note-content">
                    Content
                    <textarea
                        id="note-content"
                        use:autofocus
                        bind:value={content}
                        placeholder="Enter note content..."
                        rows="6"
                    ></textarea>
                </label>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick={handleCancel}>
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary" disabled={!content.trim()}>
                        {submitButtonText}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    textarea {
        resize: vertical;
    }
</style>
