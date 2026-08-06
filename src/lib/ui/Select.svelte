<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import type { ClassValue } from './cx';
	import { cx } from './cx';
	import { FOCUS_RING } from './variants';

	interface Props {
		value?: string | number;
		size?: 'sm' | 'md' | 'lg';
		invalid?: boolean;
		class?: ClassValue;
		/** `<option>` / `<optgroup>` elements. */
		children: Snippet;
		[key: string]: unknown;
	}

	let {
		value = $bindable(''),
		size = 'md',
		invalid = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	const SIZES = {
		sm: 'h-8 pr-8 pl-2.5 text-xs',
		/* text-base on narrow viewports avoids iOS focus zoom (<16px). */
		md: 'h-11 pr-9 pl-3 text-base sm:h-9 sm:text-sm',
		lg: 'h-11 pr-10 pl-4 text-base'
	} as const;
</script>

<div class={cx('relative inline-flex w-full', className)}>
	<select
		{...rest as HTMLSelectAttributes}
		bind:value
		aria-invalid={invalid ? 'true' : undefined}
		class={cx(
			'w-full appearance-none rounded-control border bg-surface text-foreground shadow-control transition-colors',
			'disabled:cursor-not-allowed disabled:opacity-60',
			FOCUS_RING,
			SIZES[size],
			invalid ? 'border-danger-border' : 'border-border-strong'
		)}
	>
		{@render children()}
	</select>
	<svg
		class="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-foreground-faint"
		viewBox="0 0 20 20"
		fill="none"
		aria-hidden="true"
	>
		<path
			d="m6 8 4 4 4-4"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
</div>
