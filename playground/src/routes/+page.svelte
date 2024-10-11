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
	const base64 = queryParam('base64', ssp.base64());

	let obj_changes = 0;
	let arr_changes = 0;
	let lz_changes = 0;
	let base64_changes = 0;

	$: {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$obj;
		obj_changes++;
	}

	$: {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$arr;
		arr_changes++;
	}
	$: {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$lz;
		lz_changes++;
	}
	$: {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$base64;
		base64_changes++;
	}
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

<input data-testid="base64-input" bind:value={$base64} />
<div data-testid="base64">{$base64}</div>

<button
	data-testid="change-two"
	on:click={() => {
		$str = 'one';
		$num = 42;
	}}>Change two</button
>

<p data-testid="how-many-obj-changes">{obj_changes}</p>
<p data-testid="how-many-arr-changes">{arr_changes}</p>
<p data-testid="how-many-lz-changes">{lz_changes}</p>
<p data-testid="how-many-base64-changes">{base64_changes}</p>
