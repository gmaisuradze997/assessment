import { browser } from '$app/environment';
import { captureException } from './sentry';
import { initRum } from './rum';

let started = false;

export function initObservability(): void {
	if (!browser || started) return;
	started = true;

	if (navigator.webdriver) return;

	void initRum();

	window.addEventListener('error', (event) => {
		captureException(event.error ?? event.message, { source: 'window' });
	});

	window.addEventListener('unhandledrejection', (event) => {
		captureException(event.reason, { source: 'rejection' });
	});
}
