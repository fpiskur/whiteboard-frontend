<script lang="ts">
    let {
        isOpen = $bindable(false),
        onSubmit
    }: {
        isOpen: boolean;
        onSubmit: (content: string) => void;
    } = $props();

    let content = $state('');

    function handleSubmit(e: Event) {
        e.preventDefault();
        if (content.trim()) {
            onSubmit(content.trim());
            content = ''; // Reset form
            isOpen = false;
        }
    }

    function handleCancel() {
        content = '';
        isOpen = false;
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    }

    // Close on Escape key
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            handleCancel();
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="modal-backdrop"
        onclick={handleBackdropClick}
        onkeydown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
        <div class="modal-content">
            <h2 id="modal-title">Create New Note</h2>
            <form onsubmit={handleSubmit}>
                <label for="note-content">
                    Content
                    <textarea
                        id="note-content"
                        bind:value={content}
                        placeholder="Enter note content..."
                        rows="6"
                        autofocus
                    ></textarea>
                </label>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick={handleCancel}>
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary" disabled={!content.trim()}>
                        Create Note
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    h2 {
        margin: 0 0 20px 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
    }

    label {
        display: block;
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 500;
        color: #555;
    }

    textarea {
        width: 100%;
        margin-top: 8px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s;
    }

    textarea:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }

    button {
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    .btn-primary {
        background-color: #007acc;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #0066aa;
    }

    .btn-primary:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .btn-secondary {
        background-color: #f0f0f0;
        color: #333;
    }

    .btn-secondary:hover {
        background-color: #e0e0e0;
    }
</style>
