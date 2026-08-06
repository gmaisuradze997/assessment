<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n/runtime.svelte';
	import { captureException } from '$lib/observability/sentry';

	const is404 = $derived(page.status === 404);

	onMount(() => {
		if (page.status >= 500) {
			const err = page.error;
			captureException(
				err && typeof err === 'object' && 'message' in err
					? String(err.message)
					: t('error.500.title'),
				{ status: page.status, source: 'boundary' }
			);
		}
	});
</script>

<svelte:head>
	<title>{is404 ? t('error.404.title') : t('error.500.title')}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center px-6">
	<p class="text-sm font-semibold text-accent">{page.status}</p>
	<h1 class="mt-2 text-4xl font-extrabold tracking-tight text-foreground">
		{is404 ? t('error.404.title') : t('error.500.title')}
	</h1>
	<p class="mt-4 text-foreground-muted">{is404 ? t('error.404.body') : t('error.500.body')}</p>
	<a
		href="/"
		class="mt-8 rounded-control bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
	>
		{t('error.backHome')}
	</a>
</section>
