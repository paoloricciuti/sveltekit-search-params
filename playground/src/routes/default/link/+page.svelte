<svelte:options runes />

<script module lang="ts">
	const default_obj = { inner: { str: '' } };
</script>

<script lang="ts">
	import { ssp, queryParameters } from 'sveltekit-search-params';

	const store = queryParameters(
		{
			str: ssp.string('default'),
			obj: ssp.object<{ inner: { str: string } }>(default_obj),
		},
		{ showDefaults: false },
	);

	let default_after_write = $state('');
</script>

<span data-testid="str">{store.str}</span>
<a data-testid="link" href="?str=from-link">Link</a>
<a data-testid="reset" href="?">Reset</a>

<button
	data-testid="deep-write"
	onclick={() => {
		store.obj.inner.str = 'changed';
		default_after_write = JSON.stringify(default_obj);
	}}>Write deep</button
>
<span data-testid="default-after-write">{default_after_write}</span>
