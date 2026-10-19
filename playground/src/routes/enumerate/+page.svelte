<svelte:options runes />

<script lang="ts">
	import { queryParameters, ssp } from 'sveltekit-search-params';

	const params = queryParameters({
		num: ssp.number(),
		str: ssp.string('default'),
	});
</script>

<div data-testid="keys">{Object.keys(params).join(',')}</div>
<div data-testid="spread">{JSON.stringify({ ...params })}</div>
<div data-testid="snapshot">{JSON.stringify($state.snapshot(params))}</div>
<div data-testid="in">
	{['num', 'extra', 'missing'].map((key) => key in params).join(',')}
</div>
<a data-testid="link" href="?num=1">Drop extra</a>
