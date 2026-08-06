<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { t } from '$lib/i18n/runtime.svelte';

	let { data, children } = $props();
</script>

<div class="flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground">
	<a
		href="#main"
		class="sr-only rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
	>
		{t('nav.skipToContent')}
	</a>
	<Header user={data.user} />
	<main id="main" tabindex="-1" class="flex-1 outline-none">
		{@render children()}
	</main>
	<Footer />
</div>
