<script lang="ts">
	import { queryParam, ssp } from 'sveltekit-search-params';

	const str = queryParam('str');
	const num = queryParam('num', ssp.number());
	const bools = queryParam('bools', ssp.boolean());
	const obj = queryParam('obj', ssp.object<{ str: string }>());
	const arr = queryParam('arr', ssp.array<number>());
	const arr_unordered = queryParam('arr-unordered', ssp.array<number>(), {
		sort: false,
	});
	const lz = queryParam('lz', ssp.lz<string>());
</script>

<input data-testid="str-input" bind:value={$str} />
<div data-testid="str">{$str}</div>

<button
	data-testid="num"
	on:click={() => {
		if ($num != undefined) {
			$num++;
		}
	}}>{$num}</button
>

<input data-testid="bools" type="checkbox" bind:checked={$bools} />

{#if $obj}
	<input data-testid="obj-input" bind:value={$obj.str} />
	<div data-testid="obj">{JSON.stringify($obj)}</div>
{/if}

<button
	on:click={() => {
		if (!$arr) {
			$arr = [];
		}
		$arr.push($arr.length);
		$arr = $arr;
	}}
	data-testid="arr-input">Add array</button
>
<ul>
	{#each $arr ?? [] as num}
		<li data-testid="arr">{num}</li>
	{/each}
</ul>

<button
	on:click={() => {
		if (!$arr_unordered) {
			$arr_unordered = [];
		}
		$arr_unordered.push($arr_unordered.length);
		$arr_unordered = $arr_unordered;
	}}
	data-testid="arr-unordered-input">Add unordered array</button
>
<ul>
	{#each $arr_unordered ?? [] as num}
		<li data-testid="arr-unordered">{num}</li>
	{/each}
</ul>

<input data-testid="lz-input" bind:value={$lz} />
<div data-testid="lz">{$lz}</div>

<button
	data-testid="change-two"
	on:click={() => {
		$str = 'one';
		$num = 42;
	}}>Change two</button
>
