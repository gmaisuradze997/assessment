<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	interface Props {
		size?: 'sm' | 'md' | 'page' | 'full';
		/** Horizontal padding responsive gutters. Off for `full`. */
		padded?: boolean;
		class?: ClassValue;
		children: Snippet;
	}

	const { size = 'page', padded = true, class: className, children }: Props = $props();

	const SIZES = {
		sm: 'max-w-md',
		md: 'max-w-3xl',
		// max-w-page resolves to --container-page (72rem) from the token layer.
		page: 'max-w-page',
		full: 'max-w-none'
	} as const;
</script>

<div class={cx('mx-auto w-full', SIZES[size], padded && 'px-4 sm:px-6', className)}>
	{@render children()}
</div>
