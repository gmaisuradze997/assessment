<script lang="ts">
	import { PUBLIC_SITE_URL } from '$env/static/public';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import { localizePath } from '$lib/i18n/locales';
	import Button from '$lib/ui/Button.svelte';

	const locale = $derived(currentLocale());

	const organizationLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Campaignly',
		url: `${PUBLIC_SITE_URL}/`,
		description: t('home.hero.subtitle')
	});

	const features = $derived([
		{ title: t('home.features.performance.title'), body: t('home.features.performance.body') },
		{ title: t('home.features.dx.title'), body: t('home.features.dx.body') },
		{ title: t('home.features.i18n.title'), body: t('home.features.i18n.body') }
	]);

	const tiers = $derived([
		{
			name: t('home.pricing.starter.name'),
			price: t('home.pricing.starter.price'),
			blurb: t('home.pricing.starter.blurb'),
			featured: false
		},
		{
			name: t('home.pricing.team.name'),
			price: t('home.pricing.team.price'),
			blurb: t('home.pricing.team.blurb'),
			featured: true
		},
		{
			name: t('home.pricing.enterprise.name'),
			price: t('home.pricing.enterprise.price'),
			blurb: t('home.pricing.enterprise.blurb'),
			featured: false
		}
	]);

	const quotes = $derived([
		{ text: t('home.social.quote1'), author: t('home.social.quote1.author') },
		{ text: t('home.social.quote2'), author: t('home.social.quote2.author') }
	]);
</script>

<Seo title={t('home.hero.title')} description={t('home.hero.subtitle')} path="/" />
<JsonLd data={organizationLd} />

<!-- Hero -->
<section class="home-hero relative overflow-hidden border-b border-border">
	<div class="home-hero-glow pointer-events-none absolute inset-0" aria-hidden="true"></div>
	<div
		class="relative mx-auto grid max-w-page gap-12 px-4 py-14 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
	>
		<div class="max-w-2xl">
			<p class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				Campaignly
			</p>
			<h1
				class="mt-4 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-6xl sm:leading-[1.05]"
			>
				{t('home.hero.title')}
			</h1>
			<p class="mt-5 max-w-xl text-base text-foreground-muted sm:text-xl">
				{t('home.hero.subtitle')}
			</p>
			<div class="home-hero-ctas mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
				<Button href={localizePath('/login', locale)} size="lg" class="w-full sm:w-auto">
					{t('home.hero.cta')}
				</Button>
				<Button
					href={localizePath('/blog', locale)}
					variant="outline"
					tone="neutral"
					size="lg"
					class="w-full sm:w-auto"
				>
					{t('home.hero.secondaryCta')}
				</Button>
			</div>
		</div>

		<div class="home-hero-panel relative hidden min-h-72 lg:block" aria-hidden="true">
			<div
				class="home-hero-panel-grid absolute inset-0 rounded-card border border-border bg-surface shadow-card"
			></div>
			<div
				class="absolute top-8 right-8 left-8 rounded-control border border-border bg-background px-4 py-3 shadow-popover"
			>
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-semibold tracking-wide text-foreground-faint uppercase"
						>Live campaigns</span
					>
					<span
						class="rounded-pill bg-primary px-2 py-0.5 text-[0.6875rem] font-bold text-primary-foreground"
						>+18%</span
					>
				</div>
				<p class="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">$128.4k</p>
				<p class="mt-1 text-sm text-foreground-muted">spend this week</p>
			</div>
			<div
				class="absolute right-10 bottom-10 left-10 rounded-control border border-border bg-surface-subtle px-4 py-3"
			>
				<div class="flex gap-2">
					<span class="h-2 flex-1 rounded-pill bg-primary"></span>
					<span class="h-2 flex-1 rounded-pill bg-foreground/15"></span>
					<span class="h-2 w-1/3 rounded-pill bg-foreground/10"></span>
				</div>
				<p class="mt-3 text-sm font-medium text-foreground">Email · Social · Push</p>
			</div>
		</div>
	</div>
</section>

