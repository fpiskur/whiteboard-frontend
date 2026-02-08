<script lang="ts">
    import { onMount } from 'svelte';
    import { camera, cameraRender } from '$lib/state/cameraState.svelte';
    import { themeState } from '$lib/state/themeState.svelte';
    import { getGridSize, getGridOffset } from '$lib/utils/grid-utils';
    import { getCanvasColors } from '$lib/utils/theme-utils';

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
            cameraRender.needsGridRender = true;
        });

        resizeObserver.observe(canvasEl.parentElement!);

        return () => resizeObserver.disconnect();
    });

    // Reactive drawing when camera changes, theme changes, or render flag set
    $effect(() => {
        if (!ctx || !cameraRender.needsGridRender) return;

        // Get fresh colors (will re-run when theme changes because themeState.isDark is tracked)
        const colors = getCanvasColors();

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;

        const gridSize = getGridSize(camera.scale);
        const screenGridSize = gridSize * camera.scale;
        const offsetX = getGridOffset(camera.x, screenGridSize);
        const offsetY = getGridOffset(camera.y, screenGridSize);

        // Vertical lines
        for (let x = offsetX; x < width; x += screenGridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = offsetY; y < height; y += screenGridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        cameraRender.needsGridRender = false;
    });

    // Separate effect to trigger re-render when theme changes
    $effect(() => {
        // Track theme changes
        themeState.isDark;

        // Request re-render when theme changes
        if (ctx) {
            cameraRender.needsGridRender = true;
        }
    });
</script>

<canvas bind:this={canvasEl} class="grid-canvas"></canvas>

<style>
    .grid-canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
    }
</style>
