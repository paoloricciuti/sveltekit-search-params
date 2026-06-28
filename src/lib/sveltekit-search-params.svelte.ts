import { browser, building } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import type { EncodeAndDecodeOptions, NavigationOptions } from './types';
export type { EncodeAndDecodeOptions, NavigationOptions };

// during building we fake the page url with no search params as it should be
// during prerendering. This allow the application to still build and the client
// side behavior is still persisted after the build
function get_page_url() {
	if (building) {
		return new URL('http://example.com');
	}
	return page.url;
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

const batched_updates = new Set<(query: URLSearchParams) => void>();

let batch_timeout: number;

const debounced_timeouts = new Map<string, SetTimeout>();

const DEFAULT_ENCODER_DECODER: EncodeAndDecodeOptions = {
	encode: (value) => value.toString(),
	decode: (value: string | null) => (value ? value.toString() : null),
};

const RAW = Symbol('raw');

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
	batched_updates.add(to_batch);
	clearTimeout(batch_timeout);
	const query = new URLSearchParams(window.location.search);
	batch_timeout = setTimeout(async () => {
		batched_updates.forEach((batched) => {
			batched(query);
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
				// reset overrides here since navigation finished
				overrides[name] = undefined;
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
		const value = structuredClone($state.snapshot(overrides[name]) ?? root);
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
	decodes: Map<string | symbol, EncodeAndDecodeOptions['decode']>,
	encodes: Map<string | symbol, EncodeAndDecodeOptions['encode']>,
	overrides: Record<string | symbol, unknown>,
	old_values: Map<string | symbol, Options<T>>,
	navigation_options: NavigationOptions,
	path: string[] = [],
	navigator?: ReturnType<typeof create_root_navigator>,
) {
	return new Proxy<LooseAutocomplete<Options<T>>>(
		target as LooseAutocomplete<Options<T>>,
		{
			get(target, name) {
				// we use the RAW symbol to get the original target (this is currently not used but better have it)
				if (name === RAW) return target;
				// if the path length is different from 0 we just return the actual value
				// same if it's a symbol (this is svelte checking if we are state)
				const reflected_value = Reflect.get(target, name);
				if (typeof name === 'symbol' || path.length !== 0) {
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
						get_page_url().searchParams.get(name as never),
					);
				if (value != undefined && typeof value === 'object') {
					return create_recursive_proxy(
						value,
						cache,
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
				return Reflect.has(target, name);
			},
		},
	);
}

/**
 * function to check if we should show the default and eventually navigate to update the url
 */
function should_default(
	value: unknown,
	key: string,
	option: boolean | EncodeAndDecodeOptions,
	show_defaults: boolean,
	encodes: Map<string | symbol, EncodeAndDecodeOptions['encode']>,
	overrides: Record<string | symbol, unknown>,
	navigation_options: NavigationOptions,
): option is EncodeAndDecodeOptions {
	if (
		value == undefined &&
		typeof option !== 'boolean' &&
		option.defaultValue != undefined
	) {
		if (show_defaults) {
			do_navigate(
				key,
				option.defaultValue,
				encodes,
				overrides,
				navigation_options,
			);
		}
		return true;
	}
	return false;
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

		const der = $derived.by(() => {
			const value =
				overrides[key] ?? decode(get_page_url().searchParams.get(key));
			if (
				!browser &&
				should_default(
					value,
					key,
					options[key],
					show_defaults,
					encodes,
					overrides,
					navigation_options,
				)
			) {
				// return the default value on the server (we can't set the override in $effect.pre
				// because it only execute on the client and if we set overrides on the server is not
				// actually reactive)
				return options[key].defaultValue;
			}
			const old_value = old_values.get(key) ?? null;
			// check if the old value is conceptually the same as the new, in case return the new value
			if (
				is_complex_equal(
					$state.snapshot(value),
					$state.snapshot(old_value) as any,
					typeof options[key] === 'boolean'
						? undefined
						: options[key].equalityFn,
				)
			) {
				return old_value;
			}
			// store the old value
			old_values.set(key, $state.snapshot(value));
			return value;
		});

		$effect.pre(() => {
			// override in case the param is null and we need to show the default
			if (
				should_default(
					der,
					key,
					options[key],
					show_defaults,
					encodes,
					overrides,
					navigation_options,
				)
			) {
				overrides[key] = options[key].defaultValue;
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
		decodes,
		encodes,
		overrides,
		old_values,
		navigation_options,
	);
}
