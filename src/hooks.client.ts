import type { HandleClientError } from '@sveltejs/kit';
import { captureException } from '$lib/observability/sentry';

/** Client-side error boundary hook — reports into the same beacon as RUM. */
export const handleError: HandleClientError = ({ error, status, message }) => {
	captureException(error instanceof Error ? error : message, {
		status,
		source: 'handleError'
	});

	return { message };
};
