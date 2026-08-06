/**
 * Pure state machine for an editable combobox + listbox, following the
 * WAI-ARIA 1.2 pattern. Kept free of DOM and Svelte runes so it can be
 * unit-tested in the existing node-environment Vitest setup without jsdom.
 */

export interface ComboboxOption<T = string> {
	value: T;
	label: string;
	disabled?: boolean;
}

export interface ComboboxState<T = string> {
	open: boolean;
	/** Current input text (filter query, or selected label when closed). */
	query: string;
	/** Index into `filtered`; -1 means no active option. */
	activeIndex: number;
	/** Currently committed value, or null when empty. */
	value: T | null;
}

export type ComboboxAction<T = string> =
	| { type: 'input'; query: string }
	| { type: 'open' }
	| { type: 'close' }
	| { type: 'toggle' }
	| { type: 'move'; delta: number }
	| { type: 'moveTo'; index: number }
	| { type: 'home' }
	| { type: 'end' }
	| { type: 'selectActive' }
	| { type: 'select'; value: T }
	| { type: 'escape' }
	| { type: 'blur' }
	| { type: 'setValue'; value: T | null };

export interface ComboboxConfig<T = string> {
	options: ComboboxOption<T>[];
	/** Case-insensitive substring match on label. Override for custom filtering. */
	filter?: (option: ComboboxOption<T>, query: string) => boolean;
	/** Compare two values for equality. Defaults to `Object.is`. */
	equals?: (a: T, b: T) => boolean;
}

function defaultFilter<T>(option: ComboboxOption<T>, query: string): boolean {
	if (!query) return true;
	return option.label.toLowerCase().includes(query.toLowerCase());
}

function nextEnabledIndex<T>(options: ComboboxOption<T>[], from: number, delta: number): number {
	if (options.length === 0) return -1;
	const len = options.length;
	let index = from;
	for (let step = 0; step < len; step++) {
		index = (index + delta + len) % len;
		if (!options[index]?.disabled) return index;
	}
	return -1;
}

function firstEnabledIndex<T>(options: ComboboxOption<T>[]): number {
	return options.findIndex((o) => !o.disabled);
}

function lastEnabledIndex<T>(options: ComboboxOption<T>[]): number {
	for (let i = options.length - 1; i >= 0; i--) {
		if (!options[i]?.disabled) return i;
	}
	return -1;
}

export class ComboboxMachine<T = string> {
	#options: ComboboxOption<T>[];
	#filter: (option: ComboboxOption<T>, query: string) => boolean;
	#equals: (a: T, b: T) => boolean;

	open = false;
	query = '';
	activeIndex = -1;
	value: T | null = null;

	constructor(config: ComboboxConfig<T>, initial?: Partial<ComboboxState<T>>) {
		this.#options = config.options;
		this.#filter = config.filter ?? defaultFilter;
		this.#equals = config.equals ?? Object.is;
		if (initial?.value !== undefined) this.value = initial.value;
		if (initial?.query !== undefined) this.query = initial.query;
		if (initial?.open) this.open = initial.open;
		if (initial?.activeIndex !== undefined) this.activeIndex = initial.activeIndex;

		// Sync the input label to the selected option on construction.
		if (this.value != null && !initial?.query) {
			const match = this.#options.find((o) => this.#equals(o.value, this.value as T));
			if (match) this.query = match.label;
		}
	}

