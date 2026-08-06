import { z } from 'zod';

export const USER_ROLES = ['admin', 'editor', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const userSchema = z.object({
	id: z.string().min(1),
	email: z.email(),
	password: z.string().min(1),
	name: z.string().min(1),
	role: z.enum(USER_ROLES)
});

export type User = z.infer<typeof userSchema>;

/** The user shape that is safe to expose to the client (no password). */
export type SessionUser = Omit<User, 'password'>;
