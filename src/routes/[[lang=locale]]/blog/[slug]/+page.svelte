<script lang="ts">
	import { PUBLIC_SITE_URL } from '$env/static/public';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { formatDate } from '$lib/i18n/format';
	import { localizePath } from '$lib/i18n/locales';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';

	const { data } = $props();
	const locale = $derived(currentLocale());
	const post = $derived(data.post);

	const canonicalUrl = $derived(`${PUBLIC_SITE_URL}${localizePath(`/blog/${post.slug}`, locale)}`);
	// Prerendered per locale at build time — see og.png/+server.ts.
	const ogImage = $derived(
		`${PUBLIC_SITE_URL}${localizePath(`/blog/${post.slug}/og.png`, locale)}`
	);

	const articleLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: post.title,
		description: post.excerpt,
		image: [ogImage],
		datePublished: post.publishedAt,
		dateModified: post.publishedAt,
		inLanguage: locale,
		author: { '@type': 'Person', name: post.author.name },
		publisher: { '@type': 'Organization', name: 'Campaignly', url: PUBLIC_SITE_URL },
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl }
	});

	// The last crumb carries no `item`: per Google's BreadcrumbList docs the
	// URL is optional for the current page.
	const breadcrumbLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: t('nav.home'),
				item: `${PUBLIC_SITE_URL}${localizePath('/', locale)}`
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: t('blog.title'),
				item: `${PUBLIC_SITE_URL}${localizePath('/blog', locale)}`
			},
			{ '@type': 'ListItem', position: 3, name: post.title }
		]
	});
</script>

<Seo
	title={post.title}
	description={post.excerpt}
	path={`/blog/${post.slug}`}
	type="article"
	image={ogImage}
	imageAlt={post.title}
/>
<JsonLd data={articleLd} />
<JsonLd data={breadcrumbLd} />

<article class="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
	<header>
		<div class="flex flex-wrap gap-1.5">
			{#each post.tags as tag (tag)}
				<a
					href={`${localizePath('/blog', locale)}?tag=${encodeURIComponent(tag)}`}
					class="inline-flex min-h-9 items-center rounded-full bg-surface-muted px-3 text-xs font-medium text-foreground-muted hover:bg-surface-emphasis focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
				>
					{data.tagLabels[tag] ?? tag}
				</a>
			{/each}
		</div>
		<h1
			class="post-title mt-4 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-5xl"
			style="view-transition-name: post-title-{post.slug}"
		>
			{post.title}
		</h1>
		<div class="mt-6 flex items-center gap-3">
			<span
				class="h-10 w-10 shrink-0 rounded-full"
				style="background-color: {post.author.avatarColor}"
				aria-hidden="true"
			></span>
			<div class="text-sm text-foreground-faint">
				<p class="font-medium text-foreground">{post.author.name}</p>
				<p>
					{t('blog.publishedOn', { date: formatDate(locale, post.publishedAt) })} · {t(
						'blog.readingTime',
						{ minutes: post.readingTimeMinutes }
					)}
				</p>
			</div>
		</div>
	</header>

	<div class="mt-4 h-1.5 rounded-full" style="background-color: {post.coverColor}"></div>

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- server-rendered from trusted repo data -->
	<div class="prose mt-8 max-w-none prose-zinc">{@html data.bodyHtml}</div>

	<footer class="mt-12 border-t border-border pt-6">
		<a
			href={localizePath('/blog', locale)}
			class="rounded-sm text-sm font-semibold text-accent hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
		>
			&larr; {t('blog.title')}
		</a>
	</footer>
</article>
