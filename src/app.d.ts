import type { Locale } from '$lib/i18n/locales';
import type { FeatureFlags } from '$lib/server/flags';
import type { SessionUser } from '$lib/schemas/user';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			locale: Locale;
			user: SessionUser | null;
			flags: FeatureFlags;
		}
		interface PageData {
			locale: Locale;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

// Font binaries imported as Vite assets (used by the OG image endpoint).
declare module '*.woff' {
	const src: string;
	export default src;
}

export {};
