<script lang="ts">
	import { onDestroy } from 'svelte';
	import { queryParam, ssp } from 'sveltekit-search-params';

	const param1 = queryParam('param1', ssp.string());
	const param2 = queryParam('param2', ssp.string());

	const unsubscribe = param1.subscribe(() => {
		param2.set('updated param2');
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<button
	data-testid="update-params"
	on:click={() => ($param1 = 'updated param1')}>Update params</button
>
