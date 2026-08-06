import { describe, expect, it } from 'vitest';
import {
	defaultPostSort,
	parsePostsQuery,
	postsQueryToSearchParams,
	type PostsQuery
} from './posts-query';

const parse = (qs: string) => parsePostsQuery(new URLSearchParams(qs));

describe('defaultPostSort', () => {
	it('prefers relevance when a query is present, otherwise newest', () => {
		expect(defaultPostSort('lcp')).toBe('relevance');
		expect(defaultPostSort('')).toBe('newest');
	});
});

describe('parsePostsQuery', () => {
	it('returns defaults for an empty query string', () => {
		expect(parse('')).toEqual({
			q: '',
			tags: [],
			sort: 'newest',
			page: 1
		});
	});

	it('coerces sort=relevance to newest when q is empty', () => {
		expect(parse('sort=relevance').sort).toBe('newest');
	});

	it('deduplicates tags and drops empty values', () => {
		expect(parse('tag=perf&tag=&tag=perf&tag=a11y').tags).toEqual(['perf', 'a11y']);
	});

	it('accepts a full non-default query', () => {
		expect(parse('q=lcp&tag=perf&tag=webvitals&sort=oldest&page=3')).toEqual({
			q: 'lcp',
			tags: ['perf', 'webvitals'],
			sort: 'oldest',
			page: 3
		});
	});
});

describe('postsQueryToSearchParams', () => {
	it('serializes defaults to an empty string', () => {
		const defaults: PostsQuery = { q: '', tags: [], sort: 'newest', page: 1 };
		expect(postsQueryToSearchParams(defaults).toString()).toBe('');
	});

	it('omits sort when it matches defaultPostSort(q)', () => {
		expect(
			postsQueryToSearchParams({ q: 'lcp', tags: [], sort: 'relevance', page: 1 }).toString()
		).toBe('q=lcp');
		expect(postsQueryToSearchParams({ q: '', tags: [], sort: 'newest', page: 1 }).toString()).toBe(
			''
		);
	});

	it('round-trips a non-trivial query', () => {
		const query = parse('q=lcp&tag=perf&tag=a11y&sort=oldest&page=2');
		const roundTripped = parsePostsQuery(postsQueryToSearchParams(query));
		expect(roundTripped).toEqual(query);
	});
});
