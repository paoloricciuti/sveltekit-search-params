<script lang="ts">
	import { queryParameters, ssp } from 'sveltekit-search-params';

	const obj = queryParameters({ obj: ssp.object({ test: '' }) });
</script>

<a href="/default/parameters-obj">reset</a>

{#if $obj.obj}
	<input bind:value={$obj.obj.test} />
{/if}
