import { VERSION } from '@sveltejs/kit';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { BROWSER as browser } from 'esm-env';
import { untrack } from 'svelte';
import type { EncodeAndDecodeOptions, NavigationOptions } from './types';
export type { EncodeAndDecodeOptions, NavigationOptions };

/**
 * SvelteKit 3 changes the goto options.
 * NOTE: Simplify the GOTO_OPTIONS once this library no longer supports SvelteKit 2.
 */
const is_sveltekit_2 = VERSION.startsWith('2.');

function get_page_url_params() {
	let url: typeof page.url;
	try {
		url = page.url;
	} catch (cause) {
		throw new Error(
			'sveltekit-search-params: Unable to access page.url. Move your queryParameters() definition and any initial read in a component before the first await.',
			{ cause },
		);
	}
	try {
		return url.searchParams;
	} catch {
		// Search params are unavailable during prerendering.
		return new URLSearchParams();
	}
}

function is_complex_equal<T>(
	current: T,
	next: T,
	equality_fn: (current: T, next: T) => boolean = (current, next) =>
		JSON.stringify(current) === JSON.stringify(next),
) {
	return (
		typeof current === 'object' &&
		typeof next === 'object' &&
		equality_fn(current, next)
	);
}

const GOTO_OPTIONS = is_sveltekit_2
	? {
			keepFocus: true,
			noScroll: true,
			replaceState: true,
		}
	: {
			reset: false,
			replace: true,
		};

const GOTO_OPTIONS_PUSH = is_sveltekit_2
	? { keepFocus: true, noScroll: true, replaceState: false }
	: {
			reset: false,
			replace: false,
		};

