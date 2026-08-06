<script lang="ts">
	import Toasts from '$lib/components/Toasts.svelte';
	import { localizePath } from '$lib/i18n/locales';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import { FOCUS_RING } from '$lib/ui/variants';

	const { data, children } = $props();
	const locale = $derived(currentLocale());
</script>

<div class="dash-chrome border-b border-border bg-surface">
	<div
		class="mx-auto flex max-w-page items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3"
	>
		<div class="flex min-w-0 items-center gap-2 text-sm sm:gap-3">
			<span class="truncate font-medium text-foreground">{data.user.name}</span>
			<span
				class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase {data.user.role ===
				'admin'
					? 'bg-primary-muted text-accent-strong'
					: data.user.role === 'editor'
						? 'bg-success-muted text-success-strong'
						: 'bg-surface-muted text-foreground-muted'}"
			>
				{data.user.role}
			</span>
		</div>
		<form method="POST" action={localizePath('/logout', locale)}>
			<button
				type="submit"
				class="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground {FOCUS_RING}"
			>
				{t('nav.logout')}
			</button>
		</form>
	</div>
</div>

{@render children()}
<Toasts />
