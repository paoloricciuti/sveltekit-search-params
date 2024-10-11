import { sspBase64 } from './base64';
import {
	arrayEncodeAndDecodeOptions,
	objectEncodeAndDecodeOptions,
} from './json-encode';
import { lzEncodeAndDecodeOptions } from './lz-encode';
import { primitiveEncodeAndDecodeOptions } from './util';

export default {
	number: primitiveEncodeAndDecodeOptions({
		encode: (value: number) => value.toString(),
		decode: (value: string | null) => (value ? parseFloat(value) : null),
	}),
	boolean: primitiveEncodeAndDecodeOptions({
		encode: (value: boolean) => value + '',
		decode: (value: string | null) => value !== null && value !== 'false',
	}),
	string: primitiveEncodeAndDecodeOptions({
		encode: (value: string | null) => value ?? '',
		decode: (value: string | null) => value,
	}),
	object: objectEncodeAndDecodeOptions,
	array: arrayEncodeAndDecodeOptions,
	lz: lzEncodeAndDecodeOptions,
	base64: sspBase64,
} as const;
