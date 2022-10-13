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
        encode: (value: any[]) => JSON.stringify(value),
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
        encode: (value: any) =>
            compressToEncodedURIComponent(JSON.stringify(value)),
        decode: (value: string | null) => {
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

export function queryParameters<T extends Options>(options?: T): Writable<LooseAutocomplete<T>> {
    const { set: _set, subscribe, update } = writable<LooseAutocomplete<T>>();
    const setRef: { value: Writable<T>["set"]; } = { value: noop };
    page.subscribe(($page) => {
        _set(mixSearchAndOptions($page?.url?.searchParams, options));
        setRef.value = (value) => {
            const query = new URLSearchParams($page.url.searchParams);
            for (const field of Object.keys(value)) {
                if (!value[field] == undefined) continue;
                let fnToCall: EncodeAndDecodeOptions['encode'] = (value) => value.toString();
                const optionsKey = options?.[field as string];
                if (typeof optionsKey !== "boolean" && typeof optionsKey?.encode === 'function') {
                    fnToCall = optionsKey.encode;
                }
                query.set(field as string, fnToCall(value[field]));
            }
            goto(`?${query}`, {
                keepfocus: true,
                noscroll: true
            });
        };
    });
    return {
        set: (value) => {
            setRef.value(value);
        },
        subscribe,
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
    page.subscribe(($page) => {
        _set(decode($page?.url?.searchParams?.get?.(name)));
        setRef.value = (value) => {
            const query = new URLSearchParams($page.url.searchParams);
            if (value === null) {
                query.delete(name);
            } else {
                query.set(name, encode(value));
            }
            goto(`?${query}`, {
                keepfocus: true,
                noscroll: true
            });
        };
    });
    return {
        set: (value) => {
            setRef.value(value);
        },
        subscribe,
        update
    };
}
