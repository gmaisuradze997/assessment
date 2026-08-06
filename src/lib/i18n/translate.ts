import { dictionaries, type MessageKey } from './messages';
import { DEFAULT_LOCALE, type Locale } from './locales';

export type MessageParams = Record<string, string | number>;

/**
 * Pure translation function for use in load functions and server code,
 * where the locale is explicit. Components use t() from runtime.svelte.ts
 * which resolves the locale from page state.
 */
export function translate(locale: Locale, key: MessageKey, params?: MessageParams): string {
	const message = dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
	if (!params) return message;
	return message.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in params ? String(params[name]) : match
	);
}
