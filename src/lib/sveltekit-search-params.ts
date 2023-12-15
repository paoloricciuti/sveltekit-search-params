/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { derived, get, type Updater, type Writable } from 'svelte/store';
import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from './lz-string/index.js';

const GOTO_OPTIONS = {
	keepFocus: true,
	noScroll: true,
	replaceState: true,
};

const GOTO_OPTIONS_PUSH = {
	keepFocus: true,
	noScroll: true,
	replaceState: false,
};

export type EncodeAndDecodeOptions<T = any> = {
	encode: (value: T) => string | undefined;
	decode: (value: string | null) => T | null;
	defaultValue?: T;
};

export type StoreOptions = {
	debounceHistory?: number;
	pushHistory?: boolean;
	sort?: boolean;
};

type LooseAutocomplete<T> = {
	[K in keyof T]: T[K];
} & {
	[K: string]: any;
};

type Options<T> = {
	[Key in keyof T]: EncodeAndDecodeOptions<T[Key]> | boolean;
};

function mixSearchAndOptions<T>(
	searchParams: URLSearchParams,
	options?: Options<T>,
): [LooseAutocomplete<T>, boolean] {
	const uniqueKeys = Array.from(
		new Set(
			Array.from(searchParams?.keys?.() || []).concat(
				Object.keys(options ?? {}),
			),
		),
	);
	let anyDefaultedParam = false;
	return [
		Object.fromEntries(
			uniqueKeys.map((key) => {
				let fnToCall: EncodeAndDecodeOptions['decode'] = (value) =>
					value;
				const optionsKey = (options as any)?.[key];
				if (
					typeof optionsKey !== 'boolean' &&
					typeof optionsKey?.decode === 'function'
				) {
					fnToCall = optionsKey.decode;
				}
				const value = searchParams?.get(key);
				let actualValue;
				if (
					browser &&
					value == undefined &&
					optionsKey?.defaultValue != undefined &&
					!defaultedParams.has(key)
				) {
					actualValue = optionsKey.defaultValue;
					defaultedParams.add(key);
					anyDefaultedParam = true;
				} else {
					actualValue = fnToCall(value);
				}
				return [key, actualValue];
			}),
		) as unknown as LooseAutocomplete<T>,
		anyDefaultedParam,
	];
}

export const ssp = {
	object: <T extends object = any>(defaultValue?: T) => ({
		encode: (value: T) => JSON.stringify(value),
		decode: (value: string | null): T | null => {
			if (value === null) return null;
			try {
				return JSON.parse(value);
			} catch (e) {
				return null;
			}
		},
		defaultValue,
	}),
	array: <T = any>(defaultValue?: T[]) => ({
		encode: (value: T[]) => JSON.stringify(value),
		decode: (value: string | null): T[] | null => {
			if (value === null) return null;
			try {
				return JSON.parse(value);
			} catch (e) {
				return null;
			}
		},
		defaultValue,
	}),
	number: (defaultValue?: number) => ({
		encode: (value: number) => value.toString(),
		decode: (value: string | null) => (value ? parseFloat(value) : null),
		defaultValue,
	}),
	boolean: (defaultValue?: boolean) => ({
		encode: (value: boolean) => value + '',
		decode: (value: string | null) => value !== null && value !== 'false',
		defaultValue,
	}),
	string: (defaultValue?: string) => ({
		encode: (value: string | null) => value ?? '',
		decode: (value: string | null) => value,
		defaultValue,
	}),
	lz: <T = any>(defaultValue?: T) => ({
		encode: (value: T) =>
			compressToEncodedURIComponent(JSON.stringify(value)),
		decode: (value: string | null): T | null => {
			if (!value) return null;
			try {
				return JSON.parse(
					decompressFromEncodedURIComponent(value) ?? '',
				);
			} catch (e) {
				return null;
			}
		},
		defaultValue,
	}),
};

type SetTimeout = ReturnType<typeof setTimeout>;

const batchedUpdates = new Set<(query: URLSearchParams) => void>();

let batchTimeout: SetTimeout;

const defaultedParams = new Set<string>();

const debouncedTimeouts = new Map<string, SetTimeout>();

