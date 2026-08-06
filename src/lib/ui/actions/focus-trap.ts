import type { Action } from 'svelte/action';
import { getTabbables } from './tabbable';

export interface FocusTrapOptions {
	/** Turn the trap off without tearing down the node. */
	enabled?: boolean;
	/** Element (or getter) to focus on activation; defaults to first tabbable. */
	initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
	/** Restore focus here on destroy; defaults to the previously focused element. */
	returnFocus?: HTMLElement | null;
}

/**
 * Confines Tab focus to `node`. Wraps at both edges, re-captures focus if
 * it escapes to the browser chrome and back, focuses an initial target on
 * activation, and restores focus to the trigger on teardown. Deliberately
 * hand-rolled (no library) so the behavior is explicit and auditable.
 */
export const focusTrap: Action<HTMLElement, FocusTrapOptions | undefined> = (node, options) => {
	let opts: FocusTrapOptions = options ?? {};
	const previouslyFocused = document.activeElement as HTMLElement | null;

	function focusInitial() {
		const target =
			typeof opts.initialFocus === 'function' ? opts.initialFocus() : opts.initialFocus;
		if (target) {
			target.focus();
			return;
		}
		const tabbables = getTabbables(node);
		(tabbables[0] ?? node).focus();
	}

	function onKeydown(event: KeyboardEvent) {
		if (opts.enabled === false || event.key !== 'Tab') return;

		const tabbables = getTabbables(node);
		if (tabbables.length === 0) {
			// Nothing tabbable inside: keep focus on the container itself.
			event.preventDefault();
			node.focus();
			return;
		}

		const first = tabbables[0];
		const last = tabbables[tabbables.length - 1];
		const active = document.activeElement;

		if (event.shiftKey) {
			if (active === first || !node.contains(active)) {
				event.preventDefault();
				last.focus();
			}
		} else if (active === last || !node.contains(active)) {
			event.preventDefault();
			first.focus();
		}
	}

	// Focus left the trap without a Tab we saw (programmatic move, chrome
	// round-trip): pull it back to the nearest edge.
	function onFocusIn(event: FocusEvent) {
		if (opts.enabled === false) return;
		if (node.contains(event.target as Node)) return;
		const tabbables = getTabbables(node);
		(tabbables[0] ?? node).focus();
	}

	// Ensure the container can receive focus as a fallback.
	if (!node.hasAttribute('tabindex')) node.tabIndex = -1;

	// Defer so the node (and any transition) is laid out before focusing.
	queueMicrotask(focusInitial);

	node.addEventListener('keydown', onKeydown);
	document.addEventListener('focusin', onFocusIn, true);

	return {
		update(next) {
			opts = next ?? {};
		},
		destroy() {
			node.removeEventListener('keydown', onKeydown);
			document.removeEventListener('focusin', onFocusIn, true);
			const restore = opts.returnFocus ?? previouslyFocused;
			restore?.focus?.();
		}
	};
};
