import { fail } from '@sveltejs/kit';
import { itemPatchSchema } from '$lib/schemas/item';
import { parseItemsQuery, type ItemsQuery } from '$lib/schemas/items-query';
import { seedItems } from '$lib/server/data/db';
import {
	getItemsStats,
	ItemNotFoundError,
	queryItems,
	updateItem,
	type ItemsPage,
	type ItemsStats
} from '$lib/server/data/items';
import { simulateLatency } from '$lib/server/delay';
import type { Actions, PageServerLoad } from './$types';

/** Distinct campaign owners for the FilterBar Combobox. */
function listOwners() {
	const byId = new Map<string, { value: string; label: string }>();
	for (const item of seedItems) {
		if (!byId.has(item.owner.id)) {
			byId.set(item.owner.id, { value: item.owner.id, label: item.owner.name });
		}
	}
	return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}

async function loadRows(query: ItemsQuery, chaos: string | null): Promise<ItemsPage> {
	await simulateLatency();
	if (chaos === 'rows') throw new Error('Injected row failure (chaos=rows)');
	return queryItems(query);
}

async function loadStats(chaos: string | null): Promise<ItemsStats> {
	await simulateLatency(450);
	if (chaos === 'stats') throw new Error('Injected stats failure (chaos=stats)');
	return getItemsStats();
}

/**
 * Streamed SSR: `query` is synchronous, so the page shell — heading,
 * filter bar, column headers — renders immediately. `rows` and `stats`
 * are returned as un-awaited promises that SvelteKit streams; they are
 * independent so one can fail while the other renders (partial failure
 * is a designed state, demoable via ?chaos=rows or ?chaos=stats).
 */
export const load: PageServerLoad = ({ url }) => {
	const query = parseItemsQuery(url.searchParams);
	const chaos = url.searchParams.get('chaos');
	return {
		query,
		owners: listOwners(),
		rows: loadRows(query, chaos),
		stats: loadStats(chaos)
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		// Simulated backend latency makes the optimistic window real: the
		// UI shows the new value while this is pending.
		await simulateLatency(600);

		// The hooks guard already ensures a session; this is the
		// *authorization* boundary (viewer may read but not write).
		if (locals.user!.role === 'viewer') {
			return fail(403, { message: 'dashboard.items.edit.forbidden' as const });
		}

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || id === '') {
			return fail(400, { message: 'dashboard.items.edit.notFound' as const });
		}

		const raw: Record<string, unknown> = {};
		if (form.has('budget')) raw.budget = form.get('budget');
		if (form.has('status')) raw.status = form.get('status');

		const parsed = itemPatchSchema.safeParse(raw);
		if (!parsed.success) {
			const message = parsed.error.issues[0]?.message ?? 'dashboard.items.edit.emptyPatch';
			return fail(400, { message });
		}

		try {
			const item = updateItem(id, parsed.data);
			return { item };
		} catch (error) {
			if (error instanceof ItemNotFoundError) {
				return fail(404, { message: 'dashboard.items.edit.notFound' as const });
			}
			throw error;
		}
	}
};
