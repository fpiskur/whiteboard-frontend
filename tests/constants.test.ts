import { describe, expect, it } from 'vitest';
import { AUTO_PAN, INTERACTION } from '$lib/state/constants';

// Guard test for a known maintainability issue: AUTO_PAN is defined twice —
// once at the top level and once nested under INTERACTION. They are identical
// today; this test fails if the two copies ever drift out of sync, prompting a
// consolidation. See the plan's "Known bugs" section (item 3).
describe('AUTO_PAN constant duplication', () => {
	it('keeps the top-level AUTO_PAN in sync with INTERACTION.AUTO_PAN', () => {
		expect(AUTO_PAN).toEqual(INTERACTION.AUTO_PAN);
	});
});
