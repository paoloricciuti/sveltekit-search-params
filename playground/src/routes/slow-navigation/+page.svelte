<svelte:options runes />

<script lang="ts">
	import { queryParameters, ssp } from 'sveltekit-search-params';

	const store = queryParameters({ str: true, num: ssp.number() });
</script>

<input data-testid="str-input" bind:value={store.str} />
<div data-testid="str">{store.str}</div>
<button data-testid="num-input" onclick={() => (store.num = 1)}>Set num</button>
<div data-testid="num">{store.num}</div>
