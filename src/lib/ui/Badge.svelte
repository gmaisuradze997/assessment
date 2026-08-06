<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
	type Variant = 'subtle' | 'solid' | 'outline';

	interface Props {
		tone?: Tone;
		variant?: Variant;
		size?: 'sm' | 'md';
		/** Toggle/chip selected state — swaps to solid primary styling. */
		pressed?: boolean;
		class?: ClassValue;
		children: Snippet;
	}

	const {
		tone = 'neutral',
		variant = 'subtle',
		size = 'md',
		pressed = false,
		class: className,
		children
	}: Props = $props();

	const TONE_VARIANT: Record<Variant, Record<Tone, string>> = {
		subtle: {
			neutral: 'bg-surface-muted text-foreground-muted',
			primary: 'bg-primary-subtle text-accent-strong',
			success: 'bg-success-subtle text-success-strong',
			warning: 'bg-warning-subtle text-warning-strong',
			danger: 'bg-danger-subtle text-danger-strong',
			info: 'bg-info-subtle text-info-strong'
		},
		solid: {
			neutral: 'bg-surface-emphasis text-foreground',
			primary: 'bg-primary text-primary-foreground',
			success: 'bg-success-strong text-white',
			warning: 'bg-warning-strong text-white',
			danger: 'bg-danger text-white',
			info: 'bg-info-strong text-white'
		},
		outline: {
			neutral: 'border border-border-strong text-foreground-muted',
			primary: 'border border-primary-border text-accent-strong',
			success: 'border border-success-border-strong text-success-strong',
			warning: 'border border-warning-border-strong text-warning-strong',
			danger: 'border border-danger-border text-danger-strong',
			info: 'border border-info-border-strong text-info-strong'
		}
	};

	const resolvedVariant = $derived(pressed ? 'solid' : variant);
	const resolvedTone = $derived(pressed ? 'primary' : tone);

	const SIZES = {
		sm: 'px-2 py-0.5 text-[0.6875rem]',
		md: 'px-2.5 py-0.5 text-xs'
	} as const;
</script>

<!-- Presentational only: when used as a toggle chip, pair with a native
     control (checkbox/radio) that owns the accessible checked/pressed state. -->
<span
	class={cx(
		'inline-flex items-center gap-1 rounded-pill font-medium whitespace-nowrap',
		SIZES[size],
		TONE_VARIANT[resolvedVariant][resolvedTone],
		className
	)}
>
	{@render children()}
</span>
