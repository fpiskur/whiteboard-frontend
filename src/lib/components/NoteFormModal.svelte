<script lang="ts">
    import type { Note } from '$lib/types';
    import { getColorPalette } from '$lib/state/constants';
    import Spinner from './Spinner.svelte';

    let {
        isOpen = $bindable(false),
        editNote = $bindable<Note | null>(null),
        onSubmit,
        isSubmitting = false
    }: {
        isOpen: boolean;
        editNote?: Note | null;
        onSubmit: (content: string, bgColor: string, noteId?: number) => Promise<void>;
        isSubmitting?: boolean;
    } = $props();

    let content = $state('');
    let selectedColor = $state('#ffffff');

    // Get available colors
    const availableColors = getColorPalette('light');  // TODO: Later: getColorPalette(currentTheme);

    // Sync content and color when editing
    $effect(() => {
        if (editNote) {
            content = editNote.content;
            selectedColor = editNote.bg_color;
        } else {
            content = '';
            selectedColor = '#ffffff';  // TODO: later pick the theme's default color
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

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (content.trim()) {
            await onSubmit(content.trim(), selectedColor, editNote?.id);
            content = ''; // Reset form
            selectedColor = '#ffffff';  // TODO: later add theme default color
            editNote = null;
            isOpen = false;
        }
    }

    function handleCancel() {
        if (isSubmitting) return;  // Prevent closing during submission
        content = '';
        selectedColor = '#ffffff';  // TODO: later add theme default color
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
                        disabled={isSubmitting}
                    ></textarea>
                </label>

                <!-- Color Picker -->
                <fieldset class="color-picker" disabled={isSubmitting}>
                    <legend>Background color</legend>
                    <div class="color-grid">
                        {#each availableColors as color}
                            <button
                                type="button"
                                class="color-option"
                                class:selected={selectedColor === color.value}
                                style="background-color: {color.value};"
                                onclick={() => selectedColor = color.value}
                                aria-label={color.name}
                                title={color.name}
                            >
                                {#if selectedColor === color.value}
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </fieldset>

                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick={handleCancel} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary" disabled={!content.trim() || isSubmitting}>
                        {#if isSubmitting}
                            <Spinner size={16} color="white" />
                            {isEditMode ? 'Saving...' : 'Creating...'}
                        {:else}
                            {submitButtonText}
                        {/if}
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

    .color-picker {
        border: none;
        padding: 0;
        margin: 0;
        margin-bottom: var(--spacing-lg);
    }

    .color-picker legend {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text);
        margin-bottom: var(--spacing-sm);
        padding: 0;
    }

    .color-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--spacing-sm);
    }

    .color-option {
        width: 100%;
        aspect-ratio: 1;
        border: 2px solid transparent;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .color-option:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .color-option:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .color-option.selected {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light, rgba(59, 130, 246, 0.2));
    }

    .color-option svg {
        color: #374151;
        filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.5));
    }

    button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
    }
</style>
