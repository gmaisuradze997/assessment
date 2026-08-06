import type { Item, ItemChannel, ItemPatch, ItemSortField, ItemStatus } from '$lib/schemas/item';
import type { ItemsQuery } from '$lib/schemas/items-query';
import { seedItems } from './db';

/**
 * Mutation overlay: edits are stored as patches on top of the immutable
 * seed data. This is deliberately the shape of a write-through cache in
 * front of a real API — swapping in a database means replacing this Map,
 * not the query layer. Caveat (documented in README): on serverless the
 * overlay lives per warm instance only.
 */
const overlay = new Map<string, Partial<Item>>();

function materialize(item: Item): Item {
	const patch = overlay.get(item.id);
	return patch ? { ...item, ...patch } : item;
}

export interface ItemsPage {
	rows: Item[];
	total: number;
	page: number;
	pageCount: number;
	pageSize: number;
	facets: {
		status: Record<ItemStatus, number>;
		channel: Record<ItemChannel, number>;
	};
}

const collator = new Intl.Collator('en', { sensitivity: 'base' });

function comparator(sort: ItemSortField, dir: 'asc' | 'desc') {
	const sign = dir === 'asc' ? 1 : -1;
	return (a: Item, b: Item): number => {
		let result: number;
		switch (sort) {
			case 'name':
				result = collator.compare(a.name, b.name);
				break;
			case 'status':
				result = collator.compare(a.status, b.status);
				break;
			case 'channel':
				result = collator.compare(a.channel, b.channel);
				break;
			case 'owner':
				result = collator.compare(a.owner.name, b.owner.name);
				break;
			case 'budget':
				result = a.budget - b.budget;
				break;
			case 'spent':
				result = a.spent - b.spent;
				break;
			case 'ctr':
				result = a.ctr - b.ctr;
				break;
			case 'updatedAt':
				// ISO 8601 strings sort correctly lexicographically.
				result = a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0;
				break;
		}
		// Stable tie-break so pagination never shows duplicate/missing rows.
		return result !== 0 ? sign * result : collator.compare(a.id, b.id);
	};
}

function countBy<K extends string>(items: Item[], pick: (item: Item) => K): Record<K, number> {
	const counts = {} as Record<K, number>;
	for (const item of items) {
		const key = pick(item);
		counts[key] = (counts[key] ?? 0) + 1;
	}
	return counts;
}

/**
 * The "API". Pagination, sorting, and multi-facet filtering all happen
 * here, server-side. Facet counts are computed with the *other* facet's
 * filters applied (standard faceted-search behavior), so the numbers next
 * to each option always reflect what selecting it would return.
 */
export function queryItems(query: ItemsQuery): ItemsPage {
	const all = seedItems.map(materialize);

	const q = query.q.trim().toLowerCase();
	const matchesQ = (item: Item) =>
		q === '' || item.name.toLowerCase().includes(q) || item.owner.name.toLowerCase().includes(q);
	const matchesStatus = (item: Item) =>
		query.status.length === 0 || query.status.includes(item.status);
	const matchesChannel = (item: Item) =>
		query.channel.length === 0 || query.channel.includes(item.channel);

	const base = all.filter(matchesQ);
	const statusFacet = countBy(base.filter(matchesChannel), (item) => item.status);
	const channelFacet = countBy(base.filter(matchesStatus), (item) => item.channel);

	const filtered = base.filter((item) => matchesStatus(item) && matchesChannel(item));
	filtered.sort(comparator(query.sort, query.dir));

	const total = filtered.length;
	const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
	// Clamp instead of 404: a stale link to page 9 of a now-smaller result
	// set should land on the last page, not an error.
	const page = Math.min(query.page, pageCount);
	const rows = filtered.slice((page - 1) * query.pageSize, page * query.pageSize);

	return {
		rows,
		total,
		page,
		pageCount,
		pageSize: query.pageSize,
		facets: { status: statusFacet, channel: channelFacet }
	};
}

export interface ItemsStats {
	total: number;
	active: number;
	totalBudget: number;
	totalSpent: number;
	averageCtr: number;
}

export function getItemsStats(): ItemsStats {
	const all = seedItems.map(materialize);
	const withTraffic = all.filter((item) => item.impressions > 0);
	return {
		total: all.length,
		active: all.filter((item) => item.status === 'active').length,
		totalBudget: all.reduce((sum, item) => sum + item.budget, 0),
		totalSpent: all.reduce((sum, item) => sum + item.spent, 0),
		averageCtr:
			withTraffic.length === 0
				? 0
				: withTraffic.reduce((sum, item) => sum + item.ctr, 0) / withTraffic.length
	};
}

export function getItemById(id: string): Item | undefined {
	const seed = seedItems.find((item) => item.id === id);
	return seed ? materialize(seed) : undefined;
}

export class ItemNotFoundError extends Error {
	constructor(id: string) {
		super(`Item not found: ${id}`);
		this.name = 'ItemNotFoundError';
	}
}

export function updateItem(id: string, patch: ItemPatch): Item {
	const seed = seedItems.find((item) => item.id === id);
	if (!seed) throw new ItemNotFoundError(id);
	const previous = overlay.get(id) ?? {};
	overlay.set(id, { ...previous, ...patch, updatedAt: new Date().toISOString() });
	return materialize(seed);
}

/** Test-only escape hatch so unit tests can reset mutation state. */
export function __resetItemsOverlay(): void {
	overlay.clear();
}
