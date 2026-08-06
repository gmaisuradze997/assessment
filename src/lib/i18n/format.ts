import type { Locale } from './locales';

const INTL_LOCALES: Record<Locale, string> = { en: 'en-US', de: 'de-DE' };

export function formatCurrency(locale: Locale, value: number): string {
	return new Intl.NumberFormat(INTL_LOCALES[locale], {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(value);
}

export function formatNumber(locale: Locale, value: number): string {
	return new Intl.NumberFormat(INTL_LOCALES[locale]).format(value);
}

export function formatPercent(locale: Locale, ratio: number): string {
	return new Intl.NumberFormat(INTL_LOCALES[locale], {
		style: 'percent',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(ratio);
}

export function formatDate(locale: Locale, iso: string): string {
	return new Intl.DateTimeFormat(INTL_LOCALES[locale], { dateStyle: 'medium' }).format(
		new Date(iso)
	);
}
