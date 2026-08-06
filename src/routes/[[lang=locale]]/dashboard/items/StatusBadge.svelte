<script lang="ts">
	import type { MessageKey } from '$lib/i18n/messages';
	import { t } from '$lib/i18n/runtime.svelte';
	import type { ItemStatus } from '$lib/schemas/item';
	import Badge from '$lib/ui/Badge.svelte';

	interface Props {
		status: ItemStatus;
	}

	const { status }: Props = $props();

	const STATUS_TONE: Record<ItemStatus, 'neutral' | 'primary' | 'success' | 'warning' | 'info'> = {
		draft: 'neutral',
		scheduled: 'info',
		active: 'success',
		paused: 'warning',
		completed: 'primary',
		archived: 'neutral'
	};
</script>

<Badge tone={STATUS_TONE[status]} variant="subtle" size="sm">
	{t(`status.${status}` as MessageKey)}
</Badge>
