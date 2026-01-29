<script lang="ts">
    interface Props {
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        onCancel: () => void;
        variant?: 'danger' | 'warning';
    }

    let {
        isOpen = $bindable(),
        title,
        message,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        onConfirm,
        onCancel,
        variant = 'danger'
    }: Props = $props();

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

    function handleConfirm() {
        onConfirm();
        isOpen = false;
    }

    function handleCancel() {
        onCancel();
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
            aria-describedby="modal-description"
            tabindex="-1"
        >
            <h2 id="modal-title">{title}</h2>
            <p id="modal-description">{message}</p>
            <div class="modal-actions">
                <button class="btn-secondary" onclick={handleCancel}>
                    {cancelText}
                </button>
                <button class="btn-{variant}" onclick={handleConfirm}>
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    p {
        color: var(--color-text-muted);
        margin: 0;
        line-height: 1.5;
    }
</style>
