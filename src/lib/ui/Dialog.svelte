<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { dismiss } from './actions/dismiss';
	import { focusTrap } from './actions/focus-trap';
	import { portal } from './actions/portal';
	import { lockScroll, unlockScroll } from './actions/scroll-lock';
	import type { ClassValue } from './cx';
	import { cx } from './cx';
	import { FOCUS_RING } from './variants';

	interface Props {
		open?: boolean;
		/** Plain-string title; preferred over the title snippet for simple cases. */
		title?: string;
		/** Accessible name when no visible title is rendered. */
		'aria-label'?: string;
		/** Label for the dismiss button. Defaults to "Close". */
		closeLabel?: string;
		/** When false, Escape and scrim clicks do not close the dialog. */
		dismissible?: boolean;
		class?: ClassValue;
		titleSnippet?: Snippet;
		description?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		'aria-label': ariaLabel,
		closeLabel = 'Close',
		dismissible = true,
		class: className,
		titleSnippet,
		description,
		footer,
		children
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const descId = `${uid}-desc`;

	const hasTitle = $derived(Boolean(title || titleSnippet));
	const hasDescription = $derived(Boolean(description));

	// Only mount the overlay on the client once open — zero SSR cost.
	const mounted = $derived(browser && open);

	let shellEl: HTMLElement | undefined = $state();

	function close() {
		open = false;
	}

	function onDismiss() {
		if (dismissible) close();
	}

	// Mark every top-level body child except the portaled root as inert so
	// screen-reader virtual cursors cannot leave the dialog.
	$effect(() => {
		if (!mounted || !shellEl) return;

		const inerted: HTMLElement[] = [];
		for (const child of Array.from(document.body.children) as HTMLElement[]) {
			if (child === shellEl || child.contains(shellEl)) continue;
			if (child.hasAttribute('inert')) continue;
			child.setAttribute('inert', '');
			inerted.push(child);
		}

		lockScroll();

		return () => {
			for (const el of inerted) el.removeAttribute('inert');
			unlockScroll();
		};
	});
</script>

{#if mounted}
	<div
		bind:this={shellEl}
		use:portal
		class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
	>
		<!-- Scrim sits outside the dialog node so dismiss's outside-pointer
		     path treats clicks on it as dismissal. -->
		<div
			class="absolute inset-0 bg-overlay"
			style="transition: opacity var(--duration-base) var(--ease-standard);"
			aria-hidden="true"
		></div>

		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={hasTitle ? titleId : undefined}
			aria-describedby={hasDescription ? descId : undefined}
			aria-label={!hasTitle ? ariaLabel : undefined}
			use:focusTrap={{ enabled: open }}
			use:dismiss={{
				enabled: open,
				onDismiss,
				closeOnEscape: dismissible,
				closeOnOutside: dismissible
			}}
			class={cx(
				'relative z-10 flex w-full max-w-lg flex-col overflow-hidden border border-border bg-surface shadow-overlay',
				'rounded-t-card border-b-0 sm:rounded-card sm:border-b',
				'max-h-[min(92dvh,40rem)] pb-[env(safe-area-inset-bottom)]',
				className
			)}
			style="animation: ui-dialog-in var(--duration-base) var(--ease-standard);"
		>
			{#if hasTitle}
				<div
					class="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6"
				>
					<h2 id={titleId} class="text-lg font-semibold text-balance text-foreground">
						{#if titleSnippet}
							{@render titleSnippet()}
						{:else}
							{title}
						{/if}
					</h2>
					{#if dismissible}
						<button
							type="button"
							onclick={close}
							class={cx(
								'-mt-1 -mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-foreground-faint hover:bg-surface-muted hover:text-foreground',
								FOCUS_RING
							)}
							aria-label={closeLabel}
						>
							<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path
									d="M4 4l8 8M12 4l-8 8"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<div class="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
				{#if hasDescription}
					<div id={descId} class="mb-3 text-sm text-foreground-muted">
						{@render description?.()}
					</div>
				{/if}
				{@render children()}
			</div>

			{#if footer}
				<div
					class="flex flex-col-reverse gap-2 border-t border-border bg-surface-subtle px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-6 [&_a]:w-full sm:[&_a]:w-auto [&_button]:w-full sm:[&_button]:w-auto"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes ui-dialog-in {
		from {
			opacity: 0;
			transform: translateY(0.5rem) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
