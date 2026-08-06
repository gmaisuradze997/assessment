import { page } from '$app/state';
import { DEFAULT_LOCALE, type Locale } from './locales';
import type { MessageKey } from './messages';
import { translate, type MessageParams } from './translate';

/**
 * Component-side translator. Reads the locale from reactive page state,
 * so any markup using t() re-renders when the user switches locale —
 * no store subscriptions or prop drilling needed. SSR-safe: page state
 * is request-scoped in SvelteKit.
 */
export function t(key: MessageKey, params?: MessageParams): string {
	return translate(currentLocale(), key, params);
}

export function currentLocale(): Locale {
	return (page.data.locale as Locale | undefined) ?? DEFAULT_LOCALE;
}
