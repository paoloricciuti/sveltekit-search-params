<script lang="ts">
	import { queryParameters } from 'sveltekit-search-params';

	async function read_parameters() {
		const before = queryParameters({ value: true });
		const value = before.value;
		await Promise.resolve();

		const errors: { message: string; has_cause: boolean }[] = [];
		for (const options of [{ value: true }, undefined]) {
			try {
				const after = queryParameters(options);
				// Also exercise the lazy getter when no options are provided.
				void after.value;
			} catch (error) {
				errors.push({
					message:
						error instanceof Error ? error.message : String(error),
					has_cause:
						error instanceof Error && error.cause instanceof Error,
				});
			}
		}

		return { value, errors };
	}

	const result = await read_parameters();
</script>

<p data-testid="before-await">{result.value}</p>
{#each result.errors as error (error)}
	<p data-testid="context-error">{error.message}</p>
	<p data-testid="has-cause">{String(error.has_cause)}</p>
{/each}
