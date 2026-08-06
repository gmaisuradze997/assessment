import { reportErrorEvent } from './report';

/**
 * Sentry-shaped stub: same call sites you'd use with `@sentry/sveltekit`,
 * but the sink is our `/api/beacon` endpoint (console-log on the server).
 */
export function captureException(
	error: unknown,
	context?: { status?: number; source?: 'boundary' | 'handleError' | 'window' | 'rejection' }
): void {
	if (error instanceof Error) {
		reportErrorEvent({
			message: error.message,
			name: error.name,
			stack: error.stack,
			status: context?.status,
			source: context?.source
		});
		return;
	}

	reportErrorEvent({
		message: typeof error === 'string' ? error : 'Unknown error',
		status: context?.status,
		source: context?.source
	});
}

export function captureMessage(message: string, status?: number): void {
	reportErrorEvent({ message, status, source: 'boundary' });
}
