<script lang="ts">
    let { onclick }: { onclick: () => void } = $props();
</script>

<button class="fab" onclick={onclick} aria-label="Create new note">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
</button>

<style>
    .fab {
        position: fixed;
        bottom: var(--spacing-lg);
        right: var(--spacing-lg);
        width: 56px;
        height: 56px;
        padding: 0;
        border-radius: 50%;
        background-color: var(--color-primary);
        border: none;
        box-shadow: var(--shadow-md);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all 0.2s ease;
        z-index: 1000;
    }

    .fab:hover {
        background-color: var(--color-primary-hover);
        box-shadow: var(--shadow-lg);
        transform: scale(1.05);
    }

    .fab:active {
        transform: scale(0.95);
    }
</style>
