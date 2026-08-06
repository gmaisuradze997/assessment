import { createHmac } from 'node:crypto';

const SECRET = process.env.SESSION_SECRET ?? 'e2e-ci-only-secret';

/** Mint a session cookie with the same HMAC scheme as `src/lib/server/session.ts`. */
export function mintSessionCookie(userId: string, ttlSeconds = 60 * 60): string {
	const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
	const payload = `${Buffer.from(userId).toString('base64url')}.${expiresAt}`;
	const signature = createHmac('sha256', SECRET).update(payload).digest('base64url');
	return `session=${payload}.${signature}`;
}
