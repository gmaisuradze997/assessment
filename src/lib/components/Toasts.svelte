<script lang="ts">
	import { toasts } from '$lib/toast.svelte';
	import Toast from '$lib/ui/Toast.svelte';
</script>

<div
	class="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-80"
	aria-live="assertive"
>
	{#each toasts as toast (toast.id)}
		<div class="pointer-events-auto">
			<Toast kind={toast.kind} message={toast.message} />
		</div>
	{/each}
</div>
