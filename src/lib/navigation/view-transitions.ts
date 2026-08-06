import { browser } from '$app/environment';
import { onNavigate } from '$app/navigation';

/**
 * Wire the View Transitions API into SvelteKit navigations.
 *
 * Used for continuity, not decoration: shared `view-transition-name`s on the
 * site header, dashboard chrome, and blog post titles keep those elements
 * morphing in place while the rest of the page crossfades. Skipped when the
 * API is missing or the user prefers reduced motion.
 */
export function enableViewTransitions(): void {
	if (!browser) return;

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
}
