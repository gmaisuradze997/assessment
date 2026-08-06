import { redirect } from '@sveltejs/kit';
import { localizePath } from '$lib/i18n/locales';
import { SESSION_COOKIE } from '$lib/server/session';
import type { Actions } from './$types';

/** POST-only: logout mutates state, so it must not be reachable via GET links. */
export const actions: Actions = {
	default: ({ cookies, locals }) => {
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, localizePath('/', locals.locale));
	}
};
