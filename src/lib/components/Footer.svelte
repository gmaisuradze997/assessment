<script lang="ts">
	import { t } from '$lib/i18n/runtime.svelte';
</script>

<footer class="mt-auto border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
	<div
		class="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-6"
	>
		<p class="font-display text-sm font-semibold tracking-tight text-foreground">Campaignly</p>
		<p class="text-sm text-foreground-faint">{t('footer.copy')}</p>
	</div>
</footer>
