import { browser } from '$app/environment';
import { reportVital } from './report';
import { shouldSampleRum } from './sample';

let started = false;

/**
 * Wire `web-vitals` → beacon. Dynamic import keeps the library out of the
 * critical path for sessions that aren't sampled.
 */
export async function initRum(): Promise<void> {
	if (!browser || started) return;
	started = true;

	if (!shouldSampleRum()) return;

	const { onCLS, onINP, onLCP, onTTFB } = await import('web-vitals');

	const ship =
		(name: 'LCP' | 'INP' | 'CLS' | 'TTFB') =>
		(metric: {
			value: number;
			id: string;
			rating?: 'good' | 'needs-improvement' | 'poor';
			navigationType?: string;
		}) => {
			reportVital({
				name,
				value: metric.value,
				id: metric.id,
				rating: metric.rating,
				navigationType: metric.navigationType
			});
		};

	onLCP(ship('LCP'));
	onINP(ship('INP'));
	onCLS(ship('CLS'));
	onTTFB(ship('TTFB'));
}
