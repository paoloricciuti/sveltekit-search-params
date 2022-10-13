# sveltekit-search-params

The fastest way to read **AND WRITE** from query search params in [sveltekit](https://github.com/sveltejs/kit).

> **Warning**
>
> This package is meant to be used with Svelte-Kit as the name suggest. Because it uses api that are **only** present in Svelte-Kit it will not work in your normal svelte project.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

![npm bundle size](https://img.shields.io/bundlephobia/minzip/sveltekit-search-params)

![npm](https://img.shields.io/npm/v/sveltekit-search-params)

![npm](https://img.shields.io/npm/dt/sveltekit-search-params)

![GitHub last commit](https://img.shields.io/github/last-commit/paoloricciuti/sveltekit-search-params)

## Contributing

Contributions are always welcome!

For the moment there's no code of conduct neither a contributing guideline but if you found a problem or have an idea feel free to [open an issue](https://github.com/paoloricciuti/sveltekit-search-params/issues/new)

If you want the fastest way to open a PR try out Codeflow

[![Open in Codeflow](https://developer.stackblitz.com/img/open_in_codeflow.svg)](https://pr.new/paoloricciuti/sveltekit-search-params/)

## Authors

- [@paoloricciuti](https://www.github.com/paoloricciuti)

## Installation

Install sveltekit-search-params with npm

```bash
  npm install sveltekit-search-params@latest -D
```

## Usage/Examples

Once installed in your Svelte-Kit project you need to update your `vite.config.ts` or `vite.config.js` file to include the plugin exported from `sveltekit-search-params/plugin`. It's as simple as

```javascript
import { sveltekit } from "@sveltejs/kit/vite";
import { ssp } from "sveltekit-search-params/plugin";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [ssp(), sveltekit()],
};

export default config;
```

> **Warning**
>
> This step it's very important, if you don't use this plugin your entire app will break.

After that you can start using `sveltekit-search-params`,

### Simple case

You can use this package to get an object containing all the present search params.

```svelte
<script lang="ts">
    import { createSearchParamsStore } from "sveltekit-search-params";

    const store = createSearchParamsStore();
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

### Writing to the store

Reading query parameters is cool but you know what is even cooler? Writing query parameters! With this library you can treat your store just like normal state in svelte. To update the state and conseguentely the url you can just do this

```svelte
<script lang="ts">
    import { createSearchParamsStore } from "sveltekit-search-params";

    const store = createSearchParamsStore();
</script>

<pre>
    {JSON.stringify($store, null, 2)}
</pre>
<input value={$store.username} on:input={(e)=>{
    $store.username = e.target.value;
}} />
```

writing in the input will update the state and the URL at the same time.

> **Note**
>
> one small caveat is that you can't bind but you have to do things manually. Also if you use the store in other reactive contexts keep in mind that it's the whole store that changes and not just the field you are changing)

### Expecting some parameters

Most of the times if you need to read from query parameters you are expecting some parameters to be present. You can define the parameters you are expecting during the store creating and those will be merged with the actual query parameters despite the fact that they are present or not.

```svelte
<script lang="ts">
    import { createSearchParamsStore } from "sveltekit-search-params";

    const store = createSearchParamsStore({
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

More often than not tho we are not working with strings. We are dealing with numbers, boolean, arrays and complex abjects. During the creation of the store you can specify an object containing an encode and a decode property that will be used to transform your data from and to the type you need.

```svelte
<script lang="ts">
    import { createSearchParamsStore } from "sveltekit-search-params";

    const store = createSearchParamsStore({
        username: true,
        isCool: {
            encode: (booleanValue) => booleanValue.toString(),
            decode: (stringValue) => stringValue !== null && stringValue !== "false",
        }
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

the deconding function it's what's used to update the url when you write to the store.

### Helpers encodings and decodings

Write an encode and decode function may seem trivial but it's tedious for sure. `sveltekit-search-params` provide with a set of helpers for better readability and to avoid the hassle of writing common transforms. You can find those helpers exported in a ssp variable from the same package.

```svelte
<script lang="ts">
    import { ssp, createSearchParamsStore } from "sveltekit-search-params";

    const store = createSearchParamsStore({
        username: true,
        isCool: ssp.boolean(),
    });
</script>

<pre>
    {JSON.stringify($store, null, 2)}
</pre>
```

this code will produce the same output as the code written above but far more readable and easier to read.

There are six helpers all exported as functions on the object ssp.

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
