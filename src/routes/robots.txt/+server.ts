import { PUBLIC_SITE_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

/**
 * A route instead of a static file so the Sitemap line can carry the
 * deployment's absolute origin (PUBLIC_SITE_URL). Prerendered, so it is
 * still written once at build time and served statically.
 *
 * Everything is crawlable on purpose: the dashboard is auth-gated and the
 * handle hook 303-redirects anonymous requests (crawlers included) to
 * /login, so a Disallow would only hide the redirect — and it would fail
 * Lighthouse's is-crawlable audit on the authenticated LHCI run.
 */
export const prerender = true;

export const GET: RequestHandler = () => {
	const body = [
		'User-agent: *',
		'Disallow:',
		'',
		`Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml`,
		''
	].join('\n');

	return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
