import type { EncodeAndDecodeOptions } from '$lib/types';

export function primitiveEncodeAndDecodeOptions<T>({
	encode,
	decode,
}: {
	encode: (value: T) => string | undefined;
	decode: (value: string | null) => T | null;
}) {
	function ssp(
		defaultValue: T,
	): EncodeAndDecodeOptions<T> & { defaultValue: T };
	function ssp(): EncodeAndDecodeOptions<T> & { defaultValue: undefined };
	function ssp(defaultValue?: T): EncodeAndDecodeOptions<T> {
		return { encode, decode, defaultValue };
	}
	return ssp;
}
