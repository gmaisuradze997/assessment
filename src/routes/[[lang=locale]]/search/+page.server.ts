import { redirect } from '@sveltejs/kit';
import { localizePath } from '$lib/i18n/locales';
import type { PageServerLoad } from './$types';

/** /search merged into /blog — keep old URLs working. */
export const load: PageServerLoad = ({ url, locals }) => {
	throw redirect(301, `${localizePath('/blog', locals.locale)}${url.search}`);
};
