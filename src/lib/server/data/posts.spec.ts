import { describe, expect, it } from 'vitest';
import { parsePostsQuery } from '$lib/schemas/posts-query';
import { getPostBySlug, queryPosts } from './posts';

const parse = (qs: string) => parsePostsQuery(new URLSearchParams(qs));

describe('parsePostsQuery', () => {
	it('defaults sort to newest without a query and relevance with one', () => {
		expect(parse('').sort).toBe('newest');
		expect(parse('q=performance').sort).toBe('relevance');
	});

	it('falls back to newest when relevance is requested without a query', () => {
		expect(parse('sort=relevance').sort).toBe('newest');
	});

	it('collects repeated tag params', () => {
		expect(parse('tag=design&tag=ai').tags).toEqual(['design', 'ai']);
	});
});

describe('queryPosts', () => {
	it('finds posts by text in the requested locale', () => {
		const result = queryPosts(parse('q=LCP'), 'en');
		expect(result.total).toBeGreaterThan(0);
		expect(result.posts.some((post) => post.slug === 'sub-second-lcp-on-a-content-site')).toBe(
			true
		);
	});

	it('requires all selected tags (AND semantics)', () => {
		const result = queryPosts(parse('tag=performance&tag=engineering'), 'en');
		expect(result.posts.every((post) => post.tags.includes('performance'))).toBe(true);
		expect(result.posts.every((post) => post.tags.includes('engineering'))).toBe(true);
	});

	it('sorts newest first by default', () => {
		const { posts } = queryPosts(parse(''), 'en');
		for (let i = 1; i < posts.length; i++) {
			expect(posts[i - 1].publishedAt >= posts[i].publishedAt).toBe(true);
		}
	});

	it('returns an empty page for no matches', () => {
		const result = queryPosts(parse('q=xyzzy-plugh'), 'en');
		expect(result.total).toBe(0);
		expect(result.posts).toEqual([]);
	});
});

describe('getPostBySlug', () => {
	it('returns the localized translation', () => {
		const en = getPostBySlug('sub-second-lcp-on-a-content-site', 'en');
		const de = getPostBySlug('sub-second-lcp-on-a-content-site', 'de');
		expect(en?.title).toBe('Sub-second LCP on a content site');
		expect(de?.title).toBe('LCP unter einer Sekunde auf einer Content-Seite');
	});

	it('returns undefined for unknown slugs', () => {
		expect(getPostBySlug('does-not-exist', 'en')).toBeUndefined();
	});
});
