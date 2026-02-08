import { themeState } from '$lib/state/themeState.svelte';
import { COLOR_PALETTES } from '$lib/state/constants';
import type { ColorKey } from '$lib/types';

export function getCSSVariable(name: string): string {
    if (typeof document === 'undefined') return '';  // SSR safety
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}

export function getNoteColor(colorKey: ColorKey): string {
    const palette = themeState.isDark ? COLOR_PALETTES.dark : COLOR_PALETTES.light;
    const colorEntry = palette[colorKey];

    return colorEntry?.value || palette.default.value;
}
