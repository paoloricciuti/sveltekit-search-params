<script lang="ts">
	import { queryParam, queryParameters, ssp } from 'sveltekit-search-params';
	const str = queryParam('str', ssp.string(), {
		debounceHistory: 1000,
	});

	const params = queryParameters(
		{
			str2: true,
			num: ssp.number(0),
		},
		{ debounceHistory: 1000 },
	);
</script>

<input data-testid="str-input" bind:value={$str} />
<div data-testid="str">{$str}</div>

<input data-testid="str2-input" bind:value={$params.str2} />
<div data-testid="str2">{$params.str2}</div>

<button
	data-testid="num"
	on:click={() => {
		$params.num++;
	}}>{$params.num}</button
>

<button
	data-testid="change-both"
	on:click={() => {
		$params.num++;
		$params.str2 = 'changed';
	}}>change both</button
>
