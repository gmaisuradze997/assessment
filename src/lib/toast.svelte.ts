export interface Toast {
	id: number;
	message: string;
	kind: 'success' | 'error';
}

let nextId = 0;

/** Module-level reactive state: any component can push, Toasts.svelte renders. */
export const toasts = $state<Toast[]>([]);

export function addToast(message: string, kind: Toast['kind'] = 'success', ttlMs = 4000): void {
	const id = nextId++;
	toasts.push({ id, message, kind });
	setTimeout(() => {
		const index = toasts.findIndex((toast) => toast.id === id);
		if (index !== -1) toasts.splice(index, 1);
	}, ttlMs);
}
