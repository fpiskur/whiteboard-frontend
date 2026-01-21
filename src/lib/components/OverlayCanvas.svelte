<script lang="ts">
    import { onMount } from 'svelte';
    import { camera, cameraRender } from '$lib/state/cameraState.svelte';
    import { selectionState } from '$lib/state/selectionState.svelte';
    import { COLORS } from '$lib/state/constants';

    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let width = 0;
    let height = 0;

    onMount(() => {
        ctx = canvasEl.getContext('2d')!;

        const resizeObserver = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            width = rect.width;
            height = rect.height;
            canvasEl.width = width;
            canvasEl.height = height;
            cameraRender.needsRender = true;
        });

        resizeObserver.observe(canvasEl.parentElement!);

        return () => resizeObserver.disconnect();
    });

    // Reactive drawing when selection box changes
    $effect(() => {
        if (!ctx || !cameraRender.needsRender) return;

        ctx.clearRect(0, 0, width, height);

        if (selectionState.box.isBoxSelecting && selectionState.box.boxStart && selectionState.box.boxEnd) {
            const wx1 = selectionState.box.boxStart.x;
            const wy1 = selectionState.box.boxStart.y;
            const wx2 = selectionState.box.boxEnd.x;
            const wy2 = selectionState.box.boxEnd.y;

            const minWx = Math.min(wx1, wx2);
            const maxWx = Math.max(wx1, wx2);
            const minWy = Math.min(wy1, wy2);
            const maxWy = Math.max(wy1, wy2);

            const sx1 = minWx * camera.scale + camera.x;
            const sy1 = minWy * camera.scale + camera.y;
            const sx2 = maxWx * camera.scale + camera.x;
            const sy2 = maxWy * camera.scale + camera.y;

            const x = sx1;
            const y = sy1;
            const w = sx2 - sx1;
            const h = sy2 - sy1;

            ctx.save();
            ctx.strokeStyle = COLORS.SELECTION;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
            ctx.fillStyle = COLORS.SELECTION_FILL;
            ctx.fillRect(x, y, w, h);
            ctx.restore();
        }

        cameraRender.needsRender = false;
    });
</script>

<canvas bind:this={canvasEl} class="overlay-canvas"></canvas>

<style>
    .overlay-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
    }
</style>
