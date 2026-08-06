<script lang="ts">
	import { PUBLIC_SITE_URL } from '$env/static/public';
	import { currentLocale } from '$lib/i18n/runtime.svelte';
	import { DEFAULT_LOCALE, LOCALES, localizePath, type Locale } from '$lib/i18n/locales';

	interface Props {
		title: string;
		description: string;
		/** Locale-less path of the current page, e.g. "/blog/my-post". */
		path: string;
		type?: 'website' | 'article';
		/** Absolute URL of a social preview image (1200×630). */
		image?: string;
		imageAlt?: string;
	}

	const { title, description, path, type = 'website', image, imageAlt }: Props = $props();

	/** og:locale wants the underscore territory form, not the bare tag. */
	const OG_LOCALES: Record<Locale, string> = { en: 'en_US', de: 'de_DE' };

	const locale = $derived(currentLocale());
	const canonical = $derived(`${PUBLIC_SITE_URL}${localizePath(path, locale)}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#each LOCALES as alt (alt)}
		<link rel="alternate" hreflang={alt} href={`${PUBLIC_SITE_URL}${localizePath(path, alt)}`} />
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href={`${PUBLIC_SITE_URL}${localizePath(path, DEFAULT_LOCALE)}`}
	/>
	<meta property="og:site_name" content="Campaignly" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={OG_LOCALES[locale]} />
	{#each LOCALES.filter((alt) => alt !== locale) as alt (alt)}
		<meta property="og:locale:alternate" content={OG_LOCALES[alt]} />
	{/each}
	{#if image}
		<meta property="og:image" content={image} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		{#if imageAlt}
			<meta property="og:image:alt" content={imageAlt} />
		{/if}
	{/if}
	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
		{#if imageAlt}
			<meta name="twitter:image:alt" content={imageAlt} />
		{/if}
	{/if}
</svelte:head>
