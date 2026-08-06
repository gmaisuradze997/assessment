import { z } from 'zod';
import { POST_SORTS, type PostSort } from './post';

export interface PostsQuery {
	q: string;
	tags: string[];
	sort: PostSort;
	page: number;
}

export const POSTS_PAGE_SIZE = 6;

const postsQuerySchema = z.object({
	q: z.string().trim().max(200).catch(''),
	sort: z.enum(POST_SORTS).optional().catch(undefined),
	page: z.coerce.number().int().min(1).catch(1)
});

/** With a search term the natural default is relevance; without one it is recency. */
export function defaultPostSort(q: string): PostSort {
	return q ? 'relevance' : 'newest';
}

export function parsePostsQuery(searchParams: URLSearchParams): PostsQuery {
	const parsed = postsQuerySchema.parse({
		q: searchParams.get('q') ?? '',
		sort: searchParams.get('sort') ?? undefined,
		page: searchParams.get('page') ?? undefined
	});
	let sort: PostSort = parsed.sort ?? defaultPostSort(parsed.q);
	// 'relevance' is meaningless without a query string; fall back to newest.
	if (sort === 'relevance' && !parsed.q) sort = 'newest';
	const tags = [...new Set(searchParams.getAll('tag').filter((t) => t.length > 0))];
	return { q: parsed.q, page: parsed.page, sort, tags };
}

export function postsQueryToSearchParams(query: PostsQuery): URLSearchParams {
	const params = new URLSearchParams();
	if (query.q) params.set('q', query.q);
	for (const tag of query.tags) params.append('tag', tag);
	if (query.sort !== defaultPostSort(query.q)) params.set('sort', query.sort);
	if (query.page > 1) params.set('page', String(query.page));
	return params;
}
