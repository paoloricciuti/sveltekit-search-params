/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writable, type Writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { default as lz } from "lz-string";

const { decompressFromEncodedURIComponent, compressToEncodedURIComponent } = lz;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function noop<T>(value: T) { }

export type EncodeAndDecodeOptions<T = any> = {
    encode: (value: T) => string;
    decode: (value: string | null) => T | null;
    defaultValue?: T,
};

type LooseAutocomplete<T> = {
    [K in keyof T]: T[K];
} & {
    [K: string]: any;
};

type Options<T> = {
    [Key in keyof T]: EncodeAndDecodeOptions<T[Key]> | boolean;
};

function mixSearchAndOptions<T>(searchParams: URLSearchParams, options?: Options<T>): [LooseAutocomplete<T>, boolean] {
    const uniqueKeys = Array.from(
        new Set(Array.from(searchParams?.keys?.() || []).concat(Object.keys(options ?? {})))
    );
    let anyDefaultedParam = false;
    return [Object.fromEntries(
        uniqueKeys.map((key) => {
            let fnToCall: EncodeAndDecodeOptions['decode'] = (value) => value;
            const optionsKey = (options as any)?.[key];
            if (typeof optionsKey !== "boolean" && typeof optionsKey?.decode === 'function') {
                fnToCall = optionsKey.decode;
            }
            const value = searchParams?.get(key);
            let actualValue;
            if (browser && value == undefined && optionsKey?.defaultValue != undefined && !defaultedParams.has(key)) {
                actualValue = optionsKey.defaultValue;
                defaultedParams.add(key);
                anyDefaultedParam = true;
            } else {
                actualValue = fnToCall(value);
            }
            return [key, actualValue];
        })
    ) as unknown as LooseAutocomplete<T>, anyDefaultedParam];
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
    array: <T = any>(defaultValue?: T) => ({
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
        decode: (value: string | null) => value ? parseFloat(value) : null,
        defaultValue,
    }),
    boolean: (defaultValue?: boolean) => ({
        encode: (value: boolean) => value + "",
        decode: (value: string | null) => value !== null && value !== "false",
        defaultValue,
    }),
    string: (defaultValue?: string) => ({
        encode: (value: string | null) => value ?? "",
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
                    decompressFromEncodedURIComponent(value) ?? ""
                );
            } catch (e) {
                return null;
            }
        },
        defaultValue,
    }),
};

const batchedUpdates = new Set<(query: URLSearchParams) => void>();

let batchTimeout: ReturnType<typeof setTimeout>;

const defaultedParams = new Set<string>();

export function queryParameters<T extends object>(options?: Options<T>): Writable<LooseAutocomplete<T>> {
    const { set: _set, subscribe, update } = writable<LooseAutocomplete<T>>();
    const setRef: { value: Writable<T>["set"]; } = { value: noop };
    const unsubPage = page.subscribe(($page) => {
        setRef.value = (value) => {
            const query = new URLSearchParams($page.url.searchParams);
            const toBatch = (query: URLSearchParams) => {
                for (const field of Object.keys(value)) {

                    if (!(value as any)[field] == undefined) {
                        query.delete(field);
                        continue;
                    }
                    let fnToCall: EncodeAndDecodeOptions['encode'] = (value) => value.toString();
                    const optionsKey = (options as any)?.[field as string];
                    if (typeof optionsKey !== "boolean" && typeof optionsKey?.encode === 'function') {
                        fnToCall = optionsKey.encode;
                    }
                    query.set(field as string, fnToCall((value as any)[field]));
                }
            };
            batchedUpdates.add(toBatch);
            clearTimeout(batchTimeout);
            batchTimeout = setTimeout(() => {
                batchedUpdates.forEach((batched) => {
                    batched(query);
                });
                goto(`?${query}`, {
                    keepFocus: true,
                    noScroll: true,
                });
                batchedUpdates.clear();
            });
        };
        const [valueToSet, anyDefaultedParam] = mixSearchAndOptions($page?.url?.searchParams, options);
        if (anyDefaultedParam) {
            setRef.value(valueToSet);
        } else {
            _set(valueToSet);
        }

    });
    const sub = (...props: Parameters<typeof subscribe>) => {
        const unsub = subscribe(...props);
        return () => {
            unsub();
            unsubPage();
        };
    };
    return {
        set: (value) => {
            setRef.value(value);
        },
        subscribe: sub,
        update
    };
}

const DEFAULT_ENCODER_DECODER: EncodeAndDecodeOptions = {
    encode: (value) => value.toString(),
    decode: (value: string | null) => value ? value.toString() : null,
};

export function queryParam<T = string>(name: string, { encode: encode = DEFAULT_ENCODER_DECODER.encode, decode: decode = DEFAULT_ENCODER_DECODER.decode, defaultValue }: EncodeAndDecodeOptions<T> = DEFAULT_ENCODER_DECODER): Writable<T | null> {
    const { set: _set, subscribe, update } = writable<T | null>();
    const setRef: { value: Writable<T | null>["set"]; } = { value: noop };
    const unsubPage = page.subscribe(($page) => {
        const actualParam = $page?.url?.searchParams?.get?.(name);
        setRef.value = (value) => {
            const toBatch = (query: URLSearchParams) => {
                if (value == undefined) {
                    query.delete(name);
                } else {
                    query.set(name, encode(value));
                }
            };
            batchedUpdates.add(toBatch);
            clearTimeout(batchTimeout);
            const query = new URLSearchParams($page.url.searchParams);
            batchTimeout = setTimeout(() => {
                batchedUpdates.forEach((batched) => {
                    batched(query);
                });
                goto(`?${query}`, {
                    keepFocus: true,
                    noScroll: true,
                });
                batchedUpdates.clear();
            });
        };
        if (browser && actualParam == undefined && defaultValue != undefined && !defaultedParams.has(name)) {
            _set(defaultValue);
            setRef.value(defaultValue);
            defaultedParams.add(name);
        } else {
            _set(decode(actualParam));
        }
    });
    const sub = (...props: Parameters<typeof subscribe>) => {
        const unsub = subscribe(...props);
        return () => {
            unsub();
            unsubPage();
        };
    };
    return {
        set: (value) => {
            setRef.value(value);
        },
        subscribe: sub,
        update
    };
}
