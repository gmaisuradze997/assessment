export const LOCALES = ['en', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value);
}

/** Prefix a locale-less path for the given locale. */
export function localizePath(path: string, locale: Locale): string {
	return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** Strip a locale prefix from a pathname, returning the locale and bare path. */
export function splitLocaleFromPath(pathname: string): { locale: Locale; path: string } {
	const [, first, ...rest] = pathname.split('/');
	if (first && isLocale(first)) {
		const path = `/${rest.join('/')}`;
		return { locale: first, path };
	}
	return { locale: DEFAULT_LOCALE, path: pathname };
}
