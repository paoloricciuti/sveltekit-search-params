<script lang="ts">
	import { queryParam, ssp } from 'sveltekit-search-params';

	const obj = queryParam('obj', ssp.object({ test: '' }));
</script>

<a href="/default/obj">reset</a>

{#if $obj}
	<input bind:value={$obj.test} />
{/if}
