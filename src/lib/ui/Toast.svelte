<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	type Kind = 'success' | 'error' | 'info' | 'warning';

	interface Props {
		kind?: Kind;
		message?: string;
		class?: ClassValue;
		children?: Snippet;
	}

	const { kind = 'success', message, class: className, children }: Props = $props();

	const KINDS: Record<Kind, string> = {
		success: 'border-success-border bg-success-subtle text-success-strong',
		error: 'border-danger-border bg-danger-subtle text-danger-strong',
		info: 'border-info-border-strong bg-info-subtle text-info-strong',
		warning: 'border-warning-border bg-warning-subtle text-warning-strong'
	};
</script>

<div
	class={cx(
		'rounded-control border px-4 py-3 text-sm font-medium shadow-overlay',
		KINDS[kind],
		className
	)}
	role={kind === 'error' ? 'alert' : 'status'}
>
	{#if children}{@render children()}{:else}{message}{/if}
</div>
