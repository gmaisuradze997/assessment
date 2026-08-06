/**
 * Single point where mock JSON enters the app. Everything is parsed with
 * Zod once at module init so bad data fails the build/boot loudly instead
 * of surfacing as undefined behavior deep in a page. Downstream code can
 * treat these exports as a trusted, typed database snapshot.
 */
import { z } from 'zod';
import { itemSchema, type Item } from '$lib/schemas/item';
import { postSchema, tagSchema, type Post, type Tag } from '$lib/schemas/post';
import { userSchema, type User } from '$lib/schemas/user';

import itemsJson from '../../../../mocks/items.json';
import postsJson from '../../../../mocks/posts.json';
import tagsJson from '../../../../mocks/tags.json';
import usersJson from '../../../../mocks/users.json';

export const seedItems: readonly Item[] = z.array(itemSchema).parse(itemsJson);
export const posts: readonly Post[] = z.array(postSchema).parse(postsJson);
export const tags: readonly Tag[] = z.array(tagSchema).parse(tagsJson);
export const users: readonly User[] = z.array(userSchema).parse(usersJson);
