<script lang="ts">
	import { queryParam, ssp } from 'sveltekit-search-params';

	const str = queryParam('str');
	const num = queryParam('num', ssp.number());
	const bools = queryParam('bools', ssp.boolean());
</script>

<input data-testid="str-input" bind:value={$str} />
<div data-testid="str">{$str}</div>

<button data-testid="num" on:click={()=>{
	if($num!=undefined){
		$num++;
	}
}}>{$num}</button>

<input data-testid="bools" type="checkbox" bind:checked={$bools} />