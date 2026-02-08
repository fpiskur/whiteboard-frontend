import { themeState } from '$lib/state/themeState.svelte';
import type { ColorKey } from '$lib/types';

export function getCSSVariable(name: string): string {
    if (typeof document === 'undefined') return '';  // SSR safety
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}

// Map color keys to their SCC variable names
const COLOR_VAR_MAP: Record<ColorKey, { light: string; dark: string }> = {
    default: { light: '--color-theme-light-default', dark: '--color-theme-dark-default' },
    yellow:  { light: '--color-theme-light-yellow',  dark: '--color-theme-dark-yellow' },
    orange:  { light: '--color-theme-light-orange',  dark: '--color-theme-dark-orange' },
    red:     { light: '--color-theme-light-red',     dark: '--color-theme-dark-red' },
    pink:    { light: '--color-theme-light-pink',    dark: '--color-theme-dark-pink' },
    purple:  { light: '--color-theme-light-purple',  dark: '--color-theme-dark-purple' },
    blue:    { light: '--color-theme-light-blue',    dark: '--color-theme-dark-blue' },
    cyan:    { light: '--color-theme-light-cyan',    dark: '--color-theme-dark-cyan' },
    green:   { light: '--color-theme-light-green',   dark: '--color-theme-dark-green' },
    gray:    { light: '--color-theme-light-gray',    dark: '--color-theme-dark-gray' },
};

export function getNoteColor(colorKey: ColorKey): string {
    const theme = themeState.isDark ? 'dark' : 'light';
    const varName = COLOR_VAR_MAP[colorKey]?.[theme] || COLOR_VAR_MAP.default[theme];

    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();

    return value || getComputedStyle(document.documentElement)
        .getPropertyValue(COLOR_VAR_MAP.default[theme])
        .trim();
}
