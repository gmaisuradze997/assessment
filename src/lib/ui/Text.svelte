<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	interface Props {
		as?: 'p' | 'span' | 'div';
		size?: 'xs' | 'sm' | 'md' | 'lg';
		tone?: 'default' | 'secondary' | 'muted' | 'faint' | 'danger';
		weight?: 'normal' | 'medium' | 'semibold';
		class?: ClassValue;
		children: Snippet;
	}

	const {
		as = 'p',
		size = 'md',
		tone = 'default',
		weight = 'normal',
		class: className,
		children
	}: Props = $props();

	const SIZES = {
		xs: 'text-xs',
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg'
	} as const;

	const TONES = {
		default: 'text-foreground',
		secondary: 'text-foreground-secondary',
		muted: 'text-foreground-muted',
		faint: 'text-foreground-faint',
		danger: 'text-danger'
	} as const;

	const WEIGHTS = {
		normal: 'font-normal',
		medium: 'font-medium',
		semibold: 'font-semibold'
	} as const;
</script>

<svelte:element this={as} class={cx(SIZES[size], TONES[tone], WEIGHTS[weight], className)}>
	{@render children()}
</svelte:element>
