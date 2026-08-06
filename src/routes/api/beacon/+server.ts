import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { beaconEventSchema } from '$lib/observability/schema';

/**
 * RUM / error sink. Production would forward to a vendor or log drain;
 * here we validate and `console.log` so the client wiring is real and
 * inspectable in local + CI server logs.
 */
export const POST: RequestHandler = async ({ request }) => {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return json({ ok: false, error: 'invalid_json' }, { status: 400 });
	}

	const parsed = beaconEventSchema.safeParse(raw);
	if (!parsed.success) {
		return json({ ok: false, error: 'invalid_payload' }, { status: 400 });
	}

	const event = parsed.data;
	if (event.type === 'vital') {
		console.log(
			`[beacon:vital] ${event.name}=${event.value} rating=${event.rating ?? '-'} sample=${event.sampleRate} url=${event.url}`
		);
	} else {
		console.log(
			`[beacon:error] ${event.name ?? 'Error'}: ${event.message} source=${event.source ?? '-'} status=${event.status ?? '-'} sample=${event.sampleRate} url=${event.url}`
		);
		if (event.stack) console.log(event.stack);
	}

	return new Response(null, { status: 204 });
};
