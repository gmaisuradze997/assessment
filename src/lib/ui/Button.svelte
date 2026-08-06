<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { ClassValue } from './cx';
	import { cx } from './cx';
	import { FOCUS_RING } from './variants';
	import Spinner from './Spinner.svelte';

	type Variant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
	type Tone = 'primary' | 'neutral' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		tone?: Tone;
		size?: Size;
		/** Renders an `<a>` instead of a `<button>`. */
		href?: string;
		type?: HTMLButtonAttributes['type'];
		disabled?: boolean;
		/** Shows a spinner and marks the control `aria-busy`. */
		loading?: boolean;
		class?: ClassValue;
		children: Snippet;
		/** Native attributes and `on*` handlers pass through to the root. */
		[key: string]: unknown;
	}

	const {
		variant = 'solid',
		tone = 'primary',
		size = 'md',
		href,
		type = 'button',
		disabled = false,
		loading = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	const TONE_VARIANT: Record<Variant, Record<Tone, string>> = {
		solid: {
			primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
			neutral: 'bg-surface-emphasis text-foreground hover:bg-surface-muted',
			danger: 'bg-danger text-white hover:opacity-90'
		},
		soft: {
			primary: 'bg-primary-subtle text-accent-strong hover:bg-primary-muted',
			neutral: 'bg-surface-muted text-foreground-secondary hover:bg-surface-emphasis',
			danger: 'bg-danger-subtle text-danger-strong hover:brightness-95'
		},
		outline: {
			primary: 'border border-primary-border bg-surface text-accent-strong hover:bg-primary-subtle',
			neutral:
				'border border-border-strong bg-surface text-foreground-secondary hover:bg-surface-subtle',
			danger: 'border border-danger-border bg-surface text-danger-strong hover:bg-danger-subtle'
		},
		ghost: {
			primary: 'text-accent-strong hover:bg-primary-subtle',
			neutral: 'text-foreground-secondary hover:bg-surface-subtle',
			danger: 'text-danger-strong hover:bg-danger-subtle'
		},
		link: {
			primary: 'text-accent underline-offset-4 hover:text-accent-hover hover:underline',
			neutral: 'text-foreground-secondary underline-offset-4 hover:text-foreground hover:underline',
			danger: 'text-danger underline-offset-4 hover:text-danger-strong hover:underline'
		}
	};

	const SIZES: Record<Size, string> = {
		sm: 'h-8 gap-1.5 px-3 text-xs',
		md: 'h-9 gap-2 px-4 text-sm',
		lg: 'h-11 gap-2 px-5 text-base'
	};

	const isLink = $derived(variant === 'link');
	const inactive = $derived(disabled || loading);

	const classes = $derived(
		cx(
			'inline-flex items-center justify-center font-semibold transition-[color,background-color,transform,box-shadow]',
			FOCUS_RING,
			isLink ? 'gap-1' : cx('rounded-control', SIZES[size]),
			!isLink &&
				'active:translate-y-px motion-safe:hover:-translate-y-px motion-safe:hover:shadow-control',
			TONE_VARIANT[variant][tone],
			inactive && 'pointer-events-none opacity-60',
			className
		)
	);
</script>

{#if href}
	<a
		{...rest as HTMLAnchorAttributes}
		href={inactive ? undefined : href}
		class={classes}
		aria-disabled={inactive ? 'true' : undefined}
		aria-busy={loading ? 'true' : undefined}
		role={inactive ? 'link' : undefined}
	>
		{#if loading}<Spinner />{/if}
		{@render children()}
	</a>
{:else}
	<button
		{...rest as HTMLButtonAttributes}
		{type}
		disabled={inactive}
		class={classes}
		aria-busy={loading ? 'true' : undefined}
	>
		{#if loading}<Spinner />{/if}
		{@render children()}
	</button>
{/if}
