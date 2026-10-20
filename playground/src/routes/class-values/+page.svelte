<svelte:options runes />

<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';

	class Counter {
		count = $state(0);

		constructor(count: number) {
			this.count = count;
		}
	}

	const params = queryParameters({
		date: {
			encode: (value: Date) => value.toISOString(),
			decode: (value: string | null) => (value ? new Date(value) : null),
		},
		counter: {
			encode: (value: Counter) => String(value.count),
			decode: (value: string | null) =>
				value ? new Counter(Number(value)) : null,
		},
		str: true,
	});
</script>

<div data-testid="date">{params.date?.toISOString()}</div>

<div data-testid="counter">{params.counter?.count}</div>
<div data-testid="counter-is-instance">{params.counter instanceof Counter}</div>

<input data-testid="str-input" bind:value={params.str} />
