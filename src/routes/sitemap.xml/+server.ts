import { PUBLIC_SITE_URL } from '$env/static/public';
import { DEFAULT_LOCALE, LOCALES, localizePath, type Locale } from '$lib/i18n/locales';
import { posts } from '$lib/server/data/db';
import type { RequestHandler } from './$types';

export const prerender = true;

interface Entry {
	/** Locale-less path, e.g. "/blog/my-post". */
	path: string;
	lastmod?: string;
}

/** Public, indexable pages. Login and the auth-gated dashboard are excluded. */
function collectEntries(): Entry[] {
	return [
		{ path: '/' },
		{ path: '/blog' },
		...posts.map((post) => ({
			path: `/blog/${post.slug}`,
			lastmod: post.publishedAt.slice(0, 10)
		}))
	];
}

const xmlEscape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const absoluteUrl = (path: string, locale: Locale) =>
	xmlEscape(`${PUBLIC_SITE_URL}${localizePath(path, locale)}`);

function urlElement(entry: Entry, locale: Locale): string {
	const alternates = [
		...LOCALES.map(
			(alt) =>
				`<xhtml:link rel="alternate" hreflang="${alt}" href="${absoluteUrl(entry.path, alt)}"/>`
		),
		`<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(entry.path, DEFAULT_LOCALE)}"/>`
	].join('\n\t\t');

	const lastmod = entry.lastmod ? `\n\t\t<lastmod>${entry.lastmod}</lastmod>` : '';

	return `\t<url>\n\t\t<loc>${absoluteUrl(entry.path, locale)}</loc>${lastmod}\n\t\t${alternates}\n\t</url>`;
}

export const GET: RequestHandler = () => {
	const entries = collectEntries();
	const urls = LOCALES.flatMap((locale) => entries.map((entry) => urlElement(entry, locale)));

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		'</urlset>',
		''
	].join('\n');

	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
