<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { t } from '$lib/i18n/runtime.svelte';
	import Badge from '$lib/ui/Badge.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import Combobox from '$lib/ui/Combobox.svelte';
	import Container from '$lib/ui/Container.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Heading from '$lib/ui/Heading.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Spinner from '$lib/ui/Spinner.svelte';
	import Text from '$lib/ui/Text.svelte';
	import Toast from '$lib/ui/Toast.svelte';

	let dialogOpen = $state(false);
	let loading = $state(false);
	let comboboxValue = $state<string | null>(null);
	let inputValue = $state('');
	let selectValue = $state('a');

	const comboboxOptions = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry', disabled: true },
		{ value: 'date', label: 'Date' },
		{ value: 'elderberry', label: 'Elderberry' },
		{ value: 'fig', label: 'Fig' }
	];
</script>

<Seo title={t('design.title')} description={t('design.meta.description')} path="/design" />

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Container class="py-12">
	<Heading level={1}>{t('design.title')}</Heading>
	<Text tone="muted" class="mt-2 max-w-2xl">
		{t('design.meta.description')}
	</Text>

	<section class="mt-12 flex flex-col gap-4">
		<Heading level={2} size="lg">Button</Heading>
		<div class="flex flex-wrap items-center gap-2">
			{#each ['solid', 'soft', 'outline', 'ghost', 'link'] as const as variant (variant)}
				{#each ['primary', 'neutral', 'danger'] as const as tone (tone)}
					<Button {variant} {tone} size="sm">{variant}/{tone}</Button>
				{/each}
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
			<Button {loading} onclick={() => (loading = !loading)}>
				{loading ? 'Loading' : 'Toggle loading'}
			</Button>
			<Button disabled>Disabled</Button>
			<Button href="/en">As link</Button>
		</div>
	</section>

	<section class="mt-12 flex flex-col gap-4">
		<Heading level={2} size="lg">Badge</Heading>
		<div class="flex flex-wrap items-center gap-2">
			{#each ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const as tone (tone)}
				{#each ['subtle', 'solid', 'outline'] as const as variant (variant)}
					<Badge {tone} {variant}>{tone}</Badge>
				{/each}
			{/each}
			<Badge pressed>Pressed</Badge>
		</div>
	</section>

	<section class="mt-12 flex flex-col gap-4">
		<Heading level={2} size="lg">Typography</Heading>
		<Heading level={1} size="2xl">Heading 2xl</Heading>
		<Heading level={2} size="xl">Heading xl</Heading>
		<Heading level={3} size="lg">Heading lg</Heading>
		<Text>Default body text with <Text as="span" weight="semibold">semibold</Text> emphasis.</Text>
		<Text tone="muted" size="sm">Muted small supporting copy.</Text>
		<Text tone="faint" size="xs">Faint caption text.</Text>
		<Text tone="danger" size="sm">Danger / validation text.</Text>
	</section>

	<section class="mt-12 flex flex-col gap-4">
		<Heading level={2} size="lg">Form controls</Heading>
		<div class="grid max-w-md gap-4">
			<Field label="Email" description="We never share your email.">
				{#snippet children(control)}
					<Input {...control} type="email" placeholder="you@example.com" bind:value={inputValue} />
				{/snippet}
			</Field>
			<Field label="Broken field" error="This field is required.">
				{#snippet children(control)}
					<Input {...control} invalid placeholder="Invalid example" />
				{/snippet}
			</Field>
			<Field label="Plan">
				{#snippet children(control)}
					<Select {...control} bind:value={selectValue}>
						<option value="a">Starter</option>
						<option value="b">Team</option>
						<option value="c">Enterprise</option>
					</Select>
				{/snippet}
			</Field>
		</div>
	</section>

	<section class="mt-12 flex flex-col gap-4">
		<Heading level={2} size="lg">Card</Heading>
		<div class="grid gap-4 sm:grid-cols-2">
			<Card>
				<Heading level={3} size="md">Default card</Heading>
				<Text tone="muted" size="sm" class="mt-2">Surface with border and card elevation.</Text>
			</Card>
			<Card interactive>
				{#snippet header()}
					<Heading level={3} size="md">Interactive</Heading>
				{/snippet}
				<Text tone="muted" size="sm">Hover to raise the shadow.</Text>
				{#snippet footer()}
					<Button size="sm" variant="soft">Action</Button>
				{/snippet}
			</Card>
		</div>
	</section>

	<section class="mt-12 flex flex-col gap-4">
		<Heading level={2} size="lg">Toast & Spinner</Heading>
		<div class="grid max-w-sm gap-2">
			<Toast kind="success" message="Saved successfully." />
			<Toast kind="error" message="Something went wrong." />
			<Toast kind="warning" message="Check your connection." />
			<Toast kind="info" message="New features available." />
		</div>
		<div class="flex items-center gap-3 text-accent">
			<Spinner size="sm" />
			<Spinner size="md" />
			<Spinner size="lg" />
		</div>
	</section>

	<section class="mt-12 flex flex-col gap-4">
		<Heading level={2} size="lg">Dialog</Heading>
		<Text tone="muted" size="sm">
			Focus trap, Escape / scrim dismissal, scroll lock, and inert siblings — no library.
		</Text>
		<div>
			<Button onclick={() => (dialogOpen = true)}>Open dialog</Button>
		</div>
		<Dialog bind:open={dialogOpen} title="Confirm action" closeLabel={t('ui.dialog.close')}>
			{#snippet description()}
				This dialog traps focus and restores it to the trigger when closed.
			{/snippet}
			<Text size="sm">
				Tab cycles through the controls below. Escape or the scrim dismisses the dialog.
			</Text>
			{#snippet footer()}
				<Button variant="outline" tone="neutral" onclick={() => (dialogOpen = false)}>
					{t('common.cancel')}
				</Button>
				<Button onclick={() => (dialogOpen = false)}>Confirm</Button>
			{/snippet}
		</Dialog>
	</section>

	<section class="mt-12 mb-16 flex flex-col gap-4">
		<Heading level={2} size="lg">Combobox</Heading>
		<Text tone="muted" size="sm">
			WAI-ARIA editable combobox with listbox: arrow keys, Home/End, typeahead filter, and two-stage
			Escape.
		</Text>
		<div class="max-w-sm">
			<Combobox
				options={comboboxOptions}
				bind:value={comboboxValue}
				label="Fruit"
				placeholder="Search fruit…"
				resultsLabel={(count) => t('ui.combobox.results', { count })}
				emptyLabel={t('ui.combobox.empty')}
			/>
		</div>
		{#if comboboxValue}
			<Text size="sm" tone="secondary">Selected: {comboboxValue}</Text>
		{/if}
	</section>
</Container>
