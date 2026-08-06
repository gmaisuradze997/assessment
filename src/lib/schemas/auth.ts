import { z } from 'zod';

/**
 * Shared by the login form (client-side pre-submit validation) and the
 * server action. Error messages are i18n keys, resolved with t() at
 * render time so validation is locale-aware on both sides.
 */
export const loginSchema = z.object({
	email: z.email('login.validation.email'),
	password: z.string().min(8, 'login.validation.password')
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginFieldErrors = Partial<Record<keyof LoginInput, string>>;

/** Flatten a Zod error into a per-field map of i18n message keys. */
export function loginFieldErrors(error: z.ZodError): LoginFieldErrors {
	const fields: LoginFieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0];
		if ((field === 'email' || field === 'password') && !fields[field]) {
			fields[field] = issue.message;
		}
	}
	return fields;
}
