import { browser, building } from '$app/environment';
import { goto } from '$app/navigation';
import { page as page_store } from '$app/stores';
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
import type { EncodeAndDecodeOptions, StoreOptions } from './types';
export type { EncodeAndDecodeOptions, StoreOptions };

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

type LooseAutocomplete<T> = {
	[K in keyof T]: T[K];
} & {
	[K: string]: any;
};

type Options<T> = {
	[Key in keyof T]:
		| (T[Key] extends boolean
				? string
				: T[Key] extends EncodeAndDecodeOptions<infer TReturn>
					? TReturn
					: string)
		| (T[Key] extends EncodeAndDecodeOptions<any>
				? undefined extends T[Key]['defaultValue']
					? null
					: never
				: null);
};

type Overrides<T> = {
	[Key in keyof T]?: T[Key] | null;
};

function mixSearchAndOptions<T>(
	searchParams: URLSearchParams,
	overrides: NoInfer<Overrides<Options<T>>>,
	options?: T,
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

type SetTimeout = ReturnType<typeof setTimeout>;

const batchedUpdates = new Set<(query: URLSearchParams) => void>();

let batchTimeout: ReturnType<typeof setTimeout>;

const debouncedTimeouts = new Map<string, SetTimeout>();

export function queryParameters<
	T extends Record<string, EncodeAndDecodeOptions | boolean>,
>(
	options?: T,
	{
		debounceHistory = 0,
		pushHistory = true,
		sort = true,
		showDefaults = true,
		equalityFn,
	}: StoreOptions<Options<T>> = {},
): Writable<LooseAutocomplete<Options<T>>> {
	const overrides = writable<Overrides<Options<T>>>({});
	let currentValue: Options<T>;
	let firstTime = true;

	function _set(value: Options<T>, changeImmediately?: boolean) {
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
	const { subscribe } = derived<[typeof page, typeof overrides], Options<T>>(
		[page, overrides],
		([$page, $overrides], set) => {
			const [valueToSet, anyDefaultedParam] = mixSearchAndOptions(
				$page?.url?.searchParams,
				$overrides,
				options,
			);
			if (anyDefaultedParam && showDefaults) {
				_set(structuredClone(valueToSet), firstTime);
			}
			if (isComplexEqual(currentValue, valueToSet, equalityFn)) {
				return;
			}
			currentValue = structuredClone(valueToSet);
			return set(structuredClone(valueToSet));
		},
	);
	return {
		set(newValue) {
			_set(newValue);
		},
		subscribe,
		update: (updater: Updater<LooseAutocomplete<Options<T>>>) => {
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

export function queryParam<T>(
	name: string,
	options: Partial<EncodeAndDecodeOptions<T>> & { defaultValue: T },
	storeOptions?: StoreOptions<T>,
): Writable<T>;
export function queryParam<T = string>(
	name: string,
	options?: Partial<EncodeAndDecodeOptions<T>>,
	storeOptions?: StoreOptions<T>,
): Writable<T | null>;
export function queryParam<T = string>(
	name: string,
	{
		encode: encode = DEFAULT_ENCODER_DECODER.encode,
		decode: decode = DEFAULT_ENCODER_DECODER.decode,
		defaultValue,
	}: Partial<EncodeAndDecodeOptions<T>> = DEFAULT_ENCODER_DECODER,
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
			if ($override != undefined) {
				if (isComplexEqual(currentValue, $override, equalityFn)) {
					return;
				}
				currentValue = structuredClone($override);
				return set($override);
			}
			const actualParam = $page?.url?.searchParams?.get?.(name);
			if (actualParam == undefined && defaultValue != undefined) {
				if (showDefaults) {
					_set(structuredClone(defaultValue), firstTime);
				}
				if (isComplexEqual(currentValue, defaultValue, equalityFn)) {
					return;
				}
				currentValue = structuredClone(defaultValue);
				return set(structuredClone(defaultValue));
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
