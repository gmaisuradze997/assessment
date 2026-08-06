<script lang="ts">
	import type { MessageKey } from '$lib/i18n/messages';
	import { t } from '$lib/i18n/runtime.svelte';
	import {
		setThemePreference,
		theme,
		THEME_PREFERENCES,
		type ThemePreference
	} from '$lib/theme.svelte';
	import { FOCUS_RING } from '$lib/ui/variants';

	const LABELS = {
		system: 'theme.system',
		light: 'theme.light',
		dark: 'theme.dark'
	} as const satisfies Record<ThemePreference, MessageKey>;
</script>

<!-- Hidden without JavaScript (see app.html): the preference lives in
     localStorage, and the OS preference already drives the tokens. -->
<div
	class="inline-flex items-center rounded-pill border border-border bg-surface-muted p-0.5"
	role="radiogroup"
	aria-label={t('theme.label')}
	data-theme-toggle
>
	{#each THEME_PREFERENCES as preference (preference)}
		{@const active = theme.preference === preference}
		<button
			type="button"
			role="radio"
			aria-checked={active}
			onclick={() => setThemePreference(preference)}
			class="inline-flex h-10 w-10 items-center justify-center rounded-pill transition-[background-color,color,box-shadow] {FOCUS_RING} {active
				? 'bg-surface text-foreground shadow-control'
				: 'text-foreground-faint hover:text-foreground'}"
			style="transition-duration: var(--duration-fast); transition-timing-function: var(--ease-standard);"
		>
			<span class="sr-only">{t(LABELS[preference])}</span>
			<svg
				class="h-4 w-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				{#if preference === 'system'}
					<rect x="3" y="4" width="18" height="12" rx="2" />
					<path d="M8 20h8M12 16v4" />
				{:else if preference === 'light'}
					<circle cx="12" cy="12" r="4" />
					<path
						d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
					/>
				{:else}
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
				{/if}
			</svg>
		</button>
	{/each}
</div>
