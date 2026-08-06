<script lang="ts">
	import { t } from '$lib/i18n/runtime.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Text from '$lib/ui/Text.svelte';

	interface Props {
		page: number;
		pageCount: number;
		/** Builds the href for a given page number — keeps all other URL state. */
		hrefFor: (page: number) => string;
	}

	const { page, pageCount, hrefFor }: Props = $props();

	/** Compact window around the current page so narrow viewports don't overflow. */
	function pageItems(current: number, total: number): Array<number | 'ellipsis'> {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		const pages: number[] = [1, total];
		const add = (n: number) => {
			if (n >= 1 && n <= total && !pages.includes(n)) pages.push(n);
		};
		for (let i = current - 1; i <= current + 1; i++) add(i);
		if (current <= 3) {
			add(2);
			add(3);
			add(4);
		}
		if (current >= total - 2) {
			add(total - 1);
			add(total - 2);
			add(total - 3);
		}

		pages.sort((a, b) => a - b);
		const items: Array<number | 'ellipsis'> = [];
		for (let i = 0; i < pages.length; i++) {
			const n = pages[i];
			if (i > 0 && n - pages[i - 1] > 1) items.push('ellipsis');
			items.push(n);
		}
		return items;
	}

	const items = $derived(pageItems(page, pageCount));
</script>

{#if pageCount > 1}
	<nav
		class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
		aria-label={t('pagination.nav')}
	>
		<Text size="sm" tone="faint">{t('pagination.pageOf', { page, pageCount })}</Text>
		<div class="flex flex-wrap items-center gap-1">
			{#if page > 1}
				<Button href={hrefFor(page - 1)} variant="outline" tone="neutral" size="sm" rel="prev">
					{t('pagination.previous')}
				</Button>
			{/if}
			{#each items as item, i (typeof item === 'number' ? item : `e-${i}`)}
				{#if item === 'ellipsis'}
					<span class="px-1.5 text-sm text-foreground-faint" aria-hidden="true">…</span>
				{:else}
					<Button
						href={hrefFor(item)}
						variant={item === page ? 'solid' : 'outline'}
						tone={item === page ? 'primary' : 'neutral'}
						size="sm"
						class="min-w-9"
						aria-current={item === page ? 'page' : undefined}
					>
						{item}
					</Button>
				{/if}
			{/each}
			{#if page < pageCount}
				<Button href={hrefFor(page + 1)} variant="outline" tone="neutral" size="sm" rel="next">
					{t('pagination.next')}
				</Button>
			{/if}
		</div>
	</nav>
{/if}
