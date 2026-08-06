import { z } from 'zod';

export const ITEM_STATUSES = [
	'draft',
	'scheduled',
	'active',
	'paused',
	'completed',
	'archived'
] as const;
export const ITEM_CHANNELS = ['email', 'sms', 'web', 'social', 'push'] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type ItemChannel = (typeof ITEM_CHANNELS)[number];

export const itemSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	status: z.enum(ITEM_STATUSES),
	channel: z.enum(ITEM_CHANNELS),
	owner: z.object({
		id: z.string().min(1),
		name: z.string().min(1)
	}),
	budget: z.number().nonnegative(),
	spent: z.number().nonnegative(),
	impressions: z.number().int().nonnegative(),
	clicks: z.number().int().nonnegative(),
	ctr: z.number().min(0).max(1),
	startDate: z.iso.date(),
	endDate: z.iso.date(),
	updatedAt: z.iso.datetime(),
	tags: z.array(z.string())
});

export type Item = z.infer<typeof itemSchema>;

export const ITEM_SORT_FIELDS = [
	'name',
	'status',
	'channel',
	'owner',
	'budget',
	'spent',
	'ctr',
	'updatedAt'
] as const;
export type ItemSortField = (typeof ITEM_SORT_FIELDS)[number];

export const ITEM_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Patch accepted by the inline-edit action. Values arrive as form-data
 * strings, hence the coercion. The max budget guards against fat-finger
 * input; the min gives us a deterministic validation failure to demo
 * optimistic rollback.
 */
export const itemPatchSchema = z
	.object({
		budget: z.coerce
			.number({ error: 'dashboard.items.edit.invalidBudget' })
			.min(0, 'dashboard.items.edit.invalidBudget')
			.max(10_000_000, 'dashboard.items.edit.invalidBudget')
			.optional(),
		status: z.enum(ITEM_STATUSES).optional()
	})
	.refine((patch) => patch.budget !== undefined || patch.status !== undefined, {
		error: 'dashboard.items.edit.emptyPatch'
	});

export type ItemPatch = z.infer<typeof itemPatchSchema>;
