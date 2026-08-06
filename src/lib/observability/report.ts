import { browser } from '$app/environment';
import type { BeaconEvent } from './schema';
import { ERROR_SAMPLE_RATE, RUM_SAMPLE_RATE, shouldSampleError, shouldSampleRum } from './sample';

const BEACON_PATH = '/api/beacon';

function pageUrl(): string {
	return browser ? window.location.href : '';
}

/** Transport: `sendBeacon` when available, else keepalive fetch. */
export function postBeacon(event: BeaconEvent): void {
	if (!browser) return;

	const body = JSON.stringify(event);
	const blob = new Blob([body], { type: 'application/json' });

	try {
		if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
			const queued = navigator.sendBeacon(BEACON_PATH, blob);
			if (queued) return;
		}
		void fetch(BEACON_PATH, {
			method: 'POST',
			body,
			headers: { 'content-type': 'application/json' },
			keepalive: true,
			credentials: 'same-origin'
		});
	} catch {
		// Observability must never break the page.
	}
}

export function reportVital(
	metric: Pick<Extract<BeaconEvent, { type: 'vital' }>, 'name' | 'value' | 'id' | 'rating'> & {
		navigationType?: string;
	}
): void {
	if (!shouldSampleRum()) return;
	postBeacon({
		type: 'vital',
		name: metric.name,
		value: metric.value,
		id: metric.id,
		rating: metric.rating,
		navigationType: metric.navigationType,
		url: pageUrl(),
		ts: Date.now(),
		sampleRate: RUM_SAMPLE_RATE
	});
}

let lastErrorKey = '';
let lastErrorAt = 0;

export function reportErrorEvent(input: {
	message: string;
	name?: string;
	stack?: string;
	status?: number;
	source?: Extract<BeaconEvent, { type: 'error' }>['source'];
}): void {
	if (!shouldSampleError()) return;

	// handleError + +error.svelte can both see the same failure within one tick.
	const key = `${input.status ?? ''}:${input.message}`;
	const now = Date.now();
	if (key === lastErrorKey && now - lastErrorAt < 2000) return;
	lastErrorKey = key;
	lastErrorAt = now;

	postBeacon({
		type: 'error',
		message: input.message,
		name: input.name,
		stack: input.stack,
		status: input.status,
		url: pageUrl(),
		ts: now,
		sampleRate: ERROR_SAMPLE_RATE,
		source: input.source
	});
}
