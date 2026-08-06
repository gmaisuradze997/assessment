<script lang="ts">
	interface Props {
		rows?: number;
		columns?: number;
	}

	const { rows = 10, columns = 8 }: Props = $props();
</script>

{#each Array.from({ length: rows }, (_, i) => i) as row (row)}
	<tr class="border-t border-border-subtle">
		{#each Array.from({ length: columns }, (_, i) => i) as col (col)}
			<td class="px-4 py-3">
				<div
					class="h-4 animate-pulse rounded bg-skeleton"
					style="width: {col === 0 ? '85%' : '60%'}"
				></div>
			</td>
		{/each}
	</tr>
{/each}
