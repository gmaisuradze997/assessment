import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import { posts } from '$lib/server/data/db';
import { getAllTags, getPostBySlug } from '$lib/server/data/posts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = 'auto';

export const entries: EntryGenerator = () =>
	posts.flatMap((post) => [
		{ lang: 'en', slug: post.slug },
		{ lang: 'de', slug: post.slug }
	]);

export const load: PageServerLoad = ({ params, locals }) => {
	const post = getPostBySlug(params.slug, locals.locale);
	if (!post) error(404);

	// Markdown is rendered server-side (baked into the prerendered HTML) —
	// no markdown parser ships to the client. The content is trusted
	// repo-versioned data, so no sanitizer pass is needed here.
	const bodyHtml = marked.parse(post.body, { async: false });

	const tagLabels = Object.fromEntries(
		getAllTags().map((tag) => [tag.slug, tag.label[locals.locale] ?? tag.slug])
	);

	return { post: { ...post, body: undefined }, bodyHtml, tagLabels };
};