<!-- Features -->
<section class="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
	<h2 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
		{t('home.features.title')}
	</h2>
	<div class="mt-10 grid gap-8 sm:grid-cols-3">
		{#each features as feature, i (feature.title)}
			<div class="relative border-t-2 border-primary pt-5">
				<span class="font-display text-sm font-bold text-accent">0{i + 1}</span>
				<h3 class="mt-2 font-display text-lg font-semibold tracking-tight text-foreground">
					{feature.title}
				</h3>
				<p class="mt-2 text-sm leading-relaxed text-foreground-muted">{feature.body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Pricing -->
<section class="border-y border-border bg-surface">
	<div class="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
		<h2 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			{t('home.pricing.title')}
		</h2>
		<p class="mt-2 text-foreground-muted">{t('home.pricing.subtitle')}</p>
		<div class="mt-10 grid gap-5 sm:grid-cols-3">
			{#each tiers as tier (tier.name)}
				<div
					class="flex flex-col rounded-card border p-6 transition-transform motion-safe:hover:-translate-y-0.5 {tier.featured
						? 'border-primary bg-primary text-primary-foreground shadow-card'
						: 'border-border bg-background'}"
				>
					<h3
						class="font-display font-semibold tracking-tight {tier.featured
							? 'text-primary-foreground'
							: 'text-foreground'}"
					>
						{tier.name}
					</h3>
					<p
						class="mt-3 font-display text-3xl font-bold tracking-tight {tier.featured
							? 'text-primary-foreground'
							: 'text-foreground'}"
					>
						{tier.price}
					</p>
					<p
						class="mt-2 flex-1 text-sm {tier.featured
							? 'text-primary-foreground/80'
							: 'text-foreground-muted'}"
					>
						{tier.blurb}
					</p>
					{#if tier.featured}
						<a
							href={localizePath('/login', locale)}
							class="mt-6 inline-flex h-11 w-full items-center justify-center rounded-control bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
						>
							{t('home.pricing.cta')}
						</a>
					{:else}
						<Button
							href={localizePath('/login', locale)}
							variant="outline"
							tone="neutral"
							class="mt-6 w-full"
						>
							{t('home.pricing.cta')}
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Social proof -->
<section class="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
	<h2 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
		{t('home.social.title')}
	</h2>
	<div class="mt-10 grid gap-8 sm:grid-cols-2">
		{#each quotes as quote (quote.author)}
			<figure class="border-l-2 border-primary pl-5">
				<blockquote class="text-lg leading-relaxed text-foreground">
					&ldquo;{quote.text}&rdquo;
				</blockquote>
				<figcaption class="mt-4 text-sm font-medium text-foreground-faint">
					{quote.author}
				</figcaption>
			</figure>
		{/each}
	</div>
</section>

<style>
	.home-hero {
		background-color: var(--color-background);
	}

	.home-hero-glow {
		background:
			radial-gradient(
				ellipse 70% 55% at 15% -5%,
				color-mix(in oklab, var(--color-primary) 35%, transparent),
				transparent 60%
			),
			radial-gradient(
				ellipse 50% 40% at 90% 20%,
				color-mix(in oklab, var(--color-foreground) 8%, transparent),
				transparent 55%
			),
			repeating-linear-gradient(
				-12deg,
				transparent,
				transparent 22px,
				color-mix(in oklab, var(--color-border) 55%, transparent) 22px,
				color-mix(in oklab, var(--color-border) 55%, transparent) 23px
			);
	}

	.home-hero-panel-grid {
		background-image:
			linear-gradient(
				color-mix(in oklab, var(--color-border) 70%, transparent) 1px,
				transparent 1px
			),
			linear-gradient(
				90deg,
				color-mix(in oklab, var(--color-border) 70%, transparent) 1px,
				transparent 1px
			);
		background-size: 28px 28px;
		animation: panel-in var(--duration-base) var(--ease-standard) both;
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* No entrance animation on the hero copy: opacity/transform delays were pushing
	   mobile LCP over the 2s CI budget on GitHub runners (~2017ms). */
	.home-hero-ctas :global(a) {
		transition:
			transform var(--duration-fast) var(--ease-standard),
			box-shadow var(--duration-fast) var(--ease-standard);
	}

	.home-hero-ctas :global(a:hover) {
		transform: translateY(-1px);
	}

	@media (prefers-reduced-motion: reduce) {
		.home-hero-panel-grid {
			animation: none;
		}

		.home-hero-ctas :global(a:hover) {
			transform: none;
		}
	}
</style>
