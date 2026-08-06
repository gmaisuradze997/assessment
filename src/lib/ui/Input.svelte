<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { ClassValue } from './cx';
	import { cx } from './cx';
	import { FOCUS_RING } from './variants';

	interface Props {
		value?: string | number;
		size?: 'sm' | 'md' | 'lg';
		invalid?: boolean;
		class?: ClassValue;
		/** Native input attributes and `on*` handlers. */
		[key: string]: unknown;
	}

	let {
		value = $bindable(''),
		size = 'md',
		invalid = false,
		class: className,
		...rest
	}: Props = $props();

	const SIZES = {
		sm: 'h-8 px-2.5 text-xs',
		/* text-base on narrow viewports avoids iOS focus zoom (<16px). */
		md: 'h-11 px-3 text-base sm:h-9 sm:text-sm',
		lg: 'h-11 px-4 text-base'
	} as const;
</script>

<input
	{...rest as HTMLInputAttributes}
	bind:value
	aria-invalid={invalid ? 'true' : undefined}
	class={cx(
		'w-full rounded-control border bg-surface text-foreground shadow-control transition-colors',
		'placeholder:text-foreground-faint disabled:cursor-not-allowed disabled:opacity-60',
		FOCUS_RING,
		SIZES[size],
		invalid ? 'border-danger-border' : 'border-border-strong',
		className
	)}
/>
