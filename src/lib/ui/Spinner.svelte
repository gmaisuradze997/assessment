<script lang="ts">
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	interface Props {
		/** Matches the current text size by default (`1em`). */
		size?: 'sm' | 'md' | 'lg' | 'inherit';
		class?: ClassValue;
	}

	const { size = 'inherit', class: className }: Props = $props();

	const sizes = {
		sm: 'h-3.5 w-3.5',
		md: 'h-5 w-5',
		lg: 'h-6 w-6',
		inherit: 'h-[1em] w-[1em]'
	} as const;
</script>

<svg
	class={cx('shrink-0 animate-spin', sizes[size], className)}
	viewBox="0 0 24 24"
	fill="none"
	aria-hidden="true"
>
	<circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
	<path
		class="opacity-90"
		d="M21 12a9 9 0 0 0-9-9"
		stroke="currentColor"
		stroke-width="3"
		stroke-linecap="round"
	/>
</svg>
