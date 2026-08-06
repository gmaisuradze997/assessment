import { redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import { DEFAULT_LOCALE, localizePath } from '$lib/i18n/locales';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, params, url }) => {
	if (!params.lang) {
		// url.search is not readable while prerendering — and the only bare
		// path seen at build time ('/') has no query string anyway.
		const search = building ? '' : url.search;
		redirect(308, localizePath(url.pathname, DEFAULT_LOCALE) + search);
	}
	return { locale: locals.locale, user: locals.user };
};
