import { error } from '@sveltejs/kit';
import { read } from '$app/server';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff';
import { formatDate } from '$lib/i18n/format';
import { posts } from '$lib/server/data/db';
import { getPostBySlug } from '$lib/server/data/posts';
import type { EntryGenerator, RequestHandler } from './$types';

/**
 * Per-post, per-locale Open Graph images (1200×630), rendered with
 * satori + resvg and **prerendered at build time** rather than served
 * from an edge function. The trade-off is easy here: post content is
 * repo-versioned and the slug set is closed, so every image is knowable
 * at build. Prerendering makes them plain static files on the CDN —
 * zero runtime latency for link-preview crawlers (which won't wait
 * long), no cold starts, no font-loading at request time, and satori/
 * resvg stay out of the server bundle entirely. An edge function only
 * earns its keep when the input space is open (user content, unknown at
 * build) — that's the moment this route flips to `prerender = 'auto'`
 * and moves the rendering cost to request time.
 */
export const prerender = true;

export const entries: EntryGenerator = () =>
	posts.flatMap((post) => [
		{ lang: 'en', slug: post.slug },
		{ lang: 'de', slug: post.slug }
	]);

const WIDTH = 1200;
const HEIGHT = 630;

// Satori accepts TTF/OTF/WOFF. The files are Vite assets resolved via
// read(), so they exist only at build time and ship with no output.
const fontRegular = read(inter400).arrayBuffer();
const fontBold = read(inter700).arrayBuffer();

/** Minimal element factory — satori consumes React-shaped object trees. */
function el(
	type: string,
	style: Record<string, string | number>,
	children?: unknown
): { type: string; props: Record<string, unknown> } {
	return { type, props: { style, children } };
}

const truncate = (text: string, max: number) =>
	text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

export const GET: RequestHandler = async ({ params, locals }) => {
	const post = getPostBySlug(params.slug, locals.locale);
	if (!post) error(404);

	const title = truncate(post.title, 90);
	const excerpt = truncate(post.excerpt, 150);
	const meta = `${post.author.name} · ${formatDate(locals.locale, post.publishedAt)}`;

	const tree = el(
		'div',
		{
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: '64px',
			backgroundColor: '#14140f',
			fontFamily: 'Inter'
		},
		[
			el('div', { display: 'flex', alignItems: 'center', gap: '14px' }, [
				el(
					'div',
					{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 44,
						height: 44,
						borderRadius: 10,
						backgroundColor: '#d4ff00',
						color: '#14140f',
						fontSize: 22,
						fontWeight: 700
					},
					'C'
				),
				el('div', { display: 'flex', fontSize: 34, fontWeight: 700, color: '#fafafa' }, [
					'Campaignly'
				])
			]),
			el('div', { display: 'flex', flexDirection: 'column' }, [
				el(
					'div',
					{
						fontSize: title.length > 55 ? 54 : 66,
						fontWeight: 700,
						lineHeight: 1.15,
						color: '#fafafa',
						letterSpacing: '-0.02em'
					},
					title
				),
				el(
					'div',
					{ marginTop: 28, fontSize: 30, fontWeight: 400, lineHeight: 1.4, color: '#a1a1aa' },
					excerpt
				)
			]),
			el('div', { display: 'flex', flexDirection: 'column' }, [
				el('div', { fontSize: 26, fontWeight: 400, color: '#71717a' }, meta),
				el('div', {
					marginTop: 24,
					width: 220,
					height: 10,
					borderRadius: 5,
					backgroundColor: post.coverColor
				})
			])
		]
	);

	const svg = await satori(tree, {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: 'Inter', data: await fontRegular, weight: 400, style: 'normal' },
			{ name: 'Inter', data: await fontBold, weight: 700, style: 'normal' }
		]
	});

	const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();

	return new Response(new Uint8Array(png), {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=0, s-maxage=31536000'
		}
	});
};
