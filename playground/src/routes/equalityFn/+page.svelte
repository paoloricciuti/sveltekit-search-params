<script lang="ts">
	import { queryParam, queryParameters, ssp } from 'sveltekit-search-params';
	const obj = queryParam('obj', ssp.object<{ str: string }>(), {
		equalityFn() {
			return false;
		},
	});

	let obj_changes = 0;
	$: {
		$obj;
		obj_changes++;
	}

	const params = queryParameters(
		{
			str2: true,
		},
		{
			equalityFn() {
				return false;
			},
		},
	);

	let store_changes = 0;
	$: {
		$params;
		store_changes++;
	}
</script>

{#if $obj}
	<input data-testid="str-input" bind:value={$obj.str} />
	<div data-testid="str">{$obj.str}</div>
{/if}
<input data-testid="str2-input" bind:value={$params.str2} />
<div data-testid="str2">{$params.str2}</div>

<p data-testid="how-many-obj-changes">{obj_changes}</p>
<p data-testid="how-many-store-changes">{store_changes}</p>
