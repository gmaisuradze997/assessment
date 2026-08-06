/**
 * Reference-counted document scroll lock. Multiple open overlays share
 * one lock; the body is only restored when the last one releases. The
 * scrollbar width is replaced with padding so removing the scrollbar does
 * not shift layout (and fixed headers do not jump).
 */
let locks = 0;
let previousOverflow = '';
let previousPaddingRight = '';

function scrollbarWidth(): number {
	return window.innerWidth - document.documentElement.clientWidth;
}

export function lockScroll(): void {
	if (typeof document === 'undefined') return;
	if (locks === 0) {
		const { style } = document.body;
		previousOverflow = style.overflow;
		previousPaddingRight = style.paddingRight;

		const gap = scrollbarWidth();
		if (gap > 0) {
			const current = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
			style.paddingRight = `${current + gap}px`;
		}
		style.overflow = 'hidden';
	}
	locks += 1;
}

export function unlockScroll(): void {
	if (typeof document === 'undefined' || locks === 0) return;
	locks -= 1;
	if (locks === 0) {
		document.body.style.overflow = previousOverflow;
		document.body.style.paddingRight = previousPaddingRight;
	}
}
