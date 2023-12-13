<script lang="ts">
	import { queryParameters, ssp } from 'sveltekit-search-params';

	const store = queryParameters({
		str: true,
		num: ssp.number(),
		bools: ssp.boolean(),
		obj: ssp.object<{ str: string }>(),
		arr: ssp.array<number>(),
		lz: ssp.lz<string>(),
	});
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

<input data-testid="lz-input" bind:value={$store.lz} />
<div data-testid="lz">{$store.lz}</div>

<button
	data-testid="change-two"
	on:click={() => {
		$store.str = 'one';
		$store.num = 42;
	}}>Change two</button
>
