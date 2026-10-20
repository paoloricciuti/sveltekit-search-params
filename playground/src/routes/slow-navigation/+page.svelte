<svelte:options runes />

<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';

	const store = queryParameters({ str: true });
</script>

<input data-testid="str-input" bind:value={store.str} />
<div data-testid="str">{store.str}</div>
