import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastState } from '$lib/state/toastState.svelte';

beforeEach(() => {
	vi.useFakeTimers();
	// Clear any toasts left from a previous test.
	for (const t of [...toastState.items]) {
		toastState.removeToast(t.id);
	}
});

afterEach(() => {
	vi.useRealTimers();
});

describe('addToast', () => {
	it('auto-removes the toast after its duration elapses', () => {
		toastState.addToast('hello', 'info', 4000);
		expect(toastState.items).toHaveLength(1);

		vi.advanceTimersByTime(3999);
		expect(toastState.items).toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(toastState.items).toHaveLength(0);
	});

	it('keeps a toast forever when duration is 0', () => {
		toastState.addToast('sticky', 'info', 0);
		vi.advanceTimersByTime(1_000_000);
		expect(toastState.items).toHaveLength(1);
	});

	it('assigns a new incrementing id per toast', () => {
		toastState.addToast('a', 'info', 0);
		toastState.addToast('b', 'info', 0);
		const [first, second] = toastState.items;
		expect(second.id).toBeGreaterThan(first.id);
	});
});

describe('removeToast', () => {
	it('cancels the pending auto-remove timeout', () => {
		const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
		toastState.addToast('x', 'info', 4000);
		const id = toastState.items[0].id;

		toastState.removeToast(id);

		expect(toastState.items).toHaveLength(0);
		expect(clearSpy).toHaveBeenCalled();
	});
});

describe('convenience helpers use distinct default durations', () => {
	it.each([
		['showSuccess', 3000],
		['showError', 6000],
		['showWarning', 5000],
		['showInfo', 4000]
	] as const)('%s defaults to %dms', (method, duration) => {
		toastState[method]('msg');
		expect(toastState.items).toHaveLength(1);

		vi.advanceTimersByTime(duration - 1);
		expect(toastState.items).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(toastState.items).toHaveLength(0);
	});
});
