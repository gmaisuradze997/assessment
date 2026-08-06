import { describe, expect, it } from 'vitest';
import { beaconEventSchema } from './schema';

describe('beaconEventSchema', () => {
	it('accepts a vital event', () => {
		const parsed = beaconEventSchema.parse({
			type: 'vital',
			name: 'LCP',
			value: 1234,
			id: 'v1',
			rating: 'good',
			url: 'http://localhost/en',
			ts: Date.now(),
			sampleRate: 0.25
		});
		expect(parsed.type).toBe('vital');
		if (parsed.type === 'vital') expect(parsed.name).toBe('LCP');
	});

	it('accepts an error event', () => {
		const parsed = beaconEventSchema.parse({
			type: 'error',
			message: 'boom',
			source: 'boundary',
			status: 500,
			url: 'http://localhost/en',
			ts: Date.now(),
			sampleRate: 1
		});
		expect(parsed.type).toBe('error');
	});

	it('rejects unknown vital names', () => {
		expect(() =>
			beaconEventSchema.parse({
				type: 'vital',
				name: 'FCP',
				value: 1,
				id: 'x',
				url: 'http://localhost/en',
				ts: Date.now(),
				sampleRate: 1
			})
		).toThrow();
	});
});
