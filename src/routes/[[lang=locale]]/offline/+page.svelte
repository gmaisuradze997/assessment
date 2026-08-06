<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { localizePath } from '$lib/i18n/locales';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import Button from '$lib/ui/Button.svelte';

	const locale = $derived(currentLocale());
</script>

<Seo
	title={t('dashboard.offline.title')}
	description={t('dashboard.offline.body')}
	path="/offline"
/>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16 sm:px-6 sm:py-24">
	<h1 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
		{t('dashboard.offline.title')}
	</h1>
	<p class="text-foreground-muted">{t('dashboard.offline.body')}</p>
	<Button href={localizePath('/dashboard', locale)} size="lg">
		{t('dashboard.offline.retry')}
	</Button>
</div>
