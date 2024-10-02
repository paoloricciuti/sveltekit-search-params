import type { EncodeAndDecodeOptions } from '$lib/types';

function objectEncodeAndDecodeOptions<T extends object = any>(
	defaultValue: T,
): EncodeAndDecodeOptions<T> & { defaultValue: T };
function objectEncodeAndDecodeOptions<
	T extends object = any,
>(): EncodeAndDecodeOptions<T> & { defaultValue: undefined };
function objectEncodeAndDecodeOptions<T extends object = any>(
	defaultValue?: T,
): EncodeAndDecodeOptions<T> {
	return {
		encode: (value: T) => JSON.stringify(value),
		decode: (value: string | null): T | null => {
			if (value === null) return null;
			try {
				return JSON.parse(value);
			} catch {
				return null;
			}
		},
		defaultValue,
	};
}

function arrayEncodeAndDecodeOptions<T = any>(
	defaultValue: T[],
): EncodeAndDecodeOptions<T[]> & { defaultValue: T[] };
function arrayEncodeAndDecodeOptions<T = any>(): EncodeAndDecodeOptions<T[]> & {
	defaultValue: undefined;
};
function arrayEncodeAndDecodeOptions<T = any>(
	defaultValue?: T[],
): EncodeAndDecodeOptions<T[]> {
	return {
		encode: (value: T[]) => JSON.stringify(value),
		decode: (value: string | null): T[] | null => {
			if (value === null) return null;
			try {
				return JSON.parse(value);
			} catch {
				return null;
			}
		},
		defaultValue,
	};
}

export { objectEncodeAndDecodeOptions, arrayEncodeAndDecodeOptions };
