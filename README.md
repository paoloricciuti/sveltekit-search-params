# sveltekit-search-params

The fastest way to read **AND WRITE** from query search params in [sveltekit](https://github.com/sveltejs/kit).

> **Warning**
>
> This package is meant to be used with Svelte-Kit as the name suggest. Because it uses api that are **only** present in Svelte-Kit it will not work in your normal svelte project.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

![npm](https://img.shields.io/npm/v/sveltekit-search-params)

![npm](https://img.shields.io/npm/dt/sveltekit-search-params)

![GitHub last commit](https://img.shields.io/github/last-commit/paoloricciuti/sveltekit-search-params)

## Contributing

Contributions are always welcome!

For the moment there's no code of conduct neither a contributing guideline but if you found a problem or have an idea feel free to [open an issue](https://github.com/paoloricciuti/sveltekit-search-params/issues/new)

If you want the fastest way to open a PR try out Codeflow

[![Open in Codeflow](https://developer.stackblitz.com/img/open_in_codeflow.svg)](https://pr.new/paoloricciuti/sveltekit-search-params/)

## Authors

-   [@paoloricciuti](https://www.github.com/paoloricciuti)

## Installation

Install sveltekit-search-params with npm

```bash
  npm install sveltekit-search-params@latest -D
```

## Usage/Examples

### Simple case (single parameter)

The simplest and most effective way to use this library is by importing the method `queryParam`. You can invoke this method with a string that represent the search parameters you are looking for in the URL.

```svelte
<script lang="ts">
	import { queryParam } from 'sveltekit-search-params';

	const username = queryParam('username');
</script>

Your username is {$username}
```

the function returns a store so make sure to use it with the `$` prepended to handle auto-subscriprion. In case there's not a query parameter with the chosen name it will simply be null.

### Writing to the store (single parameter)

Reading query parameters is cool but you know what is even cooler? Writing query parameters! With this library you can treat your store just like normal state in svelte. To update the state and conseguentely the url you can just do this

```svelte
<script lang="ts">
	import { queryParam } from 'sveltekit-search-params';

	const username = queryParam('username');
</script>

Your username is {$username}
<input bind:value={$username} />
```

or if you prefer

```svelte
<script lang="ts">
	import { queryParam } from 'sveltekit-search-params';

	const username = queryParam('username');
</script>

Your username is {$username}
<input
	value={$username}
	on:input={(e) => {
		$username = e.target.value;
	}}
/>
```

### Encoding and decoding

By default query parameters are strings but more often than not tho we are not working with strings. We are dealing with numbers, boolean, arrays and complex abjects. During the creation of the store you can specify an object containing an encode and a decode property that will be used to transform your data from and to the type you need.

```svelte
<script lang="ts">
	import { queryParam } from 'sveltekit-search-params';

	const count = queryParam('count', {
		encode: (value: number) => value.toString(),
		decode: (value: string | null) => (value ? parseInt(value) : null),
	});
</script>

The count is {$count}
<input bind:value={$count} type="number" />
```

this time $count would be of type number and the deconding function it's what's used to update the url when you write to the store.

### Default values

Sometimes when we want to create a new variable we like to pass a default value. You can do this by passing a third field, `defaultValue`, in the second argument of the query param object.

```svelte
<script lang="ts">
	import { queryParam } from 'sveltekit-search-params';

	const count = queryParam('count', {
		encode: (value: number) => value.toString(),
		decode: (value: string | null) => (value ? parseInt(value) : null),
		defaultValue: 10,
	});
</script>

The count is {$count}
<input bind:value={$count} type="number" />
```

this will make the query parameter change as soon as the page is rendered on the browser (the query parameter will change only if it's not already present and only the first time the application render).

> **Warning**
>
> You can't run `goto` on the server so if the page is server side rendered it will still have the null value (this is to say don't relay on the assumption that the store will always be not null).

### Helpers encodings and decodings

Write an encode and decode function may seem trivial but it's tedious for sure. `sveltekit-search-params` provide with a set of helpers for better readability and to avoid the hassle of writing common transforms. You can find those helpers exported in a ssp variable from the same package.

```svelte
<script lang="ts">
	import { ssp, queryParam } from 'sveltekit-search-params';

	const count = queryParam('count', ssp.number());
</script>

The count is {$count}
<input bind:value={$count} type="number" />
```

this code will produce the same output as the code written above but far more readable and easier to read. You can find all the exports documented in the section [ssp - Helpers](#ssp---helpers).

You can also pass a default value to the function that will be the defaultValue of the object.

```svelte
<script lang="ts">
	import { ssp, queryParam } from 'sveltekit-search-params';

	const count = queryParam('count', ssp.number(10));
</script>

The count is {$count}
<input bind:value={$count} type="number" />
```

### Simple case (all parameters)

You can use the function queryParameters to get an object containing all the present search params.

```svelte
<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';

	const store = queryParameters();
</script>

<pre>
    {JSON.stringify($store, null, 2)}
</pre>
```

assuming the page is `/?framework=svelte&isCool=true` the above code will show

```json
{
	"framework": "svelte",
	"isCool": "true"
}
```

by default all query parameters are string.

### Writing to the store (all parameters)

Just like with the single parameter case you can just update the store and the URL at the same time by doing this

```svelte
<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';

	const store = queryParameters();
</script>

<pre>
    {JSON.stringify($store, null, 2)}
</pre>
<input
	value={$store.username}
	on:input={(e) => {
		$store.username = e.target.value;
	}}
/>
```

writing in the input will update the state and the URL at the same time.

### Expecting some parameters

Most of the times if you need to read from query parameters you are expecting some parameters to be present. You can define the parameters you are expecting during the store creating and those will be merged with the actual query parameters despite the fact that they are present or not.

```svelte
<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';

	const store = queryParameters({
		username: true,
	});
</script>

<pre>
    {JSON.stringify($store, null, 2)}
</pre>
```

assuming the page is `/?framework=svelte&isCool=true` the above code will show

```json
{
	"framework": "svelte",
	"isCool": "true",
	"username": null
}
```

if we add username to the URL like this `/?framework=svelte&isCool=true&username=paoloricciuti` we will get

```json
{
	"framework": "svelte",
	"isCool": "true",
	"username": "paoloricciuti"
}
```

### Encoding and Decoding

The parameter passed to `queryParameters` can aslo be used to specify the encoding and decoding just like the `queryParam` method.

```svelte
<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';

	const store = queryParameters({
		username: true,
		isCool: {
			encode: (booleanValue) => booleanValue.toString(),
			decode: (stringValue) =>
				stringValue !== null && stringValue !== 'false',
			defaultValue: true,
		},
	});
</script>

<pre>
    {JSON.stringify($store, null, 2)}
</pre>
```

assuming the page is `/?framework=svelte&isCool=true&username=paoloricciuti` the above code will show

```json
{
	"framework": "svelte",
	"isCool": true,
	"username": null
}
```

notice that this time isCool it's a boolean and not a string anymore. With this particular transformation we've assured that if the url is the following `/?framework=svelte&isCool=false&username=paoloricciuti` or if the isCool parameter is completely missing like this `/?framework=svelte&username=paoloricciuti` we will get

```json
{
	"framework": "svelte",
	"isCool": false,
	"username": null
}
```

### Helpers encodings and decodings

Obviously also in this case you can use the helpers functions provided inside `ssp`.

```svelte
<script lang="ts">
	import { ssp, queryParameters } from 'sveltekit-search-params';

	const store = queryParameters({
		username: true,
		isCool: ssp.boolean(true),
	});
</script>

<pre>
    {JSON.stringify($store, null, 2)}
</pre>
```

## ssp - Helpers

There are six helpers all exported as functions on the object ssp. To each one of them you can pass a parameter that will be the default value for that query param.

#### object

To map from a query parameter to an object. An url like this `/?obj={"isComplex":%20true,%20"nested":%20{"field":%20"value"}}` will be mapped to

```typescript
$store.obj.isComplex; //true
$store.obj.nested; // {field: "value"}
$store.obj.nested.value; // "value"
```

#### array

To map from a query parameter to an array. An url like this `/?arr=[1,2,3,4]` will be mapped to

```typescript
$store.arr[0]; //1
$store.arr[1]; //2
$store.arr[2]; //3
$store.arr[3]; //4
```

#### number

To map from a query parameter to a number. An url like this `/?num=1` will be mapped to

```typescript
$store.num; //1
```

#### boolean

To map from a query parameter to a boolean. An url like this `/?bool=true` will be mapped to

```typescript
$store.bool; //true
```

as we've seen an url like this `/?bool=false` will be mapped to

```typescript
$store.bool; //false
```

just like an url like this `/`

#### string

This is exported mainly for readability since all query parameters are already strings.

#### lz

To map any JSON serializable state to his lz-string representation. This is a common way to store state in query parameters that will prevent the link to directly show the state.

An url like this `/?state=N4IgbghgNgrgpiAXCAsgTwAQGMD2OoYCO8ATpgA4QkQC2cALnCSAL5A` will map to

```typescript
$store.state.value; //My cool query parameter
```

## Store options

Both functions accept a configuration object that contains the following properties:

### debounceHistory

The number of milliseconds to delay the writing of the history when the state changes. This is to avoid cluttering the history of the user especially when a store is bound to an input text (every keystroke would cause a new history entry). It defaults to 0. If set a new entry in the history will be added only after `debounceHistory` seconds of "inactivity".

### pushHistory

A boolean defining if the history have to be written at all. If set to false no new history entries will be written to the history stack (the URL will still update but the user will not be able to go back with the browser).

### sort

Whenever you interact with a store, it navigates for you. By default the search params are sorted to allow for better cache-ability. You can disable this behavior by passing `false` to this option. Keep in mind that this is a per-store settings. This mean that if you interact with a store that has this option set to `false` and than interact with one that has this option set to `true` (the default) the resulting URL will still have the search params sorted.

### showDefaults

If you specify a default value for the search param and it's not present by default the library will immediately navigate to the url that contains the default search param. For example if you have this code

```svelte
<script lang="ts">
	import { queryParam, ssp } from 'sveltekit-search-params';

	const pageNum = queryParam('pageNum', ssp.number(0));
</script>
```

and you navigate to `/` as soon as the page load it will be redirected to `/?pageNum=0`. If you prefer not to show the defaults in the URL you can set the `showDefaults` option to false.

```svelte
<script lang="ts">
	import { queryParam, ssp } from 'sveltekit-search-params';

	const pageNum = queryParam('pageNum', ssp.number(0), {
		showDefaults: false,
	});
</script>
```

By doing so the store will still have a value of 0 if the search param is not present but the user will not be redirected to `/?pageNum=0`.

### equalityFn

While this is not a problem for primitive values if your store has a complex object or an array (or if you are using `queryParameters`) as a value even if the reference is the same svelte will trigger reactivity for it. To provide you with optimistic updates there's the possibility that the store will change multiple times during a single navigation. To fix this problem by default we check if the value of the store is the same by using `JSON.stringify` so that if the overall shape of your store is the same we avoid triggering the reactivity.

This is fine for most cases and you will likely never touch this option but if you have some use case not covered by `JSON.stringify` you can specify the option `equalityFn`. This option is a function that takes the `current` value and the `next` value as parameters and need to return a `boolean`. You should return `true` from this function when the value of the store is unchanged (according to your own logic). This will not trigger reactivity (note that the navigation will still happen).

For `queryParameters` the equality function applies to the entire store (so make sure to check that every query parameter is exactly the same before returning `true`).

```svelte
<script lang="ts">
	import { queryParam, ssp } from 'sveltekit-search-params';

	const pageNum = queryParam('pageNum', ssp.object<{ num: number }>(), {
		equalityFn(current, next) {
			return current?.num === next?.num;
		},
	});
</script>
```

NOTE: the equality function will not be used on primitive values, hence you can't pass the equality function to stores that have a primitive type.

### How to use it

To set the configuration object you can pass it as a third parameter in case of `queryParam` or the second in case of `queryParameters`.

```svelte
<script lang="ts">
	import { ssp, queryParameters, queryParam } from 'sveltekit-search-params';
	const name = queryParam('name', ssp.string(), {
		debounceHistory: 500, //a new history entry will be created after 500ms of this store not changing
	});
	const count = queryParam('count', ssp.number(), {
		debounceHistory: 1500, //a new history entry will be created after 1500ms of this store not changing
	});
	const store = queryParameters(
		{
			username: true,
			isCool: ssp.boolean(true),
		},
		{
			pushHistory: false, //no new history entries for this store
		},
	);
</script>
```

## Vite dependecies error

If you ran into issues with vite you need to update your `vite.config.ts` or `vite.config.js` file to include the plugin exported from `sveltekit-search-params/plugin`. It's as simple as

```javascript
import { sveltekit } from '@sveltejs/kit/vite';
import { ssp } from 'sveltekit-search-params/plugin';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [ssp(), sveltekit()],
};

export default config;
```

> **Warning**
>
> This step is required if you are running on an old version of vite/sveltekit
