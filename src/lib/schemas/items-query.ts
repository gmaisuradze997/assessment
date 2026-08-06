import { z } from 'zod';
import {
	DEFAULT_PAGE_SIZE,
	ITEM_CHANNELS,
	ITEM_PAGE_SIZES,
	ITEM_SORT_FIELDS,
	ITEM_STATUSES,
	type ItemChannel,
	type ItemSortField,
	type ItemStatus
} from './item';

export interface ItemsQuery {
	page: number;
	pageSize: number;
	sort: ItemSortField;
	dir: 'asc' | 'desc';
	status: ItemStatus[];
	channel: ItemChannel[];
	q: string;
}

export const ITEMS_QUERY_DEFAULTS: ItemsQuery = {
	page: 1,
	pageSize: DEFAULT_PAGE_SIZE,
	sort: 'updatedAt',
	dir: 'desc',
	status: [],
	channel: [],
	q: ''
};

/**
 * Every field degrades to its default instead of throwing, so a
 * hand-mangled URL never 400s the page — it just renders the closest
 * sensible view.
 */
const itemsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	pageSize: z.coerce
		.number()
		.int()
		.catch(DEFAULT_PAGE_SIZE)
		.transform((n) =>
			ITEM_PAGE_SIZES.includes(n as (typeof ITEM_PAGE_SIZES)[number]) ? n : DEFAULT_PAGE_SIZE
		),
	sort: z.enum(ITEM_SORT_FIELDS).catch('updatedAt'),
	dir: z.enum(['asc', 'desc']).catch('desc'),
	q: z.string().trim().max(200).catch('')
});

const statusValue = z.enum(ITEM_STATUSES);
const channelValue = z.enum(ITEM_CHANNELS);

export function parseItemsQuery(searchParams: URLSearchParams): ItemsQuery {
	const parsed = itemsQuerySchema.parse({
		page: searchParams.get('page') ?? undefined,
		pageSize: searchParams.get('pageSize') ?? undefined,
		sort: searchParams.get('sort') ?? undefined,
		dir: searchParams.get('dir') ?? undefined,
		q: searchParams.get('q') ?? ''
	});

	// Invalid facet values are dropped individually rather than
	// invalidating the whole filter set.
	const status = searchParams
		.getAll('status')
		.filter((v): v is ItemStatus => statusValue.safeParse(v).success);
	const channel = searchParams
		.getAll('channel')
		.filter((v): v is ItemChannel => channelValue.safeParse(v).success);

	return { ...parsed, status: [...new Set(status)], channel: [...new Set(channel)] };
}

/**
 * Serialize a query back into URLSearchParams, omitting defaults so
 * URLs stay canonical and shareable (`/dashboard/items` instead of
 * `/dashboard/items?page=1&sort=updatedAt&...`).
 */
export function itemsQueryToSearchParams(query: ItemsQuery): URLSearchParams {
	const params = new URLSearchParams();
	if (query.q) params.set('q', query.q);
	for (const s of query.status) params.append('status', s);
	for (const c of query.channel) params.append('channel', c);
	if (query.sort !== ITEMS_QUERY_DEFAULTS.sort || query.dir !== ITEMS_QUERY_DEFAULTS.dir) {
		params.set('sort', query.sort);
		params.set('dir', query.dir);
	}
	if (query.pageSize !== ITEMS_QUERY_DEFAULTS.pageSize)
		params.set('pageSize', String(query.pageSize));
	if (query.page > 1) params.set('page', String(query.page));
	return params;
}
