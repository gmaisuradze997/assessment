import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('./sample', () => ({
	RUM_SAMPLE_RATE: 1,
	ERROR_SAMPLE_RATE: 1,
	shouldSampleRum: () => true,
	shouldSampleError: () => true
}));

describe('postBeacon', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it('prefers navigator.sendBeacon', async () => {
		const sendBeacon = vi.fn().mockReturnValue(true);
		vi.stubGlobal('navigator', { sendBeacon });
		vi.stubGlobal('window', { location: { href: 'http://localhost/en' } });

		const { reportVital } = await import('./report');
		reportVital({ name: 'TTFB', value: 12, id: 't1', rating: 'good' });

		expect(sendBeacon).toHaveBeenCalledOnce();
		const [url, blob] = sendBeacon.mock.calls[0] as [string, Blob];
		expect(url).toBe('/api/beacon');
		expect(blob).toBeInstanceOf(Blob);
	});
});
