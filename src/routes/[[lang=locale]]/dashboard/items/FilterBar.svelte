<script lang="ts">
	import { goto } from '$app/navigation';
	import type { MessageKey } from '$lib/i18n/messages';
	import { t } from '$lib/i18n/runtime.svelte';
	import {
		ITEM_CHANNELS,
		ITEM_STATUSES,
		type ItemChannel,
		type ItemStatus
	} from '$lib/schemas/item';
	import {
		itemsQueryToSearchParams,
		ITEMS_QUERY_DEFAULTS,
		type ItemsQuery
	} from '$lib/schemas/items-query';
	import Badge from '$lib/ui/Badge.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Combobox from '$lib/ui/Combobox.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { dismiss } from '$lib/ui/actions/dismiss';
	import type { ComboboxOption } from '$lib/ui/combobox-machine';
	import { FOCUS_RING } from '$lib/ui/variants';

	interface Props {
		query: ItemsQuery;
		basePath: string;
		/** Facet counts from the streamed row query; null while pending/failed. */
		facets: {
			status: Partial<Record<string, number>>;
			channel: Partial<Record<string, number>>;
		} | null;
		/** Distinct owners for the owner Combobox filter. */
		owners: ComboboxOption[];
	}

	const { query, basePath, facets, owners }: Props = $props();

	// Initial capture is intentional (SSR value); the effect below re-syncs.
	// svelte-ignore state_referenced_locally
	let qInput = $state(query.q);
	let qFocused = $state(false);
	let statusOpen = $state(false);
	let channelOpen = $state(false);
	let ownerOpen = $state(false);
	let statusDetails = $state<HTMLDetailsElement | undefined>();
	let channelDetails = $state<HTMLDetailsElement | undefined>();
	let ownerDetails = $state<HTMLDetailsElement | undefined>();

	// Owner combobox value mirrors q when q exactly matches an owner label.
	let ownerValue = $state<string | null>(null);

	$effect(() => {
		const urlQ = query.q;
		if (!qFocused) qInput = urlQ;
		const match = owners.find((o) => o.label === urlQ);
		ownerValue = match ? String(match.value) : null;
	});

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function apply(next: Partial<ItemsQuery>, options: { replace?: boolean } = {}) {
		const merged: ItemsQuery = { ...query, q: qInput.trim(), page: 1, ...next };
		const params = itemsQueryToSearchParams(merged);
		goto(params.size > 0 ? `${basePath}?${params}` : basePath, {
			keepFocus: true,
			noScroll: true,
			replaceState: options.replace ?? false
		});
	}

	function onQueryInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => apply({}, { replace: true }), 300);
	}

	function toggleStatus(status: ItemStatus) {
		const next = query.status.includes(status)
			? query.status.filter((s) => s !== status)
			: [...query.status, status];
		apply({ status: next });
	}

	function toggleChannel(channel: ItemChannel) {
		const next = query.channel.includes(channel)
			? query.channel.filter((c) => c !== channel)
			: [...query.channel, channel];
		apply({ channel: next });
	}

	function onOwnerChange(value: string | null) {
		ownerValue = value;
		const label = value ? (owners.find((o) => o.value === value)?.label ?? '') : '';
		qInput = label;
		apply({ q: label }, { replace: true });
		ownerOpen = false;
	}

	function chipHref(next: Partial<ItemsQuery>): string {
		const params = itemsQueryToSearchParams({ ...query, page: 1, ...next });
		return params.size > 0 ? `${basePath}?${params}` : basePath;
	}

	const hasFilters = $derived(
		query.q !== '' || query.status.length > 0 || query.channel.length > 0
	);

	const ownerActive = $derived(owners.some((o) => o.label === query.q));

	type ActiveChip = {
		id: string;
		label: string;
		href: string;
	};

	const activeChips = $derived.by((): ActiveChip[] => {
		const chips: ActiveChip[] = [];
		if (query.q && !ownerActive) {
			chips.push({
				id: 'q',
				label: t('dashboard.items.filter.chip.search', { q: query.q }),
				href: chipHref({ q: '' })
			});
		}
		if (ownerActive) {
			chips.push({
				id: 'owner',
				label: t('dashboard.items.filter.chip.owner', { owner: query.q }),
				href: chipHref({ q: '' })
			});
		}
		for (const status of query.status) {
			chips.push({
				id: `status-${status}`,
				label: t('dashboard.items.filter.chip.status', {
					status: t(`status.${status}` as MessageKey)
				}),
				href: chipHref({ status: query.status.filter((s) => s !== status) })
			});
		}
		for (const channel of query.channel) {
			chips.push({
				id: `channel-${channel}`,
				label: t('dashboard.items.filter.chip.channel', {
					channel: t(`channel.${channel}` as MessageKey)
				}),
				href: chipHref({ channel: query.channel.filter((c) => c !== channel) })
			});
		}
		return chips;
	});

	const filterTriggerClass =
		'flex min-h-10 list-none items-center gap-1.5 rounded-control border px-3 text-sm font-medium transition-colors cursor-pointer select-none [&::-webkit-details-marker]:hidden';

	const popoverClass =
		'absolute top-full z-40 mt-1.5 max-w-[min(18rem,calc(100vw-2rem))] rounded-control border border-border bg-surface p-2 shadow-popover';
