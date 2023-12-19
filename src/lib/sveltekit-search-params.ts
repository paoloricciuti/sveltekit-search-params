/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import {
	derived,
	get,
	writable,
	type Updater,
	type Writable,
} from 'svelte/store';
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
	showDefaults?: boolean;
};

type LooseAutocomplete<T> = {
	[K in keyof T]: T[K];
} & {
	[K: string]: any;
};

type Options<T> = {
	[Key in keyof T]: EncodeAndDecodeOptions<T[Key]> | boolean;
};

type Overrides<T> = {
	[Key in keyof T]?: T[Key] | null;
};

function mixSearchAndOptions<T>(
	searchParams: URLSearchParams,
	overrides: Overrides<T>,
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
				if ((overrides as any)[key] != undefined) {
					return [key, (overrides as any)[key]];
				}
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
					value == undefined &&
					optionsKey?.defaultValue != undefined
				) {
					actualValue = optionsKey.defaultValue;
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

const debouncedTimeouts = new Map<string, SetTimeout>();

export function queryParameters<T extends object>(
	options?: Options<T>,
	{
		debounceHistory = 0,
		pushHistory = true,
		sort = true,
		showDefaults = true,
	}: StoreOptions = {},
): Writable<LooseAutocomplete<T>> {
	const overrides = writable<Overrides<T>>({});
	let firstTime = true;

	function _set(value: T, changeImmediately?: boolean) {
		if (!browser) return;
		firstTime = false;
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
				overrides.set(value);
				// eslint-disable-next-line no-inner-declarations
				async function navigate() {
					if (sort) {
						query.sort();
					}
					await goto(
						`?${query}${hash}`,
						pushHistory ? GOTO_OPTIONS_PUSH : GOTO_OPTIONS,
					);
					overrides.set({});
				}
				if (changeImmediately || debounceHistory === 0) {
					navigate();
				} else {
					debouncedTimeouts.set(
						'queryParameters',
						setTimeout(navigate, debounceHistory),
					);
				}
			}
			batchedUpdates.clear();
		});
	}
	const { subscribe } = derived([page, overrides], ([$page, $overrides]) => {
		const [valueToSet, anyDefaultedParam] = mixSearchAndOptions(
			$page?.url?.searchParams,
			$overrides,
			options,
		);
		if (anyDefaultedParam && showDefaults) {
			_set(valueToSet, firstTime);
		}
		return valueToSet;
	});
	return {
		set(newValue) {
			_set(newValue);
		},
		subscribe,
		update: (updater: Updater<LooseAutocomplete<T>>) => {
			const currentValue = get({ subscribe });
			const newValue = updater(currentValue);
			_set(newValue);
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
	{
		debounceHistory = 0,
		pushHistory = true,
		sort = true,
		showDefaults = true,
	}: StoreOptions = {},
): Writable<T | null> {
	const override = writable<T | null>(null);
	let firstTime = true;
	function _set(value: T | null, changeImmediately?: boolean) {
		if (!browser) return;
		firstTime = false;
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
				override.set(value);
				// eslint-disable-next-line no-inner-declarations
				async function navigate() {
					if (sort) {
						query.sort();
					}
					await goto(
						`?${query}${hash}`,
						pushHistory ? GOTO_OPTIONS_PUSH : GOTO_OPTIONS,
					);
					override.set(null);
				}
				if (changeImmediately || debounceHistory === 0) {
					navigate();
				} else {
					debouncedTimeouts.set(
						name,
						setTimeout(navigate, debounceHistory),
					);
				}
			}
			batchedUpdates.clear();
		});
	}

	const { subscribe } = derived([page, override], ([$page, $override]) => {
		if ($override) {
			return $override;
		}
		const actualParam = $page?.url?.searchParams?.get?.(name);
		if (actualParam == undefined && defaultValue != undefined) {
			if (showDefaults) {
				_set(defaultValue, firstTime);
			}
			return defaultValue;
		}
		return decode(actualParam);
	});
	return {
		set(newValue) {
			_set(newValue);
		},
		subscribe,
		update: (updater: Updater<T | null>) => {
			const currentValue = get({ subscribe });
			const newValue = updater(currentValue);
			_set(newValue);
		},
	};
}
