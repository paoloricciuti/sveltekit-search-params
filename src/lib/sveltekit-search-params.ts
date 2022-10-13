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
function noop<T>(value: LooseAutocomplete<T>) { }

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
    [key: string]: EncodeAndDecodeOptions | boolean,
};

function mixSearchAndOptions<T extends Options>(searchParams: URLSearchParams, options?: T): LooseAutocomplete<T> {
    const uniqueKeys = Array.from(
        new Set(Array.from(searchParams?.keys?.() || []).concat(Object.keys(options ?? {})))
    );
    return Object.fromEntries(
        uniqueKeys.map((key) => {
            let fnToCall: EncodeAndDecodeOptions['decode'] = (value) => value;
            const optionsKey = options?.[key];
            if (typeof optionsKey !== "boolean" && typeof optionsKey?.decode === 'function') {
                fnToCall = optionsKey.decode;
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

export function createSearchParamsStore<T extends Options>(options?: T): Writable<LooseAutocomplete<T>> {
    const { set: _set, subscribe, update } = writable<LooseAutocomplete<T>>();
    const setRef = { value: noop };
    page.subscribe(($page) => {
        _set(mixSearchAndOptions($page?.url?.searchParams, options));
        setRef.value = (value) => {
            const query = new URLSearchParams($page.url.searchParams);
            let fnToCall: EncodeAndDecodeOptions['encode'] = (value) => value.toString();
            for (const field of Object.keys(value)) {
                const optionsKey = options?.[field as string];
                if (typeof optionsKey !== "boolean" && typeof optionsKey?.encode === 'function') {
                    fnToCall = optionsKey.encode;
                }
                query.set(field as string, fnToCall(value));
                goto(`?${query}`, {
                    keepfocus: true,
                    noscroll: true
                });
            }
        };
    });
    return {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        set: (value) => {
            setRef.value(value);
        },
        subscribe,
        update
    };
}
