import { z } from 'zod';

/** Shared client → `/api/beacon` contract. */
export const beaconEventSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('vital'),
		name: z.enum(['LCP', 'INP', 'CLS', 'TTFB']),
		value: z.number(),
		id: z.string(),
		rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
		navigationType: z.string().optional(),
		url: z.string(),
		ts: z.number().int(),
		sampleRate: z.number().min(0).max(1)
	}),
	z.object({
		type: z.literal('error'),
		message: z.string(),
		name: z.string().optional(),
		stack: z.string().optional(),
		status: z.number().int().optional(),
		url: z.string(),
		ts: z.number().int(),
		sampleRate: z.number().min(0).max(1),
		source: z.enum(['boundary', 'handleError', 'window', 'rejection']).optional()
	})
]);

export type BeaconEvent = z.infer<typeof beaconEventSchema>;
