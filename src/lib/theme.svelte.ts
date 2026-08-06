import { browser } from '$app/environment';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

const STORAGE_KEY = 'theme';

function isThemePreference(value: unknown): value is ThemePreference {
	return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/**
 * Mirrors the override the boot script in app.html stamped on <html>
 * before first paint. 'system' means no override — the tokens then follow
 * `color-scheme: light dark`, i.e. the OS.
 *
 * Server-rendered markup always says 'system' because the public pages are
 * prerendered and shared by every visitor; the real value is picked up on
 * import, so the control is correct from hydration onwards. Page colors are
 * never affected — those are applied by the boot script, not by Svelte.
 */
function readPreference(): ThemePreference {
	if (!browser) return 'system';
	const stored = document.documentElement.dataset.theme;
	return isThemePreference(stored) ? stored : 'system';
}

export const theme = $state<{ preference: ThemePreference }>({ preference: readPreference() });

export function setThemePreference(next: ThemePreference): void {
	theme.preference = next;

	const root = document.documentElement;
	root.classList.toggle('theme-light', next === 'light');
	root.classList.toggle('theme-dark', next === 'dark');
	if (next === 'system') {
		delete root.dataset.theme;
	} else {
		root.dataset.theme = next;
	}

	try {
		if (next === 'system') localStorage.removeItem(STORAGE_KEY);
		else localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// Storage can be unavailable (private mode, blocked cookies). The
		// choice still applies to this document, it just won't outlive it.
	}
}
