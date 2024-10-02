export type EncodeAndDecodeOptions<T = any> = {
	encode: (value: T) => string | undefined;
	decode: (value: string | null) => T | null;
	defaultValue?: T;
};

export type StoreOptions<T> = {
	debounceHistory?: number;
	pushHistory?: boolean;
	sort?: boolean;
	showDefaults?: boolean;
	equalityFn?: T extends object
		? (current: T | null, next: T | null) => boolean
		: never;
};
