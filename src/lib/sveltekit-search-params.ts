/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { browser, building } from '$app/environment';
import { goto } from '$app/navigation';
import { navigating, page as page_store } from '$app/stores';
import type { Page } from '@sveltejs/kit';
import {
	derived,
	get,
	writable,
	type Updater,
	type Writable,
	type Readable,
	readable,
} from 'svelte/store';
import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from './lz-string/index.js';

// during building we fake the page store with an URL with no search params
// as it should be during prerendering. This allow the application to still build
// and the client side behavior is still persisted after the build
let page: Readable<Pick<Page, 'url'>>;
if (building) {
	page = readable({
		url: new URL(
			'https://github.com/paoloricciuti/sveltekit-search-params',
		),
	});
} else {
	page = page_store;
}

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

export type StoreOptions<T> = {
	debounceHistory?: number;
	pushHistory?: boolean;
	sort?: boolean;
	showDefaults?: boolean;
	equalityFn?: T extends object
		? (current: T | null, next: T | null) => boolean
		: never;
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

function isComplexEqual<T>(
	current: T,
	next: T,
	equalityFn: (current: T, next: T) => boolean = (current, next) =>
		JSON.stringify(current) === JSON.stringify(next),
) {
	return (
		typeof current === 'object' &&
		typeof next === 'object' &&
		equalityFn(current, next)
	);
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
} satisfies Record<string, () => EncodeAndDecodeOptions<any>>;

type SetTimeout = ReturnType<typeof setTimeout>;

const batchedUpdates = new Set<(query: URLSearchParams) => void>();

let batchTimeout: number;

const debouncedTimeouts = new Map<string, SetTimeout>();

export function queryParameters<T extends object>(
	options?: Options<T>,
	{
		debounceHistory = 0,
		pushHistory = true,
		sort = true,
		showDefaults = true,
		equalityFn,
	}: StoreOptions<T> = {},
): Writable<LooseAutocomplete<T>> {
	const overrides = writable<Overrides<T>>({});
	let currentValue: T;
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
	const { subscribe } = derived<[typeof page, typeof overrides], T>(
		[page, overrides],
		([$page, $overrides], set) => {
			const [valueToSet, anyDefaultedParam] = mixSearchAndOptions(
				$page?.url?.searchParams,
				$overrides,
				options,
			);
			if (anyDefaultedParam && showDefaults) {
				_set(valueToSet, firstTime);
			}
			if (isComplexEqual(currentValue, valueToSet, equalityFn)) {
				return;
			}
			currentValue = structuredClone(valueToSet);
			return set(valueToSet);
		},
	);
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
		equalityFn,
	}: StoreOptions<T> = {},
): Writable<T | null> {
	const override = writable<T | null>(null);
	let firstTime = true;
	let currentValue: T | null;

	let isNavigating = false;
	if (browser) {
		navigating.subscribe((nav) => {
			isNavigating = nav?.type === 'goto';
		});
	}

	function _set(value: T | null, changeImmediately?: boolean) {
		if (!browser) return;

		// Wait for previous navigation to be finished before updating again
		if (isNavigating) {
			const unsubscribe = navigating.subscribe((nav) => {
				if (nav?.type !== 'goto') {
					_set(value, changeImmediately);
					unsubscribe();
				}
			});
			return;
		}

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

	const { subscribe } = derived<[typeof page, typeof override], T | null>(
		[page, override],
		([$page, $override], set) => {
			if ($override) {
				if (isComplexEqual(currentValue, $override, equalityFn)) {
					return;
				}
				currentValue = structuredClone($override);
				return set($override);
			}
			const actualParam = $page?.url?.searchParams?.get?.(name);
			if (actualParam == undefined && defaultValue != undefined) {
				if (showDefaults) {
					_set(defaultValue, firstTime);
				}
				if (isComplexEqual(currentValue, defaultValue, equalityFn)) {
					return;
				}
				currentValue = structuredClone(defaultValue);
				return set(defaultValue);
			}
			const retval = decode(actualParam);
			if (isComplexEqual(currentValue, retval, equalityFn)) {
				return;
			}
			currentValue = structuredClone(retval);
			return set(retval);
		},
	);
	return {
		set(newValue) {
			_set(newValue);
		},
		subscribe,
		update: (updater: Updater<T | null>) => {
			const newValue = updater(currentValue);
			_set(newValue);
		},
	};
}