	/** Replace the option list (e.g. after async load) and clamp activeIndex. */
	setOptions(options: ComboboxOption<T>[]): void {
		this.#options = options;
		const filtered = this.filtered;
		if (this.activeIndex >= filtered.length) {
			this.activeIndex = filtered.length === 0 ? -1 : firstEnabledIndex(filtered);
		}
		if (this.value != null) {
			const stillThere = options.some((o) => this.#equals(o.value, this.value as T));
			if (!stillThere) {
				this.value = null;
			}
		}
	}

	get options(): ComboboxOption<T>[] {
		return this.#options;
	}

	get filtered(): ComboboxOption<T>[] {
		return this.#options.filter((o) => this.#filter(o, this.query));
	}

	get activeOption(): ComboboxOption<T> | null {
		return this.filtered[this.activeIndex] ?? null;
	}

	/** Snapshot for reactive UI layers that cannot observe plain fields. */
	snapshot(): ComboboxState<T> & { filtered: ComboboxOption<T>[] } {
		return {
			open: this.open,
			query: this.query,
			activeIndex: this.activeIndex,
			value: this.value,
			filtered: this.filtered
		};
	}

	dispatch(action: ComboboxAction<T>): void {
		switch (action.type) {
			case 'input': {
				this.query = action.query;
				this.open = true;
				const filtered = this.filtered;
				this.activeIndex = firstEnabledIndex(filtered);
				break;
			}
			case 'open': {
				if (this.open) break;
				this.open = true;
				if (this.activeIndex < 0) {
					this.activeIndex = this.#indexOfValue() ?? firstEnabledIndex(this.filtered);
				}
				break;
			}
			case 'close': {
				this.open = false;
				this.activeIndex = -1;
				this.#syncQueryToValue();
				break;
			}
			case 'toggle': {
				if (this.open) this.dispatch({ type: 'close' });
				else this.dispatch({ type: 'open' });
				break;
			}
			case 'move': {
				if (!this.open) {
					this.open = true;
					this.activeIndex = this.#indexOfValue() ?? firstEnabledIndex(this.filtered);
					break;
				}
				const filtered = this.filtered;
				if (filtered.length === 0) {
					this.activeIndex = -1;
					break;
				}
				const from = this.activeIndex < 0 ? (action.delta > 0 ? -1 : 0) : this.activeIndex;
				this.activeIndex = nextEnabledIndex(filtered, from, action.delta);
				break;
			}
			case 'moveTo': {
				const filtered = this.filtered;
				const option = filtered[action.index];
				if (!option || option.disabled) break;
				this.open = true;
				this.activeIndex = action.index;
				break;
			}
			case 'home': {
				if (!this.open) this.open = true;
				this.activeIndex = firstEnabledIndex(this.filtered);
				break;
			}
			case 'end': {
				if (!this.open) this.open = true;
				this.activeIndex = lastEnabledIndex(this.filtered);
				break;
			}
			case 'selectActive': {
				const option = this.activeOption;
				if (!option || option.disabled) break;
				this.#commit(option);
				break;
			}
			case 'select': {
				const option = this.#options.find((o) => this.#equals(o.value, action.value));
				if (!option || option.disabled) break;
				this.#commit(option);
				break;
			}
			case 'escape': {
				// Two-stage Escape: first close the list, then clear the value.
				if (this.open) {
					this.open = false;
					this.activeIndex = -1;
					this.#syncQueryToValue();
				} else if (this.value != null || this.query !== '') {
					this.value = null;
					this.query = '';
				}
				break;
			}
			case 'blur': {
				this.open = false;
				this.activeIndex = -1;
				this.#syncQueryToValue();
				break;
			}
			case 'setValue': {
				this.value = action.value;
				this.#syncQueryToValue();
				break;
			}
		}
	}

	/**
	 * Keyboard reducer. Returns true when the event was handled (caller
	 * should preventDefault). Focus stays on the input throughout.
	 */
	handleKeydown(event: Pick<KeyboardEvent, 'key' | 'altKey'>): boolean {
		switch (event.key) {
			case 'ArrowDown': {
				if (event.altKey) {
					this.dispatch({ type: 'open' });
				} else {
					this.dispatch({ type: 'move', delta: 1 });
				}
				return true;
			}
			case 'ArrowUp': {
				this.dispatch({ type: 'move', delta: -1 });
				return true;
			}
			case 'Home': {
				this.dispatch({ type: 'home' });
				return true;
			}
			case 'End': {
				this.dispatch({ type: 'end' });
				return true;
			}
			case 'Enter': {
				if (this.open && this.activeIndex >= 0) {
					this.dispatch({ type: 'selectActive' });
					return true;
				}
				return false;
			}
			case 'Escape': {
				this.dispatch({ type: 'escape' });
				return true;
			}
			case 'Tab': {
				if (this.open) {
					// Commit the active option on Tab if one is highlighted,
					// otherwise just close and let focus move on.
					if (this.activeIndex >= 0) this.dispatch({ type: 'selectActive' });
					else this.dispatch({ type: 'close' });
				}
				return false;
			}
			default:
				return false;
		}
	}

	#commit(option: ComboboxOption<T>): void {
		this.value = option.value;
		this.query = option.label;
		this.open = false;
		this.activeIndex = -1;
	}

	#syncQueryToValue(): void {
		if (this.value == null) return;
		const match = this.#options.find((o) => this.#equals(o.value, this.value as T));
		this.query = match?.label ?? '';
	}

	#indexOfValue(): number | null {
		if (this.value == null) return null;
		const filtered = this.filtered;
		const index = filtered.findIndex((o) => this.#equals(o.value, this.value as T));
		return index >= 0 ? index : null;
	}
}
