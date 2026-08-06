import type { Action } from 'svelte/action';

/**
 * Relocates the node to `document.body` (or a given target) so overlays
 * escape ancestor `overflow`, `transform`, and stacking contexts. The
 * node is removed on destroy. SSR-safe: actions never run on the server,
 * and the composites that use this only mount their content client-side.
 */
export const portal: Action<HTMLElement, HTMLElement | string | undefined> = (node, target) => {
	function resolve(t: HTMLElement | string | undefined): HTMLElement {
		if (t instanceof HTMLElement) return t;
		if (typeof t === 'string') {
			const found = document.querySelector<HTMLElement>(t);
			if (found) return found;
		}
		return document.body;
	}

	let host = resolve(target);
	host.appendChild(node);

	return {
		update(next) {
			host = resolve(next);
			host.appendChild(node);
		},
		destroy() {
			node.remove();
		}
	};
};
