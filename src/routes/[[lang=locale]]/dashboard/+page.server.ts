import { fail, redirect } from '@sveltejs/kit';
import { getItemsStats } from '$lib/server/data/items';
import {
	FLAG_COOKIE,
	parseFlagOverride,
	parseFlagsCookie,
	writeFlagsCookie
} from '$lib/server/flags';
import type { Actions, PageServerLoad } from './$types';

/**
 * The overview is cheap (a handful of aggregates), so it is awaited —
 * streaming here would add a skeleton flash for no benefit. Contrast with
 * /dashboard/items, where the expensive row query is streamed.
 */
export const load: PageServerLoad = () => {
	return { stats: getItemsStats() };
};

export const actions: Actions = {
	flags: async ({ request, cookies, url }) => {
		const raw = String((await request.formData()).get('ff') ?? '');
		const parsed = parseFlagOverride(raw);
		if (!parsed) return fail(400);

		const flags = parseFlagsCookie(cookies.get(FLAG_COOKIE));
		flags[parsed.name] = parsed.enabled;
		writeFlagsCookie(cookies, flags, { secure: url.protocol === 'https:' });

		redirect(303, url.pathname + url.search);
	}
};
