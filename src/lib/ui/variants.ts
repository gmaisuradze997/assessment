import { cx, type ClassValue } from './cx';

/**
 * Tiny typed variant factory in the spirit of `cva`, without the
 * dependency. Given a base class plus named variant groups, it returns a
 * resolver that maps a props object to a class string, filling in
 * defaults and appending a caller `class` override last.
 *
 * The generic plumbing exists so call sites get full autocomplete and a
 * type error when a variant value is misspelled — e.g. Button's
 * `variant`/`tone`/`size` values are checked at compile time.
 */
type VariantGroups = Record<string, Record<string, string>>;

/** Selected value per group (all optional; defaults fill the gaps). */
export type VariantProps<G extends VariantGroups> = {
	[K in keyof G]?: keyof G[K];
};

interface VariantConfig<G extends VariantGroups> {
	base?: string;
	variants: G;
	defaults?: VariantProps<G>;
}

export function variants<G extends VariantGroups>(config: VariantConfig<G>) {
	const { base, variants: groups, defaults } = config;

	return (props?: VariantProps<G> & { class?: ClassValue }): string => {
		const classes: ClassValue[] = [base];

		for (const group in groups) {
			const selected = props?.[group] ?? defaults?.[group];
			if (selected == null) continue;
			classes.push(groups[group][selected as string]);
		}

		classes.push(props?.class);
		return cx(...classes);
	};
}

/**
 * Shared focus-visible ring. Keyboard focus only (`focus-visible`), so a
 * mouse click never paints the ring. Uses `--accent` (not the softer
 * `--ring`) so the indicator clears WCAG 1.4.11 non-text contrast (≥3:1)
 * against page/surface backgrounds in both themes. Offset keeps the ring
 * legible on filled controls. Every interactive primitive composes this
 * instead of re-deriving the same utilities.
 */
export const FOCUS_RING =
	'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Sibling of a `peer` control (e.g. visually-hidden checkbox) — paints the
 * same AA focus ring when the peer receives keyboard focus.
 */
export const PEER_FOCUS_RING =
	'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background';
