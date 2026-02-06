import { themeState } from '$lib/state/themeState.svelte';
import { COLOR_PALETTES } from '$lib/state/constants';

export function getCSSVariable(name: string): string {
    if (typeof document === 'undefined') return '';  // SSR safety
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}

export function getNoteColor(colorIndex: number): string {
    const palette = themeState.isDark ? COLOR_PALETTES.dark : COLOR_PALETTES.light;
    const entry = palette[colorIndex]
    return entry ? entry.value : palette[0].value;  // Default to the first color
}
