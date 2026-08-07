<script lang="ts">
	import { formatCurrency, formatNumber, formatPercent } from '$lib/i18n/format';
	import { localizePath } from '$lib/i18n/locales';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import Button from '$lib/ui/Button.svelte';

	const { data } = $props();
	const locale = $derived(currentLocale());
	// const betaInsights = $derived(data.flags.betaInsights);

	const cards = $derived([
		{ label: t('dashboard.stats.total'), value: formatNumber(locale, data.stats.total) },
		{ label: t('dashboard.stats.active'), value: formatNumber(locale, data.stats.active) },
		{ label: t('dashboard.stats.budget'), value: formatCurrency(locale, data.stats.totalBudget) },
		{ label: t('dashboard.stats.spent'), value: formatCurrency(locale, data.stats.totalSpent) },
		{ label: t('dashboard.stats.ctr'), value: formatPercent(locale, data.stats.averageCtr) }
	]);
</script>

<svelte:head>
	<title>{t('dashboard.title')}</title>
	<meta name="description" content={t('dashboard.meta.description')} />
</svelte:head>

<div class="mx-auto max-w-page px-4 py-10 sm:px-6">
	<h1 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
		{t('dashboard.greeting', { name: data.user.name })}
	</h1>

	{#if data.user.role === 'viewer'}
		<p
			class="mt-4 rounded-control border border-warning-border bg-warning-subtle px-4 py-3 text-sm text-warning-strong"
		>
			{t('dashboard.role.viewer')}
		</p>
	{/if}

	<!-- {#if betaInsights}
		<aside
			class="mt-6 rounded-control border border-accent bg-primary-muted px-4 py-4 sm:px-5"
			aria-labelledby="beta-insights-title"
		>
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0">
					<p
						id="beta-insights-title"
						class="text-xs font-semibold tracking-wide text-accent-strong uppercase"
					>
						{t('dashboard.flags.betaInsights.title')}
					</p>
					<p class="mt-2 text-sm leading-relaxed text-foreground">
						{t('dashboard.flags.betaInsights.body')}
					</p>
				</div>
				<form method="POST" action="?/flags">
					<input type="hidden" name="ff" value="-betaInsights" />
					<button
						type="submit"
						class="shrink-0 rounded-sm text-sm font-medium text-accent hover:text-accent-hover {FOCUS_RING}"
					>
						{t('dashboard.flags.betaInsights.disable')}
					</button>
				</form>
			</div>
		</aside>
	{:else}
		<form method="POST" action="?/flags" class="mt-4">
			<input type="hidden" name="ff" value="betaInsights" />
			<button
				type="submit"
				class="rounded-sm text-sm font-medium text-accent hover:text-accent-hover {FOCUS_RING}"
			>
				{t('dashboard.flags.betaInsights.enable')}
			</button>
		</form>
	{/if} -->

	<div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
		{#each cards as card (card.label)}
			<div
				class="rounded-card border border-border bg-surface p-3 shadow-card transition-transform motion-safe:hover:-translate-y-0.5 sm:p-4"
			>
				<p class="text-xs font-semibold tracking-wide text-foreground-faint uppercase">
					{card.label}
				</p>
				<p
					class="mt-1.5 font-display text-lg font-bold tracking-tight wrap-break-word text-foreground sm:text-xl"
				>
					{card.value}
				</p>
			</div>
		{/each}
	</div>

	<div class="mt-8">
		<Button href={localizePath('/dashboard/items', locale)} size="lg" class="w-full sm:w-auto">
			{t('dashboard.viewItems')} →
		</Button>
	</div>
</div>
