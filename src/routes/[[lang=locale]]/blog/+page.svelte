<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_SITE_URL } from '$env/static/public';
	import Pagination from '$lib/components/Pagination.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { localizePath } from '$lib/i18n/locales';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import { postsQueryToSearchParams, type PostsQuery } from '$lib/schemas/posts-query';
	import type { PostSort } from '$lib/schemas/post';
	import { FOCUS_RING, PEER_FOCUS_RING } from '$lib/ui/variants';

	const { data } = $props();
	const locale = $derived(currentLocale());
	const basePath = $derived(localizePath('/blog', locale));

	const tagLabels = $derived(Object.fromEntries(data.tags.map((tag) => [tag.slug, tag.label])));

	// Local input state mirrors the URL. The URL remains authoritative:
	// after back/forward the effect below re-syncs the input — unless the
	// user is actively typing in it, in which case their keystrokes win.
	// (Initial capture is intentional: it provides the SSR value.)
	// svelte-ignore state_referenced_locally
	let qInput = $state(data.query.q);
	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		const urlQ = data.query.q;
		if (typeof document !== 'undefined' && document.activeElement !== inputEl) {
			qInput = urlQ;
		}
	});

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	/** Navigate to the URL representing the given state (page resets to 1). */
	function apply(next: Partial<PostsQuery>, options: { replace?: boolean } = {}) {
		const query: PostsQuery = {
			q: qInput.trim(),
			tags: data.query.tags,
			sort: data.query.sort,
			page: 1,
			...next
		};
		const params = postsQueryToSearchParams(query);
		const target = params.size > 0 ? `${basePath}?${params}` : basePath;
		goto(target, {
			keepFocus: true,
			noScroll: true,
			replaceState: options.replace ?? false
		});
	}

	function onQueryInput() {
		clearTimeout(debounceTimer);
		// replaceState while typing so each keystroke doesn't pollute history;
		// back/forward then jumps between "settled" searches.
		debounceTimer = setTimeout(() => apply({}, { replace: true }), 300);
	}

	function toggleTag(slug: string) {
		const tags = data.query.tags.includes(slug)
			? data.query.tags.filter((tag) => tag !== slug)
			: [...data.query.tags, slug];
		apply({ tags });
	}

	function hrefFor(page: number): string {
		const params = postsQueryToSearchParams({ ...data.query, page });
		return params.size > 0 ? `${basePath}?${params}` : basePath;
	}

	const hasFilters = $derived(data.query.q !== '' || data.query.tags.length > 0);
	const isDefaultListing = $derived(!hasFilters && data.query.page === 1);
</script>

<Seo title={t('blog.title')} description={t('blog.meta.description')} path="/blog" />

<svelte:head>
	{#if data.result.page > 1}
		<link rel="prev" href={`${PUBLIC_SITE_URL}${hrefFor(data.result.page - 1)}`} />
	{/if}
	{#if data.result.page < data.result.pageCount}
		<link rel="next" href={`${PUBLIC_SITE_URL}${hrefFor(data.result.page + 1)}`} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12">
	<h1 class="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
		{t('blog.title')}
	</h1>

	<!-- Plain GET form: Enter still submits without JS; with JS the
	     debounced input updates results live. -->
	<form
		method="GET"
		action={basePath}
		role="search"
		aria-label={t('blog.searchLabel')}
		class="mt-8 flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card"
		data-sveltekit-keepfocus
	>
		<div>
			<label for="blog-q" class="sr-only">{t('search.placeholder')}</label>
			<input
				id="blog-q"
				name="q"
				type="search"
				placeholder={t('search.placeholder')}
				bind:value={qInput}
				bind:this={inputEl}
				oninput={onQueryInput}
				class="w-full max-w-xl rounded-control border border-border-strong bg-background px-4 py-3 text-base shadow-control sm:py-2.5 sm:text-sm {FOCUS_RING}"
			/>
		</div>

		<div class="flex flex-wrap items-center gap-x-6 gap-y-3">
			<fieldset class="flex flex-wrap items-center gap-2">
				<legend class="sr-only">{t('search.tags')}</legend>
				{#each data.tags as tag (tag.slug)}
					{@const selected = data.query.tags.includes(tag.slug)}
					<label class="cursor-pointer">
						<input
							type="checkbox"
							name="tag"
							value={tag.slug}
							checked={selected}
							onchange={() => toggleTag(tag.slug)}
							class="peer sr-only"
						/>
						<span
							class="inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm font-medium transition-colors {PEER_FOCUS_RING} {selected
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border-strong bg-surface text-foreground-muted hover:bg-surface-subtle'}"
						>
							{tag.label}
						</span>
					</label>
				{/each}
			</fieldset>

			<div class="flex items-center gap-2">
				<label for="blog-sort" class="text-sm text-foreground-faint">{t('search.sort.label')}</label
				>
				<select
					id="blog-sort"
					name="sort"
					value={data.query.sort}
					onchange={(event) => apply({ sort: event.currentTarget.value as PostSort })}
					class="min-h-10 rounded-control border border-border-strong bg-surface px-2.5 text-base sm:min-h-0 sm:py-1.5 sm:text-sm {FOCUS_RING}"
				>
					{#if data.query.q}
						<option value="relevance">{t('search.sort.relevance')}</option>
					{/if}
					<option value="newest">{t('search.sort.newest')}</option>
					<option value="oldest">{t('search.sort.oldest')}</option>
				</select>
			</div>

			{#if hasFilters}
				<a
					href={basePath}
					class="rounded-sm text-sm font-medium text-accent hover:text-accent-hover {FOCUS_RING}"
				>
					{t('search.clear')}
				</a>
			{/if}
		</div>
	</form>

	<div class="mt-8" aria-live="polite">
		{#if !isDefaultListing}
			{#if data.query.q}
				<p class="text-sm text-foreground-faint">
					{t('search.results', { count: data.result.total, query: data.query.q })}
				</p>
			{:else}
				<p class="text-sm text-foreground-faint">
					{t('search.resultsAll', { count: data.result.total })}
				</p>
			{/if}
		{/if}

		{#if data.result.posts.length === 0}
			<div
				class="mt-12 flex flex-col items-start gap-4 rounded-card border border-border bg-surface p-8"
			>
				<p class="text-foreground-muted">
					{hasFilters ? t('search.noResults') : t('blog.empty')}
				</p>
				{#if hasFilters}
					<a
						href={basePath}
						class="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover {FOCUS_RING}"
					>
						{t('search.clear')}
					</a>
				{/if}
			</div>
		{:else}
			<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.result.posts as post (post.id)}
					<PostCard {post} {tagLabels} />
				{/each}
			</div>
			<div class="mt-10">
				<Pagination page={data.result.page} pageCount={data.result.pageCount} {hrefFor} />
			</div>
		{/if}
	</div>
</div>
