import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getNoteColor } from '$lib/utils/theme-utils';
import { themeState } from '$lib/state/themeState.svelte';
import type { ColorKey } from '$lib/types';

// getNoteColor resolves a note colour from CSS custom properties on <html>, keyed
// by the active theme. Seed a few known variables so the selection/fallback logic
// can be asserted deterministically without loading the app's stylesheet.
const root = document.documentElement;
const seeded = {
	'--color-theme-light-default': '#light-default',
	'--color-theme-dark-default': '#dark-default',
	'--color-theme-light-yellow': '#light-yellow',
	'--color-theme-dark-yellow': '#dark-yellow'
	// note: no --color-theme-*-purple, to exercise the empty-value fallback
};

beforeEach(() => {
	for (const [name, value] of Object.entries(seeded)) {
		root.style.setProperty(name, value);
	}
});

afterEach(() => {
	for (const name of Object.keys(seeded)) {
		root.style.removeProperty(name);
	}
	themeState.setTheme('light');
});

describe('getNoteColor', () => {
	it('resolves the light variable in light mode', () => {
		themeState.setTheme('light');
		expect(getNoteColor('yellow')).toBe('#light-yellow');
	});

	it('resolves the dark variable in dark mode', () => {
		themeState.setTheme('dark');
		expect(getNoteColor('yellow')).toBe('#dark-yellow');
	});

	it('falls back to the default colour for an unknown key', () => {
		themeState.setTheme('light');
		expect(getNoteColor('bogus' as ColorKey)).toBe('#light-default');
	});

	it('falls back to the default colour when the variable is unset', () => {
		themeState.setTheme('light');
		// purple has no seeded variable -> empty -> default.
		expect(getNoteColor('purple')).toBe('#light-default');
	});
});
