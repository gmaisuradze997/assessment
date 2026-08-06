<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	interface Props {
		padding?: 'none' | 'sm' | 'md' | 'lg';
		/** Adds hover elevation; pair with a link/button child. */
		interactive?: boolean;
		class?: ClassValue;
		header?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	const {
		padding = 'md',
		interactive = false,
		class: className,
		header,
		footer,
		children
	}: Props = $props();

	const PADDINGS = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	} as const;

	// Header/footer own their own padding so the divider spans full width.
	const bodyPadding = $derived(header || footer ? '' : PADDINGS[padding]);
	const sectionPadding = $derived(padding === 'none' ? 'p-6' : PADDINGS[padding]);
</script>

<div
	class={cx(
		'overflow-hidden rounded-card border border-border bg-surface text-foreground shadow-card',
		interactive &&
			'transition-[transform,box-shadow] hover:shadow-popover motion-safe:hover:-translate-y-0.5',
		bodyPadding,
		className
	)}
>
	{#if header}
		<div class={cx('border-b border-border', sectionPadding)}>
			{@render header()}
		</div>
	{/if}

	<div class={header || footer ? sectionPadding : ''}>
		{@render children()}
	</div>

	{#if footer}
		<div class={cx('border-t border-border bg-surface-subtle', sectionPadding)}>
			{@render footer()}
		</div>
	{/if}
</div>
