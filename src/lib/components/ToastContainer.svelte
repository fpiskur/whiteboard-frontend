<script lang="ts">
    import { toastState } from '$lib/state/toastState.svelte';
    import type { Toast } from '$lib/state/toastState.svelte';

    function handleClose(id: number) {
        toastState.removeToast(id);
    }

    function getIcon(type: Toast['type']): string {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
        }
    }
</script>

<div class="toast-container">
    {#each toastState.items as toast (toast.id)}
        <div class="toast toast-{toast.type}" role="alert">
            <span class="toast-icon">{getIcon(toast.type)}</span>
            <span class="toast-message">{toast.message}</span>
            <button
                class="toast-close"
                onclick={() => handleClose(toast.id)}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        top: var(--spacing-lg);
        right: var(--spacing-lg);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        pointer-events: none;
    }

    .toast {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        min-width: 300px;
        max-width: 500px;
        padding: var(--spacing-md) var(--spacing-lg);
        background: white;
        color: #1f2937;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
        opacity: 1;
        transform: translateX(0);
    }

    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .toast-icon {
        font-size: 20px;
        font-weight: bold;
        flex-shrink: 0;
        line-height: 1;
    }

    .toast-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
        color: #1f2937;
    }

    .toast-close {
        background: none;
        border: none;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        opacity: 0.8;
        transition: opacity 0.2s;
        flex-shrink: 0;
    }

    .toast-close:hover {
        opacity: 1;
        color: #374151;
    }

    /* Type-specific styling */
    .toast-success {
        border-left: 4px solid #10b981;
    }

    .toast-success .toast-icon {
        color: #10b981;
    }

    .toast-error {
        border-left: 4px solid #ef4444;
    }

    .toast-error .toast-icon {
        color: #ef4444;
    }

    .toast-warning {
        border-left: 4px solid #f59e0b;
    }

    .toast-warning .toast-icon {
        color: #f59e0b;
    }

    .toast-info {
        border-left: 4px solid #3b82f6;
    }

    .toast-info .toast-icon {
        color: #3b82f6;
    }
</style>
