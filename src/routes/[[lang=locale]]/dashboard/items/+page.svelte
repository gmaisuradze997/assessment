<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { formatCurrency, formatDate, formatNumber, formatPercent } from '$lib/i18n/format';
	import { localizePath } from '$lib/i18n/locales';
	import type { MessageKey } from '$lib/i18n/messages';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { ITEM_PAGE_SIZES, type Item, type ItemSortField } from '$lib/schemas/item';
	import { itemsQueryToSearchParams } from '$lib/schemas/items-query';
	import type { ItemsPage } from '$lib/server/data/items';
	import Button from '$lib/ui/Button.svelte';
	import Container from '$lib/ui/Container.svelte';
	import Heading from '$lib/ui/Heading.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Text from '$lib/ui/Text.svelte';
	import Toast from '$lib/ui/Toast.svelte';
	import { FOCUS_RING } from '$lib/ui/variants';
	import FilterBar from './FilterBar.svelte';
	import ItemEditDialog from './ItemEditDialog.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import TableSkeleton from './TableSkeleton.svelte';

	const { data } = $props();
	const locale = $derived(currentLocale());
	const basePath = $derived(localizePath('/dashboard/items', locale));
	// Write authorization is enforced in the update action (viewer → 403).
	// Keeping the form enabled lets optimistic apply → rollback stay demoable.
	const canEdit = true;

	/**
	 * The streamed promise is copied into local state once it resolves.
	 * Rendering from local state (instead of {#await}) is what makes
	 * optimistic inline edits possible: rows can be mutated immediately
	 * and rolled back without re-running the load (which would replace
	 * the table with a skeleton again).
	 */
	type RowsView = { state: 'loading' } | { state: 'error' } | { state: 'ready'; page: ItemsPage };

	let view = $state<RowsView>({ state: 'loading' });
	let detailItem = $state<Item | null>(null);
	let detailOpen = $state(false);

	$effect(() => {
		const promise = data.rows;
		view = { state: 'loading' };
		promise.then(
			(page) => {
				// Guard against out-of-order resolution after fast navigations.
				if (promise === data.rows) view = { state: 'ready', page };
			},
			() => {
				if (promise === data.rows) view = { state: 'error' };
			}
		);
	});

	function applyPatch(id: string, patch: Partial<Item>): Item | null {
		if (view.state !== 'ready') return null;
		const index = view.page.rows.findIndex((row) => row.id === id);
		if (index === -1) return null;
		const previous = view.page.rows[index];
		// Reassign `view` so the optimistic row swap always invalidates `{#each}`.
		const rows = view.page.rows.with(index, { ...previous, ...patch });
		view = { state: 'ready', page: { ...view.page, rows } };
		return previous;
	}

	function commitRow(id: string, item: Item) {
		if (view.state !== 'ready') return;
		const index = view.page.rows.findIndex((row) => row.id === id);
		if (index !== -1) {
			const rows = view.page.rows.with(index, item);
			view = { state: 'ready', page: { ...view.page, rows } };
		}
		if (detailItem?.id === id) detailItem = item;
	}

	function rollbackRow(id: string, previous: Item) {
		if (view.state !== 'ready') return;
		const index = view.page.rows.findIndex((row) => row.id === id);
		if (index !== -1) {
			const rows = view.page.rows.with(index, previous);
			view = { state: 'ready', page: { ...view.page, rows } };
		}
	}

	function openDetail(item: Item) {
		detailItem = item;
		detailOpen = true;
	}

	interface Column {
		field: ItemSortField;
		label: string;
		numeric?: boolean;
	}

	const columns = $derived<Column[]>([
		{ field: 'name', label: t('dashboard.items.column.name') },
		{ field: 'status', label: t('dashboard.items.column.status') },
		{ field: 'channel', label: t('dashboard.items.column.channel') },
		{ field: 'owner', label: t('dashboard.items.column.owner') },
		{ field: 'budget', label: t('dashboard.items.column.budget'), numeric: true },
		{ field: 'spent', label: t('dashboard.items.column.spent'), numeric: true },
		{ field: 'ctr', label: t('dashboard.items.column.ctr'), numeric: true },
		{ field: 'updatedAt', label: t('dashboard.items.column.updated') }
	]);

	const DESC_FIRST: ReadonlySet<ItemSortField> = new Set(['budget', 'spent', 'ctr', 'updatedAt']);

	function sortHref(field: ItemSortField): string {
		const dir =
			data.query.sort === field
				? data.query.dir === 'asc'
					? 'desc'
					: 'asc'
				: DESC_FIRST.has(field)
					? 'desc'
					: 'asc';
		const params = itemsQueryToSearchParams({ ...data.query, sort: field, dir, page: 1 });
		return params.size > 0 ? `${basePath}?${params}` : basePath;
	}

	function pageHref(page: number): string {
		const params = itemsQueryToSearchParams({ ...data.query, page });
		return params.size > 0 ? `${basePath}?${params}` : basePath;
	}

	function onPageSizeChange(event: Event) {
		const pageSize = Number((event.currentTarget as HTMLSelectElement).value);
		const params = itemsQueryToSearchParams({ ...data.query, pageSize, page: 1 });
		goto(params.size > 0 ? `${basePath}?${params}` : basePath, {
			keepFocus: true,
			noScroll: true
		});
	}

	const hasFilters = $derived(
		data.query.q !== '' || data.query.status.length > 0 || data.query.channel.length > 0
	);
