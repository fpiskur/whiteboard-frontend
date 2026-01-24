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

    // Action to focus element when it's added to DOM
    function autofocus(node: HTMLElement) {
        node.focus();
        return {};
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

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    }

    // Close on Escape key
    function handleKeyDown(e: KeyboardEvent) {
        if (isOpen && e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    }

    // Backdrop keyboard handler for a11y (same as click)
    function handleBackdropKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            handleBackdropClick(e as any);
        }
    }
</script>

<!-- Attach keydown to window, not backdrop -->
<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="modal-backdrop"
        onclick={handleBackdropClick}
        onkeydown={handleBackdropKeyDown}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
        <div class="modal-content">
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
