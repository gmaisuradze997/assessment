import { describe, expect, it } from 'vitest';
import { createSessionCookieValue, verifySessionCookieValue } from './session';

describe('session cookie', () => {
	it('round-trips a user id', async () => {
		const cookie = await createSessionCookieValue('demo_editor');
		expect(await verifySessionCookieValue(cookie)).toBe('demo_editor');
	});

	it('rejects a tampered signature', async () => {
		const cookie = await createSessionCookieValue('demo_editor');
		const [payload, exp] = cookie.split('.');
		expect(await verifySessionCookieValue(`${payload}.${exp}.AAAAAAAA`)).toBeNull();
	});

	it('rejects a tampered payload (privilege escalation attempt)', async () => {
		const cookie = await createSessionCookieValue('demo_viewer');
		const [, exp, sig] = cookie.split('.');
		const forged = `${Buffer.from('demo_admin').toString('base64url')}.${exp}.${sig}`;
		expect(await verifySessionCookieValue(forged)).toBeNull();
	});

	it('rejects expired cookies', async () => {
		const cookie = await createSessionCookieValue('demo_editor', -10);
		expect(await verifySessionCookieValue(cookie)).toBeNull();
	});

	it('rejects malformed values', async () => {
		expect(await verifySessionCookieValue('')).toBeNull();
		expect(await verifySessionCookieValue('a.b')).toBeNull();
		expect(await verifySessionCookieValue('a.b.c.d')).toBeNull();
		expect(await verifySessionCookieValue('!!!.123.!!!')).toBeNull();
	});
});
