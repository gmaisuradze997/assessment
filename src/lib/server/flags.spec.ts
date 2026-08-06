import { describe, expect, it } from 'vitest';
import { defaultFlags, parseFlagOverride, parseFlagsCookie, serializeFlagsCookie } from './flags';

describe('parseFlagsCookie', () => {
	it('returns all flags off for missing/empty values', () => {
		expect(parseFlagsCookie(undefined)).toEqual(defaultFlags());
		expect(parseFlagsCookie('')).toEqual({ betaInsights: false });
	});

	it('enables known flags and ignores unknown ones', () => {
		expect(parseFlagsCookie('betaInsights')).toEqual({ betaInsights: true });
		expect(parseFlagsCookie('betaInsights,nope')).toEqual({ betaInsights: true });
		expect(parseFlagsCookie('nope')).toEqual({ betaInsights: false });
	});
});

describe('serializeFlagsCookie', () => {
	it('round-trips enabled flags', () => {
		const enabled = { betaInsights: true };
		expect(parseFlagsCookie(serializeFlagsCookie(enabled))).toEqual(enabled);
		expect(serializeFlagsCookie({ betaInsights: false })).toBe('');
	});
});

describe('parseFlagOverride', () => {
	it('parses enable and disable tokens', () => {
		expect(parseFlagOverride('betaInsights')).toEqual({
			name: 'betaInsights',
			enabled: true
		});
		expect(parseFlagOverride('-betaInsights')).toEqual({
			name: 'betaInsights',
			enabled: false
		});
	});

	it('rejects unknown names', () => {
		expect(parseFlagOverride('unknown')).toBeNull();
		expect(parseFlagOverride('')).toBeNull();
	});
});
