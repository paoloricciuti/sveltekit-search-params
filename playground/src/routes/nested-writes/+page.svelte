<svelte:options runes />

<script module lang="ts">
	const default_nested = {
		inner: { str: '' },
		items: [{ id: 1 }, { id: 2 }, { id: 3 }],
	};
	const frozen_default = Object.freeze({
		inner: Object.freeze({ str: 'frozen' }),
	});
</script>

<script lang="ts">
	import { queryParameters, ssp } from 'sveltekit-search-params';

	const params = queryParameters({
		nested: ssp.object<typeof default_nested>(default_nested),
		frozen: ssp.object<typeof frozen_default>(frozen_default),
	});

	let default_after_write = $state('');
</script>

<input data-testid="nested-input" bind:value={params.nested.inner.str} />
<div data-testid="nested">{JSON.stringify(params.nested)}</div>

{#each params.nested.items as item (item)}
	<button
		data-testid="remove-{item.id}"
		onclick={() => {
			params.nested.items.splice(params.nested.items.indexOf(item), 1);
			default_after_write = JSON.stringify(default_nested);
		}}>Remove {item.id}</button
	>
{/each}
<button
	data-testid="add"
	onclick={() => {
		params.nested.items.push({ id: 4 });
		default_after_write = JSON.stringify(default_nested);
	}}>Add</button
>
<div data-testid="default-after-write">{default_after_write}</div>
<div data-testid="frozen">{params.frozen.inner.str}</div>
