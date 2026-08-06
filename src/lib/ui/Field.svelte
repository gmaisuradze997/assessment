<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from './cx';
	import { cx } from './cx';

	/** Props the field computes for its control; spread onto the input. */
	export interface ControlProps {
		id: string;
		'aria-describedby': string | undefined;
		'aria-invalid': 'true' | undefined;
	}

	interface Props {
		label: string;
		description?: string;
		error?: string;
		/** Hides the label visually but keeps it for assistive tech. */
		hideLabel?: boolean;
		class?: ClassValue;
		/** Receives wired ARIA props to spread onto the control. */
		children: Snippet<[ControlProps]>;
	}

	const {
		label,
		description,
		error,
		hideLabel = false,
		class: className,
		children
	}: Props = $props();

	// One stable base per instance; SSR/hydration-safe via $props.id().
	const uid = $props.id();
	const controlId = `${uid}-control`;
	const descId = `${uid}-desc`;
	const errorId = `${uid}-error`;

	// Point aria-describedby at whichever helper text is present.
	const describedBy = $derived(cx(description && descId, error && errorId).trim() || undefined);

	const controlProps = $derived<ControlProps>({
		id: controlId,
		'aria-describedby': describedBy,
		'aria-invalid': error ? 'true' : undefined
	});
</script>

<div class={cx('flex flex-col gap-1.5', className)}>
	<label
		for={controlId}
		class={hideLabel ? 'sr-only' : 'text-sm font-medium text-foreground-secondary'}
	>
		{label}
	</label>

	{#if description}
		<p id={descId} class="text-xs text-foreground-faint">{description}</p>
	{/if}

	{@render children(controlProps)}

	{#if error}
		<p id={errorId} class="text-sm text-danger">{error}</p>
	{/if}
</div>
