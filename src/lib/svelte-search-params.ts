/* eslint-disable @typescript-eslint/no-explicit-any */
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

export type EncodeAndDecodeOptions<T = any> = {
    encode: (value: T) => string;
    decode: (value: string) => T;
};

type Options = Record<string, EncodeAndDecodeOptions>;

function mixSearchAndOptions(searchParams: URLSearchParams, options: Options) {
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
    );
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

export function createSearchParamsStore<T extends Options>(options: T) {
    const { set, subscribe, update } = writable<Record<string & Omit<keyof T, string>, any>>();
    page.subscribe(($page) => {
        set(
            new Proxy<Record<string & Omit<keyof T, string>, any>>(mixSearchAndOptions($page?.url?.searchParams, options), {
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
