<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	interface Props {
		/** Semantic level for document outline (`<h1>`..`<h6>`). */
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		/** Visual size, decoupled from level so outline order stays correct. */
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		tone?: 'default' | 'muted';
		class?: ClassValue;
		id?: string;
		style?: string;
		children: Snippet;
	}

	const {
		level = 2,
		size,
		tone = 'default',
		class: className,
		id,
		style,
		children
	}: Props = $props();

	// Sensible visual default per level; `size` overrides when supplied.
	const LEVEL_SIZE = { 1: '2xl', 2: 'xl', 3: 'lg', 4: 'md', 5: 'sm', 6: 'xs' } as const;

	const SIZES = {
		xs: 'text-sm font-semibold',
		sm: 'text-base font-semibold',
		md: 'font-display text-lg font-semibold tracking-tight',
		lg: 'font-display text-xl font-bold tracking-tight',
		xl: 'font-display text-2xl font-bold tracking-tight',
		'2xl': 'font-display text-3xl font-bold tracking-tight sm:text-4xl'
	} as const;

	const resolvedSize = $derived(size ?? LEVEL_SIZE[level]);
	const classes = $derived(
		cx(
			'text-balance',
			SIZES[resolvedSize],
			tone === 'muted' ? 'text-foreground-muted' : 'text-foreground',
			className
		)
	);
</script>

<svelte:element this={`h${level}`} {id} {style} class={classes}>
	{@render children()}
</svelte:element>
