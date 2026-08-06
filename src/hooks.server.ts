import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { localizePath, splitLocaleFromPath } from '$lib/i18n/locales';
import { getUserById } from '$lib/server/data/users';
import {
	FLAG_COOKIE,
	defaultFlags,
	parseFlagOverride,
	parseFlagsCookie,
	writeFlagsCookie
} from '$lib/server/flags';
import { SESSION_COOKIE, verifySessionCookieValue } from '$lib/server/session';

/** Resolve the locale from the URL prefix and stamp it on <html lang>. */
const handleLocale: Handle = ({ event, resolve }) => {
	const { locale } = splitLocaleFromPath(event.url.pathname);
	event.locals.locale = locale;
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};

const handleFlags: Handle = ({ event, resolve }) => {
	if (building) {
		event.locals.flags = defaultFlags();
		return resolve(event);
	}

	const flags = parseFlagsCookie(event.cookies.get(FLAG_COOKIE));
	const override = event.url.searchParams.get('ff');
	if (override !== null) {
		const parsed = parseFlagOverride(override);
		if (parsed) {
			flags[parsed.name] = parsed.enabled;
			writeFlagsCookie(event.cookies, flags, {
				secure: event.url.protocol === 'https:'
			});
		}
		const clean = new URL(event.url);
		clean.searchParams.delete('ff');
		redirect(303, clean.pathname + clean.search);
	}

	event.locals.flags = flags;
	return resolve(event);
};

/** Verify the session cookie on every request and expose the user via locals. */
const handleSession: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	const cookie = event.cookies.get(SESSION_COOKIE);
	if (cookie) {
		const userId = await verifySessionCookieValue(cookie);
		const user = userId ? getUserById(userId) : undefined;
		if (user) {
			event.locals.user = user;
		} else {
			// Tampered, expired, or orphaned cookie — clear it.
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}
	return resolve(event);
};

/**
 * Auth guard lives in the handle hook, not in a layout load: layout loads
 * do not re-run for every child navigation and can be bypassed by direct
 * endpoint hits. Here it covers pages, actions, and future API routes.
 */
const handleAuthGuard: Handle = ({ event, resolve }) => {
	// The prerender crawler follows the public header's /dashboard link.
	// No protected page is prerendered, so the guard is a no-op at build
	// time (and url.search is not accessible then anyway).
	if (building) return resolve(event);

	const { locale, path } = splitLocaleFromPath(event.url.pathname);
	const isProtected = path === '/dashboard' || path.startsWith('/dashboard/');
	if (isProtected && !event.locals.user) {
		const redirectTo = event.url.pathname + event.url.search;
		redirect(303, `${localizePath('/login', locale)}?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	return resolve(event);
};

export const handle = sequence(handleLocale, handleFlags, handleSession, handleAuthGuard);
