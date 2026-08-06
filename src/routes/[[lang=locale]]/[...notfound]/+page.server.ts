import { error } from '@sveltejs/kit';

/**
 * Catch-all so unknown URLs render the localized +error.svelte inside the
 * normal layout (header/footer) instead of SvelteKit's bare fallback.
 */
export const load = () => {
	error(404);
};
