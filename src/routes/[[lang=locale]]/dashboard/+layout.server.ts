import type { Config } from '@sveltejs/adapter-vercel';
import type { LayoutServerLoad } from './$types';

export const config: Config = { runtime: 'nodejs22.x' };

export const load: LayoutServerLoad = ({ locals }) => {
	return { user: locals.user!, flags: locals.flags };
};
