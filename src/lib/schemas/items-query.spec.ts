import { describe, expect, it } from 'vitest';
import { ITEMS_QUERY_DEFAULTS, itemsQueryToSearchParams, parseItemsQuery } from './items-query';

const parse = (qs: string) => parseItemsQuery(new URLSearchParams(qs));

describe('parseItemsQuery', () => {
	it('returns defaults for an empty query string', () => {
		expect(parse('')).toEqual(ITEMS_QUERY_DEFAULTS);
	});

	it('degrades garbage values to defaults instead of throwing', () => {
		const query = parse('page=-5&pageSize=999&sort=DROP TABLE&dir=sideways&q=' + 'x'.repeat(500));
		expect(query.page).toBe(1);
		expect(query.pageSize).toBe(ITEMS_QUERY_DEFAULTS.pageSize);
		expect(query.sort).toBe('updatedAt');
		expect(query.dir).toBe('desc');
		expect(query.q).toBe('');
	});

	it('parses repeated facet params and drops invalid values individually', () => {
		const query = parse('status=active&status=bogus&status=paused&channel=email&channel=fax');
		expect(query.status).toEqual(['active', 'paused']);
		expect(query.channel).toEqual(['email']);
	});

	it('deduplicates facet values', () => {
		expect(parse('status=active&status=active').status).toEqual(['active']);
	});

	it('trims and accepts valid values', () => {
		const query = parse('page=3&pageSize=50&sort=budget&dir=asc&q=%20launch%20');
		expect(query).toEqual({
			page: 3,
			pageSize: 50,
			sort: 'budget',
			dir: 'asc',
			q: 'launch',
			status: [],
			channel: []
		});
	});
});

describe('itemsQueryToSearchParams', () => {
	it('serializes defaults to an empty string (canonical URLs)', () => {
		expect(itemsQueryToSearchParams(ITEMS_QUERY_DEFAULTS).toString()).toBe('');
	});

	it('round-trips a non-trivial query', () => {
		const query = parse(
			'page=2&pageSize=50&sort=budget&dir=asc&q=launch&status=active&channel=sms'
		);
		const roundTripped = parseItemsQuery(itemsQueryToSearchParams(query));
		expect(roundTripped).toEqual(query);
	});
});
