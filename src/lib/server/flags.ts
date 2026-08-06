import type { Cookies } from '@sveltejs/kit';

export const FLAG_COOKIE = 'ff';

/** Known flags. Add a key here and it becomes available on locals.flags. */
export const FLAG_NAMES = ['betaInsights'] as const;
export type FlagName = (typeof FLAG_NAMES)[number];
export type FeatureFlags = Record<FlagName, boolean>;

const FLAG_SET = new Set<string>(FLAG_NAMES);
const FLAG_MAX_AGE = 60 * 60 * 24 * 365;

export function defaultFlags(): FeatureFlags {
	return { betaInsights: false };
}

export function parseFlagsCookie(value: string | undefined): FeatureFlags {
	const flags = defaultFlags();
	if (!value) return flags;
	for (const token of value.split(',')) {
		const name = token.trim();
		if (FLAG_SET.has(name)) {
			flags[name as FlagName] = true;
		}
	}
	return flags;
}

export function serializeFlagsCookie(flags: FeatureFlags): string {
	return FLAG_NAMES.filter((name) => flags[name]).join(',');
}

export function parseFlagOverride(raw: string): { name: FlagName; enabled: boolean } | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const enabled = !trimmed.startsWith('-');
	const name = (enabled ? trimmed : trimmed.slice(1)) as FlagName;
	if (!FLAG_SET.has(name)) return null;
	return { name, enabled };
}

/** Persist flags to the HttpOnly cookie (or clear it when all are off). */
export function writeFlagsCookie(
	cookies: Cookies,
	flags: FeatureFlags,
	opts: { secure: boolean }
): void {
	const value = serializeFlagsCookie(flags);
	if (value) {
		cookies.set(FLAG_COOKIE, value, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: opts.secure,
			maxAge: FLAG_MAX_AGE
		});
	} else {
		cookies.delete(FLAG_COOKIE, { path: '/' });
	}
}
