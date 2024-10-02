<script lang="ts">
	import { queryParameters, ssp } from 'sveltekit-search-params';

	const store = queryParameters({
		str: true,
		num: ssp.number(),
		bools: ssp.boolean(),
		obj: ssp.object<{ str: string }>(),
		arr: ssp.array<number>(),
		lz: ssp.lz<string>(),
		base64: ssp.base64(),
	});

	const unordered_store = queryParameters(
		{
			'arr-unordered': ssp.array<number>(),
		},
		{
			sort: false,
		},
	);

	let change_in_store = 0;

	$: {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$store;
		change_in_store++;
	}
</script>

<input data-testid="str-input" bind:value={$store.str} />
<div data-testid="str">{$store.str}</div>

<button
	data-testid="num"
	on:click={() => {
		if ($store.num != undefined) {
			$store.num++;
		}
	}}>{$store.num}</button
>

<input data-testid="bools" type="checkbox" bind:checked={$store.bools} />

{#if $store.obj}
	<input data-testid="obj-input" bind:value={$store.obj.str} />
	<div data-testid="obj">{JSON.stringify($store.obj)}</div>
{/if}

<button
	on:click={() => {
		if (!$store.arr) {
			$store.arr = [];
		}
		$store.arr.push($store.arr.length);
		$store.arr = $store.arr;
	}}
	data-testid="arr-input">Add array</button
>
<ul>
	{#each $store.arr ?? [] as num}
		<li data-testid="arr">{num}</li>
	{/each}
</ul>

<button
	on:click={() => {
		if (!$unordered_store['arr-unordered']) {
			$unordered_store['arr-unordered'] = [];
		}
		$unordered_store['arr-unordered'].push(
			$unordered_store['arr-unordered'].length,
		);
		$unordered_store['arr-unordered'] = $unordered_store['arr-unordered'];
	}}
	data-testid="arr-unordered-input">Add unordered array</button
>
<ul>
	{#each $unordered_store['arr-unordered'] ?? [] as num}
		<li data-testid="arr-unordered">{num}</li>
	{/each}
</ul>

<input data-testid="lz-input" bind:value={$store.lz} />
<div data-testid="lz">{$store.lz}</div>

<input data-testid="base64-input" bind:value={$store.base64} />
<div data-testid="base64">{$store.base64}</div>

<button
	data-testid="change-two"
	on:click={() => {
		$store.str = 'one';
		$store.num = 42;
	}}>Change two</button
>

<p data-testid="how-many-store-changes">{change_in_store}</p>
