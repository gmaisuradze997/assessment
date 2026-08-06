import type { Action } from 'svelte/action';

export interface DismissOptions {
	enabled?: boolean;
	onDismiss: (reason: 'escape' | 'outside') => void;
	/** Pointerdowns on this element (the opener) are ignored. */
	trigger?: HTMLElement | (() => HTMLElement | null) | null;
	closeOnEscape?: boolean;
	closeOnOutside?: boolean;
}

interface Layer {
	node: HTMLElement;
	opts: DismissOptions;
}

// Shared stack so nested overlays dismiss top-down: one Escape closes only
// the topmost layer, matching native dialog/menu behavior.
const stack: Layer[] = [];

function onKeydown(event: KeyboardEvent) {
	if (event.key !== 'Escape') return;
	// Walk from the top so disabled / non-escaping layers (e.g. closed
	// filter popovers that stay mounted) don't trap Escape for the
	// active overlay underneath.
	for (let i = stack.length - 1; i >= 0; i--) {
		const layer = stack[i];
		if (layer.opts.enabled === false || layer.opts.closeOnEscape === false) continue;
		event.stopPropagation();
		layer.opts.onDismiss('escape');
		return;
	}
}

function onPointerDown(event: PointerEvent) {
	const target = event.target as Node;
	for (let i = stack.length - 1; i >= 0; i--) {
		const layer = stack[i];
		if (layer.opts.enabled === false || layer.opts.closeOnOutside === false) continue;

		if (layer.node.contains(target)) return;

		const trigger =
			typeof layer.opts.trigger === 'function' ? layer.opts.trigger() : layer.opts.trigger;
		if (trigger && trigger.contains(target)) return;

		layer.opts.onDismiss('outside');
		return;
	}
}

function attachGlobal() {
	if (stack.length !== 1) return;
	// Capture phase for Escape so we win over inner handlers; pointerdown
	// (not click) so we react before focus/selection side effects.
	document.addEventListener('keydown', onKeydown, true);
	document.addEventListener('pointerdown', onPointerDown, true);
}

function detachGlobal() {
	if (stack.length !== 0) return;
	document.removeEventListener('keydown', onKeydown, true);
	document.removeEventListener('pointerdown', onPointerDown, true);
}

/** Closes an overlay on Escape (topmost only) or an outside pointerdown. */
export const dismiss: Action<HTMLElement, DismissOptions> = (node, options) => {
	const layer: Layer = { node, opts: options };
	stack.push(layer);
	attachGlobal();

	return {
		update(next) {
			layer.opts = next;
		},
		destroy() {
			const index = stack.indexOf(layer);
			if (index !== -1) stack.splice(index, 1);
			detachGlobal();
		}
	};
};
