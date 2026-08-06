<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { formatCurrency, formatDate, formatPercent } from '$lib/i18n/format';
	import type { MessageKey } from '$lib/i18n/messages';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import { ITEM_STATUSES, itemPatchSchema, type Item, type ItemStatus } from '$lib/schemas/item';
	import { addToast } from '$lib/toast.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Text from '$lib/ui/Text.svelte';
	import StatusBadge from './StatusBadge.svelte';

	interface Props {
		open?: boolean;
		item: Item | null;
		canEdit: boolean;
		onApply: (id: string, patch: Partial<Item>) => Item | null;
		onCommit: (id: string, item: Item) => void;
		onRollback: (id: string, previous: Item) => void;
	}

	let { open = $bindable(false), item, canEdit, onApply, onCommit, onRollback }: Props = $props();

	const locale = $derived(currentLocale());

	let draftStatus = $state<ItemStatus>('draft');
	let draftBudget = $state('');
	let budgetError = $state<string | undefined>();
	let saving = $state(false);

	// Re-seed drafts whenever the dialog opens onto a (possibly new) item.
	$effect(() => {
		if (!open || !item) return;
		draftStatus = item.status;
		draftBudget = String(item.budget);
		budgetError = undefined;
		saving = false;
	});

	const dirty = $derived(
		Boolean(item) && (draftStatus !== item!.status || draftBudget !== String(item!.budget))
	);

	function close() {
		open = false;
	}

	const submit: SubmitFunction = ({ formData, cancel }) => {
		if (!item || !canEdit) {
			cancel();
			return;
		}

		const raw: Record<string, unknown> = {};
		if (draftStatus !== item.status) raw.status = draftStatus;
		if (draftBudget !== String(item.budget)) raw.budget = draftBudget;

		const parsed = itemPatchSchema.safeParse(raw);
		if (!parsed.success) {
			const message = parsed.error.issues[0]?.message ?? 'dashboard.items.edit.emptyPatch';
			if (message === 'dashboard.items.edit.invalidBudget') {
				budgetError = t(message as MessageKey);
			} else {
				addToast(t(message as MessageKey), 'error');
			}
			cancel();
			return;
		}

		budgetError = undefined;
		formData.set('id', item.id);
		formData.delete('budget');
		formData.delete('status');
		if (parsed.data.budget !== undefined) formData.set('budget', String(parsed.data.budget));
		if (parsed.data.status !== undefined) formData.set('status', parsed.data.status);

		const previous = onApply(item.id, parsed.data);
		saving = true;

		return async ({ result }) => {
			saving = false;
			const data = result.type === 'success' || result.type === 'failure' ? result.data : undefined;
			if (result.type === 'success' && data?.item) {
				onCommit(item.id, data.item as Item);
				addToast(t('dashboard.items.edit.saved'), 'success');
				close();
			} else {
				if (previous) onRollback(item.id, previous);
				const reason = typeof data?.message === 'string' ? data.message : null;
				addToast(
					`${reason ? t(reason as MessageKey) + ' ' : ''}${t('dashboard.items.edit.rolledBack')}`,
					'error'
				);
			}
		};
	};
</script>

<Dialog
	bind:open
	title={item?.name ?? t('dashboard.items.detail.title')}
	closeLabel={t('dashboard.items.detail.close')}
	dismissible={!saving}
>
	{#if item}
		{#if canEdit}
			<form
				method="POST"
				action="?/update"
				use:enhance={submit}
				class="flex flex-col gap-4"
				id="item-edit-form"
			>
				<input type="hidden" name="id" value={item.id} />

				<Field label={t('dashboard.items.column.status')}>
					{#snippet children(control)}
						<Select {...control} name="status" bind:value={draftStatus}>
							{#each ITEM_STATUSES as status (status)}
								<option value={status}>{t(`status.${status}` as MessageKey)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>

				<Field label={t('dashboard.items.column.budget')} error={budgetError}>
					{#snippet children(control)}
						<Input
							{...control}
							name="budget"
							type="number"
							min="0"
							step="100"
							bind:value={draftBudget}
							invalid={Boolean(budgetError)}
							class="tabular-nums"
						/>
					{/snippet}
				</Field>
			</form>
		{:else}
			<div class="mb-4">
				<Text size="sm" tone="muted">{t('dashboard.items.edit.forbidden')}</Text>
			</div>
			<div class="mb-4 flex items-center gap-2">
				<Text size="sm" tone="faint">{t('dashboard.items.column.status')}</Text>
				<StatusBadge status={item.status} />
			</div>
			<div class="mb-4">
				<Text size="sm" tone="faint">{t('dashboard.items.column.budget')}</Text>
				<p class="mt-0.5 text-sm font-medium text-foreground tabular-nums">
					{formatCurrency(locale, item.budget)}
				</p>
			</div>
		{/if}

		<dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
			<div>
				<dt class="text-foreground-faint">{t('dashboard.items.column.channel')}</dt>
				<dd class="mt-0.5 font-medium text-foreground">
					{t(`channel.${item.channel}` as MessageKey)}
				</dd>
			</div>
			<div>
				<dt class="text-foreground-faint">{t('dashboard.items.column.owner')}</dt>
				<dd class="mt-0.5 font-medium text-foreground">{item.owner.name}</dd>
			</div>
			<div>
				<dt class="text-foreground-faint">{t('dashboard.items.column.spent')}</dt>
				<dd class="mt-0.5 font-medium text-foreground tabular-nums">
					{formatCurrency(locale, item.spent)}
				</dd>
			</div>
			<div>
				<dt class="text-foreground-faint">{t('dashboard.items.column.ctr')}</dt>
				<dd class="mt-0.5 font-medium text-foreground tabular-nums">
					{formatPercent(locale, item.ctr)}
				</dd>
			</div>
			<div class="col-span-2">
				<dt class="text-foreground-faint">{t('dashboard.items.column.updated')}</dt>
				<dd class="mt-0.5 font-medium text-foreground">
					{formatDate(locale, item.updatedAt)}
				</dd>
			</div>
		</dl>
	{/if}

	{#snippet footer()}
		{#if canEdit}
			<Button variant="outline" tone="neutral" onclick={close} disabled={saving}>
				{t('common.cancel')}
			</Button>
			<Button type="submit" form="item-edit-form" loading={saving} disabled={!dirty || saving}>
				{t('common.save')}
			</Button>
		{:else}
			<Button variant="outline" tone="neutral" onclick={close}>
				{t('dashboard.items.detail.close')}
			</Button>
		{/if}
	{/snippet}
</Dialog>
