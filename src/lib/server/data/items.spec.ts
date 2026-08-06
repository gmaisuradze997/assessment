import { beforeEach, describe, expect, it } from 'vitest';
import { ITEMS_QUERY_DEFAULTS, type ItemsQuery } from '$lib/schemas/items-query';
import { __resetItemsOverlay, getItemById, queryItems, updateItem } from './items';

const query = (overrides: Partial<ItemsQuery> = {}): ItemsQuery => ({
	...ITEMS_QUERY_DEFAULTS,
	...overrides
});

beforeEach(() => {
	__resetItemsOverlay();
});

describe('queryItems pagination', () => {
	it('returns the full dataset paginated with defaults', () => {
		const result = queryItems(query());
		expect(result.total).toBe(220);
		expect(result.rows).toHaveLength(25);
		expect(result.page).toBe(1);
		expect(result.pageCount).toBe(Math.ceil(220 / 25));
	});

	it('clamps out-of-range pages to the last page instead of failing', () => {
		const result = queryItems(query({ page: 9999 }));
		expect(result.page).toBe(result.pageCount);
		expect(result.rows.length).toBeGreaterThan(0);
	});

	it('never duplicates or drops rows across pages (stable sort)', () => {
		const page1 = queryItems(query({ sort: 'budget', dir: 'desc', page: 1 }));
		const page2 = queryItems(query({ sort: 'budget', dir: 'desc', page: 2 }));
		const ids = new Set([...page1.rows, ...page2.rows].map((row) => row.id));
		expect(ids.size).toBe(page1.rows.length + page2.rows.length);
	});
});

describe('queryItems sorting', () => {
	it('sorts numerically by budget', () => {
		const { rows } = queryItems(query({ sort: 'budget', dir: 'asc', pageSize: 50 }));
		const budgets = rows.map((row) => row.budget);
		expect(budgets).toEqual([...budgets].sort((a, b) => a - b));
	});

	it('sorts by owner name, not owner id', () => {
		const { rows } = queryItems(query({ sort: 'owner', dir: 'asc', pageSize: 50 }));
		const names = rows.map((row) => row.owner.name);
		const sorted = [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
		expect(names).toEqual(sorted);
	});

	it('sorts by updatedAt descending by default', () => {
		const { rows } = queryItems(query());
		for (let i = 1; i < rows.length; i++) {
			expect(rows[i - 1].updatedAt >= rows[i].updatedAt).toBe(true);
		}
	});
});

describe('queryItems filtering', () => {
	it('applies multiple facets conjunctively', () => {
		const result = queryItems(query({ status: ['active'], channel: ['email'], pageSize: 50 }));
		expect(result.rows.every((row) => row.status === 'active' && row.channel === 'email')).toBe(
			true
		);
		expect(result.total).toBeLessThan(220);
	});

	it('treats multiple values within one facet as a union', () => {
		const active = queryItems(query({ status: ['active'] })).total;
		const paused = queryItems(query({ status: ['paused'] })).total;
		const both = queryItems(query({ status: ['active', 'paused'] })).total;
		expect(both).toBe(active + paused);
	});

	it('matches q against name and owner, case-insensitively', () => {
		const result = queryItems(query({ q: 'priya', pageSize: 50 }));
		expect(result.total).toBeGreaterThan(0);
		expect(
			result.rows.every(
				(row) =>
					row.name.toLowerCase().includes('priya') || row.owner.name.toLowerCase().includes('priya')
			)
		).toBe(true);
	});

	it('computes facet counts with the other facet applied', () => {
		const result = queryItems(query({ channel: ['email'] }));
		// Status facet counts are scoped to channel=email, so they must sum
		// to the email-only total.
		const sum = Object.values(result.facets.status).reduce((a, b) => a + b, 0);
		expect(sum).toBe(result.total);
	});

	it('returns an empty page (not an error) when nothing matches', () => {
		const result = queryItems(query({ q: 'zzz-no-such-campaign' }));
		expect(result.total).toBe(0);
		expect(result.rows).toEqual([]);
		expect(result.pageCount).toBe(1);
	});
});

describe('updateItem', () => {
	it('applies a patch on top of the seed data and bumps updatedAt', () => {
		const before = getItemById('cmp_0001')!;
		const updated = updateItem('cmp_0001', { budget: before.budget + 1000 });
		expect(updated.budget).toBe(before.budget + 1000);
		expect(updated.updatedAt > before.updatedAt).toBe(true);
		expect(getItemById('cmp_0001')!.budget).toBe(before.budget + 1000);
	});

	it('is visible through queryItems (overlay is materialized)', () => {
		updateItem('cmp_0001', { budget: 123456 });
		const result = queryItems(query({ q: 'GA release #001' }));
		expect(result.rows[0]?.budget).toBe(123456);
	});

	it('throws for unknown ids', () => {
		expect(() => updateItem('cmp_nope', { budget: 1 })).toThrowError(/not found/i);
	});
});
