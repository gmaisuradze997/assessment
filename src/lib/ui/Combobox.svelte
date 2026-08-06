<script lang="ts" generics="T = string">
	import { dismiss } from './actions/dismiss';
	import type { ClassValue } from './cx';
	import { cx } from './cx';
	import { ComboboxMachine, type ComboboxAction, type ComboboxOption } from './combobox-machine';
	import { FOCUS_RING } from './variants';

	interface Props {
		options: ComboboxOption<T>[];
		value?: T | null;
		/** Accessible name for the combobox input. */
		label: string;
		/** Visually hide the label (still exposed to AT). */
		hideLabel?: boolean;
		placeholder?: string;
		disabled?: boolean;
		invalid?: boolean;
		/** Announce filter results; receives the filtered count. */
		resultsLabel?: (count: number) => string;
		emptyLabel?: string;
		class?: ClassValue;
		onchange?: (value: T | null) => void;
	}

	let {
		options,
		value = $bindable(null as T | null),
		label,
		hideLabel = false,
		placeholder = '',
		disabled = false,
		invalid = false,
		resultsLabel = (count) => `${count} results`,
		emptyLabel = 'No results',
		class: className,
		onchange
	}: Props = $props();

	const uid = $props.id();
	const inputId = `${uid}-input`;
	const listboxId = `${uid}-listbox`;
	const statusId = `${uid}-status`;

	// Construct empty; the effects below push the live props in.
	const machine = new ComboboxMachine<T>({ options: [] });

	// Reactive mirror of the plain machine — bumped after every mutation.
	let snap = $state(machine.snapshot());

	function commit(action: ComboboxAction<T>) {
		machine.dispatch(action);
		snap = machine.snapshot();
		if (machine.value !== value) {
			value = machine.value;
			onchange?.(machine.value);
		}
	}

	// Keep the machine's option list in sync when the caller updates it.
	$effect(() => {
		machine.setOptions(options);
		snap = machine.snapshot();
	});

	// External value changes (e.g. form reset) flow into the machine.
	$effect(() => {
		if (value !== machine.value) {
			machine.dispatch({ type: 'setValue', value });
			snap = machine.snapshot();
		}
	});

	let inputEl: HTMLInputElement | undefined = $state();
	let listboxEl: HTMLElement | undefined = $state();

	const activeId = $derived(
		snap.open && snap.activeIndex >= 0 ? `${uid}-opt-${snap.activeIndex}` : undefined
	);

	function onInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		commit({ type: 'input', query: target.value });
	}

	function onKeydown(event: KeyboardEvent) {
		if (machine.handleKeydown(event)) {
			event.preventDefault();
			snap = machine.snapshot();
			if (machine.value !== value) {
				value = machine.value;
				onchange?.(machine.value);
			}
			queueMicrotask(scrollActiveIntoView);
		}
	}

	function scrollActiveIntoView() {
		if (!listboxEl || snap.activeIndex < 0) return;
		const el = listboxEl.querySelector(`#${uid}-opt-${snap.activeIndex}`);
		el?.scrollIntoView({ block: 'nearest' });
	}

	function selectIndex(index: number) {
		commit({ type: 'moveTo', index });
		commit({ type: 'selectActive' });
		inputEl?.focus();
	}
</script>

<div class={cx('relative flex w-full flex-col gap-1.5', className)}>
	<label
		for={inputId}
		class={hideLabel ? 'sr-only' : 'text-sm font-medium text-foreground-secondary'}
	>
		{label}
	</label>

	<div class="relative">
		<input
			bind:this={inputEl}
			id={inputId}
			type="text"
			role="combobox"
			aria-expanded={snap.open}
			aria-controls={listboxId}
			aria-autocomplete="list"
			aria-activedescendant={activeId}
			aria-invalid={invalid ? 'true' : undefined}
			aria-describedby={statusId}
			{disabled}
			{placeholder}
			autocomplete="off"
			value={snap.query}
			oninput={onInput}
			onkeydown={onKeydown}
			onfocus={() => commit({ type: 'open' })}
			class={cx(
				'w-full rounded-control border bg-surface pr-10 text-base text-foreground shadow-control transition-colors sm:pr-9 sm:text-sm',
				'h-11 px-3 placeholder:text-foreground-faint disabled:cursor-not-allowed disabled:opacity-60 sm:h-9',
				FOCUS_RING,
				invalid ? 'border-danger-border' : 'border-border-strong'
			)}
		/>
		<button
			type="button"
			tabindex="-1"
			{disabled}
			aria-label={snap.open ? 'Close' : 'Open'}
			onclick={() => {
				commit({ type: 'toggle' });
				inputEl?.focus();
			}}
			class="absolute top-1/2 right-1.5 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded text-foreground-faint hover:text-foreground"
		>
			<svg
				class={cx('h-4 w-4 transition-transform', snap.open && 'rotate-180')}
				style="transition-duration: var(--duration-fast);"
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
		</button>
	</div>

	<!-- Live region announces filter result counts to screen readers. -->
	<div id={statusId} role="status" aria-live="polite" class="sr-only">
		{#if snap.open}
			{snap.filtered.length === 0 ? emptyLabel : resultsLabel(snap.filtered.length)}
		{/if}
	</div>

	{#if snap.open}
		<ul
			bind:this={listboxEl}
			id={listboxId}
			role="listbox"
			use:dismiss={{
				enabled: snap.open,
				onDismiss: () => commit({ type: 'blur' }),
				trigger: () => inputEl ?? null,
				closeOnEscape: false,
				closeOnOutside: true
			}}
			class="absolute top-full z-40 mt-1 max-h-60 w-full overflow-auto rounded-control border border-border bg-surface py-1 shadow-popover"
		>
			{#if snap.filtered.length === 0}
				<li class="px-3 py-2 text-sm text-foreground-faint" role="presentation">
					{emptyLabel}
				</li>
			{:else}
				{#each snap.filtered as option, index (String(option.value))}
					{@const active = index === snap.activeIndex}
					{@const selected = snap.value != null && Object.is(snap.value, option.value)}
					<li
						id={`${uid}-opt-${index}`}
						role="option"
						aria-selected={selected}
						aria-disabled={option.disabled || undefined}
						onmousedown={(event) => {
							// Prevent input blur before click registers.
							event.preventDefault();
							if (!option.disabled) selectIndex(index);
						}}
						onmouseenter={() => {
							if (!option.disabled) commit({ type: 'moveTo', index });
						}}
						class={cx(
							'cursor-pointer px-3 py-2.5 text-sm sm:py-1.5',
							option.disabled && 'cursor-not-allowed opacity-50',
							active && 'bg-primary-subtle text-accent-strong',
							!active && selected && 'font-medium text-accent',
							!active && !selected && 'text-foreground'
						)}
					>
						{option.label}
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
