import type { EncodeAndDecodeOptions } from '$lib/types';
import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from './lz-string';

export function lzEncodeAndDecodeOptions<T = any>(
	defaultValue: T,
): EncodeAndDecodeOptions<T> & { defaultValue: T };
export function lzEncodeAndDecodeOptions<
	T = any,
>(): EncodeAndDecodeOptions<T> & {
	defaultValue: undefined;
};
export function lzEncodeAndDecodeOptions<T = any>(
	defaultValue?: T,
): EncodeAndDecodeOptions<T> {
	return {
		encode: (value: T) =>
			compressToEncodedURIComponent(JSON.stringify(value)),
		decode: (value: string | null): T | null => {
			if (!value) return null;
			try {
				return JSON.parse(
					decompressFromEncodedURIComponent(value) ?? '',
				);
			} catch {
				return null;
			}
		},
		defaultValue,
	};
}
