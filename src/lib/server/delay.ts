import { dev } from '$app/environment';

/**
 * The mock "API" is an in-process array, so reads resolve in microseconds
 * and streamed SSR would never visibly stream. This simulates realistic
 * backend latency so skeletons, optimistic UI, and rollback are actually
 * observable. Kept in prod builds on purpose — the live demo should show
 * the streaming behavior too.
 *
 * Prod default is 500ms so dashboard LCP keeps headroom under the mobile
 * budget: LHCI's vite preview holds the document stream open until deferred
 * data resolves, and Lantern's simulated LCP tracks that held-open body.
 */
export function simulateLatency(ms = dev ? 600 : 500): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
