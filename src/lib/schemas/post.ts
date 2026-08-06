import { z } from 'zod';

export const postTranslationSchema = z.object({
	title: z.string().min(1),
	excerpt: z.string().min(1),
	body: z.string().min(1)
});

export const postSchema = z.object({
	id: z.string().min(1),
	slug: z.string().min(1),
	translations: z.record(z.string(), postTranslationSchema),
	tags: z.array(z.string()),
	author: z.object({
		id: z.string().min(1),
		name: z.string().min(1),
		avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/)
	}),
	publishedAt: z.iso.datetime(),
	readingTimeMinutes: z.number().int().positive(),
	coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/)
});

export type Post = z.infer<typeof postSchema>;
export type PostTranslation = z.infer<typeof postTranslationSchema>;

/** A post flattened to a single locale for rendering. */
export type LocalizedPost = Omit<Post, 'translations'> & PostTranslation;

export const tagSchema = z.object({
	slug: z.string().min(1),
	label: z.record(z.string(), z.string().min(1))
});

export type Tag = z.infer<typeof tagSchema>;

export const POST_SORTS = ['relevance', 'newest', 'oldest'] as const;
export type PostSort = (typeof POST_SORTS)[number];
