import type { SessionUser, User } from '$lib/schemas/user';
import { users } from './db';

export function toSessionUser(user: User): SessionUser {
	const { password: _password, ...safe } = user;
	return safe;
}

export function findUserByEmail(email: string): User | undefined {
	const normalized = email.trim().toLowerCase();
	return users.find((user) => user.email.toLowerCase() === normalized);
}

export function getUserById(id: string): SessionUser | undefined {
	const user = users.find((u) => u.id === id);
	return user ? toSessionUser(user) : undefined;
}
