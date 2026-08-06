/**
 * Minimal class-name joiner. Filters out falsy parts and joins the rest
 * with single spaces. Intentionally not `clsx`: the dependency (and its
 * bundle cost) buys object/array syntax we do not need here, and every
 * primitive already appends its `class` prop last so Tailwind's cascade
 * resolves the handful of overrides we actually use.
 */
export type ClassValue = string | false | null | undefined;

export function cx(...parts: ClassValue[]): string {
	let out = '';
	for (const part of parts) {
		if (!part) continue;
		out = out ? `${out} ${part}` : part;
	}
	return out;
}
