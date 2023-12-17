<script lang="ts">
	import { queryParam, ssp, queryParameters } from 'sveltekit-search-params';
	const str = queryParam('str', ssp.string('def'));
	const num = queryParam('num', ssp.number(42));
	const store = queryParameters({
		str2: ssp.string('str2'),
	});
</script>

<span data-testid="str">{$str}</span>

<span data-testid="num">{$num}</span>

<span data-testid="str2">{$store.str2}</span>