</script>

<svelte:head>
	<title>{t('dashboard.items.title')}</title>
	<meta name="description" content={t('dashboard.items.meta.description')} />
</svelte:head>

<Container class="py-10">
	<div class="flex flex-wrap items-baseline justify-between gap-2">
		<!-- 2xl: shell title stays larger than streamed row names for LCP. -->
		<Heading level={1} size="2xl">{t('dashboard.items.title')}</Heading>
		{#if view.state === 'ready'}
			<Text size="sm" tone="faint">
				{t('dashboard.items.count', { total: formatNumber(locale, view.page.total) })}
			</Text>
		{/if}
	</div>

	<!-- Summary strip: streamed independently of the rows, so it can fail
	     (or succeed) on its own — partial failure is a first-class state. -->
	{#await data.stats}
		<!-- Skeleton lines mirror the resolved card's typography exactly
		     (h-4 = text-xs line box, mt-1 + h-7 = text-lg line box), so the
		     strip's height doesn't change when stats stream in — otherwise
		     everything below shifts and blows the CLS budget. -->
		<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
				<div class="rounded-card border border-border bg-surface p-3 shadow-card">
					<div class="flex h-4 items-center">
						<div class="h-3 w-16 animate-pulse rounded bg-skeleton"></div>
					</div>
					<div class="mt-1 flex h-7 items-center">
						<div class="h-5 w-20 animate-pulse rounded bg-skeleton"></div>
					</div>
				</div>
			{/each}
		</div>
	{:then stats}
		<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{#each [{ label: t('dashboard.stats.total'), value: formatNumber(locale, stats.total) }, { label: t('dashboard.stats.active'), value: formatNumber(locale, stats.active) }, { label: t('dashboard.stats.budget'), value: formatCurrency(locale, stats.totalBudget) }, { label: t('dashboard.stats.spent'), value: formatCurrency(locale, stats.totalSpent) }, { label: t('dashboard.stats.ctr'), value: formatPercent(locale, stats.averageCtr) }] as card (card.label)}
				<div class="rounded-card border border-border bg-surface p-3 shadow-card">
					<p class="text-xs font-semibold tracking-wide text-foreground-faint uppercase">
						{card.label}
					</p>
					<p class="mt-1 font-display text-lg font-bold tracking-tight break-words text-foreground">
						{card.value}
					</p>
				</div>
			{/each}
		</div>
	{:catch}
		<div class="mt-6">
			<Toast kind="warning" message={t('dashboard.stats.error')} />
		</div>
	{/await}

	<div class="mt-6">
		<FilterBar
			query={data.query}
			{basePath}
			facets={view.state === 'ready' ? view.page.facets : null}
			owners={data.owners}
		/>
	</div>

	{#if view.state === 'error'}
		<div
			class="mt-4 flex flex-col items-start gap-4 rounded-card border border-border bg-surface p-8 shadow-card"
		>
			<Text size="sm" class="text-danger-strong">{t('dashboard.items.loadError')}</Text>
			<Button type="button" onclick={() => invalidateAll()}>
				{t('common.retry')}
			</Button>
		</div>
	{:else if view.state === 'ready' && view.page.rows.length === 0}
		<div
			class="mt-4 flex flex-col items-start gap-4 rounded-card border border-border bg-surface p-8 shadow-card"
		>
			<Heading level={2} size="md" class="text-foreground">
				{hasFilters ? t('dashboard.items.noMatches') : t('dashboard.items.empty')}
			</Heading>
			<Text tone="muted">
				{hasFilters ? t('dashboard.items.noMatchesHint') : t('dashboard.items.emptyHint')}
			</Text>
			{#if hasFilters}
				<Button href={basePath}>{t('dashboard.items.clearFilters')}</Button>
			{/if}
		</div>
	{:else}
		<!-- Mobile: stacked cards — the wide table needs horizontal pan. -->
		<ul
			class="mt-4 flex flex-col gap-3 md:hidden"
			aria-busy={view.state === 'loading'}
			aria-label={t('dashboard.items.tableLabel')}
		>
			{#if view.state === 'loading'}
				{#each Array.from({ length: Math.min(data.query.pageSize, 6) }, (_, i) => i) as i (i)}
					<li class="rounded-card border border-border bg-surface p-4 shadow-card">
						<div class="h-5 w-2/3 animate-pulse rounded bg-skeleton"></div>
						<div class="mt-3 flex gap-2">
							<div class="h-6 w-16 animate-pulse rounded-pill bg-skeleton"></div>
							<div class="h-6 w-20 animate-pulse rounded bg-skeleton"></div>
						</div>
						<div class="mt-4 grid grid-cols-2 gap-3">
							<div class="h-4 w-20 animate-pulse rounded bg-skeleton"></div>
							<div class="ml-auto h-4 w-16 animate-pulse rounded bg-skeleton"></div>
						</div>
					</li>
				{/each}
			{:else}
				{#each view.page.rows as item (item.id)}
					<li>
						<button
							type="button"
							onclick={() => openDetail(item)}
							class="w-full rounded-card border border-border bg-surface p-4 text-left shadow-card transition-colors hover:bg-surface-subtle {FOCUS_RING}"
							aria-label={canEdit
								? t('dashboard.items.edit.open', { name: item.name })
								: t('dashboard.items.detail.open', { name: item.name })}
						>
							<div class="flex items-start justify-between gap-3">
								<span class="font-medium text-balance text-foreground">{item.name}</span>
								<StatusBadge status={item.status} />
							</div>
							<p class="mt-2 text-sm text-foreground-muted">
								{t(`channel.${item.channel}` as MessageKey)} · {item.owner.name}
							</p>
							<dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
								<div>
									<dt class="text-xs text-foreground-faint">
										{t('dashboard.items.column.budget')}
									</dt>
									<dd class="font-medium text-foreground tabular-nums">
										{formatCurrency(locale, item.budget)}
									</dd>
								</div>
								<div class="text-right">
									<dt class="text-xs text-foreground-faint">
										{t('dashboard.items.column.spent')}
									</dt>
									<dd class="text-foreground-muted tabular-nums">
										{formatCurrency(locale, item.spent)}
									</dd>
								</div>
								<div>
									<dt class="text-xs text-foreground-faint">
										{t('dashboard.items.column.ctr')}
									</dt>
									<dd class="text-foreground-muted tabular-nums">
										{formatPercent(locale, item.ctr)}
									</dd>
								</div>
								<div class="text-right">
									<dt class="text-xs text-foreground-faint">
										{t('dashboard.items.column.updated')}
									</dt>
									<dd class="text-foreground-faint">{formatDate(locale, item.updatedAt)}</dd>
								</div>
							</dl>
						</button>
					</li>
				{/each}
			{/if}
		</ul>

		<!-- Desktop / tablet: sortable table -->
		<div
			class="mt-4 hidden overflow-x-auto rounded-card border border-border bg-surface shadow-card md:block"
			aria-busy={view.state === 'loading'}
		>
			<table
				class="w-full min-w-4xl text-left text-sm"
				aria-label={t('dashboard.items.tableLabel')}
			>
				<thead>
					<tr
						class="border-b border-border bg-surface-subtle text-xs text-foreground-faint uppercase"
					>
						{#each columns as column (column.field)}
							{@const active = data.query.sort === column.field}
							<th
								scope="col"
								aria-sort={active
									? data.query.dir === 'asc'
										? 'ascending'
										: 'descending'
									: undefined}
								class="px-4 py-3 font-semibold {column.numeric ? 'text-right' : ''}"
							>
								<a
									href={sortHref(column.field)}
									data-sveltekit-noscroll
									class="inline-flex items-center gap-1 rounded-sm hover:text-foreground {FOCUS_RING} {active
										? 'text-accent'
										: ''}"
								>
									{column.label}
									{#if active}
										<span aria-hidden="true">{data.query.dir === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</a>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#if view.state === 'loading'}
						<TableSkeleton rows={Math.min(data.query.pageSize, 10)} columns={columns.length} />
					{:else}
						{#each view.page.rows as item (item.id)}
							<tr class="border-t border-border-subtle hover:bg-surface-subtle">
								<td class="max-w-64 truncate px-4 py-2.5 font-medium text-foreground">
									<button
										type="button"
										onclick={() => openDetail(item)}
										class="rounded-sm text-left hover:text-accent hover:underline {FOCUS_RING}"
										aria-label={canEdit
											? t('dashboard.items.edit.open', { name: item.name })
											: t('dashboard.items.detail.open', { name: item.name })}
									>
										{item.name}
									</button>
								</td>
								<td class="px-4 py-2.5">
									<StatusBadge status={item.status} />
								</td>
								<td class="px-4 py-2.5 text-foreground-muted">
									{t(`channel.${item.channel}` as MessageKey)}
								</td>
								<td class="px-4 py-2.5 text-foreground-muted">{item.owner.name}</td>
								<td class="px-4 py-2.5 text-right text-foreground tabular-nums">
									{formatCurrency(locale, item.budget)}
								</td>
								<td class="px-4 py-2.5 text-right text-foreground-muted tabular-nums">
									{formatCurrency(locale, item.spent)}
								</td>
								<td class="px-4 py-2.5 text-right text-foreground-muted tabular-nums">
									{formatPercent(locale, item.ctr)}
								</td>
								<td class="px-4 py-2.5 text-foreground-faint">
									{formatDate(locale, item.updatedAt)}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}

	{#if view.state === 'ready'}
		<div
			class="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
		>
			<label class="flex items-center gap-2 text-sm text-foreground-faint">
				<span class="shrink-0">{t('dashboard.items.pageSize')}</span>
				<Select
					id="items-page-size"
					value={String(data.query.pageSize)}
					size="sm"
					class="w-auto min-w-16 shrink-0"
					onchange={onPageSizeChange}
				>
					{#each ITEM_PAGE_SIZES as size (size)}
						<option value={size}>{size}</option>
					{/each}
				</Select>
			</label>
			<div class="min-w-0 flex-1 sm:flex sm:justify-end">
				<Pagination page={view.page.page} pageCount={view.page.pageCount} hrefFor={pageHref} />
			</div>
		</div>
	{/if}
</Container>

<ItemEditDialog
	bind:open={detailOpen}
	item={detailItem}
	{canEdit}
	onApply={applyPatch}
	onCommit={commitRow}
	onRollback={rollbackRow}
/>