</script>

<!-- GET form so filtering works without JavaScript; hidden fields carry
     the sort state that would otherwise be dropped on native submit. -->
<form
	method="GET"
	action={basePath}
	aria-label={t('dashboard.items.filtersLabel')}
	class="rounded-card border border-border bg-surface shadow-card"
	data-sveltekit-keepfocus
>
	{#if query.sort !== ITEMS_QUERY_DEFAULTS.sort || query.dir !== ITEMS_QUERY_DEFAULTS.dir}
		<input type="hidden" name="sort" value={query.sort} />
		<input type="hidden" name="dir" value={query.dir} />
	{/if}

	<!-- Linear/Notion-style toolbar: search + filter popovers (live, no Apply) -->
	<div class="flex flex-wrap items-center gap-2 border-b border-border-subtle px-3 py-2.5">
		<div class="relative min-w-0 flex-1 basis-full sm:min-w-48 sm:basis-56">
			<label for="items-q" class="sr-only">{t('dashboard.items.searchPlaceholder')}</label>
			<span
				class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-foreground-faint"
				aria-hidden="true"
			>
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="none">
					<path
						d="m14.5 14.5-3.1-3.1m1.1-2.9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
			</span>
			<Input
				id="items-q"
				name="q"
				type="search"
				placeholder={t('dashboard.items.searchPlaceholder')}
				bind:value={qInput}
				oninput={onQueryInput}
				onfocus={() => (qFocused = true)}
				onblur={() => (qFocused = false)}
				class="pl-9"
			/>
		</div>

		<details bind:this={statusDetails} bind:open={statusOpen} class="relative">
			<summary
				class="{filterTriggerClass} {FOCUS_RING} {query.status.length > 0
					? 'border-primary bg-primary-subtle text-accent-strong'
					: 'border-border-strong bg-surface text-foreground-secondary hover:bg-surface-subtle'}"
			>
				{t('dashboard.items.filter.status')}
				{#if query.status.length > 0}
					<span
						class="rounded-pill bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground"
					>
						{query.status.length}
					</span>
				{/if}
				<svg class="h-3.5 w-3.5 opacity-60" viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path
						d="m6 8 4 4 4-4"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</summary>
			<div
				use:dismiss={{
					enabled: statusOpen,
					onDismiss: () => (statusOpen = false),
					trigger: () => statusDetails?.querySelector('summary') ?? null,
					closeOnEscape: true,
					closeOnOutside: true
				}}
				class="{popoverClass} left-0 w-56"
			>
				<fieldset class="flex flex-col gap-0.5">
					<legend class="sr-only">{t('dashboard.items.filter.status')}</legend>
					{#each ITEM_STATUSES as status (status)}
						{@const selected = query.status.includes(status)}
						{@const count = facets?.status[status]}
						<label
							class="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-surface-subtle"
						>
							<input
								type="checkbox"
								name="status"
								value={status}
								checked={selected}
								onchange={() => toggleStatus(status)}
								class="size-3.5 rounded border-border-strong accent-primary"
							/>
							<span class="flex-1 text-foreground">{t(`status.${status}` as MessageKey)}</span>
							{#if count !== undefined}
								<span class="text-xs text-foreground-faint tabular-nums">{count}</span>
							{/if}
						</label>
					{/each}
				</fieldset>
			</div>
		</details>

		<details bind:this={channelDetails} bind:open={channelOpen} class="relative">
			<summary
				class="{filterTriggerClass} {FOCUS_RING} {query.channel.length > 0
					? 'border-primary bg-primary-subtle text-accent-strong'
					: 'border-border-strong bg-surface text-foreground-secondary hover:bg-surface-subtle'}"
			>
				{t('dashboard.items.filter.channel')}
				{#if query.channel.length > 0}
					<span
						class="rounded-pill bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground"
					>
						{query.channel.length}
					</span>
				{/if}
				<svg class="h-3.5 w-3.5 opacity-60" viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path
						d="m6 8 4 4 4-4"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</summary>
			<div
				use:dismiss={{
					enabled: channelOpen,
					onDismiss: () => (channelOpen = false),
					trigger: () => channelDetails?.querySelector('summary') ?? null,
					closeOnEscape: true,
					closeOnOutside: true
				}}
				class="{popoverClass} left-0 w-56 sm:right-0 sm:left-auto"
			>
				<fieldset class="flex flex-col gap-0.5">
					<legend class="sr-only">{t('dashboard.items.filter.channel')}</legend>
					{#each ITEM_CHANNELS as channel (channel)}
						{@const selected = query.channel.includes(channel)}
						{@const count = facets?.channel[channel]}
						<label
							class="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-surface-subtle"
						>
							<input
								type="checkbox"
								name="channel"
								value={channel}
								checked={selected}
								onchange={() => toggleChannel(channel)}
								class="size-3.5 rounded border-border-strong accent-primary"
							/>
							<span class="flex-1 text-foreground">{t(`channel.${channel}` as MessageKey)}</span>
							{#if count !== undefined}
								<span class="text-xs text-foreground-faint tabular-nums">{count}</span>
							{/if}
						</label>
					{/each}
				</fieldset>
			</div>
		</details>

		<details bind:this={ownerDetails} bind:open={ownerOpen} class="relative">
			<summary
				class="{filterTriggerClass} {FOCUS_RING} {ownerActive
					? 'border-primary bg-primary-subtle text-accent-strong'
					: 'border-border-strong bg-surface text-foreground-secondary hover:bg-surface-subtle'}"
			>
				{t('dashboard.items.filter.owner')}
				{#if ownerActive}
					<span
						class="rounded-pill bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground"
					>
						1
					</span>
				{/if}
				<svg class="h-3.5 w-3.5 opacity-60" viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path
						d="m6 8 4 4 4-4"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</summary>
			<div
				use:dismiss={{
					enabled: ownerOpen,
					onDismiss: () => (ownerOpen = false),
					trigger: () => ownerDetails?.querySelector('summary') ?? null,
					closeOnEscape: true,
					closeOnOutside: true
				}}
				class="{popoverClass} right-0 left-auto w-72 p-3"
			>
				<Combobox
					options={owners}
					bind:value={ownerValue}
					label={t('dashboard.items.filter.owner')}
					hideLabel
					placeholder={t('dashboard.items.filter.ownerPlaceholder')}
					resultsLabel={(count) => t('dashboard.items.filter.ownerResults', { count })}
					emptyLabel={t('dashboard.items.filter.ownerEmpty')}
					onchange={onOwnerChange}
				/>
			</div>
		</details>
	</div>

	{#if hasFilters}
		<div
			class="flex flex-wrap items-center gap-2 px-3 py-2.5"
			aria-label={t('dashboard.items.filter.active')}
		>
			{#each activeChips as chip (chip.id)}
				<a
					href={chip.href}
					data-sveltekit-noscroll
					class="inline-flex items-center gap-1 rounded-pill {FOCUS_RING}"
					aria-label={t('dashboard.items.filter.remove', { label: chip.label })}
				>
					<Badge tone="primary" variant="subtle" class="pr-1.5">
						{chip.label}
						<span class="ml-0.5 opacity-70" aria-hidden="true">×</span>
					</Badge>
				</a>
			{/each}
			<Button href={basePath} variant="link" size="sm">
				{t('dashboard.items.clearFilters')}
			</Button>
		</div>
	{/if}
</form>
