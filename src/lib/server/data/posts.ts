import type { LocalizedPost, Post, Tag } from '$lib/schemas/post';
import { POSTS_PAGE_SIZE, type PostsQuery } from '$lib/schemas/posts-query';
import type { Locale } from '$lib/i18n/locales';
import { posts, tags } from './db';

export function localizePost(post: Post, locale: Locale): LocalizedPost {
	const { translations, ...rest } = post;
	// English is the source language and always present; a missing
	// translation falls back to it rather than breaking the page.
	const translation = translations[locale] ?? translations.en;
	return { ...rest, ...translation };
}

/** Card shape for lists — body omitted to keep payloads lean. */
export type PostCard = Omit<LocalizedPost, 'body'>;

function toCard(post: LocalizedPost): PostCard {
	const { body: _body, ...card } = post;
	return card;
}

const byNewest = (a: LocalizedPost, b: LocalizedPost) =>
	a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0;

export function getAllPosts(locale: Locale): LocalizedPost[] {
	return posts.map((post) => localizePost(post, locale)).sort(byNewest);
}

export function getPostBySlug(slug: string, locale: Locale): LocalizedPost | undefined {
	const post = posts.find((p) => p.slug === slug);
	return post ? localizePost(post, locale) : undefined;
}

export function getAllTags(): readonly Tag[] {
	return tags;
}

/**
 * Naive weighted relevance: title hits count most, then excerpt, then
 * body. Fine for 20 documents; a real search index replaces this
 * function, not its callers.
 */
function relevanceScore(post: LocalizedPost, q: string): number {
	const needle = q.toLowerCase();
	const count = (haystack: string) => haystack.toLowerCase().split(needle).length - 1;
	return count(post.title) * 5 + count(post.excerpt) * 2 + count(post.body);
}

export interface PostsPage {
	posts: PostCard[];
	total: number;
	page: number;
	pageCount: number;
}

export function queryPosts(query: PostsQuery, locale: Locale): PostsPage {
	let results = getAllPosts(locale);

	if (query.tags.length > 0) {
		results = results.filter((post) => query.tags.every((tag) => post.tags.includes(tag)));
	}

	const q = query.q.trim();
	let scored: Array<{ post: LocalizedPost; score: number }>;
	if (q) {
		scored = results
			.map((post) => ({ post, score: relevanceScore(post, q) }))
			.filter((entry) => entry.score > 0);
	} else {
		scored = results.map((post) => ({ post, score: 0 }));
	}

	switch (query.sort) {
		case 'relevance':
			scored.sort((a, b) => b.score - a.score || byNewest(a.post, b.post));
			break;
		case 'newest':
			scored.sort((a, b) => byNewest(a.post, b.post));
			break;
		case 'oldest':
			scored.sort((a, b) => -byNewest(a.post, b.post));
			break;
	}

	const total = scored.length;
	const pageCount = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE));
	const page = Math.min(query.page, pageCount);
	const pageItems = scored
		.slice((page - 1) * POSTS_PAGE_SIZE, page * POSTS_PAGE_SIZE)
		.map((entry) => toCard(entry.post));

	return { posts: pageItems, total, page, pageCount };
}
