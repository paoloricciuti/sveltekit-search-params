/* eslint-disable @typescript-eslint/no-explicit-any */
import { writable, type Writable } from 'svelte/store';
import { goto } from '../@sveltejs/kit/src/runtime/app/navigation.js';
import { page } from '../@sveltejs/kit/src/runtime/app/stores.js';
import {
    compressToEncodedURIComponent,
    decompressFromEncodedURIComponent,
} from "lz-string";

export type EncodeAndDecodeOptions<T = any> = {
    encode: (value: T) => string;
    decode: (value: string | null) => T;
};

type LooseAutocomplete<T> = {
    [K in keyof T]: any;
} & {
    [K: string]: any;
};

type Options = {
    [key: string]: EncodeAndDecodeOptions,
};

type ReturnValues<T extends Options> = {
    [K in keyof T]: ReturnType<T[K]['decode']>
};

function mixSearchAndOptions<T extends Options>(searchParams: URLSearchParams, options?: T): LooseAutocomplete<T> {
    const uniqueKeys = Array.from(
        new Set(Array.from(searchParams?.keys?.() || []).concat(Object.keys(options ?? {})))
    );
    return Object.fromEntries(
        uniqueKeys.map((key) => {
            let fnToCall: EncodeAndDecodeOptions['decode'] = (value) => value;
            if (typeof options?.[key]?.decode === 'function') {
                fnToCall = options[key].decode;
            }
            const value = searchParams?.get(key);
            return [key, fnToCall(value)];
        })
    ) as unknown as LooseAutocomplete<T>;
}

export const ssp = {
    object: () => ({
        encode: (value: object) => JSON.stringify(value),
        decode: (value: string | null) => {
            if (value === null) return null;
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        },
    }),
    array: () => ({
        encode: (value: object) => JSON.stringify(value),
        decode: (value: string | null) => {
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
        decode: (value: string | null) => value ? parseInt(value) : null,
    }),
    boolean: () => ({
        encode: (value: boolean) => value + "",
        decode: (value: string | null) => value !== null && value !== "false"
    }),
    string: () => ({
        encode: (value: string | null) => value ?? "",
        decode: (value: string | null) => value,
    }),
    lz: () => ({
        encode: (value: object) =>
            compressToEncodedURIComponent(JSON.stringify(value)),
        decode: (value: string | null) =>
            !value
                ? null
                : JSON.parse(
                    decompressFromEncodedURIComponent(value) ?? ""
                ),
    }),
};

export function createSearchParamsStore<T extends Options>(options?: T): Writable<ReturnValues<LooseAutocomplete<T>>> {
    const { set, subscribe, update } = writable<LooseAutocomplete<T>>();
    page.subscribe(($page) => {
        set(
            new Proxy<ReturnValues<LooseAutocomplete<T>>>(mixSearchAndOptions($page?.url?.searchParams, options), {
                set: (_, field, value) => {
                    const query = new URLSearchParams($page.url.searchParams);
                    let fnToCall: EncodeAndDecodeOptions['encode'] = (value) => value.toString();
                    if (typeof options?.[field as string]?.encode === 'function') {
                        fnToCall = options[field as string].encode;
                    }
                    query.set(field as string, fnToCall(value));
                    goto(`?${query}`, {
                        keepfocus: true,
                        noscroll: true
                    });
                    return true;
                }
            })
        );
    });
    return {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        set: () => { },
        subscribe,
        update
    };
}
