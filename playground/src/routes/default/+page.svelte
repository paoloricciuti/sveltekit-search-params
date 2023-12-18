<script lang="ts">
	import { queryParam, ssp, queryParameters } from 'sveltekit-search-params';
	const str = queryParam('str', ssp.string('def'));
	const num = queryParam('num', ssp.number(42));
	const str_no_show = queryParam('str-no-show', ssp.string('no-show'), {
		showDefaults: false,
	});
	const store = queryParameters({
		str2: ssp.string('str2'),
	});
	const store_no_show = queryParameters(
		{
			'str2-no-show': ssp.string('str2-no-show'),
		},
		{ showDefaults: false },
	);
</script>

<span data-testid="str">{$str}</span>

<span data-testid="str-no-show">{$str_no_show}</span>

<span data-testid="num">{$num}</span>

<span data-testid="str2">{$store.str2}</span>

<span data-testid="str2-no-show">{$store_no_show['str2-no-show']}</span>