// type to get full autocomplete on T but also allow for any other string
type LooseAutocomplete<T> = {
	[K in keyof T]: T[K];
} & {
	[K: string]: string | null;
} & {
	toJSON: () => Record<string, string | null>;
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

type SetTimeout = ReturnType<typeof setTimeout>;

type BatchedUpdate = {
	apply: (query: URLSearchParams) => void;
	settle: () => void;
};

const batched_updates = new Set<BatchedUpdate>();

let batch_timeout: number;

const debounced_timeouts = new Map<string, SetTimeout>();

const DEFAULT_ENCODER_DECODER: EncodeAndDecodeOptions = {
	encode: (value) => value.toString(),
	decode: (value: string | null) => (value ? value.toString() : null),
};

const RAW = Symbol('raw');

// the latest write to each key, per queryParameters instance
const latest_writes = new WeakMap<object, Map<string | symbol, symbol>>();

function do_navigate(
	name: string,
	value: unknown,
	encodes: Map<string | symbol, EncodeAndDecodeOptions['encode']>,
	overrides: Record<string | symbol, unknown>,
	navigation_options: NavigationOptions,
) {
	// if we are on the server just return since we can't navigate
	if (!browser) return;
	// set the overrides to have the value immediately
	overrides[name] = value;
	const write = Symbol();
	const writes = latest_writes.get(overrides) ?? new Map();
	latest_writes.set(overrides, writes);
	writes.set(name, write);
	const {
		debounceHistory = 0,
		pushHistory = true,
		sort = true,
	} = navigation_options;
	const hash = window.location.hash;
	// we batch the changes to prevent a new change arriving before the navigation from "negating" this change
	const to_batch = (query: URLSearchParams) => {
		if (value == undefined) {
			query.delete(name);
		} else {
			const new_value = (
				encodes.get(name) ?? DEFAULT_ENCODER_DECODER.encode
			)(value);
			if (new_value == undefined) {
				query.delete(name);
			} else {
				query.set(name, new_value);
			}
		}
	};
	batched_updates.add({
		apply: to_batch,
		settle() {
			// a navigation superseded by a later write must not clear that write's override
			if (writes.get(name) === write) {
				writes.delete(name);
				overrides[name] = undefined;
			}
		},
	});
	clearTimeout(batch_timeout);
	const query = new URLSearchParams(window.location.search);
	batch_timeout = setTimeout(async () => {
		const batch = [...batched_updates];
		batch.forEach((batched) => {
			batched.apply(query);
		});
		clearTimeout(debounced_timeouts.get(name));
		if (browser) {
			async function navigate() {
				if (sort) {
					query.sort();
				}
				await goto(
					`?${query}${hash}`,
					pushHistory ? GOTO_OPTIONS_PUSH : GOTO_OPTIONS,
				);
				// reset the overrides of every write in the batch since navigation finished
				batch.forEach((batched) => {
					batched.settle();
				});
			}
			// if debounce is 0 just call it immediately (not even waiting 0)
			if (debounceHistory === 0) {
				navigate();
			} else {
				debounced_timeouts.set(
					name,
					setTimeout(navigate, debounceHistory),
				);
			}
		}
		batched_updates.clear();
	});
}

function is_proxyable(value: unknown): value is object {
	if (value == null || typeof value !== 'object') return false;
	if (Array.isArray(value)) return true;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

/**
 * this is used for objects and arrays...when a property changes we actually
 * want to change the base parameter...this function is passed through the
 * recursive proxy so that we can invoke it when a nested property changes
 */
function create_root_navigator(
	root: object,
	encodes: Map<string | symbol, EncodeAndDecodeOptions['encode']>,
	overrides: Record<string | symbol, unknown>,
	navigation_options: NavigationOptions,
) {
	return (_path: string[], key: string, to_set: unknown) => {
		const path = [..._path];
		const name = path.shift()!;
		const value = structuredClone($state.snapshot(overrides[name] ?? root));
		let current = value;
		for (const piece of path) {
			current = current[piece as never];
		}
		(current as any)[key] = to_set;
		do_navigate(
			name,
			// this allow for `push` to work
			Array.isArray(value) && key === 'length'
				? structuredClone(value)
				: value,
			encodes,
			overrides,
			navigation_options,
		);
	};
}

/**
 * to keep track of all the changes in nested objects and arrays
 * we need to create a recursive proxy
 */
function create_recursive_proxy<
	T extends Record<string, EncodeAndDecodeOptions | boolean>,
>(
	target: unknown,
	cache: Partial<T>,
	proxies: WeakMap<object, Map<string, object>>,
	decodes: Map<string | symbol, EncodeAndDecodeOptions['decode']>,
	encodes: Map<string | symbol, EncodeAndDecodeOptions['encode']>,
	overrides: Record<string | symbol, unknown>,
	old_values: Map<string | symbol, Options<T>>,
	navigation_options: NavigationOptions,
	path: string[] = [],
	navigator?: ReturnType<typeof create_root_navigator>,
) {
	// reading `toJSON` or an inherited property like `toString` never gives a parameter
	const is_param = (name: string) =>
		name !== 'toJSON' &&
		(Object.hasOwn(cache, name) ||
			(!(name in cache) && get_page_url_params().has(name)));
	// one proxy per object and path, so reading the same value twice gives the same object
	function get_proxy(value: object, name: string) {
		const key = JSON.stringify([...path, name]);
		let by_path = proxies.get(value);
		if (!by_path) {
			by_path = new Map();
			proxies.set(value, by_path);
		}
		let proxy = by_path.get(key);
		if (!proxy) {
			proxy = create_recursive_proxy(
				value,
				cache,
				proxies,
				decodes,
				encodes,
				overrides,
				old_values,
				navigation_options,
				[...path, name],
				navigator ??
					create_root_navigator(
						value,
						encodes,
						overrides,
						navigation_options,
					),
			);
			by_path.set(key, proxy);
		}
		return proxy;
	}
	return new Proxy<LooseAutocomplete<Options<T>>>(
		target as LooseAutocomplete<Options<T>>,
		{
			get(target, name) {
				// we use the RAW symbol to get the original target (this is currently not used but better have it)
				if (name === RAW) return target;
				// if it's a symbol we just return the actual value (this is svelte checking if we are state)
				const reflected_value = Reflect.get(target, name);
				if (typeof name === 'symbol') {
					return reflected_value;
				}
				// below the root we proxy nested objects and arrays too, so writes at any depth navigate
				if (path.length !== 0) {
					// a proxy can't stand in for a read-only, non-configurable property (like a frozen object's)
					const { writable = true, configurable = true } =
						Reflect.getOwnPropertyDescriptor(target, name) ?? {};
					if (
						is_proxyable(reflected_value) &&
						(writable || configurable)
					) {
						return get_proxy(reflected_value, name);
					}
					return reflected_value;
				}

				// if we have a reflected value it means someone is trying to access a property on the object prototype
				// in that case we return the same property from the cache object.
				if (reflected_value) {
					return Reflect.get(cache, name);
				}

				// special case for JSON.stringify
				if (name === 'toJSON') {
					return () => {
						// snapshot the cache
						const values = $state.snapshot(cache);
						// on the server that's enough
						if (!browser) return values;

						// otherwise we mere with existing but not specified search params
						const search_params = new URLSearchParams(
							window.location.search,
						);
						for (const [key, value] of search_params.entries()) {
							if (!(key in cache)) {
								(values as any)[key] = value;
							}
						}
						return values;
					};
				}

				const value =
					cache[name as never] ??
					(decodes.get(name) ?? DEFAULT_ENCODER_DECODER.decode)(
						get_page_url_params().get(name as never),
					);
				if (value != undefined && typeof value === 'object') {
					return get_proxy(value, name);
				}
				return value;
			},
			set(target, name, value) {
				if (typeof name === 'symbol')
					return Reflect.set(target, name, value);
				if (!browser) return true;
				// if we have a navigator we call the navigator (we are in a proxy and we are setting a leaf)
				if (navigator) {
					navigator(path, name, value);
					return true;
				}
				// otherwise we just navigate
				do_navigate(
					name,
					value,
					encodes,
					overrides,
					navigation_options,
				);
				return true;
			},
			has(target, name) {
				if (name === RAW) return true;
				if (
					path.length === 0 &&
					typeof name === 'string' &&
					is_param(name)
				) {
					return true;
				}
				return Reflect.has(target, name);
			},
			ownKeys(target) {
				if (path.length !== 0) return Reflect.ownKeys(target);
				const names = [
					...Object.keys(cache),
					...get_page_url_params().keys(),
				];
				return [...new Set(names.filter(is_param))];
			},
			getOwnPropertyDescriptor(target, name) {
				if (path.length !== 0 || typeof name === 'symbol') {
					return Reflect.getOwnPropertyDescriptor(target, name);
				}
				if (!is_param(name)) return undefined;
				return {
					value: this.get!(target, name, target),
					enumerable: true,
					configurable: true,
					writable: true,
				};
			},
			// a property on the target or a frozen target would tie ownKeys to the target's keys
			defineProperty(target, name, descriptor) {
				if (path.length !== 0) {
					return Reflect.defineProperty(target, name, descriptor);
				}
				return false;
			},
			preventExtensions(target) {
				if (path.length !== 0) return Reflect.preventExtensions(target);
				return false;
			},
		},
	);
}

/**
 * a plain default is copied for every use, so writes into the value never change the default itself
 */
function get_default(option: EncodeAndDecodeOptions) {
	const default_value = option.defaultValue;
	if (is_proxyable(default_value)) return $state.snapshot(default_value);
	return default_value;
}

/**
 * function to check if we should show the default instead of the value
 */
function should_default(
	value: unknown,
	option: boolean | EncodeAndDecodeOptions,
): option is EncodeAndDecodeOptions {
	return (
		value == undefined &&
		typeof option !== 'boolean' &&
		option.defaultValue != undefined
	);
}

export function queryParameters<
	T extends Record<string, EncodeAndDecodeOptions | boolean>,
>(
	options?: T,
	navigation_options: NavigationOptions = {},
): LooseAutocomplete<Options<T>> {
	const { showDefaults: show_defaults = true } = navigation_options;
	// keeps all the deriveds for every single property
	const cache: Partial<T> = {};
	// al the decode functions
	const decodes: Map<string | symbol, EncodeAndDecodeOptions['decode']> =
		new Map();
	// all the encode functions
	const encodes: Map<string | symbol, EncodeAndDecodeOptions['encode']> =
		new Map();
	// all the old references of the derived (to prevent unnecessary reactions)
	const old_values: Map<string | symbol, Options<T>> = new Map();
	// all the overrides (it's a $state and not a SvelteMap because when deleting a value SvelteMap invalidate the whole Map)
	const overrides: Record<string | symbol, unknown> = $state({});
	for (const key in options) {
		const decode =
			typeof options?.[key] === 'boolean'
				? DEFAULT_ENCODER_DECODER.decode
				: options?.[key].decode;
		const encode =
			typeof options?.[key] === 'boolean'
				? DEFAULT_ENCODER_DECODER.encode
				: options?.[key].encode;
		decodes.set(key, decode);
		encodes.set(key, encode);

		const raw = $derived(
			overrides[key] ?? decode(get_page_url_params().get(key)),
		);

		const der = $derived.by(() => {
			const value = should_default(raw, options[key])
				? get_default(options[key])
				: raw;
			const old_value = old_values.get(key) ?? null;
			// reuse the old value when it is conceptually the same as the new value
			// Equality reads must not track edits to the cached value.
			if (
				is_complex_equal(
					$state.snapshot(value),
					untrack(() => $state.snapshot(old_value)) as any,
					typeof options[key] === 'boolean'
						? undefined
						: options[key].equalityFn,
				)
			) {
				return old_value;
			}
			// store the old value
			const reactive_value = $state($state.snapshot(value));
			old_values.set(key, reactive_value);
			return reactive_value;
		});

		$effect.pre(() => {
			// write the default to the url in case the param is null and we need to show it
			if (show_defaults && should_default(raw, options[key])) {
				do_navigate(
					key,
					get_default(options[key]),
					encodes,
					overrides,
					navigation_options,
				);
			}
		});

		Object.defineProperty(cache, key, {
			get() {
				return der;
			},
			enumerable: true,
		});
	}
	return create_recursive_proxy(
		{},
		cache,
		new WeakMap(),
		decodes,
		encodes,
		overrides,
		old_values,
		navigation_options,
	);
}
