import { fail, redirect } from '@sveltejs/kit';
import { localizePath, type Locale } from '$lib/i18n/locales';
import { loginFieldErrors, loginSchema } from '$lib/schemas/auth';
import { findUserByEmail } from '$lib/server/data/users';
import { createSessionCookieValue, SESSION_COOKIE, SESSION_TTL_SECONDS } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

/** Only same-origin paths — prevents open-redirect via ?redirectTo=. */
function safeRedirectTarget(target: string | null, locale: Locale): string {
	if (target && target.startsWith('/') && !target.startsWith('//')) return target;
	return localizePath('/dashboard', locale);
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo'), locals.locale));
	}
	return { wasRedirected: url.searchParams.has('redirectTo') };
};

export const actions: Actions = {
	default: async ({ request, cookies, locals, url }) => {
		const form = await request.formData();
		const raw = {
			email: form.get('email'),
			password: form.get('password')
		};

		// Same schema the client validates with — the server is the
		// authoritative boundary, the client check is just fast feedback.
		const parsed = loginSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				fieldErrors: loginFieldErrors(parsed.error),
				email: typeof raw.email === 'string' ? raw.email : ''
			});
		}

		const user = findUserByEmail(parsed.data.email);
		// Plaintext comparison is a documented demo shortcut; the shape of
		// the flow (server-side verification, generic error) is the real part.
		if (!user || user.password !== parsed.data.password) {
			return fail(401, { message: 'login.error' as const, email: parsed.data.email });
		}

		cookies.set(SESSION_COOKIE, await createSessionCookieValue(user.id), {
			path: '/',
			maxAge: SESSION_TTL_SECONDS
		});

		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo'), locals.locale));
	}
};
