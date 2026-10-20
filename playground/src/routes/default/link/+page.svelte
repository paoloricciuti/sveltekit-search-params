<svelte:options runes />

<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ssp, queryParameters } from 'sveltekit-search-params';

	const default_obj = { inner: { str: '', arr: ['initial'] } };
	const default_arr = ['initial'];
	const store = queryParameters(
		{
			str: ssp.string('default'),
			obj: ssp.object(default_obj),
			arr: ssp.array(default_arr),
		},
		{ showDefaults: false },
	);

	let default_after_write = $state('');
	const linked_query = new URLSearchParams({
		str: 'from-link',
		obj: JSON.stringify({ inner: { str: 'linked', arr: ['linked'] } }),
		arr: JSON.stringify(['linked']),
	});
	const unrelated_query = $derived.by(() => {
		const query = new URLSearchParams(page.url.search);
		query.set('unrelated', '1');
		return query.toString();
	});
	function observe_defaults() {
		default_after_write = JSON.stringify({
			obj: default_obj,
			arr: default_arr,
		});
	}
</script>

<span data-testid="str">{store.str}</span>
<span data-testid="obj">{JSON.stringify(store.obj)}</span>
<span data-testid="arr">{JSON.stringify(store.arr)}</span>
<span data-testid="query">{page.url.search}</span>
<a data-testid="link" href={resolve(`/default/link?${linked_query}`)}>Link</a>
<a data-testid="reset" href={resolve('/default/link')}>Reset</a>
<a data-testid="unrelated" href={resolve(`/default/link?${unrelated_query}`)}
	>Unrelated query</a
>

<button
	data-testid="deep-write"
	onclick={() => {
		store.obj.inner.str = 'changed';
		observe_defaults();
	}}>Write deep</button
>
<button
	data-testid="nested-push"
	onclick={() => {
		store.obj.inner.arr.push('added');
		observe_defaults();
	}}>Push nested array</button
>
<button
	data-testid="direct-write"
	onclick={() => {
		store.obj.inner = { str: 'direct', arr: ['direct'] };
		observe_defaults();
	}}>Write object property</button
>
<button
	data-testid="root-push"
	onclick={() => {
		store.arr.push('added');
		observe_defaults();
	}}>Push array</button
>
<button data-testid="observe-defaults" onclick={observe_defaults}
	>Read defaults</button
>
<span data-testid="default-after-write">{default_after_write}</span>
