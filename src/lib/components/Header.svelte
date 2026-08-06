<script lang="ts">
	import { building } from '$app/environment';
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import { LOCALES, localizePath, splitLocaleFromPath, type Locale } from '$lib/i18n/locales';
	import type { SessionUser } from '$lib/schemas/user';
	import Button from '$lib/ui/Button.svelte';
	import { FOCUS_RING } from '$lib/ui/variants';

	interface Props {
		user: SessionUser | null;
	}

	const { user }: Props = $props();

	const locale = $derived(currentLocale());
	const barePath = $derived(splitLocaleFromPath(page.url.pathname).path);
	const showLogin = $derived(!user && barePath !== '/login');

	const navItems = $derived([
		{ href: localizePath('/', locale), label: t('nav.home'), active: barePath === '/' },
		{
			href: localizePath('/blog', locale),
			label: t('nav.blog'),
			active: barePath.startsWith('/blog')
		},
		{
			href: localizePath('/dashboard', locale),
			label: t('nav.dashboard'),
			active: barePath.startsWith('/dashboard')
		}
	]);

	function localeHref(target: Locale): string {
		// url.search is not readable while prerendering — and prerendered
		// pages have no query string to preserve anyway. At runtime the
		// switcher keeps filters/pagination when changing language.
		const search = building ? '' : page.url.search;
		return localizePath(barePath, target) + search;
	}
</script>

<header
	class="site-header sticky top-0 z-50 border-b border-border/80 bg-surface/85 pt-[env(safe-area-inset-top)] backdrop-blur-md"
>
	<div
		class="mx-auto flex max-w-page flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:gap-x-8 sm:px-6 sm:py-3.5"
	>
		<a
			href={localizePath('/', locale)}
			class="group flex min-h-10 items-center gap-2 rounded-sm font-display text-lg font-bold tracking-tight text-foreground {FOCUS_RING}"
		>
			<span
				class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground transition-transform motion-safe:group-hover:rotate-6"
				aria-hidden="true"
			>
				C
			</span>
			Campaignly
		</a>

		<nav
			class="order-last -mx-1 flex w-[calc(100%+0.5rem)] gap-1 overflow-x-auto sm:order-0 sm:mx-0 sm:w-auto sm:overflow-visible"
			aria-label={t('nav.main')}
		>
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					aria-current={item.active ? 'page' : undefined}
					class="inline-flex min-h-10 shrink-0 items-center rounded-pill px-3.5 text-sm font-medium transition-colors {FOCUS_RING} {item.active
						? 'bg-primary text-primary-foreground'
						: 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-1.5 sm:gap-3">
			{#if showLogin}
				<Button href={localizePath('/login', locale)} size="sm" class="min-h-10 px-3.5">
					{t('nav.login')}
				</Button>
			{/if}

			<ThemeToggle />

			<div class="flex items-center gap-0.5" role="group" aria-label={t('locale.label')}>
				{#each LOCALES as target (target)}
					<a
						href={localeHref(target)}
						hreflang={target}
						aria-current={target === locale ? 'true' : undefined}
						class="inline-flex h-10 min-w-10 items-center justify-center rounded-md text-xs font-semibold uppercase transition-colors {FOCUS_RING} {target ===
						locale
							? 'bg-foreground text-background'
							: 'text-foreground-faint hover:bg-surface-muted hover:text-foreground'}"
					>
						{target}
					</a>
				{/each}
			</div>
		</div>
	</div>
</header>