export function queryParameters<T extends object>(
	options?: Options<T>,
	{ debounceHistory = 0, pushHistory = true, sort = true }: StoreOptions = {},
): Writable<LooseAutocomplete<T>> {
	function set(value: T) {
		if (!browser) return;
		const hash = window.location.hash;
		const query = new URLSearchParams(window.location.search);
		const toBatch = (query: URLSearchParams) => {
			for (const field of Object.keys(value)) {
				if ((value as any)[field] == undefined) {
					query.delete(field);
					continue;
				}
				let fnToCall: EncodeAndDecodeOptions['encode'] = (value) =>
					value.toString();
				const optionsKey = (options as any)?.[field as string];
				if (
					typeof optionsKey !== 'boolean' &&
					typeof optionsKey?.encode === 'function'
				) {
					fnToCall = optionsKey.encode;
				}
				const newValue = fnToCall((value as any)[field]);
				if (newValue == undefined) {
					query.delete(field as string);
				} else {
					query.set(field as string, newValue);
				}
			}
		};
		batchedUpdates.add(toBatch);
		clearTimeout(batchTimeout);
		batchTimeout = setTimeout(async () => {
			batchedUpdates.forEach((batched) => {
				batched(query);
			});
			clearTimeout(debouncedTimeouts.get('queryParameters'));
			if (browser) {
				if (sort) {
					query.sort();
				}
				await goto(`?${query}${hash}`, GOTO_OPTIONS);
			}
			if (pushHistory && browser) {
				debouncedTimeouts.set(
					'queryParameters',
					setTimeout(() => {
						if (sort) {
							query.sort();
						}
						goto(hash, GOTO_OPTIONS_PUSH);
					}, debounceHistory),
				);
			}
			batchedUpdates.clear();
		});
	}
	const { subscribe } = derived(page, ($page) => {
		const [valueToSet, anyDefaultedParam] = mixSearchAndOptions(
			$page?.url?.searchParams,
			options,
		);
		if (anyDefaultedParam) {
			set(valueToSet);
		}
		return valueToSet;
	});
	return {
		set,
		subscribe,
		update: (updater: Updater<LooseAutocomplete<T>>) => {
			const currentValue = get({ subscribe });
			const newValue = updater(currentValue);
			set(newValue);
		},
	};
}

const DEFAULT_ENCODER_DECODER: EncodeAndDecodeOptions = {
	encode: (value) => value.toString(),
	decode: (value: string | null) => (value ? value.toString() : null),
};

export function queryParam<T = string>(
	name: string,
	{
		encode: encode = DEFAULT_ENCODER_DECODER.encode,
		decode: decode = DEFAULT_ENCODER_DECODER.decode,
		defaultValue,
	}: EncodeAndDecodeOptions<T> = DEFAULT_ENCODER_DECODER,
	{ debounceHistory = 0, pushHistory = true, sort = true }: StoreOptions = {},
): Writable<T | null> {
	function set(value: T | null) {
		if (!browser) return;
		const hash = window.location.hash;
		const toBatch = (query: URLSearchParams) => {
			if (value == undefined) {
				query.delete(name);
			} else {
				const newValue = encode(value);
				if (newValue == undefined) {
					query.delete(name);
				} else {
					query.set(name, newValue);
				}
			}
		};
		batchedUpdates.add(toBatch);
		clearTimeout(batchTimeout);
		const query = new URLSearchParams(window.location.search);
		batchTimeout = setTimeout(async () => {
			batchedUpdates.forEach((batched) => {
				batched(query);
			});
			clearTimeout(debouncedTimeouts.get(name));
			if (browser) {
				if (sort) {
					query.sort();
				}
				await goto(`?${query}${hash}`, GOTO_OPTIONS);
			}
			if (pushHistory && browser) {
				debouncedTimeouts.set(
					name,
					setTimeout(() => {
						if (sort) {
							query.sort();
						}
						goto(hash, GOTO_OPTIONS_PUSH);
					}, debounceHistory),
				);
			}
			batchedUpdates.clear();
		});
	}

	const { subscribe } = derived(page, ($page) => {
		const actualParam = $page?.url?.searchParams?.get?.(name);
		if (
			browser &&
			actualParam == undefined &&
			defaultValue != undefined &&
			!defaultedParams.has(name)
		) {
			set(defaultValue);
			defaultedParams.add(name);
			return defaultValue;
		}
		return decode(actualParam);
	});
	return {
		set,
		subscribe,
		update: (updater: Updater<T | null>) => {
			const currentValue = get({ subscribe });
			const newValue = updater(currentValue);
			set(newValue);
		},
	};
}
