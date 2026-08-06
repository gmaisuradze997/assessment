import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

describe('shouldSampleRum', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it('is sticky for the session', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0); // always < rate
		const { resetSamplingForTests, shouldSampleRum } = await import('./sample');
		resetSamplingForTests();
		expect(shouldSampleRum()).toBe(true);
		vi.spyOn(Math, 'random').mockReturnValue(0.99);
		expect(shouldSampleRum()).toBe(true);
	});

	it('drops the session when the coin flip loses', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.99);
		const { resetSamplingForTests, shouldSampleRum, RUM_SAMPLE_RATE } = await import('./sample');
		resetSamplingForTests();
		if (RUM_SAMPLE_RATE >= 1) {
			expect(shouldSampleRum()).toBe(true);
			return;
		}
		expect(shouldSampleRum()).toBe(false);
		expect(shouldSampleRum()).toBe(false);
	});
});
