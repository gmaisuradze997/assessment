import { describe, expect, it } from 'vitest';
import { loginFieldErrors, loginSchema } from './auth';

describe('loginSchema', () => {
	it('accepts valid credentials shape', () => {
		expect(loginSchema.safeParse({ email: 'admin@demo.test', password: 'demo1234' }).success).toBe(
			true
		);
	});

	it('rejects a malformed email with an i18n message key', () => {
		const result = loginSchema.safeParse({ email: 'not-an-email', password: 'demo1234' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(loginFieldErrors(result.error).email).toBe('login.validation.email');
		}
	});

	it('rejects a short password with an i18n message key', () => {
		const result = loginSchema.safeParse({ email: 'admin@demo.test', password: 'short' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(loginFieldErrors(result.error).password).toBe('login.validation.password');
		}
	});

	it('collects one error per field', () => {
		const result = loginSchema.safeParse({ email: 'nope', password: '' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const errors = loginFieldErrors(result.error);
			expect(errors.email).toBeDefined();
			expect(errors.password).toBeDefined();
		}
	});
});
