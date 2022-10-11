/* eslint-disable @typescript-eslint/no-explicit-any */
import { writable, type Writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

export type EncodeAndDecodeOptions<T = any> = {
    encode: (value: T) => string;
    decode: (value: string) => T;
};

type LooseAutocomplete<T> = {
    [K in keyof T]: any;
} & {
    [K: string]: any;
};

type Options = {
    [key: string]: EncodeAndDecodeOptions,
};

function mixSearchAndOptions<T extends Options>(searchParams: URLSearchParams, options: T): LooseAutocomplete<T> {
    const uniqueKeys = Array.from(
        new Set(Array.from(searchParams?.keys?.() || []).concat(Object.keys(options)))
    );
    return Object.fromEntries(
        uniqueKeys.map((key) => {
            let fnToCall: EncodeAndDecodeOptions['decode'] = (value) => value;
            if (typeof options?.[key]?.decode === 'function') {
                fnToCall = options[key].decode;
            }
            const value = searchParams?.get(key) ?? '';
            return [key, fnToCall(value)];
        })
    ) as unknown as LooseAutocomplete<T>;
}

export const ssp: Record<'object' | 'number' | 'boolean', () => EncodeAndDecodeOptions> = {
    object: () => ({
        encode: JSON.stringify,
        decode: JSON.parse
    }),
    number: () => ({
        encode: Number.toString,
        decode: Number.parseInt
    }),
    boolean: () => ({
        encode: Boolean.toString,
        decode: Boolean
    })
};

export function createSearchParamsStore<T extends Options>(options: T): Writable<LooseAutocomplete<T>> {
    const { set, subscribe, update } = writable<LooseAutocomplete<T>>();
    page.subscribe(($page) => {
        set(
            new Proxy<LooseAutocomplete<T>>(mixSearchAndOptions($page?.url?.searchParams, options), {
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
