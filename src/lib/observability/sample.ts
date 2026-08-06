import { browser } from '$app/environment';
import { PUBLIC_RUM_SAMPLE_RATE } from '$env/static/public';

/**
 * Session-sticky RUM sampling: one coin flip per page load so LCP/INP/CLS/TTFB
 * from the same visit are kept or dropped together. Client errors use a
 * separate (default: always-on) rate so rare failures aren't starved by the
 * vitals budget.
 */

function clampRate(raw: string | undefined, fallback: number): number {
	const n = Number(raw);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(1, Math.max(0, n));
}

export const RUM_SAMPLE_RATE = clampRate(PUBLIC_RUM_SAMPLE_RATE, 0.25);
/** Errors are rare; keep them unless explicitly dialed down. */
export const ERROR_SAMPLE_RATE = 1;

let rumSession: boolean | null = null;
let errorSession: boolean | null = null;

/** Test seam — reset sticky decisions between vitest cases. */
export function resetSamplingForTests(): void {
	rumSession = null;
	errorSession = null;
}

function decide(rate: number): boolean {
	if (!browser) return false;
	if (rate <= 0) return false;
	if (rate >= 1) return true;
	return Math.random() < rate;
}

export function shouldSampleRum(): boolean {
	if (rumSession === null) rumSession = decide(RUM_SAMPLE_RATE);
	return rumSession;
}

export function shouldSampleError(): boolean {
	if (errorSession === null) errorSession = decide(ERROR_SAMPLE_RATE);
	return errorSession;
}
