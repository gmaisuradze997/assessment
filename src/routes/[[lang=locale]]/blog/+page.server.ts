import type { Config } from '@sveltejs/adapter-vercel';
import { parsePostsQuery } from '$lib/schemas/posts-query';
import { getAllTags, queryPosts } from '$lib/server/data/posts';
import type { PageServerLoad } from './$types';

/**
 * Blog index owns listing + search. Edge fits unbounded query space
 * (q/tag/sort/page) the same way the old /search route did — nothing here
 * is cacheable across arbitrary filter combinations.
 */
export const config: Config = { runtime: 'edge' };

export const load: PageServerLoad = ({ url, locals }) => {
	const query = parsePostsQuery(url.searchParams);
	const result = queryPosts(query, locals.locale);
	const tags = getAllTags().map((tag) => ({
		slug: tag.slug,
		label: tag.label[locals.locale] ?? tag.slug
	}));
	return { query, result, tags };
};
