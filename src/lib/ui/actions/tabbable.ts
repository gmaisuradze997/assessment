/**
 * Tabbable-element discovery. "Tabbable" (reachable via Tab) is stricter
 * than "focusable": it excludes negative tabindex and elements hidden by
 * layout. Used by the focus trap to find edges and an initial target.
 */
const CANDIDATE_SELECTOR = [
	'a[href]',
	'area[href]',
	'button',
	'input',
	'select',
	'textarea',
	'[tabindex]',
	'audio[controls]',
	'video[controls]',
	'[contenteditable]:not([contenteditable="false"])'
].join(',');

function isDisabled(el: HTMLElement): boolean {
	return (
		(el as HTMLButtonElement | HTMLInputElement).disabled === true ||
		el.getAttribute('aria-disabled') === 'true'
	);
}

/** Hidden by `display:none`/`visibility:hidden`, `hidden`, or `inert`. */
function isVisible(el: HTMLElement): boolean {
	if (el.hidden) return false;
	if (el.closest('[inert]')) return false;
	// offsetParent is null for display:none (and fixed elements — guard that).
	if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
	return getComputedStyle(el).visibility !== 'hidden';
}

/**
 * An unchecked radio is only tabbable when no sibling in its named group
 * is checked (the checked one owns the tab stop for the whole group).
 */
function isUntabbableRadio(el: HTMLElement): boolean {
	const radio = el as HTMLInputElement;
	if (radio.type !== 'radio' || !radio.name) return false;
	const root = radio.form ?? radio.ownerDocument;
	const checked = root.querySelector<HTMLInputElement>(
		`input[type="radio"][name="${CSS.escape(radio.name)}"]:checked`
	);
	return checked != null && checked !== radio;
}

export function getTabbables(container: HTMLElement): HTMLElement[] {
	const nodes = Array.from(container.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR));
	return nodes.filter((el) => {
		if (el.tabIndex < 0) return false;
		if (isDisabled(el)) return false;
		if (isUntabbableRadio(el)) return false;
		return isVisible(el);
	});
}
