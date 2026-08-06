import { building, dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function secret(): string {
	if (env.SESSION_SECRET) return env.SESSION_SECRET;
	if (dev || building) return 'dev-only-insecure-secret';
	throw new Error('SESSION_SECRET must be set in production');
}

let keyPromise: Promise<CryptoKey> | undefined;

function hmacKey(): Promise<CryptoKey> {
	keyPromise ??= crypto.subtle.importKey(
		'raw',
		encoder.encode(secret()),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
	return keyPromise;
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Returns null for input that is not valid base64url. */
function fromBase64Url(value: string): Uint8Array | null {
	try {
		const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/'));
		return Uint8Array.from(binary, (char) => char.charCodeAt(0));
	} catch {
		return null;
	}
}

export async function createSessionCookieValue(
	userId: string,
	ttlSeconds: number = SESSION_TTL_SECONDS
): Promise<string> {
	const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
	const payload = `${toBase64Url(encoder.encode(userId))}.${expiresAt}`;
	const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(payload));
	return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the userId for a valid, unexpired cookie; null otherwise. */
export async function verifySessionCookieValue(value: string): Promise<string | null> {
	const parts = value.split('.');
	if (parts.length !== 3) return null;
	const [encodedUserId, expiresAt, signature] = parts;

	const signatureBytes = fromBase64Url(signature);
	if (!signatureBytes) return null;

	// subtle.verify compares in constant time (the timingSafeEqual of Web Crypto).
	const valid = await crypto.subtle.verify(
		'HMAC',
		await hmacKey(),
		signatureBytes as BufferSource,
		encoder.encode(`${encodedUserId}.${expiresAt}`)
	);
	if (!valid) return null;

	const expiry = Number(expiresAt);
	if (!Number.isFinite(expiry) || expiry * 1000 < Date.now()) return null;

	const userIdBytes = fromBase64Url(encodedUserId);
	return userIdBytes ? new TextDecoder().decode(userIdBytes) : null;
}
