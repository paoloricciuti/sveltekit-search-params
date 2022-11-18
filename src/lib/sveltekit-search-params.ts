/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writable, type Writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import {
    compressToEncodedURIComponent,
    decompressFromEncodedURIComponent,
} from "lz-string";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function noop<T>(value: T) { }

export type EncodeAndDecodeOptions<T = any> = {
    encode: (value: T) => string;
    decode: (value: string | null) => T | null;
};

type LooseAutocomplete<T> = {
    [K in keyof T]: T[K];
} & {
    [K: string]: any;
};

type Options<T> = {
    [Key in keyof T]: EncodeAndDecodeOptions<T[Key]> | boolean;
};

function mixSearchAndOptions<T>(searchParams: URLSearchParams, options?: Options<T>): LooseAutocomplete<T> {
    const uniqueKeys = Array.from(
        new Set(Array.from(searchParams?.keys?.() || []).concat(Object.keys(options ?? {})))
    );
    return Object.fromEntries(
        uniqueKeys.map((key) => {
            let fnToCall: EncodeAndDecodeOptions['decode'] = (value) => value;
            const optionsKey = (options as any)?.[key];
            if (typeof optionsKey !== "boolean" && typeof optionsKey?.decode === 'function') {
                fnToCall = optionsKey.decode;
            }
            const value = searchParams?.get(key);
            return [key, fnToCall(value)];
        })
    ) as unknown as LooseAutocomplete<T>;
}

export const ssp = {
    object: <T extends object = any>() => ({
        encode: (value: T) => JSON.stringify(value),
        decode: (value: string | null): T | null => {
            if (value === null) return null;
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        },
    }),
    array: <T = any>() => ({
        encode: (value: T[]) => JSON.stringify(value),
        decode: (value: string | null): T[] | null => {
            if (value === null) return null;
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        },
    }),
    number: () => ({
        encode: (value: number) => value.toString(),
        decode: (value: string | null) => value ? parseFloat(value) : null,
    }),
    boolean: () => ({
        encode: (value: boolean) => value + "",
        decode: (value: string | null) => value !== null && value !== "false"
    }),
    string: () => ({
        encode: (value: string | null) => value ?? "",
        decode: (value: string | null) => value,
    }),
    lz: <T = any>() => ({
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
        }
    }),
};

const batchedUpdates = new Set<(query: URLSearchParams) => void>();

let batchTimeout: ReturnType<typeof setTimeout>;

export function queryParameters<T extends object>(options?: Options<T>): Writable<LooseAutocomplete<T>> {
    const { set: _set, subscribe, update } = writable<LooseAutocomplete<T>>();
    const setRef: { value: Writable<T>["set"]; } = { value: noop };
    const unsubPage = page.subscribe(($page) => {
        _set(mixSearchAndOptions($page?.url?.searchParams, options));
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

export function queryParam<T = string>(name: string, { encode: encode = DEFAULT_ENCODER_DECODER.encode, decode: decode = DEFAULT_ENCODER_DECODER.decode }: EncodeAndDecodeOptions<T> = DEFAULT_ENCODER_DECODER): Writable<T | null> {
    const { set: _set, subscribe, update } = writable<T | null>();
    const setRef: { value: Writable<T | null>["set"]; } = { value: noop };
    const unsubPage = page.subscribe(($page) => {
        _set(decode($page?.url?.searchParams?.get?.(name)));
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
