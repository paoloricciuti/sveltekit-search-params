import type { EncodeAndDecodeOptions } from '$lib/types';

/**
 * Encodes and decodes a Unicode string as utf-8 Base64 URL safe.
 *
 * See: https://developer.mozilla.org/en-US/docs/Glossary/Base64
 */
function sspBase64(
	defaultValue: string,
): EncodeAndDecodeOptions<string> & { defaultValue: string };
function sspBase64(): EncodeAndDecodeOptions<string> & {
	defaultValue: undefined;
};
function sspBase64(defaultValue?: string): EncodeAndDecodeOptions<string> {
	return {
		encode: (value: string) => {
			if (value === '') return undefined;
			const bytes = new TextEncoder().encode(value);
			const binString = Array.from(bytes, (byte) =>
				String.fromCodePoint(byte),
			).join('');
			return btoa(binString)
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');
		},
		decode: (value: string | null) => {
			if (value === null) return '';
			const binString = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
			const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
			return new TextDecoder().decode(bytes);
		},
		defaultValue,
	};
}

export { sspBase64 };
