<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Seo from '$lib/components/Seo.svelte';
	import type { MessageKey } from '$lib/i18n/messages';
	import { t } from '$lib/i18n/runtime.svelte';
	import { loginFieldErrors, loginSchema, type LoginFieldErrors } from '$lib/schemas/auth';
	import Badge from '$lib/ui/Badge.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import Container from '$lib/ui/Container.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Heading from '$lib/ui/Heading.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Text from '$lib/ui/Text.svelte';
	import Toast from '$lib/ui/Toast.svelte';
	import { FOCUS_RING } from '$lib/ui/variants';

	const { data, form } = $props();

	const DEMO_ACCOUNTS = [
		{ email: 'admin@demo.test', role: 'admin', tone: 'primary' as const },
		{ email: 'editor@demo.test', role: 'editor', tone: 'success' as const },
		{ email: 'viewer@demo.test', role: 'viewer', tone: 'neutral' as const }
	];

	let email = $state('');
	let password = $state('');
	let clientErrors = $state<LoginFieldErrors>({});
	let submitting = $state(false);

	$effect(() => {
		if (form?.email) email = form.email;
	});

	// Client error wins (it is fresher); otherwise show what the server said.
	const fieldErrors = $derived<LoginFieldErrors>({
		email: clientErrors.email ?? form?.fieldErrors?.email,
		password: clientErrors.password ?? form?.fieldErrors?.password
	});

	const handleSubmit: SubmitFunction = ({ formData, cancel }) => {
		const parsed = loginSchema.safeParse(Object.fromEntries(formData));
		if (!parsed.success) {
			clientErrors = loginFieldErrors(parsed.error);
			cancel();
			return;
		}
		clientErrors = {};
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	};

	function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
		email = account.email;
		password = 'demo1234';
		clientErrors = {};
	}
</script>

<Seo title={t('login.title')} description={t('login.meta.description')} path="/login" />

<Container size="sm" class="py-10 sm:py-16">
	<Heading level={1}>{t('login.title')}</Heading>

	{#if data.wasRedirected}
		<div class="mt-4">
			<Toast kind="warning" message={t('login.redirected')} />
		</div>
	{/if}

	{#if form?.message}
		<div class="mt-4">
			<Toast kind="error" message={t(form.message as MessageKey)} />
		</div>
	{/if}

	<form method="POST" use:enhance={handleSubmit} novalidate class="mt-6 flex flex-col gap-4">
		<Field
			label={t('login.email')}
			error={fieldErrors.email ? t(fieldErrors.email as MessageKey) : undefined}
		>
			{#snippet children(control)}
				<Input
					{...control}
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					invalid={Boolean(fieldErrors.email)}
				/>
			{/snippet}
		</Field>

		<Field
			label={t('login.password')}
			error={fieldErrors.password ? t(fieldErrors.password as MessageKey) : undefined}
		>
			{#snippet children(control)}
				<Input
					{...control}
					name="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
					invalid={Boolean(fieldErrors.password)}
				/>
			{/snippet}
		</Field>

		<Button type="submit" loading={submitting} class="w-full">
			{submitting ? t('common.loading') : t('login.submit')}
		</Button>
	</form>

	<Card class="mt-8" padding="sm">
		<Text size="xs" tone="faint" weight="medium">
			{t('login.demoHint', { password: 'demo1234' })}
		</Text>
		<div class="mt-3 flex flex-col gap-2">
			{#each DEMO_ACCOUNTS as account (account.email)}
				<button
					type="button"
					onclick={() => fillDemo(account)}
					class="flex w-full items-center justify-between gap-3 rounded-control border border-border px-3 py-2.5 text-left transition-colors hover:border-border-strong hover:bg-surface-subtle {FOCUS_RING}"
				>
					<span class="font-mono text-sm text-foreground">{account.email}</span>
					<Badge tone={account.tone} variant="subtle" size="sm">{account.role}</Badge>
				</button>
			{/each}
		</div>
	</Card>
</Container>
