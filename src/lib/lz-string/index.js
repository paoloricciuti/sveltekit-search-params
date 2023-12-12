// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let f = String.fromCharCode,
	keyStrUriSafe =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$',
	baseReverseDic = {};
function getBaseValue(o, e) {
	if (!baseReverseDic[o]) {
		baseReverseDic[o] = {};
		for (let r = 0; r < o.length; r++) baseReverseDic[o][o.charAt(r)] = r;
	}
	return baseReverseDic[o][e];
}
function compressToEncodedURIComponent(o) {
	return null == o
		? ''
		: _compress(o, 6, function (o) {
				return keyStrUriSafe.charAt(o);
			});
}
function decompressFromEncodedURIComponent(o) {
	return null == o
		? ''
		: '' == o
			? null
			: _decompress((o = o.replace(/ /g, '+')).length, 32, function (e) {
					return getBaseValue(keyStrUriSafe, o.charAt(e));
				});
}
function _compress(o, e, r) {
	if (null == o) return '';
	let i,
		t,
		s = {},
		n = {},
		$ = '',
		_ = '',
		p = '',
		a = 2,
		l = 3,
		c = 2,
		u = [],
		h = 0,
		d = 0,
		v;
	for (v = 0; v < o.length; v += 1)
		if (
			(($ = o.charAt(v)),
			Object.prototype.hasOwnProperty.call(s, $) ||
				((s[$] = l++), (n[$] = !0)),
			(_ = p + $),
			Object.prototype.hasOwnProperty.call(s, _))
		)
			p = _;
		else {
			if (Object.prototype.hasOwnProperty.call(n, p)) {
				if (256 > p.charCodeAt(0)) {
					for (i = 0; i < c; i++)
						(h <<= 1),
							d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++;
					for (i = 0, t = p.charCodeAt(0); i < 8; i++)
						(h = (h << 1) | (1 & t)),
							d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
							(t >>= 1);
				} else {
					for (i = 0, t = 1; i < c; i++)
						(h = (h << 1) | t),
							d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
							(t = 0);
					for (i = 0, t = p.charCodeAt(0); i < 16; i++)
						(h = (h << 1) | (1 & t)),
							d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
							(t >>= 1);
				}
				0 == --a && ((a = Math.pow(2, c)), c++), delete n[p];
			} else
				for (i = 0, t = s[p]; i < c; i++)
					(h = (h << 1) | (1 & t)),
						d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
						(t >>= 1);
			0 == --a && ((a = Math.pow(2, c)), c++),
				(s[_] = l++),
				(p = String($));
		}
	if ('' !== p) {
		if (Object.prototype.hasOwnProperty.call(n, p)) {
			if (256 > p.charCodeAt(0)) {
				for (i = 0; i < c; i++)
					(h <<= 1),
						d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++;
				for (i = 0, t = p.charCodeAt(0); i < 8; i++)
					(h = (h << 1) | (1 & t)),
						d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
						(t >>= 1);
			} else {
				for (i = 0, t = 1; i < c; i++)
					(h = (h << 1) | t),
						d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
						(t = 0);
				for (i = 0, t = p.charCodeAt(0); i < 16; i++)
					(h = (h << 1) | (1 & t)),
						d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
						(t >>= 1);
			}
			0 == --a && ((a = Math.pow(2, c)), c++), delete n[p];
		} else
			for (i = 0, t = s[p]; i < c; i++)
				(h = (h << 1) | (1 & t)),
					d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
					(t >>= 1);
		0 == --a && ((a = Math.pow(2, c)), c++);
	}
	for (i = 0, t = 2; i < c; i++)
		(h = (h << 1) | (1 & t)),
			d == e - 1 ? ((d = 0), u.push(r(h)), (h = 0)) : d++,
			(t >>= 1);
	for (;;) {
		if (((h <<= 1), d == e - 1)) {
			u.push(r(h));
			break;
		}
		d++;
	}
	return u.join('');
}
function _decompress(o, e, r) {
	let i = [],
		t,
		s = 4,
		n = 4,
		$ = 3,
		_ = '',
		p = [],
		a,
		l,
		c,
		u,
		h,
		d,
		v,
		m = { val: r(0), position: e, index: 1 };
	for (a = 0; a < 3; a += 1) i[a] = a;
	for (c = 0, h = 4, d = 1; d != h; )
		(u = m.val & m.position),
			(m.position >>= 1),
			0 == m.position && ((m.position = e), (m.val = r(m.index++))),
			(c |= (u > 0 ? 1 : 0) * d),
			(d <<= 1);
	switch ((t = c)) {
		case 0:
			for (c = 0, h = 256, d = 1; d != h; )
				(u = m.val & m.position),
					(m.position >>= 1),
					0 == m.position &&
						((m.position = e), (m.val = r(m.index++))),
					(c |= (u > 0 ? 1 : 0) * d),
					(d <<= 1);
			v = f(c);
			break;
		case 1:
			for (c = 0, h = 65536, d = 1; d != h; )
				(u = m.val & m.position),
					(m.position >>= 1),
					0 == m.position &&
						((m.position = e), (m.val = r(m.index++))),
					(c |= (u > 0 ? 1 : 0) * d),
					(d <<= 1);
			v = f(c);
			break;
		case 2:
			return '';
	}
	for (i[3] = v, l = v, p.push(v); ; ) {
		if (m.index > o) return '';
		for (c = 0, h = Math.pow(2, $), d = 1; d != h; )
			(u = m.val & m.position),
				(m.position >>= 1),
				0 == m.position && ((m.position = e), (m.val = r(m.index++))),
				(c |= (u > 0 ? 1 : 0) * d),
				(d <<= 1);
		switch ((v = c)) {
			case 0:
				for (c = 0, h = 256, d = 1; d != h; )
					(u = m.val & m.position),
						(m.position >>= 1),
						0 == m.position &&
							((m.position = e), (m.val = r(m.index++))),
						(c |= (u > 0 ? 1 : 0) * d),
						(d <<= 1);
				(i[n++] = f(c)), (v = n - 1), s--;
				break;
			case 1:
				for (c = 0, h = 65536, d = 1; d != h; )
					(u = m.val & m.position),
						(m.position >>= 1),
						0 == m.position &&
							((m.position = e), (m.val = r(m.index++))),
						(c |= (u > 0 ? 1 : 0) * d),
						(d <<= 1);
				(i[n++] = f(c)), (v = n - 1), s--;
				break;
			case 2:
				return p.join('');
		}
		if ((0 == s && ((s = Math.pow(2, $)), $++), i[v])) _ = i[v];
		else {
			if (v !== n) return null;
			_ = l + l.charAt(0);
		}
		p.push(_),
			(i[n++] = l + _.charAt(0)),
			s--,
			(l = _),
			0 == s && ((s = Math.pow(2, $)), $++);
	}
}
export { compressToEncodedURIComponent, decompressFromEncodedURIComponent };
